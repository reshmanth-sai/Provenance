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
 *    - The network engine enforces 10 strict controls: fixed host assertion,
 *      HTTPS-only, manual redirect policy (no redirect following), 5s timeout,
 *      512KB body cap, request count cap, safe logging (no full body), and SHA-256
 *      hash storage of third-party names (never plaintext).
 * ============================================================================
 */

import { IssuerConnector } from "./types.js";

// Hardcoded constant hostname — never derived from document content
export const COURSERA_HOST = "www.coursera.org";

/**
 * Multi-strategy parser to extract certificate holder name from Coursera verification HTML.
 * If no strategy confidently identifies a recipient name, returns null.
 * A null return guarantees that the system produces 'issuer_lookup_unavailable'
 * rather than falsely accusing a candidate of a name mismatch due to upstream HTML changes.
 */
export function parseCourseraHolderName(html: string): string | null {
  if (!html || typeof html !== "string") return null;

  // Clean HTML entities helper
  const decodeEntities = (str: string): string => {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  const sanitizeName = (raw: string | undefined | null): string | null => {
    if (!raw) return null;
    const cleaned = decodeEntities(raw).replace(/\s+/g, " ").trim();
    // Exclude generic platform words, titles, and malformed strings
    if (
      cleaned.length < 2 ||
      cleaned.length > 70 ||
      /^coursera/i.test(cleaned) ||
      /^online courses/i.test(cleaned) ||
      /^join for free/i.test(cleaned) ||
      /^accomplishment/i.test(cleaned) ||
      /^specialization/i.test(cleaned) ||
      /^certificate/i.test(cleaned)
    ) {
      return null;
    }
    return cleaned;
  };

  // Strategy 1: JSON-LD Structured Data (<script type="application/ld+json">)
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const checkObj = (obj: any): string | null => {
        if (!obj || typeof obj !== "object") return null;
        if (obj.recipient && typeof obj.recipient === "object" && obj.recipient.name) {
          return sanitizeName(obj.recipient.name);
        }
        if (obj.recipient && typeof obj.recipient === "string") {
          return sanitizeName(obj.recipient);
        }
        if (obj.recipientName && typeof obj.recipientName === "string") {
          return sanitizeName(obj.recipientName);
        }
        if (obj.name && obj["@type"] === "Person") {
          return sanitizeName(obj.name);
        }
        return null;
      };

      const found = checkObj(data);
      if (found) return found;
      if (Array.isArray(data)) {
        for (const item of data) {
          const itemFound = checkObj(item);
          if (itemFound) return itemFound;
        }
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: OpenGraph & Meta Tag Patterns
  // Examples:
  // <meta property="og:title" content="Coursera | Verification for Jane Doe"/>
  // <meta name="description" content="...completed by John Smith..."/>
  const metaMatches = html.matchAll(/<meta[^>]+(?:name|property)=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi);
  for (const match of metaMatches) {
    const prop = match[1].toLowerCase();
    const content = match[2];

    if (prop.includes("title") || prop.includes("description")) {
      const patterns = [
        /(?:completed|awarded to|certified to|accomplishment for|earned by|issued to)\s+([A-Z][a-zA-Z\s.'-]+?)(?:'s|\s+on|\s+for|\s+with|\.|\/|,|$)/i,
        /([A-Z][a-zA-Z\s.'-]+?)(?:'s)?\s+account is verified/i,
        /verify certificate for\s+([A-Z][a-zA-Z\s.'-]+?)(?:\.|\/|,|$)/i,
        /verification for\s+([A-Z][a-zA-Z\s.'-]+?)(?:\s*\||\.|\/|,|$)/i,
      ];
      for (const pattern of patterns) {
        const m = content.match(pattern);
        if (m && m[1]) {
          const cand = sanitizeName(m[1]);
          if (cand) return cand;
        }
      }
    }
  }

  // Strategy 3: Client State / Embedded State Objects (window.__APOLLO_STATE__, window.App)
  const apolloStateMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<)/);
  if (apolloStateMatch) {
    try {
      const apolloData = JSON.parse(apolloStateMatch[1]);
      for (const [key, val] of Object.entries(apolloData)) {
        if (typeof val === "object" && val !== null) {
          const v: any = val;
          if (v.fullName && typeof v.fullName === "string") {
            const cand = sanitizeName(v.fullName);
            if (cand) return cand;
          }
          if (v.learnerName && typeof v.learnerName === "string") {
            const cand = sanitizeName(v.learnerName);
            if (cand) return cand;
          }
          if (v.recipientName && typeof v.recipientName === "string") {
            const cand = sanitizeName(v.recipientName);
            if (cand) return cand;
          }
          if (v.__typename === "User" && v.name && typeof v.name === "string") {
            const cand = sanitizeName(v.name);
            if (cand) return cand;
          }
        }
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 4: DOM Headings & Key Selectors in HTML markup
  const domPatterns = [
    /<(?:h1|h2|h3|strong|span|div)[^>]*class=["'][^"']*(?:recipient|learner|student|holder|account-name)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h1|h2|h3|strong|span|div)>/i,
    /(?:This is to certify that|successfully completed by|awarded to)\s*<[^>]+>\s*([A-Z][a-zA-Z\s.'-]{2,60})\s*<\/[^>]+>/i,
    /<h3[^>]*class=["'][^"']*banner-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i,
  ];

  for (const pattern of domPatterns) {
    const m = html.match(pattern);
    if (m && m[1]) {
      // Strip any nested HTML tags from capture
      const stripped = m[1].replace(/<[^>]+>/g, " ");
      const cand = sanitizeName(stripped);
      if (cand) return cand;
    }
  }

  return null;
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
    "/verify/{code}",
    "/verify/specialization/{code}",
    "/verify/professional-cert/{code}",
    "/account/accomplishments/verify/{code}",
    "/account/accomplishments/specialization/{code}",
    "/account/accomplishments/professional-cert/{code}",
  ],
  codePattern: /^[A-Z0-9]{8,20}$/,
  parseHolderName: parseCourseraHolderName,
};
