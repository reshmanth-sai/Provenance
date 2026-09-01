import pdfParse from "pdf-parse";
import tesseract from "node-tesseract-ocr";
import { distance } from "fastest-levenshtein";
import { prisma } from "@provenance/db";
import {
  computeCanonicalContentHash,
  computePerceptualHash,
  hammingDistance,
  CredentialStructuredFields,
} from "./hash-utils.js";
import { ValidatedFile } from "./file-storage.js";

const KNOWN_EDITING_TOOLS = [
  "photoshop",
  "acrobat pro",
  "gimp",
  "illustrator",
  "canva",
  "inkscape",
  "coreldraw",
  "affinity",
  "pixelmator",
];

export interface SignalItem {
  signalType: string;
  signalValue: {
    fact: string;
    disclaimer: string;
  };
  severity: "low_concern" | "review_recommended" | "inconclusive";
}

export interface PipelineResult {
  metadata: Record<string, any>;
  canonicalContentHash: string;
  phash: string | null;
  ocrText: string | null;
  ocrConfidence: number | null;
  analyses: SignalItem[];
  overallSeverity: "low_concern" | "review_recommended" | "inconclusive";
}

import { PDFDocument } from "pdf-lib";

/**
 * Extracts raw PDF metadata from buffer including /Producer, /Creator, /CreationDate, /ModDate.
 */
async function extractPdfMetadata(buffer: Buffer): Promise<{
  metadata: Record<string, any>;
  creationDate: Date | null;
  modDate: Date | null;
}> {
  const metadata: Record<string, any> = {};
  let creationDate: Date | null = null;
  let modDate: Date | null = null;

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    metadata.Producer = pdfDoc.getProducer() || null;
    metadata.Creator = pdfDoc.getCreator() || null;
    metadata.Title = pdfDoc.getTitle() || null;
    metadata.Author = pdfDoc.getAuthor() || null;
    metadata.Subject = pdfDoc.getSubject() || null;
    creationDate = pdfDoc.getCreationDate() || null;
    modDate = pdfDoc.getModificationDate() || null;

    if (creationDate) metadata.CreationDate = creationDate.toISOString();
    if (modDate) metadata.ModDate = modDate.toISOString();
  } catch (_err) {
    // Fallback regex parsing
    const textContent = buffer.toString("binary");
    const extractField = (key: string): string | null => {
      const regex = new RegExp(`/${key}\\s*\\(([^)]+)\\)`, "i");
      const match = textContent.match(regex);
      return match ? match[1] : null;
    };
    metadata.Producer = extractField("Producer");
    metadata.Creator = extractField("Creator");
  }

  return { metadata, creationDate, modDate };
}

/**
 * Parses PDF date format (e.g. D:YYYYMMDDHHmmSS or ISO) to JavaScript Date.
 */
function parsePdfDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = match[2] ? parseInt(match[2], 10) - 1 : 0;
    const day = match[3] ? parseInt(match[3], 10) : 1;
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const min = match[5] ? parseInt(match[5], 10) : 0;
    const sec = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Executes the 7-stage deterministic document self-upload analysis pipeline.
 */
