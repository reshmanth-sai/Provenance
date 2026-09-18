import QRCode from "qrcode";

/**
 * Returns the public verification URL for a given credential.
 */
export function getVerifyUrl(credentialId: string, baseUrl?: string): string {
  let host =
    baseUrl ||
    process.env.PUBLIC_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.CORS_ORIGIN ||
    "http://localhost:3000";

  if (host.includes(",")) {
    host = host.split(",")[0].trim();
  }

  return `${host.replace(/\/+$/, "")}/verify/${credentialId}`;
}

/**
 * Generates a PNG Buffer encoding the credential's public verification URL.
 */
export async function generateQrPng(credentialId: string, baseUrl?: string): Promise<Buffer> {
  const url = getVerifyUrl(credentialId, baseUrl);
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: {
      dark: "#0a192f",
      light: "#ffffff",
    },
  });
}

/**
 * Generates an SVG string encoding the credential's public verification URL.
 */
export async function generateQrSvg(credentialId: string, baseUrl?: string): Promise<string> {
  const url = getVerifyUrl(credentialId, baseUrl);
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: {
      dark: "#0a192f",
      light: "#ffffff",
    },
  });
}
