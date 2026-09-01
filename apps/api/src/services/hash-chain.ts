import crypto from "crypto";
import { prisma } from "@provenance/db";

/**
 * Deterministically serializes any JavaScript object or primitive into a stable JSON string.
 * Recursively sorts all object keys to ensure identical hash output regardless of key order.
 */
export function deterministicSerialize(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => deterministicSerialize(item)).join(",") + "]";
  }

  const sortedKeys = Object.keys(obj).sort();
  const keyValPairs = sortedKeys.map((key) => {
    return JSON.stringify(key) + ":" + deterministicSerialize(obj[key]);
  });

  return "{" + keyValPairs.join(",") + "}";
}

/**
 * Computes SHA-256 hexadecimal hash over a string.
 */
export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Appends a new immutable event to an issuer's tamper-evident hash chain.
 * Uses PostgreSQL advisory transaction locking to serialize concurrent writes per issuer.
 */
export async function appendChainEvent(
  issuerId: string,
  credentialId: string,
  eventType: "issued" | "verified" | "rejected" | "revoked",
  canonicalData: object,
  actorUserId: string
) {
  return prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL advisory transaction lock on hashtext(issuerId) for per-issuer serialization
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${issuerId}))`;

    // Query the latest chain tip for this issuer
    const tip: any[] = await tx.$queryRaw`
      SELECT "contentHash" FROM "CredentialEvent"
      WHERE "issuerId" = ${issuerId}
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 1
      FOR UPDATE
    `;

    const prevHash: string | null = tip.length > 0 && tip[0]?.contentHash ? tip[0].contentHash : null;
    const contentHash = sha256(deterministicSerialize(canonicalData));

    return tx.credentialEvent.create({
      data: {
        credentialId,
        issuerId,
        eventType,
        canonicalData: canonicalData as any,
        contentHash,
        prevHash,
        createdBy: actorUserId,
      },
    });
  });
}

export interface VerifyChainResult {
  events: Array<{
    id: string;
    eventType: string;
    result: "valid" | "modified" | "depends_on_invalid";
  }>;
  chainValid: boolean;
  firstBreak: string | null;
}

/**
 * Verifies the integrity of an issuer's hash chain.
 * Recomputes content hashes from canonicalData and checks prevHash linkage.
 */
export async function verifyChain(issuerId: string): Promise<VerifyChainResult> {
  const events = await prisma.credentialEvent.findMany({
    where: { issuerId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const results: Array<{
    id: string;
    eventType: string;
    result: "valid" | "modified" | "depends_on_invalid";
  }> = [];

  let chainValid = true;
  let firstBreak: string | null = null;
  let expectedPrevHash: string | null = null;
  let previousWasBroken = false;

  for (const event of events) {
    if (previousWasBroken) {
      results.push({
        id: event.id,
        eventType: event.eventType,
        result: "depends_on_invalid",
      });
      continue;
    }

    // Check 1: Recompute contentHash from stored canonicalData
    const recomputedHash = sha256(deterministicSerialize(event.canonicalData));
    const contentHashMatches = recomputedHash === event.contentHash;

    // Check 2: Verify prevHash matches previous event's contentHash
    const prevHashMatches = event.prevHash === expectedPrevHash;

    if (contentHashMatches && prevHashMatches) {
      results.push({
        id: event.id,
        eventType: event.eventType,
        result: "valid",
      });
      expectedPrevHash = event.contentHash;
    } else {
      chainValid = false;
      if (!firstBreak) {
        firstBreak = event.id;
      }
      previousWasBroken = true;
      results.push({
        id: event.id,
        eventType: event.eventType,
        result: "modified",
      });
    }
  }

  return {
    events: results,
    chainValid,
    firstBreak,
  };
}
