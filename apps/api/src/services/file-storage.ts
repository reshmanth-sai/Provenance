import fs from "fs";
import path from "path";
import crypto from "crypto";
import FileType from "file-type";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface ValidatedFile {
  storageKey: string;
  rawFileHash: string;
  mimeType: string;
  originalName: string;
  size: number;
  filePath: string;
}

/**
 * Validates file buffer magic bytes against allowed MIME types.
 * Enforces strict byte-level verification rather than trusting extensions.
 */
export async function validateAndStoreFile(
  buffer: Buffer,
  originalFilename: string
): Promise<ValidatedFile> {
  const detectedType = await FileType.fromBuffer(buffer);

  if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType.mime)) {
    throw new Error(
      `Invalid file signature or unsupported MIME type: ${detectedType?.mime || "unknown"}. Allowed: PDF, JPEG, PNG, WEBP.`
    );
  }

  // 10MB limit enforcement
  const MAX_SIZE = 10 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    throw new Error("File size exceeds the 10MB limit.");
  }

  // Compute SHA-256 of the raw uploaded bytes
  const rawFileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Generate random UUID key for disk storage
  const storageUuid = crypto.randomUUID();
  const extension = detectedType.ext;
  const storageKey = `${storageUuid}.${extension}`;

  const uploadsDir = path.resolve(process.cwd(), "../../storage/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, storageKey);
  fs.writeFileSync(filePath, buffer);

  return {
    storageKey,
    rawFileHash,
    mimeType: detectedType.mime,
    originalName: originalFilename,
    size: buffer.length,
    filePath,
  };
}
