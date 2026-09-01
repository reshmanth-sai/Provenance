import crypto from "crypto";
import sharp from "sharp";

export interface CredentialStructuredFields {
  candidateName: string;
  claimedIssuerName: string;
  credentialType: string;
  credentialTitle: string;
  issueDate?: string | Date | null;
  certificateNumber?: string | null;
}

/**
 * Calculates deterministic SHA-256 hash over canonical structured credential fields.
 */
export function computeCanonicalContentHash(fields: CredentialStructuredFields): string {
  const normalized = {
    candidateName: fields.candidateName.trim().toLowerCase(),
    claimedIssuerName: fields.claimedIssuerName.trim().toLowerCase(),
    credentialType: fields.credentialType.trim().toLowerCase(),
    credentialTitle: fields.credentialTitle.trim().toLowerCase(),
    issueDate: fields.issueDate ? new Date(fields.issueDate).toISOString().split("T")[0] : null,
    certificateNumber: fields.certificateNumber ? fields.certificateNumber.trim() : null,
  };

  const serialized = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Computes a 64-bit difference hash (dHash) from an image or PDF buffer using Sharp.
 * For PDFs, rasterizes the first page using sips or converts to a raster format.
 */
export async function computePerceptualHash(buffer: Buffer, mimeType: string): Promise<string | null> {
  let imgBuffer = buffer;

  if (mimeType === "application/pdf") {
    const tmpPdf = path.join(os.tmpdir(), `phash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`);
    const tmpPng = path.join(os.tmpdir(), `phash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`);
    try {
      fs.writeFileSync(tmpPdf, buffer);
      // Use macOS native sips to rasterize PDF page 1 to PNG
      execSync(`sips -s format png "${tmpPdf}" --out "${tmpPng}" 2>/dev/null`);
      if (fs.existsSync(tmpPng)) {
        imgBuffer = fs.readFileSync(tmpPng);
      }
    } catch (_pdfRasterizeErr) {
      // Fallback: if sips is unavailable, imgBuffer remains raw buffer
    } finally {
      if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
      if (fs.existsSync(tmpPng)) fs.unlinkSync(tmpPng);
    }
  }

  try {
    const { data } = await sharp(imgBuffer)
      .resize(9, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let hash = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftPixel = data[row * 9 + col];
        const rightPixel = data[row * 9 + col + 1];
        hash += leftPixel > rightPixel ? "1" : "0";
      }
    }

    // Convert 64-bit binary string to 16-char hex
    let hex = "";
    for (let i = 0; i < hash.length; i += 4) {
      const nibble = hash.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }

    return hex;
  } catch (_error) {
    // If image conversion fails, return null
    return null;
  }
}

/**
 * Calculates Hamming distance between two hex hashes of equal length.
 */
export function hammingDistance(hex1: string, hex2: string): number {
  if (hex1.length !== hex2.length) return 64;
  let distance = 0;
  for (let i = 0; i < hex1.length; i++) {
    const v1 = parseInt(hex1[i], 16);
    const v2 = parseInt(hex2[i], 16);
    let xor = v1 ^ v2;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}
