import { describe, it, expect } from 'vitest';
import { FuzzyNormalizer } from '../../src/services/location/FuzzyNormalizer';
import { calculateHaversineDistanceKm, createGeoPoint, isValidCoordinate } from '../../src/services/location/geospatial';
import { NominatimLocationProvider } from '../../src/services/location/NominatimProvider';

describe('Location System & Geospatial Verification Suite', () => {
  describe('A: Fuzzy Normalizer & Typo Tolerance', () => {
    it('should normalize city typos e.g. Ahmedbad -> Ahmedabad', () => {
      const norm = FuzzyNormalizer.normalize('Ahmedbad');
      expect(norm.normalizedQuery.toLowerCase()).toContain('ahmedabad');
      expect(norm.hasTypoCorrection).toBe(true);
    });

    it('should extract postal codes correctly', () => {
      const norm1 = FuzzyNormalizer.normalize('380015');
      expect(norm1.extractedPostalCode).toBe('380015');

      const norm2 = FuzzyNormalizer.normalize('Kalawad road, Rajkot 360005');
      expect(norm2.extractedPostalCode).toBe('360005');
      expect(norm2.normalizedQuery.toLowerCase()).toContain('rajkot');
    });

    it('should normalize colloquial inputs e.g. Mandvi kutch', () => {
      const norm = FuzzyNormalizer.normalize('Mandvi kutch');
      expect(norm.normalizedQuery.toLowerCase()).toContain('mandvi');
      expect(norm.normalizedQuery.toLowerCase()).toContain('kutch');
    });

    it('should handle partial addresses e.g. SG highway or Satellite', () => {
      const norm = FuzzyNormalizer.normalize('SG highway');
      expect(norm.normalizedQuery.toLowerCase()).toContain('sg highway');
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
        expect(r.city.toLowerCase()).not.toBe('ahmedabad');
        expect(r.locationName.toLowerCase()).not.toBe('ahmedabad');
      }
    });

    it('should return empty results for gibberish without guessing Ahmedabad', async () => {
      const results = await NominatimLocationProvider.search('zzxxqwerty9988nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('F: Hierarchical City & Area Search (Mundra & Localities)', () => {
    it('should search and return verified Mundra city result with pincode 370421', async () => {
      const results = await NominatimLocationProvider.search('Mundra');
      expect(results.length).toBeGreaterThan(0);
      const mundra = results.find((r) => r.city?.toLowerCase() === 'mundra' || r.locationName?.toLowerCase() === 'mundra');
      expect(mundra).toBeDefined();
      expect(mundra?.postalCode).toBe('370421');
    });

    it('should return verified localities when searching within Mundra city context', async () => {
      const results = await NominatimLocationProvider.search('Samaghoga', 'Mundra');
      expect(results.length).toBeGreaterThan(0);
      const samaghoga = results.find((r) => (r.locality || r.locationName).toLowerCase().includes('samaghoga'));
      expect(samaghoga).toBeDefined();
      expect(samaghoga?.city?.toLowerCase()).toBe('mundra');
    });

    it('should return multiple verified areas when searching all areas in Mundra', async () => {
      const results = await NominatimLocationProvider.search('Mundra', 'Mundra');
      const areas = results.map((r) => (r.locality || r.locationName || r.formattedAddress || '').toLowerCase());
      expect(areas.some((a) => a.includes('samaghoga') || a.includes('baroi') || a.includes('port'))).toBe(true);
    });

    it('should normalize Mundra pincode 370421 correctly', () => {
      const norm = FuzzyNormalizer.normalize('Mundra 370421');
      expect(norm.extractedPostalCode).toBe('370421');
      expect(norm.normalizedQuery.toLowerCase()).toContain('mundra');
    });
  });
});

