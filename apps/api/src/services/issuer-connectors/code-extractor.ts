/**
 * Extracts candidate verification codes matching a connector's codePattern from
 * candidate-supplied certificateNumber and/or extracted document OCR text.
 */
export function extractVerificationCodes(
  codePattern: RegExp,
  options: {
    certificateNumber?: string | null;
    extractedText?: string | null;
  }
): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const addCandidate = (rawCode: string | null | undefined) => {
    if (!rawCode) return;
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (codePattern.test(clean) && !seen.has(clean)) {
      seen.add(clean);
      candidates.push(clean);
    }
  };

  // 1. Prefer explicit certificateNumber if supplied and valid
  if (options.certificateNumber) {
    addCandidate(options.certificateNumber);
  }

  // 2. Scan OCR text for qualifying alphanumeric tokens
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

    // Find occurrences of marker phrases and extract tokens within a ~150-char window
    interface ScoredToken {
      token: string;
      distance: number;
    }

    const scoredTokens: ScoredToken[] = [];
    const lowerText = text.toLowerCase();

    // Tokenize text into words / alphanumeric sequences
    const rawTokens = text.split(/[\s\n\r\t,;:"'()\[\]{}|\\/]+/);
    for (const t of rawTokens) {
      const clean = t.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (codePattern.test(clean) && !seen.has(clean)) {
        // Find minimum distance to any marker phrase in the text
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
        scoredTokens.push({ token: clean, distance: minDistance });
      }
    }

    // Sort by proximity to verification markers
    scoredTokens.sort((a, b) => a.distance - b.distance);
    for (const st of scoredTokens) {
      if (!seen.has(st.token)) {
        seen.add(st.token);
        candidates.push(st.token);
      }
    }
  }

  // Return at most 3 candidate tokens
  return candidates.slice(0, 3);
}
