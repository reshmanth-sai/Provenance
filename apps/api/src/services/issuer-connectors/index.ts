import { IssuerConnector } from "./types.js";
import { courseraConnector } from "./coursera.js";
import { extractVerificationCodes } from "./code-extractor.js";
import { executeIssuerLookup } from "./executor.js";
import { DocumentAnalysisSignal } from "../analysis-pipeline.js";

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
 */
export async function runIssuerLookup(params: {
  claimedIssuerName?: string | null;
  certificateNumber?: string | null;
  extractedText?: string | null;
  candidateName: string;
  documentId?: string;
}): Promise<DocumentAnalysisSignal | null> {
  const { claimedIssuerName, certificateNumber, extractedText, candidateName, documentId } = params;

  const connector = findConnector(claimedIssuerName);
  if (!connector) {
    return null;
  }

  // Extract qualifying alphanumeric tokens matching connector's code pattern
  const candidateCodes = extractVerificationCodes(connector.codePattern, {
    certificateNumber,
    extractedText,
  });

  if (candidateCodes.length === 0) {
    return null;
  }

  // Execute lookup on highest-priority code
  const primaryCode = candidateCodes[0];
  const result = await executeIssuerLookup({
    connector,
    code: primaryCode,
    candidateName,
    documentId,
  });

  return result.signal || null;
}

export * from "./types.js";
export * from "./coursera.js";
export * from "./code-extractor.js";
export * from "./executor.js";
