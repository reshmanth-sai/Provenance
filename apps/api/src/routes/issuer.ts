import fs from "fs";
import crypto from "crypto";
import { Router, Request, Response } from "express";
import { prisma, hashPassword } from "@provenance/db";
import {
  authenticateToken,
  authenticateStreamToken,
  requireRole,
  requireApprovedIssuer,
} from "../middleware/auth.js";
import { appendChainEvent, verifyChain } from "../services/hash-chain.js";
import { getDocumentFilePath } from "../services/file-storage.js";

const router = Router();

/**
 * POST /issuer/register (Public endpoint)
 * Registers a new institution and creates its initial staff user account.
 * Enforces email domain matching against claimed institution domain.
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { institutionName, domain, contactEmail, password } = req.body;

  if (!institutionName || !domain || !contactEmail || !password) {
    res.status(400).json({ error: "Missing required fields: institutionName, domain, contactEmail, password" });
    return;
  }

  const cleanDomain = domain.toLowerCase().trim();
  const cleanEmail = contactEmail.toLowerCase().trim();

  // Validate that contactEmail's domain strictly matches the claimed domain field
  const emailDomain = cleanEmail.split("@")[1];
  if (!emailDomain || emailDomain !== cleanDomain) {
    res.status(400).json({
      error: `Contact email domain (${emailDomain || "invalid"}) must match claimed institution domain (${cleanDomain})`,
    });
    return;
  }

  try {
    // Check if email or domain is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      res.status(409).json({ error: "An account with this email address already exists" });
      return;
    }

    const existingIssuer = await prisma.issuer.findUnique({
      where: { domain: cleanDomain },
    });
    if (existingIssuer) {
      res.status(409).json({ error: "An institution with this domain has already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Create User, Issuer, and linking IssuerUser atomically
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "issuer_staff",
        },
      });

      const issuer = await tx.issuer.create({
        data: {
          name: institutionName.trim(),
          domain: cleanDomain,
          status: "pending",
        },
      });

      const issuerUser = await tx.issuerUser.create({
        data: {
          issuerId: issuer.id,
          userId: user.id,
          role: "admin",
        },
      });

      return { user, issuer, issuerUser };
    });

    res.status(201).json({
      message: "Institution registration submitted and is pending platform administrator approval",
      issuer: {
        id: result.issuer.id,
        name: result.issuer.name,
        domain: result.issuer.domain,
        status: result.issuer.status,
      },
    });
  } catch (error) {
    console.error("Error registering issuer:", error);
    res.status(500).json({ error: "Internal server error during institution registration" });
  }
});

/**
 * GET /issuer/verification-requests/:id/document
 * Streams the candidate's uploaded file with the correct Content-Type for inline browser rendering.
 * Gated by authenticateStreamToken to allow iframe query tokens while restricting all other endpoints to Bearer headers.
 * Strictly gated: the verification request must belong to the caller's own issuer.
 */
router.get(
  "/verification-requests/:id/document",
  authenticateStreamToken,
  requireRole("issuer_staff"),
  requireApprovedIssuer,
  async (req: Request, res: Response): Promise<void> => {
    const issuerId = req.issuer!.id;
    const { id } = req.params;

    try {
      const request = await prisma.verificationRequest.findFirst({
        where: { id, issuerId },
        include: {
          credential: {
            include: {
              document: true,
            },
          },
        },
      });

      if (!request || request.issuerId !== issuerId) {
        res.status(404).json({ error: "Verification request not found for this institution" });
        return;
      }

      const doc = request.credential?.document;
      if (!doc) {
        res.status(404).json({ error: "No document attached to this verification request" });
        return;
      }

      const filePath = getDocumentFilePath(doc.storageKey);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "Document file not found on storage disk" });
        return;
      }

      res.setHeader("Content-Type", doc.originalMimeType || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${doc.storageKey}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error streaming verification request document:", error);
      res.status(500).json({ error: "Failed to stream document" });
    }
  }
);

// All following routes strictly require standard Authorization: Bearer <token> header
router.use(authenticateToken, requireRole("issuer_staff"), requireApprovedIssuer);

/**
 * GET /issuer/verification-requests
 * Returns all verification requests scoped strictly to caller's issuer
 */
router.get("/verification-requests", async (req: Request, res: Response): Promise<void> => {
  const issuerId = req.issuer!.id;

  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { issuerId },
      include: {
        credential: {
          include: {
            document: {
              include: {
                analyses: true,
              },
            },
          },
        },
        candidate: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    res.status(200).json({ verificationRequests: requests });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    res.status(500).json({ error: "Failed to retrieve verification requests" });
  }
});

/**
 * GET /issuer/verification-requests/:id
 * Returns a single verification request with full candidate, credential, document, and analysis signals.
 * Strictly scoped to the caller's issuer.
 */
