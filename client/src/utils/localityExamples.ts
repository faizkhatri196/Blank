/**
 * SERVORA UI Locality Placeholder Helper
 * 
 * Provides dynamic, city-aware placeholder text with realistic locality examples.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. This is STRICTLY for UI placeholder/example text.
 * 2. It must NEVER participate in coordinates, geocoding, serviceability,
 *    postcode resolution, technician matching, or ticket dispatch.
 * 3. Never invents localities for unknown cities — falls back to a generic prompt.
 */

/**
 * Normalizes a city string exclusively for matching UI locality placeholder examples.
 * Takes the primary city token before commas, converts to lowercase, and strips punctuation.
 *
 * Examples:
 *   "Ahmedabad, Gujarat" -> "ahmedabad"
 *   "Ahmedabad, Gujarat, India" -> "ahmedabad"
 *   "ahmedabad" -> "ahmedabad"
 *   "New Delhi" -> "new delhi"
 *   "Vadodara" -> "vadodara"
 */
export function normalizeCityForExamples(cityRaw?: string | null): string {
  if (!cityRaw) return '';
  const firstSegment = cityRaw.split(',')[0].trim().toLowerCase();
  return firstSegment.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Curated UI example localities for prominent operational cities.
 * Used exclusively for placeholder prompt hints in the search box.
 */
export const CITY_LOCALITY_EXAMPLES: Record<string, string[]> = {
  ahmedabad: ['Satellite', 'Bopal', 'Maninagar', 'Chandkheda'],
  rajkot: ['Kalawad Road', 'Raiya Road', 'University Road'],
  vadodara: ['Alkapuri', 'Gotri', 'Manjalpur'],
  baroda: ['Alkapuri', 'Gotri', 'Manjalpur'],
  surat: ['Adajan', 'Vesu', 'Varachha'],
  mumbai: ['Andheri', 'Bandra', 'Borivali'],
  bombay: ['Andheri', 'Bandra', 'Borivali'],
  delhi: ['Rohini', 'Dwarka', 'Saket'],
  'new delhi': ['Rohini', 'Dwarka', 'Saket'],
  gandhinagar: ['Sector 7', 'Kudasan', 'Infocity'],
  bengaluru: ['Indiranagar', 'Koramangala', 'Whitefield'],
  bangalore: ['Indiranagar', 'Koramangala', 'Whitefield'],
  pune: ['Kothrud', 'Baner', 'Viman Nagar'],
  mundra: ['Baroi', 'Samaghoga', 'Mundra Port'],
  mandvi: ['Salaya', 'Bada', 'Maska'],
  bhuj: ['Madhapar', 'Mirzapar', 'Jubilee Ground'],
};

/**
 * Returns a city-aware placeholder string for the locality search input.
 * 
 * Behavior:
 * - Ahmedabad: "Search area in Ahmedabad (e.g. Satellite, Bopal, Maninagar)..."
 * - Rajkot: "Search area in Rajkot (e.g. Kalawad Road, Raiya Road, University Road)..."
 * - Vadodara: "Search area in Vadodara (e.g. Alkapuri, Gotri, Manjalpur)..."
 * - Mumbai: "Search area in Mumbai (e.g. Andheri, Bandra, Borivali)..."
 * - Delhi: "Search area in Delhi (e.g. Rohini, Dwarka, Saket)..."
 * - Unknown city: "Search area in {City} (e.g. enter your locality)..."
 */
export function getCityLocalityPlaceholder(cityName?: string | null): string {
  if (!cityName || !cityName.trim()) {
    return 'Search area / locality (e.g. enter your locality)...';
  }

  const rawTrimmed = cityName.trim();
  // Display clean primary city segment in placeholder text
  const displayCity = rawTrimmed.split(',')[0].trim();
  const normalized = normalizeCityForExamples(displayCity);
  const examples = CITY_LOCALITY_EXAMPLES[normalized];

  if (examples && examples.length > 0) {
    // Show top 3 examples to prevent horizontal overflow on mobile viewports
    const sample = examples.slice(0, 3).join(', ');
    return `Search area in ${displayCity} (e.g. ${sample})...`;
  }

  // Safe fallback for unlisted cities — never invent fictional areas
  return `Search area in ${displayCity} (e.g. enter your locality)...`;
}
