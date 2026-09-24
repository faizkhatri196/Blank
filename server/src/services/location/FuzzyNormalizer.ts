/**
 * Location query normalizer and typo corrector.
 * Generic string sanitation and common spelling corrections.
 * Never invents postal codes or hardcoded locations.
 */

interface KnownLocationCorrection {
  pattern: RegExp;
  replacement: string;
}

const KNOWN_CORRECTIONS: KnownLocationCorrection[] = [
  {
    pattern: /\b(ahmedbad|ahmdabad|ahmdavad|ahmdvd|amdavad|ahmedabd)\b/gi,
    replacement: 'Ahmedabad',
  },
  {
    pattern: /\b(rajkot\s*(guj|gujrat))\b/gi,
    replacement: 'Rajkot, Gujarat',
  },
  {
    pattern: /\b(modsa)\b/gi,
    replacement: 'Modasa',
  },
  {
    pattern: /\b(mandvi\s*kachchh)\b/gi,
    replacement: 'Mandvi, Kutch',
  },
  {
    pattern: /\b(satlite|satelite)\b/gi,
    replacement: 'Satellite',
  },
  {
    pattern: /\b(sg\s*higway)\b/gi,
    replacement: 'SG Highway',
  },
  {
    pattern: /\b(kalawad\s*rd|kalavad\s*road)\b/gi,
    replacement: 'Kalawad Road',
  },
];

export interface NormalizedQueryResult {
  rawQuery: string;
  normalizedQuery: string;
  hasTypoCorrection: boolean;
  correctionSuggestion?: string;
  extractedPostalCode?: string;
}

export class FuzzyNormalizer {
  public static normalize(query: string): NormalizedQueryResult {
    if (!query || typeof query !== 'string') {
      return { rawQuery: '', normalizedQuery: '', hasTypoCorrection: false };
    }

    const trimmed = query.trim().replace(/\s+/g, ' ');

    // Extract explicit postal code from search query if user typed one (e.g. 5 or 6 digits)
    const postalMatch = trimmed.match(/\b\d{5,6}\b/);
    const extractedPostalCode = postalMatch ? postalMatch[0] : undefined;

    let normalized = trimmed;
    let hasTypoCorrection = false;

    // Apply word-level typo corrections without inventing artificial addresses
    for (const correction of KNOWN_CORRECTIONS) {
      if (correction.pattern.test(normalized)) {
        normalized = normalized.replace(correction.pattern, correction.replacement);
        hasTypoCorrection = true;
      }
    }

    // Clean basic punctuation
    const cleaned = normalized.replace(/[;]+/g, ',').trim();

    return {
      rawQuery: query,
      normalizedQuery: cleaned,
      hasTypoCorrection,
      correctionSuggestion: hasTypoCorrection ? cleaned : undefined,
      extractedPostalCode,
    };
  }
}
