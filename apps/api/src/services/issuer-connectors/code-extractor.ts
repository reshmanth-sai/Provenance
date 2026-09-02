/**
 * ============================================================================
 * OCR CODE EXTRACTION AND RECONSTRUCTION ENGINE
 * ============================================================================
 * 
 * Performs deterministic token extraction and OCR glyph confusion expansion:
 * 1. Prefer candidate-entered certificate number if supplied and pattern-valid.
 * 2. If absent, scan OCR text for qualifying alphanumeric tokens near verification markers.
 * 3. Expand OCR tokens using empirical glyph-confusion map (at most 4 ambiguous positions,
 *    capped at 16 variants per token, ordered by ascending substitution weight/edit distance).
 * ============================================================================
 */

export const OCR_CONFUSION_MAP: Record<string, string[]> = {
  "0": ["0", "O", "Q", "D"],
  "O": ["O", "0", "Q"],
  "Q": ["Q", "0", "O"],
  "1": ["1", "I", "L", "7"],
  "I": ["I", "J", "1", "L"],
  "L": ["L", "1", "I"],
  "5": ["5", "S"],
  "S": ["S", "5"],
  "8": ["8", "B"],
  "B": ["B", "8"],
  "2": ["2", "Z"],
  "Z": ["Z", "2"],
  "6": ["6", "G"],
  "G": ["G", "6"],
  "J": ["J", "I"],
  "7": ["7", "1"],
};

export type CodeSource = "candidate_entered" | "ocr_exact" | "ocr_reconstructed";

export interface CandidateCode {
  code: string;
  codeSource: CodeSource;
  dist: number;
}

/**
 * Generates plausible true code variants for an OCR token using character confusion expansion.
 */
export function generateOcrVariants(
  token: string,
  codePattern: RegExp = /^[A-Z0-9]{8,20}$/
): { code: string; isOriginal: boolean; dist: number }[] {
  const clean = token.toUpperCase().trim();
  if (!codePattern.test(clean)) return [];

  // Identify all ambiguous positions
  const positions: { index: number; char: string; priority: number }[] = [];
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (OCR_CONFUSION_MAP[ch] && OCR_CONFUSION_MAP[ch].length > 1) {
      // Prioritize high-frequency letter-digit substitutions (S/5, I/J/1, O/0, G/6)
      const priority = ["S", "5", "I", "J", "O", "0", "G", "6", "B", "8", "Z", "2", "L", "1", "Q", "D", "7"].indexOf(ch);
      positions.push({ index: i, char: ch, priority: priority === -1 ? 99 : priority });
    }
  }

  // Cap at 4 ambiguous positions
  positions.sort((a, b) => a.priority - b.priority);
  const activeIndices = positions.slice(0, 4).map((p) => p.index).sort((a, b) => a - b);

  if (positions.length > 4) {
    console.log(`[OCR-RECONSTRUCTION] Truncated ambiguous positions from ${positions.length} to 4 for token '${clean}'`);
  }

  // Generate Cartesian product across active positions
  let combinations: string[] = [""];
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (activeIndices.includes(i)) {
      const options = OCR_CONFUSION_MAP[ch] || [ch];
      const nextCombos: string[] = [];
      for (const prefix of combinations) {
        for (const opt of options) {
          nextCombos.push(prefix + opt);
        }
      }
      combinations = nextCombos;
    } else {
      combinations = combinations.map((c) => c + ch);
    }
  }

  // Calculate Hamming edit distance and empirical substitution weights
  const scored = combinations.map((v) => {
    let dist = 0;
    let weight = 0;
    for (let i = 0; i < clean.length; i++) {
      if (clean[i] !== v[i]) {
        dist++;
        const orig = clean[i];
        const repl = v[i];
        if ((orig === "S" && repl === "5") || (orig === "5" && repl === "S")) {
          weight += 0.5; // Top priority
        } else if ((orig === "I" && repl === "J") || (orig === "J" && repl === "I")) {
          weight += 0.5; // Top priority
        } else if ((orig === "I" && repl === "1") || (orig === "1" && repl === "I")) {
          weight += 0.8;
        } else if ((orig === "O" && repl === "0") || (orig === "0" && repl === "O")) {
          weight += 1.0;
        } else {
          weight += 2.0;
        }
      }
    }
    return { code: v, dist, weight };
  });

  // Sort by weight ascending, then edit distance ascending
  scored.sort((a, b) => a.weight - b.weight || a.dist - b.dist);

  const seen = new Set<string>();
  const result: { code: string; isOriginal: boolean; dist: number }[] = [];

  // 1. Emit original unmodified token first
  seen.add(clean);
  result.push({ code: clean, isOriginal: true, dist: 0 });

  // 2. Add variants in increasing edit distance / weight up to 16 total
  for (const s of scored) {
    if (!seen.has(s.code) && codePattern.test(s.code)) {
      seen.add(s.code);
      result.push({ code: s.code, isOriginal: false, dist: s.dist });
      if (result.length >= 16) break;
    }
  }

  return result;
}

