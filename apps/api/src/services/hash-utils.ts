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

/**
 * Computes a 64-bit difference hash (dHash) from an image buffer using Sharp.
 */
export async function computePerceptualHash(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    let image = sharp(buffer);

    // If PDF, Sharp might not render all pages without libvips pdf support, but for images and rasterized buffers:
    const { data } = await image
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
    // If image conversion fails (e.g. text-only PDF), return null or fallback
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
