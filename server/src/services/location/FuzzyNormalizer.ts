/**
 * Location query normalizer and typo corrector.
 * Handles common phonetic misspellings, colloquial state abbreviations,
 * and extracts postal codes or landmarks without silently guessing unreliably.
 */

interface KnownLocationCorrection {
  pattern: RegExp;
  suggestedQuery: string;
  city?: string;
  state?: string;
  country?: string;
}

const KNOWN_CORRECTIONS: KnownLocationCorrection[] = [
  {
    pattern: /\b(ahmedbad|ahmdabad|ahmdavad|ahmdvd|amdavad|ahmedabd)\b/i,
    suggestedQuery: 'Ahmedabad, Gujarat, India',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
  },
  {
    pattern: /\b(rajkot\s*(guj|gujrat|gujarat)?)\b/i,
    suggestedQuery: 'Rajkot, Gujarat, India',
    city: 'Rajkot',
    state: 'Gujarat',
    country: 'India',
  },
  {
    pattern: /\b(modsa)\b/i,
    suggestedQuery: 'Modasa, Gujarat, India',
    city: 'Modasa',
    state: 'Gujarat',
    country: 'India',
  },
  {
    pattern: /\b(mandvi\s*kutch|mandvi\s*kachchh)\b/i,
    suggestedQuery: 'Mandvi, Kutch, Gujarat, India',
    city: 'Mandvi',
    state: 'Gujarat',
    country: 'India',
  },
  {
    pattern: /\b(satlite|satelite)\s*(ahmedabad)?\b/i,
    suggestedQuery: 'Satellite, Ahmedabad, Gujarat, India',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
  },
  {
    pattern: /\b(s\.?g\.?\s*highway|sg\s*higway)\b/i,
    suggestedQuery: 'SG Highway, Ahmedabad, Gujarat, India',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
  },
  {
    pattern: /\b(kalawad\s*rd|kalavad\s*road|kalawad\s*road)\b/i,
    suggestedQuery: 'Kalawad Road, Rajkot, Gujarat, India',
    city: 'Rajkot',
    state: 'Gujarat',
    country: 'India',
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

    // Check for postal code (e.g. 6-digit India pincode or 5-digit US zip)
    const postalMatch = trimmed.match(/\b\d{5,6}\b/);
    const extractedPostalCode = postalMatch ? postalMatch[0] : undefined;

    // Check against known typo/abbreviation corrections
    for (const correction of KNOWN_CORRECTIONS) {
      if (correction.pattern.test(trimmed)) {
        // If the query is strictly or predominantly the typo, provide the enhanced query
        return {
          rawQuery: query,
          normalizedQuery: correction.suggestedQuery,
          hasTypoCorrection: true,
          correctionSuggestion: correction.suggestedQuery,
          extractedPostalCode,
        };
      }
    }

    // Clean basic punctuation and return normalized query
    const cleaned = trimmed.replace(/[;]+/g, ',').trim();

    return {
      rawQuery: query,
      normalizedQuery: cleaned,
      hasTypoCorrection: false,
      extractedPostalCode,
    };
  }
}