export async function runDocumentAnalysisPipeline(params: {
  file: ValidatedFile;
  fileBuffer: Buffer;
  candidateName: string;
  claimedIssuerName: string;
  credentialType: string;
  credentialTitle: string;
  issueDate?: Date | null;
  certificateNumber?: string | null;
  issuerId?: string | null;
}): Promise<PipelineResult> {
  const {
    file,
    fileBuffer,
    candidateName,
    claimedIssuerName,
    credentialType,
    credentialTitle,
    issueDate,
    certificateNumber,
    issuerId,
  } = params;

  const signals: SignalItem[] = [];
  let extractionFailed = false;

  // Stage 3: Metadata Extraction & Editing Software Check
  let extractedMetadata: Record<string, any> = {};
  if (file.mimeType === "application/pdf") {
    try {
      const { metadata, creationDate, modDate } = await extractPdfMetadata(fileBuffer);
      extractedMetadata = metadata;

      // Check Producer / Creator against known editing software
      const toolField = `${extractedMetadata.Producer || ""} ${extractedMetadata.Creator || ""}`.toLowerCase();
      const detectedTool = KNOWN_EDITING_TOOLS.find((tool) => toolField.includes(tool));

      if (detectedTool) {
        signals.push({
          signalType: "editing_software_detected",
          signalValue: {
            fact: `Metadata indicates document was created or modified using ${detectedTool.toUpperCase()}`,
            disclaimer:
              "Editing software is sometimes used for legitimate document preparation and does not by itself prove falsification.",
          },
          severity: "review_recommended",
        });
      }

      // Check ModDate vs CreationDate gap (> 24 hours)
      if (creationDate && modDate) {
        const diffHours = (modDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
        if (diffHours > 24) {
          signals.push({
            signalType: "modification_time_gap",
            signalValue: {
              fact: `Document modification date is ${Math.round(diffHours)} hours after creation date`,
              disclaimer:
                "Time gaps between creation and modification can occur during standard administrative workflows or scans.",
            },
            severity: "review_recommended",
          });
        }
      }
    } catch (e) {
      console.warn("Metadata extraction error:", e);
    }
  }

  // Stage 4: Canonical Content Hash
  const structuredFields: CredentialStructuredFields = {
    candidateName,
    claimedIssuerName,
    credentialType,
    credentialTitle,
    issueDate,
    certificateNumber,
  };
  const canonicalContentHash = computeCanonicalContentHash(structuredFields);

  // Stage 5: Perceptual Hash + Template Comparison
  const phash = await computePerceptualHash(fileBuffer, file.mimeType);

  if (phash) {
    try {
      // Find other documents that have an approved issuer
      const otherDocs = await prisma.document.findMany({
        where: {
          phash: { not: null },
        },
        select: {
          id: true,
          phash: true,
          candidateId: true,
        },
        take: 20,
      });

      for (const otherDoc of otherDocs) {
        if (otherDoc.phash) {
          const dist = hammingDistance(phash, otherDoc.phash);
          // If visual template is almost identical (distance <= 6) across different issuers
          if (dist <= 6 && issuerId) {
            const otherCredential = await prisma.credential.findFirst({
              where: { documentId: otherDoc.id },
              select: { issuerId: true },
            });
            if (otherCredential?.issuerId && otherCredential.issuerId !== issuerId) {
              signals.push({
                signalType: "template_cross_issuer_mismatch",
                signalValue: {
                  fact: "Document visual template closely matches a known template from a different issuing institution",
                  disclaimer:
                    "Standard document layouts or shared certificate generation platforms across institutions can produce visual similarities.",
                },
                severity: "review_recommended",
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Template comparison error:", e);
    }
  }

  // Stage 6: Text Extraction + Consistency Check
  let extractedText: string | null = null;
  let ocrConfidence: number | null = null;

  if (file.mimeType === "application/pdf") {
    try {
      const parse = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;
      const parsedPdf = await parse(fileBuffer);
      extractedText = parsedPdf?.text || "";
      console.log("[Pipeline] Extracted text length from pdf-parse:", extractedText.length);
    } catch (e) {
      console.error("[Pipeline] pdf-parse error details:", e);
    }
  }

  // Fallback to Tesseract OCR if text is empty/minimal or if image file
  if (!extractedText || extractedText.trim().length < 10) {
    try {
      const ocrResult = await tesseract.recognize(file.filePath, {
        lang: "eng",
        oem: 1,
        psm: 3,
      });
      extractedText = ocrResult;
      ocrConfidence = 0.85;
    } catch (e) {
      console.warn("OCR fallback error:", e);
      extractionFailed = true;
    }
  }

  if (extractedText && extractedText.trim().length > 0) {
    const textLower = extractedText.toLowerCase();
    const candidateLower = candidateName.toLowerCase().trim();

    // 1. Candidate Name Consistency Check
    const nameWords = candidateLower.split(/\s+/).filter(Boolean);
    const containsAllWords = nameWords.every((word) => textLower.includes(word));

    if (!containsAllWords) {
      // Compute best normalized similarity against candidate name
      const textWords = textLower.split(/\s+/).filter(Boolean);
      let bestSimilarity = 0;

      for (let i = 0; i <= textWords.length - nameWords.length; i++) {
        const slice = textWords.slice(i, i + nameWords.length).join(" ");
        const dist = distance(candidateLower, slice);
        const maxLen = Math.max(candidateLower.length, slice.length);
        const similarity = 1 - dist / maxLen;
        if (similarity > bestSimilarity) bestSimilarity = similarity;
      }

      if (bestSimilarity < 0.8) {
        signals.push({
          signalType: "candidate_name_mismatch",
          signalValue: {
            fact: `Extracted document text does not contain a close match for candidate name '${candidateName}'`,
            disclaimer:
              "Name formatting differences, maiden names, middle initials, or OCR text recognition errors can cause text mismatches.",
          },
          severity: "review_recommended",
        });
      }
    }

    // 2. Issue Year Consistency Check
    if (issueDate) {
      const declaredYear = new Date(issueDate).getFullYear().toString();
      const detectedYears = Array.from(new Set(extractedText.match(/\b(19\d\d|20\d\d)\b/g) || []));

      if (detectedYears.length > 0 && !detectedYears.includes(declaredYear)) {
        signals.push({
          signalType: "issue_year_mismatch",
          signalValue: {
            fact: `Declared issue year ${declaredYear} was not found in document text (detected years: ${detectedYears.join(", ")})`,
            disclaimer:
              "Date formatting variations, graduation vs conferral dates, or OCR misreads may cause date detection mismatches.",
          },
          severity: "review_recommended",
        });
      }
    }
  } else {
    extractionFailed = true;
  }

  // Stage 7: Signal Assembly & Overall Severity Computation
  let overallSeverity: "low_concern" | "review_recommended" | "inconclusive";
  if (extractionFailed && signals.length === 0) {
    overallSeverity = "inconclusive";
  } else if (signals.length > 0) {
    overallSeverity = "review_recommended";
  } else {
    overallSeverity = "low_concern";
  }

  return {
    metadata: extractedMetadata,
    canonicalContentHash,
    phash,
    ocrText: extractedText,
    ocrConfidence,
    analyses: signals,
    overallSeverity,
  };
}
