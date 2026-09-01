import crypto from "crypto";
import { prisma } from "@provenance/db";
import { IssuerConnector, ConnectorLookupResult, ConnectorLookupOutcome } from "./types.js";
import { DocumentAnalysisSignal } from "../analysis-pipeline.js";

/**
 * Matches a parsed name against a candidate's profile name using
 * word-boundary and normalized token comparison.
 */
export function compareNames(parsedName: string, candidateName: string): boolean {
  if (!parsedName || !candidateName) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normParsed = normalize(parsedName);
  const normCandidate = normalize(candidateName);

  if (normParsed === normCandidate) return true;

  const parsedTokens = normParsed.split(" ").filter((t) => t.length >= 2);
  const candidateTokens = normCandidate.split(" ").filter((t) => t.length >= 2);

  if (parsedTokens.length === 0 || candidateTokens.length === 0) return false;

  // Check if all tokens of candidate name appear in parsed name or vice versa
  const allCandidateInParsed = candidateTokens.every((t) =>
    new RegExp(`\\b${t}\\b`, "i").test(normParsed)
  );
  const allParsedInCandidate = parsedTokens.every((t) =>
    new RegExp(`\\b${t}\\b`, "i").test(normCandidate)
  );

  return allCandidateInParsed || allParsedInCandidate;
}

/**
 * Executes an anti-SSRF issuer lookup against a connector's public verification page.
 * Implements strict same-host redirect validation (max 2 hops), exact host constant assertion,
 * 5s timeout, 512KB body cap, and safe logging.
 */
