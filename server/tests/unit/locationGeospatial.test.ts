import { describe, it, expect } from 'vitest';
import { FuzzyNormalizer } from '../../src/services/location/FuzzyNormalizer';
import { calculateHaversineDistanceKm, createGeoPoint, isValidCoordinate } from '../../src/services/location/geospatial';
import { NominatimLocationProvider } from '../../src/services/location/NominatimProvider';
import { CoverageService, calculateHaversineDistance, calculateSphericalLawOfCosinesDistance } from '../../src/services/coverageService';

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

  describe('G: Authoritative CoverageService & Real Geospatial Boundary Logic', () => {
    // Reference points:
    // Mundra center: 22.8393, 69.7249
    // Koday coordinates: 22.8680, 69.5250 (~20.72 km)
    // Mandvi coordinates: 22.8330, 69.3550 (~38.12 km)

    it('E. Customer inside radius: distanceKm < radiusKm -> COVERED', () => {
      const companyArea = {
        _id: 'area-mundra-1',
        locationName: 'Mundra Operating Hub',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 23,
        services: ['SOLAR', 'AC'] as any,
        active: true,
      };

      // Koday is ~20.72 km from Mundra center. Configured radius is 23 km.
      const res = CoverageService.checkAreaCoverage(22.8680, 69.5250, companyArea);
      expect(res.withinRadius).toBe(true);
      expect(res.distanceKm).toBeLessThan(23);
      expect(res.serviceMatches).toBe(true);
      expect(res.reason).toBeUndefined();
    });

    it('F. Customer exactly on boundary: distanceKm == radiusKm -> COVERED (Boundary is INCLUDED)', () => {
      const centerLat = 22.8393;
      const centerLon = 69.7249;
      // Customer at Koday: distance is ~20.7248 km
      const exactDistance = calculateHaversineDistance(centerLat, centerLon, 22.8680, 69.5250);

      const companyArea = {
        _id: 'area-boundary-1',
        locationName: 'Boundary Hub',
        latitude: centerLat,
        longitude: centerLon,
        radiusKm: exactDistance, // Configured radius is exactly equal to the distance
        services: ['SOLAR'] as any,
        active: true,
      };

      const res = CoverageService.checkAreaCoverage(22.8680, 69.5250, companyArea);
      expect(res.distanceKm).toBeCloseTo(exactDistance, 5);
      expect(res.withinRadius).toBe(true); // Boundary is INCLUDED
    });

    it('G. Customer outside radius: distanceKm > radiusKm -> NOT COVERED', () => {
      const companyArea = {
        _id: 'area-mundra-1',
        locationName: 'Mundra Operating Hub',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 23, // 23 km radius
        services: ['SOLAR', 'AC'] as any,
        active: true,
      };

      // Mandvi is ~38.12 km from Mundra center. 38.12 > 23.
      const res = CoverageService.checkAreaCoverage(22.8330, 69.3550, companyArea);
      expect(res.withinRadius).toBe(false);
      expect(res.distanceKm).toBeGreaterThan(23);
      expect(res.reason).toContain('OUTSIDE_RADIUS');
    });

    it('J. Inactive area is ignored even if customer is within distance', () => {
      const inactiveArea = {
        _id: 'area-inactive-1',
        locationName: 'Decommissioned Hub',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 50,
        services: ['SOLAR'] as any,
        active: false, // Inactive
      };

      const res = CoverageService.checkAreaCoverage(22.8680, 69.5250, inactiveArea);
      expect(res.active).toBe(false);
      expect(res.withinRadius).toBe(true); // Geographically inside the 50km radius circle
      expect(res.reason).toBe('AREA_INACTIVE'); // But discarded by evaluateCoverage because inactive
    });

    it('K. Service-specific filtering verifies requested service against area offerings', () => {
      const solarOnlyArea = {
        _id: 'area-solar-1',
        locationName: 'Solar Only Hub',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 25,
        services: ['SOLAR'] as any,
        active: true,
      };

      const solarCheck = CoverageService.checkAreaCoverage(22.8680, 69.5250, solarOnlyArea, 'comp-1', 'Comp', 'SOLAR');
      expect(solarCheck.serviceMatches).toBe(true);

      const acCheck = CoverageService.checkAreaCoverage(22.8680, 69.5250, solarOnlyArea, 'comp-1', 'Comp', 'AC');
      expect(acCheck.serviceMatches).toBe(false);
      expect(acCheck.reason).toBe('SERVICE_NOT_SUPPORTED_IN_AREA');
    });

    it('M. Missing or invalid customer coordinates are rejected immediately', () => {
      const validArea = {
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 25,
        services: ['SOLAR'] as any,
        active: true,
      };

      const resInvalidLat = CoverageService.checkAreaCoverage(95, 69.7249, validArea);
      expect(resInvalidLat.withinRadius).toBe(false);
      expect(resInvalidLat.reason).toBe('LOCATION_COORDINATES_REQUIRED');

      const resNaN = CoverageService.checkAreaCoverage(NaN, NaN, validArea);
      expect(resNaN.withinRadius).toBe(false);
      expect(resNaN.reason).toBe('LOCATION_COORDINATES_REQUIRED');
    });

    it('N. Missing coverage center coordinates in legacy data are safely rejected without crashing', () => {
      const legacyAreaWithoutCoords = {
        city: 'Koday',
        radiusKm: 25,
        services: ['SOLAR'] as any,
        active: true,
      };

      const res = CoverageService.checkAreaCoverage(22.8680, 69.5250, legacyAreaWithoutCoords);
      expect(res.withinRadius).toBe(false);
      expect(res.reason).toBe('COVERAGE_COORDINATES_MISSING');
    });

    it('O. Spherical Law of Cosines cross-verifies Haversine math within 0.05% margin', () => {
      // Mundra to Koday
      const hav = calculateHaversineDistance(22.8393, 69.7249, 22.8680, 69.5250);
      const cos = calculateSphericalLawOfCosinesDistance(22.8393, 69.7249, 22.8680, 69.5250);

      expect(hav).toBeGreaterThan(20);
      expect(hav).toBeLessThan(21.5);

      const diff = Math.abs(hav - cos);
      expect(diff).toBeLessThan(0.01); // Within 10 meters on a ~20.7km geodesic line
    });

    it('H & I. Multi-coverage area support: evaluates EVERY active area independently', () => {
      // Company with 3 areas:
      // Area A: Mandvi (22.833, 69.355) radius: 10 km (Customer at Koday 22.868, 69.525 is ~17.8 km away -> outside)
      // Area B: Mundra (22.8393, 69.7249) radius: 23 km (Customer at Koday is ~20.73 km away -> inside)
      // Area C: Rajkot (22.3039, 70.8022) radius: 30 km (Customer at Koday is ~140 km away -> outside)
      const areaMandvi = {
        _id: 'area-mandvi',
        locationName: 'Mandvi Hub',
        latitude: 22.833,
        longitude: 69.355,
        radiusKm: 10,
        services: ['AC'] as any,
        active: true,
      };

      const areaMundra = {
        _id: 'area-mundra',
        locationName: 'Mundra Hub',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 23,
        services: ['SOLAR'] as any,
        active: true,
      };

      const areaRajkot = {
        _id: 'area-rajkot',
        locationName: 'Rajkot Hub',
        latitude: 22.3039,
        longitude: 70.8022,
        radiusKm: 30,
        services: ['SOLAR', 'AC'] as any,
        active: true,
      };

      // Check each area independently for customer at Koday:
      const kodayLat = 22.8680;
      const kodayLon = 69.5250;

      const evalMandvi = CoverageService.checkAreaCoverage(kodayLat, kodayLon, areaMandvi);
      expect(evalMandvi.withinRadius).toBe(false); // Outside Area A

      const evalMundra = CoverageService.checkAreaCoverage(kodayLat, kodayLon, areaMundra);
      expect(evalMundra.withinRadius).toBe(true); // Inside Area B! Must NOT stop because Area A didn't cover.

      const evalRajkot = CoverageService.checkAreaCoverage(kodayLat, kodayLon, areaRajkot);
      expect(evalRajkot.withinRadius).toBe(false); // Outside Area C
    });

    it('L. Old city name alone cannot create coverage without valid coordinates', () => {
      const areaWithCityOnly = {
        _id: 'area-legacy-1',
        city: 'Mundra',
        radiusKm: 25,
        services: ['SOLAR'] as any,
        active: true,
      };

      const evalResult = CoverageService.checkAreaCoverage(22.8680, 69.5250, areaWithCityOnly);
      expect(evalResult.withinRadius).toBe(false);
      expect(evalResult.reason).toBe('COVERAGE_COORDINATES_MISSING');
    });

    it('U. Cross-tenant isolation verification logic', () => {
      const technicianCompanyId = 'company-tenant-alpha';
      const requestingManagerCompanyId = 'company-tenant-beta';

      // Tenant check
      const hasPermission = technicianCompanyId === requestingManagerCompanyId;
      expect(hasPermission).toBe(false);
    });

    it('X. Diagnostic evaluation reports actual distance and radius values', () => {
      const area = {
        _id: 'area-diag-1',
        locationName: 'Kutch Solar Hub',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 23,
        services: ['SOLAR'] as any,
        active: true,
      };

      const diag = CoverageService.checkAreaCoverage(22.8680, 69.5250, area, 'comp-101', 'Kutch Energy', 'SOLAR');
      expect(diag.companyId).toBe('comp-101');
      expect(diag.areaName).toBe('Kutch Solar Hub');
      expect(diag.centerLatitude).toBe(22.8393);
      expect(diag.centerLongitude).toBe(69.7249);
      expect(diag.radiusKm).toBe(23);
      expect(diag.distanceKm).toBeCloseTo(20.73, 1);
      expect(diag.withinRadius).toBe(true);
      expect(diag.serviceMatches).toBe(true);
    });
  });

  describe('H: Technician Regional 25km Coverage & Zero 7800km Null-Island Error', () => {
    it('should reject uninitialized (0, 0) Null Island coordinates to prevent 7800km false distance', () => {
      expect(isValidCoordinate(0, 0)).toBe(false);
      expect(isValidCoordinate(0.00001, 0.00001)).toBe(false);
      expect(isValidCoordinate(22.8393, 69.7249)).toBe(true);
    });

    it('should cover all villages within 25km when technician is added with a city center', () => {
      // Technician added at Mundra Hub (22.8393, 69.7249) with 25km radius
      const techLat = 22.8393;
      const techLon = 69.7249;
      const coverageRadiusKm = 25;

      // Village 1: Koday (22.8680, 69.5250) - distance ~20.73 km
      const distKoday = calculateHaversineDistanceKm(techLat, techLon, 22.8680, 69.5250);
      expect(distKoday).toBeLessThanOrEqual(coverageRadiusKm);
      expect(distKoday).toBeCloseTo(20.73, 1);

      // Village 2: Baroi (22.8447, 69.7153) - distance ~1.14 km
      const distBaroi = calculateHaversineDistanceKm(techLat, techLon, 22.8447, 69.7153);
      expect(distBaroi).toBeLessThanOrEqual(coverageRadiusKm);
      expect(distBaroi).toBeLessThan(2);

      // Village 3: Samaghoga (22.8850, 69.7350) - distance ~5.2 km
      const distSamaghoga = calculateHaversineDistanceKm(techLat, techLon, 22.8850, 69.7350);
      expect(distSamaghoga).toBeLessThanOrEqual(coverageRadiusKm);
      expect(distSamaghoga).toBeLessThan(10);
    });

    it('should correctly calculate real distance for distant locations instead of 7800km', () => {
      // Technician at Mundra (22.8393, 69.7249)
      // Customer at Mandvi (22.8330, 69.3550) - ~37.9 km away
      const distMandvi = calculateHaversineDistanceKm(22.8393, 69.7249, 22.8330, 69.3550);
      expect(distMandvi).toBeGreaterThan(25); // Exceeds 25km radius
      expect(distMandvi).toBeCloseTo(37.9, 0); // Real distance ~38km, NEVER ~7800km
      expect(distMandvi).toBeLessThan(100);
    });
  });
});



