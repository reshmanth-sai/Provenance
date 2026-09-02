import { IssuerConnector } from "./types.js";
import { courseraConnector } from "./coursera.js";
import { extractCandidateCodes, CandidateCode } from "./code-extractor.js";
import { executeIssuerLookup, RequestBudget } from "./executor.js";
import { SignalItem } from "../analysis-pipeline.js";

// Static registry of supported issuer verification connectors
export const ISSUER_CONNECTORS: IssuerConnector[] = [
  courseraConnector,
];

/**
 * Finds a connector by matching candidate's claimed issuer name against connector aliases.
 * Selection is strictly outside document OCR content to prevent SSRF steering.
 */
export function findConnector(claimedIssuerName: string | null | undefined): IssuerConnector | null {
  if (!claimedIssuerName || typeof claimedIssuerName !== "string") return null;

  const normalized = claimedIssuerName.toLowerCase().trim();
  for (const connector of ISSUER_CONNECTORS) {
    if (
      connector.id === normalized ||
      connector.displayName.toLowerCase() === normalized ||
      connector.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))
    ) {
      return connector;
    }
  }

  return null;
}

/**
 * High-level entrypoint to execute issuer verification lookups for a document.
 * Manages request budget (max 8 outbound requests total) and candidate prioritization.
 */
export async function runIssuerLookup(params: {
  claimedIssuerName?: string | null;
  certificateNumber?: string | null;
  extractedText?: string | null;
  candidateName: string;
  documentId?: string;
}): Promise<SignalItem | null> {
  const { claimedIssuerName, certificateNumber, extractedText, candidateName, documentId } = params;

  const connector = findConnector(claimedIssuerName);
  if (!connector) {
    return null;
  }

  // Extract prioritized candidate codes (candidate-entered first, then OCR exact, then OCR reconstructed)
  const candidateCodes: CandidateCode[] = extractCandidateCodes(connector.codePattern, {
    certificateNumber,
    extractedText,
  });

  if (candidateCodes.length === 0) {
    return null;
  }

  // Global request budget per document upload
  const budget: RequestBudget = {
    outboundRequestCount: 0,
    maxOutboundRequests: 8,
  };

  let fallbackSignal: SignalItem | null = null;

  for (const cand of candidateCodes) {
    const result = await executeIssuerLookup({
      connector,
      code: cand.code,
      codeSource: cand.codeSource,
      candidateName,
      documentId,
      budget,
    });

    // 1. Decisive matches (name_match or name_mismatch) immediately terminate search
    if (result.outcome === "name_match" || result.outcome === "name_mismatch") {
      return result.signal || null;
    }

    // 2. Candidate-entered code returning explicit null terminates search (authoritative)
    if (result.outcome === "code_not_found" && cand.codeSource === "candidate_entered") {
      return result.signal || null;
    }

    // 3. For OCR exact returning not-found, remember signal as fallback but continue search on reconstructed variants
    if (result.outcome === "code_not_found" && cand.codeSource === "ocr_exact" && !fallbackSignal) {
      fallbackSignal = result.signal || null;
    } else if (!fallbackSignal && result.signal) {
      fallbackSignal = result.signal || null;
    }

    // If budget limit reached, stop trying further variants
    if (budget.outboundRequestCount >= budget.maxOutboundRequests) {
      break;
    }
  }

  return fallbackSignal;
}

export * from "./types.js";
export * from "./coursera.js";
export * from "./code-extractor.js";
export * from "./executor.js";
