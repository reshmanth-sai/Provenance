/**
 * ============================================================================
 * ANTI-SSRF ARCHITECTURE AND ISSUER CONNECTOR (COURSERA)
 * ============================================================================
 * 
 * Substantive Engineering Decision:
 * ---------------------------------
 * 1. PROHIBITED: Provenance strictly prohibits fetching arbitrary URLs or QR code
 *    payloads extracted from user-uploaded documents. In arbitrary URL fetching,
 *    an attacker controls scheme, host, port, and path, constituting textbook SSRF.
 * 
 * 2. WHAT THIS CONNECTOR DOES INSTEAD:
 *    - Connector selection is driven exclusively by the candidate's self-declared
 *      profile field ('claimedIssuerName'), matching against static alias lists.
 *      Document OCR content NEVER influences which host is contacted.
 *    - The destination hostname is a hardcoded module-level constant ('www.coursera.org').
 *    - The extracted identifier is an alphanumeric token strictly matching /^[A-Z0-9]{8,20}$/.
 *    - The token is interpolated into fixed, predefined path templates.
 *    - Safe same-host redirects are permitted up to 2 hops, strictly re-asserting
 *      exact equality to the constant host ('www.coursera.org') and HTTPS on every hop.
 *    - The network engine enforces 10 strict controls: fixed host assertion,
 *      HTTPS-only, same-host redirect validation, 5s timeout, 512KB body cap,
 *      request count cap, safe logging (no full body), and SHA-256 hash storage of
 *      third-party names (never plaintext).
 * ============================================================================
 */

import { IssuerConnector } from "./types.js";

// Hardcoded constant hostname — never derived from document content
export const COURSERA_HOST = "www.coursera.org";

/**
 * Structured Apollo State parser for Coursera verification pages.
 * 
 * Reads holder name from `window.__APOLLO_STATE__` -> `signatureTrackProfilesV1...`
 * Distinguishes:
 * 1. Valid accomplishment -> returns `{ parsedName: string, notFound: false }`
 * 2. Resource explicitly null -> returns `{ parsedName: null, notFound: true }`
 * 3. Unparseable, corrupted, or missing state -> returns `{ parsedName: null, notFound: false }`
 */
export function parseCourseraResponse(html: string, code: string): { parsedName: string | null; notFound: boolean } {
  if (!html || typeof html !== "string") {
    return { parsedName: null, notFound: false };
  }

  try {
    const prefix = "window.__APOLLO_STATE__ = ";
    const startIdx = html.indexOf(prefix);
    if (startIdx === -1) {
      return { parsedName: null, notFound: false };
    }

    const jsonStart = startIdx + prefix.length;
    const endSemicolon = html.indexOf(";\n", jsonStart);
    const endScriptTag = html.indexOf(";</script>", jsonStart);
    let endIdx = endSemicolon !== -1 ? endSemicolon : endScriptTag;

    if (endIdx === -1) {
      endIdx = html.indexOf("};", jsonStart);
      if (endIdx !== -1) endIdx += 1;
    }

    if (endIdx === -1) {
      return { parsedName: null, notFound: false };
    }

    const jsonStr = html.substring(jsonStart, endIdx);
    const state = JSON.parse(jsonStr);

    const cleanCode = code.toUpperCase().trim();
    const rootQuery = state.ROOT_QUERY || {};

    let hasResourceKey = false;
    let allMatchingAreNull = true;

    // Helper to extract name from signatureTrackProfiles array
    const extractName = (profiles: any[]): string | null => {
      if (!Array.isArray(profiles) || profiles.length === 0) return null;
      const p = profiles[0];
      if (!p || typeof p !== "object") return null;

      const parts = [p.firstName, p.middleName, p.lastName]
        .filter((x) => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);

      const fullName = parts.join(" ").replace(/\s+/g, " ").trim();
      return fullName.length > 0 ? fullName : null;
    };

    // 1. Inspect ROOT_QUERY resource entries
    for (const [key, val] of Object.entries(rootQuery)) {
      if (key.includes(cleanCode)) {
        hasResourceKey = true;
        if (val !== null) {
          allMatchingAreNull = false;
        }

        if (val && typeof val === "object") {
          for (const [vk, vv] of Object.entries(val as Record<string, any>)) {
            if (vk.includes("signatureTrackProfiles") && Array.isArray(vv)) {
              const name = extractName(vv);
              if (name) return { parsedName: name, notFound: false };
            }
            if (typeof vv === "object" && vv !== null) {
              for (const [subk, subv] of Object.entries(vv as Record<string, any>)) {
                if (subk.includes("signatureTrackProfiles") && Array.isArray(subv)) {
                  const name = extractName(subv);
                  if (name) return { parsedName: name, notFound: false };
                }
              }
            }
          }
        }
      }
    }

    // 2. Search entire state for AccomplishmentsSignatureTrackProfile objects
    for (const [key, val] of Object.entries(state)) {
      if (key.includes("AccomplishmentsSignatureTrackProfile") && val && typeof val === "object") {
        const name = extractName([val]);
        if (name) return { parsedName: name, notFound: false };
      }
    }

    // 3. If resource key exists in ROOT_QUERY and was explicitly null -> code not found
    if (hasResourceKey && allMatchingAreNull) {
      return { parsedName: null, notFound: true };
    }
  } catch (err) {
    // If JSON parse or traversal fails, safely degrade to unparseable
    return { parsedName: null, notFound: false };
  }

  return { parsedName: null, notFound: false };
}

export const courseraConnector: IssuerConnector = {
  id: "coursera",
  displayName: "Coursera",
  aliases: [
    "coursera",
    "deeplearning.ai",
    "google career certificates",
    "google",
    "meta",
    "ibm",
  ],
  host: COURSERA_HOST,
  pathTemplates: [
    "/account/accomplishments/specialization/{code}",
    "/account/accomplishments/verify/{code}",
    "/account/accomplishments/professional-cert/{code}",
    "/verify/specialization/{code}",
    "/verify/{code}",
    "/verify/professional-cert/{code}",
  ],
  codePattern: /^[A-Z0-9]{8,20}$/,
  parseResponse: parseCourseraResponse,
};