/**
 * Extracts candidate verification codes with codeSource tracking and OCR expansion.
 */
export function extractCandidateCodes(
  codePattern: RegExp,
  options: {
    certificateNumber?: string | null;
    extractedText?: string | null;
  }
): CandidateCode[] {
  const result: CandidateCode[] = [];
  const seen = new Set<string>();

  // 1. Candidate-entered code takes absolute precedence
  if (options.certificateNumber) {
    const clean = options.certificateNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (codePattern.test(clean)) {
      seen.add(clean);
      result.push({ code: clean, codeSource: "candidate_entered", dist: 0 });
      // Candidate entered code is authoritative: do not reconstruct alternatives
      return result;
    }
  }

  // 2. Scan OCR text for candidate tokens near verification markers
  if (options.extractedText) {
    const text = options.extractedText;
    const markerPhrases = [
      "verify this certificate",
      "verify at",
      "verify",
      "certificate id",
      "credential id",
      "coursera.org/verify",
      "coursera",
      "accomplishments",
      "specialization",
      "professional-cert",
      "certificate number",
    ];

    const STOP_WORDS = new Set([
      "SPECIALIZATION",
      "SPECIALIZAT",
      "COURSERA",
      "CERTIFICATE",
      "CERTIFICATES",
      "ACCOMPLISHMENTS",
      "PROFESSIONAL",
      "VERIFICATION",
      "CREDENTIAL",
      "COMPLETION",
      "ESSENTIALS",
      "PROGRAM",
      "ONLINE",
      "DIRECTOR",
      "INSTITUTION",
      "ORGANIZATION",
      "UNIVERSITY",
      "ENROLLMENT",
      "CONSTITUTE",
      "SUCCESSFULLY",
      "PRODUCTIVITY",
      "RESPONSIBLY",
      "DEVELOPED",
    ]);

    interface ScoredToken {
      token: string;
      distance: number;
    }

    const scoredTokens: ScoredToken[] = [];
    const lowerText = text.toLowerCase();
    const rawTokens = text.split(/[\s\n\r\t,;:"'()\[\]{}|\\/]+/);

    for (const t of rawTokens) {
      const clean = t.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (STOP_WORDS.has(clean)) continue;

      if (codePattern.test(clean) && !seen.has(clean)) {
        let minDistance = 999999;
        const tokenIdx = lowerText.indexOf(clean.toLowerCase());
        if (tokenIdx !== -1) {
          for (const marker of markerPhrases) {
            let markerIdx = lowerText.indexOf(marker);
            while (markerIdx !== -1) {
              const dist = Math.abs(tokenIdx - markerIdx);
              if (dist < minDistance) minDistance = dist;
              markerIdx = lowerText.indexOf(marker, markerIdx + 1);
            }
          }
        }

        // Prioritize tokens with digits (true credential IDs) over pure alphabetic words
        const hasDigit = /\d/.test(clean);
        const hasLetter = /[A-Z]/.test(clean);
        const isAlphanumeric = hasDigit && hasLetter;
        const score = minDistance + (isAlphanumeric ? 0 : 1000);

        scoredTokens.push({ token: clean, distance: score });
      }
    }

    // Sort by proximity score (preferring alphanumeric tokens closest to verification markers)
    scoredTokens.sort((a, b) => a.distance - b.distance);

    // Take top 3 proximity tokens and expand them
    const topTokens = scoredTokens.slice(0, 3);
    for (const st of topTokens) {
      const variants = generateOcrVariants(st.token, codePattern);
      for (const v of variants) {
        if (!seen.has(v.code)) {
          seen.add(v.code);
          result.push({
            code: v.code,
            codeSource: v.isOriginal ? "ocr_exact" : "ocr_reconstructed",
            dist: v.dist,
          });
        }
      }
    }
  }

  return result;
}

// Backward compatibility alias
export const extractVerificationCodes = (
  codePattern: RegExp,
  options: { certificateNumber?: string | null; extractedText?: string | null }
): string[] => {
  return extractCandidateCodes(codePattern, options).map((c) => c.code);
};