router.get("/verification-requests/:id", async (req: Request, res: Response): Promise<void> => {
  const issuerId = req.issuer!.id;
  const { id } = req.params;

  try {
    const request = await prisma.verificationRequest.findFirst({
      where: { id, issuerId },
      include: {
        credential: {
          include: {
            document: {
              include: {
                analyses: true,
              },
            },
          },
        },
        candidate: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Verification request not found for this institution" });
      return;
    }

    res.status(200).json({ verificationRequest: request });
  } catch (error) {
    console.error("Error fetching verification request detail:", error);
    res.status(500).json({ error: "Failed to retrieve verification request" });
  }
});

/**
 * GET /issuer/credentials
 * Returns all credentials issued or verified by the caller's institution.
 */
router.get("/credentials", async (req: Request, res: Response): Promise<void> => {
  const issuerId = req.issuer!.id;

  try {
    const credentials = await prisma.credential.findMany({
      where: { issuerId },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                publicUsername: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ credentials });
  } catch (error) {
    console.error("Error fetching issuer credentials roster:", error);
    res.status(500).json({ error: "Failed to fetch credentials roster" });
  }
});

/**
 * POST /issuer/verification-requests/:id/approve
 * Approves a verification request, appends a 'verified' chain event, and updates status
 */
router.post("/verification-requests/:id/approve", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const issuerId = req.issuer!.id;
  const actorUserId = req.user!.id;

  try {
    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: { id, issuerId },
    });

    if (!verificationRequest) {
      res.status(404).json({ error: "Verification request not found for this institution" });
      return;
    }

    if (verificationRequest.status !== "pending") {
      res.status(400).json({ error: `Cannot approve request with status '${verificationRequest.status}'` });
      return;
    }

    const credential = await prisma.credential.findUnique({
      where: { id: verificationRequest.credentialId },
    });

    if (!credential) {
      res.status(404).json({ error: "Associated credential not found" });
      return;
    }

    const canonicalData = {
      credentialId: credential.id,
      issuerId,
      candidateId: credential.candidateId,
      credentialType: credential.credentialType,
      credentialTitle: credential.credentialTitle,
      issueDate: credential.issueDate ? credential.issueDate.toISOString() : null,
      certificateNumber: credential.certificateNumber,
      source: credential.source,
      verifiedAt: new Date().toISOString(),
      verifiedBy: actorUserId,
    };

    // 1. Append immutable event to hash chain
    const chainEvent = await appendChainEvent(
      issuerId,
      credential.id,
      "verified",
      canonicalData,
      actorUserId
    );

    // 2. Update Credential & VerificationRequest status
    const [updatedCredential, updatedRequest] = await prisma.$transaction([
      prisma.credential.update({
        where: { id: credential.id },
        data: { status: "verified" },
      }),
      prisma.verificationRequest.update({
        where: { id: verificationRequest.id },
        data: {
          status: "approved",
          resolvedAt: new Date(),
          resolvedBy: actorUserId,
        },
      }),
    ]);

    res.status(200).json({
      message: "Verification request approved and recorded to tamper-evident hash chain",
      credential: updatedCredential,
      verificationRequest: updatedRequest,
      chainEvent,
    });
  } catch (error) {
    console.error("Error approving verification request:", error);
    res.status(500).json({ error: "Failed to approve verification request" });
  }
});

/**
 * POST /issuer/verification-requests/:id/reject
 * Rejects a verification request. Zero chain events are created.
 */
router.post("/verification-requests/:id/reject", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const issuerId = req.issuer!.id;
  const actorUserId = req.user!.id;

  try {
    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: { id, issuerId },
    });

    if (!verificationRequest) {
      res.status(404).json({ error: "Verification request not found for this institution" });
      return;
    }

    if (verificationRequest.status !== "pending") {
      res.status(400).json({ error: `Cannot reject request with status '${verificationRequest.status}'` });
      return;
    }

    const [updatedCredential, updatedRequest] = await prisma.$transaction([
      prisma.credential.update({
        where: { id: verificationRequest.credentialId },
        data: { status: "rejected" },
      }),
      prisma.verificationRequest.update({
        where: { id: verificationRequest.id },
        data: {
          status: "rejected",
          resolvedAt: new Date(),
          resolvedBy: actorUserId,
        },
      }),
    ]);

    res.status(200).json({
      message: "Verification request rejected",
      credential: updatedCredential,
      verificationRequest: updatedRequest,
    });
  } catch (error) {
    console.error("Error rejecting verification request:", error);
    res.status(500).json({ error: "Failed to reject verification request" });
  }
});

/**
 * POST /issuer/credentials (Direct Issuance)
 * Issues a new credential directly from the institution, appending an 'issued' chain event.
 */
