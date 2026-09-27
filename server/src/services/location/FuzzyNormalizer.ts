/**
 * Generic query normalizer and input sanitizer.
 * Universal string sanitation: cleans extra spaces, normalizes punctuation,
 * and detects explicit postal code tokens.
 *
 * CRITICAL RULE:
 * NEVER hardcode specific cities, towns, areas, or PIN codes.
 * Zero city-specific substitutions.
 */

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

    // Extract explicit 5-6 digit postal code from search query if user typed one
    const postalMatch = trimmed.match(/\b\d{5,6}\b/);
    const extractedPostalCode = postalMatch ? postalMatch[0] : undefined;

    // Standardize commas and remove trailing punctuation
    const cleaned = trimmed
      .replace(/[;]+/g, ',')
      .replace(/\s*,\s*/g, ', ')
      .replace(/^[,\s]+|[,\s]+$/g, '');

    return {
      rawQuery: query,
      normalizedQuery: cleaned,
      hasTypoCorrection: false,
      extractedPostalCode,
    };
  }
}
