import { describe, it, expect } from 'vitest';
import { FuzzyNormalizer } from '../../src/services/location/FuzzyNormalizer';
import { calculateHaversineDistanceKm, createGeoPoint, isValidCoordinate } from '../../src/services/location/geospatial';
import { NominatimLocationProvider } from '../../src/services/location/NominatimProvider';

describe('Location System & Geospatial Verification Suite', () => {
  describe('A: Fuzzy Normalizer & Generic Sanitization', () => {
    it('should sanitize whitespace and punctuation without inventing city names', () => {
      const norm = FuzzyNormalizer.normalize('   Random Town ; Area  ');
      expect(norm.normalizedQuery).toBe('Random Town, Area');
      expect(norm.normalizedQuery.toLowerCase()).not.toContain('ahmedabad');
    });

    it('should extract postal codes correctly from any query', () => {
      const norm1 = FuzzyNormalizer.normalize('380015');
      expect(norm1.extractedPostalCode).toBe('380015');

      const norm2 = FuzzyNormalizer.normalize('Main road, Sector 5 110001');
      expect(norm2.extractedPostalCode).toBe('110001');
      expect(norm2.normalizedQuery.toLowerCase()).toContain('sector 5');
    });

    it('should normalize colloquial inputs without hardcoded city mapping', () => {
      const norm = FuzzyNormalizer.normalize('Mandvi kutch');
      expect(norm.normalizedQuery.toLowerCase()).toContain('mandvi');
      expect(norm.normalizedQuery.toLowerCase()).toContain('kutch');
    });

    it('should handle partial addresses e.g. Highway or Street', () => {
      const norm = FuzzyNormalizer.normalize('Highway 44 ; Main road');
      expect(norm.normalizedQuery.toLowerCase()).toContain('highway 44, main road');
    });
  });

  describe('B: Real Geospatial Distance Calculations (Haversine)', () => {
    it('should calculate accurate distance between Ahmedabad and Rajkot (~198 km)', () => {
      // Ahmedabad: 23.0225, 72.5714
      // Rajkot: 22.3039, 70.8022
      const dist = calculateHaversineDistanceKm(23.0225, 72.5714, 22.3039, 70.8022);
      expect(dist).toBeGreaterThan(190);
      expect(dist).toBeLessThan(210);
    });

    it('should return 0 km for identical coordinates', () => {
      const dist = calculateHaversineDistanceKm(22.3039, 70.8022, 22.3039, 70.8022);
      expect(dist).toBe(0);
    });

    it('should accurately calculate local neighbourhood distance (e.g. 5-10 km)', () => {
      // Kalawad road to Yagnik road in Rajkot (~4.5 km)
      const dist = calculateHaversineDistanceKm(22.2850, 70.7750, 22.3000, 70.7980);
      expect(dist).toBeGreaterThan(2);
      expect(dist).toBeLessThan(8);
    });
  });

  describe('C: GeoJSON 2dsphere Canonical Coordinate Ordering [lng, lat]', () => {
    it('should enforce [longitude, latitude] array order required by MongoDB 2dsphere', () => {
      const lat = 22.3039;
      const lon = 70.8022;
      const geoPoint = createGeoPoint(lat, lon);

      expect(geoPoint.type).toBe('Point');
      expect(geoPoint.coordinates[0]).toBe(lon); // Longitude first
      expect(geoPoint.coordinates[1]).toBe(lat); // Latitude second
    });

    it('should validate valid coordinates correctly', () => {
      expect(isValidCoordinate(22.3039, 70.8022)).toBe(true);
      expect(isValidCoordinate(95, 70.8022)).toBe(false); // Invalid latitude
      expect(isValidCoordinate(22.3039, 195)).toBe(false); // Invalid longitude
      expect(isValidCoordinate(NaN as any, 70.8022)).toBe(false);
    });
  });

  describe('D: Boundary-Distance Coverage Matching', () => {
    // Base center: Rajkot (22.3039, 70.8022) with 25km radius
    const baseLat = 22.3039;
    const baseLng = 70.8022;
    const radiusKm = 25;

    it('should cover a location 10 km from center', () => {
      // Point ~10km away: 22.35, 70.85
      const dist = calculateHaversineDistanceKm(baseLat, baseLng, 22.35, 70.85);
      expect(dist).toBeLessThan(radiusKm);
    });

    it('should reject a location 40 km from center (outside boundary)', () => {
      // Gondal: ~38 km away: 21.96, 70.79
      const dist = calculateHaversineDistanceKm(baseLat, baseLng, 21.96, 70.79);
      expect(dist).toBeGreaterThan(radiusKm);
    });
  });

  describe('E: Zero Silent Ahmedabad / Default Fallback', () => {
    it('should NOT fall back to Ahmedabad when query is an unknown or distant place', async () => {
      const results = await NominatimLocationProvider.search('Tokyo Shibuya crossing 12345');
      // Should either return Tokyo results or empty, never Ahmedabad
      for (const r of results) {
        expect(r.city?.toLowerCase()).not.toBe('ahmedabad');
        expect(r.formattedAddress.toLowerCase()).not.toContain('ahmedabad');
      }
    }, 15000);

    it('should return empty results for gibberish without guessing Ahmedabad', async () => {
      const results = await NominatimLocationProvider.search('zzxxqwerty9988nonexistent');
      expect(results.length).toBe(0);
    }, 15000);
  });

  describe('F: Hierarchical City & Area Search', () => {
    it('should search and return verified city result with provider postcode', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 12345,
            lat: '22.8314',
            lon: '69.7214',
            display_name: 'Mundra, Kutch, Gujarat, 370421, India',
            address: {
              town: 'Mundra',
              district: 'Kutch',
              state: 'Gujarat',
              country: 'India',
              postcode: '370421',
            },
          },
        ],
      }) as any;

      try {
        const results = await NominatimLocationProvider.search('Mundra');
        expect(results.length).toBeGreaterThan(0);
        const mundra = results.find((r) => r.city?.toLowerCase() === 'mundra' || r.town?.toLowerCase() === 'mundra' || r.formattedAddress.toLowerCase().includes('mundra'));
        expect(mundra).toBeDefined();
        expect(mundra?.postalCode).toBe('370421');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return verified localities when searching within city context (e.g. Powai, Mumbai)', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 67890,
            lat: '19.1176',
            lon: '72.9060',
            display_name: 'Powai, Mumbai, Maharashtra, 400076, India',
            address: {
              suburb: 'Powai',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              postcode: '400076',
            },
          },
        ],
      }) as any;

      try {
        const results = await NominatimLocationProvider.search('Powai', 'Mumbai');
        expect(results.length).toBeGreaterThan(0);
        const powai = results.find((r) => (r.locality || r.suburb || r.locationName || '').toLowerCase().includes('powai'));
        expect(powai).toBeDefined();
        expect(powai?.city?.toLowerCase()).toBe('mumbai');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return verified localities when searching within city context (e.g. Satellite, Ahmedabad)', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 11223,
            lat: '23.0300',
            lon: '72.5175',
            display_name: 'Satellite, Ahmedabad, Gujarat, 380015, India',
            address: {
              suburb: 'Satellite',
              city: 'Ahmedabad',
              district: 'Ahmedabad',
              state: 'Gujarat',
              country: 'India',
              postcode: '380015',
            },
          },
        ],
      }) as any;

      try {
        const results = await NominatimLocationProvider.search('Satellite', 'Ahmedabad');
        expect(results.length).toBeGreaterThan(0);
        const sat = results.find((r) =>
          [r.locality, r.suburb, r.road, r.formattedAddress].some((f) => f?.toLowerCase().includes('satellite'))
        );
        expect(sat).toBeDefined();
        expect([sat?.city, sat?.district].some((x) => x?.toLowerCase() === 'ahmedabad')).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should normalize query with pincode correctly', () => {
      const norm = FuzzyNormalizer.normalize('Mundra 370421');
      expect(norm.extractedPostalCode).toBe('370421');
      expect(norm.normalizedQuery.toLowerCase()).toContain('mundra');
    });
  });
});