router.post("/credentials", async (req: Request, res: Response): Promise<void> => {
  const { candidateEmail, credentialType, credentialTitle, issueDate, certificateNumber } = req.body;
  const issuerId = req.issuer!.id;
  const actorUserId = req.user!.id;

  if (!candidateEmail || !credentialType || !credentialTitle) {
    res.status(400).json({ error: "Missing required fields: candidateEmail, credentialType, credentialTitle" });
    return;
  }

  try {
    const cleanEmail = candidateEmail.toLowerCase().trim();

    // Find candidate user or auto-provision account if needed
    let candidate = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!candidate) {
      const placeholderHash = await hashPassword(crypto.randomUUID());
      candidate = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash: placeholderHash,
          role: "candidate",
        },
      });
      await prisma.candidateProfile.create({
        data: {
          userId: candidate.id,
          publicUsername: `candidate_${candidate.id.substring(0, 8)}`,
          name: cleanEmail.split("@")[0],
        },
      });
    }

    const parsedIssueDate = issueDate ? new Date(issueDate) : new Date();

    const credential = await prisma.credential.create({
      data: {
        candidateId: candidate.id,
        issuerId,
        source: "issuer_issued",
        status: "verified",
        credentialType: credentialType.trim(),
        credentialTitle: credentialTitle.trim(),
        issueDate: parsedIssueDate,
        certificateNumber: certificateNumber ? certificateNumber.trim() : null,
      },
    });

    const canonicalData = {
      credentialId: credential.id,
      issuerId,
      candidateId: candidate.id,
      credentialType: credential.credentialType,
      credentialTitle: credential.credentialTitle,
      issueDate: parsedIssueDate.toISOString(),
      certificateNumber: credential.certificateNumber,
      source: "issuer_issued",
      issuedAt: new Date().toISOString(),
      issuedBy: actorUserId,
    };

    const chainEvent = await appendChainEvent(
      issuerId,
      credential.id,
      "issued",
      canonicalData,
      actorUserId
    );

    res.status(201).json({
      message: "Credential directly issued and committed to hash chain",
      credential,
      chainEvent,
    });
  } catch (error) {
    console.error("Error directly issuing credential:", error);
    res.status(500).json({ error: "Failed to directly issue credential" });
  }
});

/**
 * POST /issuer/credentials/:id/revoke
 * Revokes a verified credential, appending a 'revoked' chain event.
 */
router.post("/credentials/:id/revoke", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  const issuerId = req.issuer!.id;
  const actorUserId = req.user!.id;

  try {
    const credential = await prisma.credential.findFirst({
      where: { id, issuerId },
    });

    if (!credential) {
      res.status(404).json({ error: "Credential not found for this institution" });
      return;
    }

    if (credential.status !== "verified") {
      res.status(400).json({ error: `Cannot revoke credential with status '${credential.status}'` });
      return;
    }

    const canonicalData = {
      credentialId: credential.id,
      issuerId,
      candidateId: credential.candidateId,
      revokedAt: new Date().toISOString(),
      revokedBy: actorUserId,
      reason: reason ? String(reason).trim() : "Revoked by issuing authority",
    };

    // 1. Append revoked event to chain
    const chainEvent = await appendChainEvent(
      issuerId,
      credential.id,
      "revoked",
      canonicalData,
      actorUserId
    );

    // 2. Update Credential status
    const updatedCredential = await prisma.credential.update({
      where: { id: credential.id },
      data: { status: "revoked" },
    });

    res.status(200).json({
      message: "Credential revoked and recorded to hash chain",
      credential: updatedCredential,
      chainEvent,
    });
  } catch (error) {
    console.error("Error revoking credential:", error);
    res.status(500).json({ error: "Failed to revoke credential" });
  }
});

/**
 * GET /issuer/chain-audit
 * Wraps verifyChain(issuerId) returning the full sequential event list with positions and results.
 * Scoped strictly to the caller's own approved institution.
 */
router.get("/chain-audit", async (req: Request, res: Response): Promise<void> => {
  const issuerId = req.issuer!.id;

  try {
    const rawEvents = await prisma.credentialEvent.findMany({
      where: { issuerId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const auditResult = await verifyChain(issuerId);

    // Map audit validation results back onto full event list
    const resultMap = new Map(auditResult.events.map((e) => [e.id, e.result]));

    const enrichedEvents = rawEvents.map((evt, idx) => ({
      id: evt.id,
      position: idx + 1,
      eventType: evt.eventType,
      credentialId: evt.credentialId,
      contentHash: evt.contentHash,
      prevHash: evt.prevHash,
      createdAt: evt.createdAt,
      createdBy: evt.createdBy,
      canonicalData: evt.canonicalData,
      result: resultMap.get(evt.id) || "valid",
    }));

    res.status(200).json({
      issuerId,
      institutionName: req.issuer!.name,
      algorithm: "SHA-256",
      chainValid: auditResult.chainValid,
      firstBreak: auditResult.firstBreak,
      totalEvents: enrichedEvents.length,
      events: enrichedEvents,
    });
  } catch (error) {
    console.error("Error auditing hash chain:", error);
    res.status(500).json({ error: "Failed to audit hash chain" });
  }
});

/**
 * GET /issuer/chain/verify
 * Cryptographically audits and verifies the issuer's complete hash chain
 */
router.get("/chain/verify", async (req: Request, res: Response): Promise<void> => {
  const issuerId = req.issuer!.id;

  try {
    const auditResult = await verifyChain(issuerId);
    res.status(200).json(auditResult);
  } catch (error) {
    console.error("Error verifying hash chain:", error);
    res.status(500).json({ error: "Failed to verify hash chain" });
  }
});

export default router;