export async function executeIssuerLookup(params: {
  connector: IssuerConnector;
  code: string;
  candidateName: string;
  documentId?: string;
}): Promise<ConnectorLookupResult> {
  const { connector, code, candidateName, documentId } = params;

  // Control 1: Global kill switch
  if (process.env.ISSUER_LOOKUP_ENABLED === "false") {
    console.log(`[ISSUER-LOOKUP] Skipped: ISSUER_LOOKUP_ENABLED is set to false`);
    return {
      outcome: "unavailable",
      httpStatus: null,
      rawNameHash: null,
    };
  }

  // Control 2: Pre-request strict code validation
  if (!connector.codePattern.test(code)) {
    console.warn(`[ISSUER-LOOKUP] Rejected: Code '${code}' failed pre-request pattern validation`);
    return {
      outcome: "unavailable",
      httpStatus: null,
      rawNameHash: null,
    };
  }

  // Control 3: 24-hour cache check to prevent redundant outbound traffic
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const cached = await prisma.issuerLookup.findFirst({
      where: {
        connectorId: connector.id,
        code,
        checkedAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { checkedAt: "desc" },
    });

    if (cached) {
      console.log(`[ISSUER-LOOKUP] Cache hit for ${connector.id}:${code} (outcome: ${cached.outcome}, checkedAt: ${cached.checkedAt.toISOString()})`);
      if (documentId) {
        try {
          await prisma.issuerLookup.create({
            data: {
              documentId,
              connectorId: connector.id,
              code,
              outcome: cached.outcome,
              httpStatus: cached.httpStatus,
              rawNameHash: cached.rawNameHash,
            },
          });
        } catch (saveErr) {
          console.warn("[ISSUER-LOOKUP] Error recording cached IssuerLookup record:", saveErr);
        }
      }
      return {
        outcome: cached.outcome as ConnectorLookupOutcome,
        httpStatus: cached.httpStatus,
        rawNameHash: cached.rawNameHash,
        signal: buildSignal(cached.outcome as ConnectorLookupOutcome, connector, code),
      };
    }
  } catch (dbErr) {
    console.warn("[ISSUER-LOOKUP] Cache lookup error:", dbErr);
  }

  let finalOutcome: ConnectorLookupOutcome = "unavailable";
  let lastHttpStatus: number | null = null;
  let rawNameHash: string | null = null;
  let matchedTemplate: string | undefined = undefined;

  // Control 4: Sequential requests capped at 3 path templates, short-circuiting on decisive outcome
  const templatesToTry = connector.pathTemplates.slice(0, 3);

  for (const template of templatesToTry) {
    const encodedCode = encodeURIComponent(code);
    const initialPath = template.replace("{code}", encodedCode);
    let currentUrl = new URL(`https://${connector.host}${initialPath}`);
    let redirectHops = 0;
    const maxHops = 2;

    while (redirectHops <= maxHops) {
      // Control 5: Host and HTTPS scheme assertion on EVERY hop
      if (currentUrl.host !== connector.host || currentUrl.protocol !== "https:") {
        console.warn(`[ISSUER-LOOKUP] SSRF safety violation: destination '${currentUrl.host}' does not match connector host '${connector.host}' or protocol '${currentUrl.protocol}'`);
        finalOutcome = "unavailable";
        break;
      }

      // Control 6: 5-second timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const startTime = Date.now();

      let response: Response;
      try {
        // Control 7: manual redirect policy (re-asserting host check on each hop)
        response = await fetch(currentUrl.toString(), {
          method: "GET",
          headers: {
            "User-Agent": "Provenance-Credential-Verifier/1.0 (+https://provenance.org)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          redirect: "manual",
          signal: controller.signal,
        });
      } catch (reqErr: any) {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;
        console.warn(`[ISSUER-LOOKUP] Request error for ${currentUrl.pathname}: ${reqErr?.message || reqErr} (${durationMs}ms)`);
        break;
      }

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      lastHttpStatus = response.status;

      // Control 8: Safe request logging (never log response bodies)
      console.log(`[ISSUER-LOOKUP] ${new Date().toISOString()} | Host: ${connector.host} | Path: ${currentUrl.pathname} | Status: ${response.status} | Duration: ${durationMs}ms | Hop: ${redirectHops + 1}`);

      // Handle Redirect (3xx) — Follow ONLY if same-host and under hop limit
      if (response.status >= 300 && response.status < 400) {
        const locationHeader = response.headers.get("location");
        if (!locationHeader) {
          console.warn(`[ISSUER-LOOKUP] Redirect ${response.status} missing Location header`);
          break;
        }

        const nextUrl = new URL(locationHeader, currentUrl);
        console.log(`[ISSUER-LOOKUP] Evaluating redirect destination: ${nextUrl.toString()}`);

        // Re-assert exact host equality and https
        if (nextUrl.host !== connector.host || nextUrl.protocol !== "https:") {
          console.warn(`[ISSUER-LOOKUP] Aborting redirect to foreign destination: ${nextUrl.toString()}`);
          finalOutcome = "unavailable";
          break;
        }

        currentUrl = nextUrl;
        redirectHops++;
        if (redirectHops > maxHops) {
          console.warn(`[ISSUER-LOOKUP] Exceeded maximum redirect hop limit (${maxHops})`);
          break;
        }
        continue;
      }

      if (response.status === 404) {
        finalOutcome = "code_not_found";
        matchedTemplate = template;
        break;
      }

      if (response.status === 200) {
        // Control 9: Response body reading capped at 512KB
        const arrayBuf = await response.arrayBuffer();
        const cappedBuf = Buffer.from(arrayBuf).subarray(0, 512 * 1024);
        const html = cappedBuf.toString("utf8");

        const parseRes = connector.parseResponse(html, code);

        if (parseRes.notFound) {
          finalOutcome = "code_not_found";
          matchedTemplate = template;
          break;
        } else if (parseRes.parsedName) {
          // Control 10: SHA-256 hash storage of parsed name (never store plaintext name)
          rawNameHash = crypto.createHash("sha256").update(parseRes.parsedName.toLowerCase().trim()).digest("hex");
          const nameMatches = compareNames(parseRes.parsedName, candidateName);

          finalOutcome = nameMatches ? "name_match" : "name_mismatch";
          matchedTemplate = template;
          break;
        } else {
          // Failure to parse a name MUST degrade to unavailable, NEVER to name_mismatch
          finalOutcome = "unavailable";
        }
      }
      break;
    }

    if (finalOutcome === "name_match" || finalOutcome === "name_mismatch" || finalOutcome === "code_not_found") {
      break;
    }
  }

  // Persist IssuerLookup record if documentId is provided
  if (documentId) {
    try {
      await prisma.issuerLookup.create({
        data: {
          documentId,
          connectorId: connector.id,
          code,
          outcome: finalOutcome,
          httpStatus: lastHttpStatus,
          rawNameHash,
        },
      });
    } catch (saveErr) {
      console.warn("[ISSUER-LOOKUP] Error saving IssuerLookup record:", saveErr);
    }
  }

  return {
    outcome: finalOutcome,
    httpStatus: lastHttpStatus,
    rawNameHash,
    matchedTemplate,
    signal: buildSignal(finalOutcome, connector, code),
  };
}

/**
 * Builds the labeled DocumentAnalysisSignal based on lookup outcome.
 */
export function buildSignal(
  outcome: ConnectorLookupOutcome,
  connector: IssuerConnector,
  code: string
): DocumentAnalysisSignal | undefined {
  switch (outcome) {
    case "name_match":
      return {
        signalType: "issuer_lookup_name_match",
        signalValue: {
          fact: `Public verification page published by ${connector.displayName} for code ${code} confirms matching candidate name`,
          disclaimer:
            "This confirms only that a public verification page published by the issuer lists this name for this code. It is not the same as the issuing institution confirming this credential through Provenance, and does not alter the credential's verification status.",
        },
        severity: "low_concern",
      };

    case "name_mismatch":
      return {
        signalType: "issuer_lookup_name_mismatch",
        signalValue: {
          fact: `The public verification page published by ${connector.displayName} for code ${code} lists a different name than the one on the submitted document`,
          disclaimer:
            "Legal name changes, transliteration, and differing name order can cause legitimate mismatches on public verification registries.",
        },
        severity: "review_recommended",
      };

    case "code_not_found":
      return {
        signalType: "issuer_lookup_code_not_found",
        signalValue: {
          fact: `Credential code ${code} was not found on the public verification registry for ${connector.displayName}`,
          disclaimer:
            "Expired, withdrawn, or regionally restricted credential pages can return not-found for legitimately issued credentials.",
        },
        severity: "review_recommended",
      };

    case "unavailable":
      return {
        signalType: "issuer_lookup_unavailable",
        signalValue: {
          fact: `Public verification lookup for ${connector.displayName} could not be completed at this time`,
          disclaimer:
            "Network timeouts, third-party page layout updates, or rate limits can prevent public verification lookups from completing.",
        },
        severity: "inconclusive",
      };

    default:
      return undefined;
  }
}
