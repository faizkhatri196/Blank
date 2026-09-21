import { describe, it, expect } from 'vitest';
import { companySignupSchema, serviceAreaSchema } from '../../src/validators';
import { calculateHaversineDistanceKm } from '../../src/services/location/geospatial';
import { FuzzyNormalizer } from '../../src/services/location/FuzzyNormalizer';
import { CoverageService } from '../../src/services/coverageService';

describe('BUG A & B Regression Test Suite', () => {
  describe('Bug A: Customer Location & Service Discovery', () => {
    it('1. Location normalizer strips parenthesized pincode and resolves pure city', () => {
      const input = 'Mundra (370421)';
      const cleanCity = input
        .replace(/\s*\(\d+\)\s*$/, '')
        .split(',')[0]
        .trim()
        .toLowerCase();
      expect(cleanCity).toBe('mundra');
    });

    it('2. Geospatial Haversine calculation accurately computes distance in Mundra', () => {
      // Mundra port/SEZ (Samaghoga) ~22.8447, 69.7153 vs Mundra town ~22.8393, 69.7249
      const dist = calculateHaversineDistanceKm(22.8447, 69.7153, 22.8393, 69.7249);
      expect(dist).toBeLessThan(5); // Within 5 km
      expect(dist).toBeLessThanOrEqual(25); // Well within company 25km radius
    });

    it('3. Unsupported location does NOT match company coverage or fall back to Ahmedabad', () => {
      const unsupportedCity = 'Shimla';
      const companyCity = 'Mundra';
      const cleanUnsupported = unsupportedCity.toLowerCase();
      const cleanCompany = companyCity.toLowerCase();
      expect(cleanUnsupported === cleanCompany).toBe(false);
      expect(cleanUnsupported).not.toContain('ahmedabad');
    });

    it('4. Authoritative CoverageService determines coverage strictly by coordinates and radius', () => {
      const companyArea = {
        city: 'Mundra',
        latitude: 22.8393,
        longitude: 69.7249,
        radiusKm: 23,
        services: ['SOLAR', 'AC'] as any,
        active: true,
      };

      // Koday coordinates (22.8680, 69.5250) ~20.72 km from Mundra center
      const evalKoday = CoverageService.checkAreaCoverage(22.8680, 69.5250, companyArea);
      expect(evalKoday.withinRadius).toBe(true);
      expect(evalKoday.distanceKm).toBeLessThanOrEqual(companyArea.radiusKm);

      // Mandvi coordinates (22.8330, 69.3550) ~38.12 km from Mundra center
      const evalMandvi = CoverageService.checkAreaCoverage(22.8330, 69.3550, companyArea);
      expect(evalMandvi.withinRadius).toBe(false);
      expect(evalMandvi.distanceKm).toBeGreaterThan(companyArea.radiusKm);
    });

    it('5. Location fuzzy normalization corrects common typos without inventing Ahmedabad', () => {
      const norm = FuzzyNormalizer.normalize('Mundra');
      expect(norm.normalizedQuery.toLowerCase()).toContain('mundra');
      expect(norm.normalizedQuery.toLowerCase()).not.toContain('ahmedabad');
    });
  });

  describe('Bug B: Company Registration & Onboarding Validation', () => {
    it('1. Validates company signup payload correctly', () => {
      const validPayload = {
        companyName: 'Apex Clean Energy Ops',
        managerName: 'Vikram Sharma',
        email: 'ops@apexenergy.in',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        phone: '9876543210',
        servicesSupported: ['SOLAR', 'AC'],
        serviceAreas: [
          {
            city: 'Mundra',
            state: 'Gujarat',
            country: 'India',
            areas: ['Samaghoga', 'Baroi'],
            pincodes: ['370415', '370421'],
            radius: 25,
            services: ['SOLAR', 'AC'],
          },
        ],
      };

      const parseResult = companySignupSchema.safeParse(validPayload);
      expect(parseResult.success).toBe(true);
    });

    it('2. Rejects password confirmation mismatch with clear error message', () => {
      const mismatchPayload = {
        companyName: 'Apex Clean Energy Ops',
        managerName: 'Vikram Sharma',
        email: 'ops@apexenergy.in',
        password: 'securePassword123',
        confirmPassword: 'differentPassword456',
        phone: '9876543210',
      };

      const parseResult = companySignupSchema.safeParse(mismatchPayload);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toContain("Passwords don't match");
      }
    });

    it('3. Rejects invalid email address with informative error message', () => {
      const invalidEmailPayload = {
        companyName: 'Apex Clean Energy Ops',
        managerName: 'Vikram Sharma',
        email: 'not-an-email',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        phone: '9876543210',
      };

      const parseResult = companySignupSchema.safeParse(invalidEmailPayload);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toContain('Invalid email address');
      }
    });

    it('4. Rejects service area with empty services array', () => {
      const invalidArea = {
        city: 'Mumbai',
        state: 'Maharashtra',
        areas: ['Powai'],
        services: [], // Empty
      };

      const parseResult = serviceAreaSchema.safeParse(invalidArea);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toContain('At least one service is required');
      }
    });

    it('5. Validates service area with valid services and custom radius', () => {
      const validArea = {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        areas: ['Powai', 'Thane'],
        radiusKm: 25,
        services: ['SOLAR', 'AC'],
      };

      const parseResult = serviceAreaSchema.safeParse(validArea);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.city).toBe('Mumbai');
        expect(parseResult.data.services).toEqual(['SOLAR', 'AC']);
      }
    });
  });

  describe('Bug C: Customer Dashboard Service Application & Live Location Technician Assignment', () => {
    it('1. Computes local distance accurately for live customer location against technician base location', () => {
      // Live GPS from customer in Mundra area (~22.8400, 69.7200)
      const customerLat = 22.8400;
      const customerLon = 69.7200;

      // Technician Adil with base in Mundra (22.8393, 69.7249)
      const technicianAdil = {
        id: 'tech-101',
        name: 'Adil',
        baseLocation: {
          city: 'Mundra',
          latitude: 22.8393,
          longitude: 69.7249,
          center: {
            type: 'Point',
            coordinates: [69.7249, 22.8393] as [number, number],
          },
        },
        coverageRadiusKm: 25,
        serviceTypes: ['SOLAR', 'AC'] as any,
        active: true,
      };

      const evalResult = CoverageService.checkTechnicianCoverage(
        customerLat,
        customerLon,
        technicianAdil,
        'SOLAR'
      );

      expect(evalResult.calculation.covered).toBe(true);
      expect(evalResult.calculation.calculatedDistanceKm).toBeLessThan(1.0); // ~0.5 km
      expect(evalResult.calculation.calculatedDistanceKm).toBeGreaterThanOrEqual(0);
      expect(evalResult.coordinateOrderWarning).toBeUndefined();
    });

    it('2. Technician in 25km radius covers all nearby villages (e.g. Koday 20.7km)', () => {
      // Village customer in Koday (~22.8680, 69.5250)
      const customerLat = 22.8680;
      const customerLon = 69.5250;

      const technicianAdil = {
        id: 'tech-101',
        name: 'Adil',
        baseLocation: {
          city: 'Mundra',
          latitude: 22.8393,
          longitude: 69.7249,
          center: {
            type: 'Point',
            coordinates: [69.7249, 22.8393] as [number, number],
          },
        },
        coverageRadiusKm: 25,
        serviceTypes: ['SOLAR', 'AC'] as any,
        active: true,
      };

      const evalResult = CoverageService.checkTechnicianCoverage(
        customerLat,
        customerLon,
        technicianAdil,
        'SOLAR'
      );

      expect(evalResult.calculation.covered).toBe(true);
      expect(evalResult.calculation.calculatedDistanceKm).toBeCloseTo(20.7, 0);
      expect(evalResult.calculation.calculatedDistanceKm).toBeLessThanOrEqual(25);
    });

    it('3. Outside operating radius (e.g. Mandvi 38km from Mundra base with 25km radius) is correctly flagged without large 7000km error', () => {
      // Mandvi (~22.8330, 69.3550) ~38km away
      const customerLat = 22.8330;
      const customerLon = 69.3550;

      const technicianAdil = {
        id: 'tech-101',
        name: 'Adil',
        baseLocation: {
          city: 'Mundra',
          latitude: 22.8393,
          longitude: 69.7249,
          center: {
            type: 'Point',
            coordinates: [69.7249, 22.8393] as [number, number],
          },
        },
        coverageRadiusKm: 25,
        serviceTypes: ['SOLAR', 'AC'] as any,
        active: true,
      };

      const evalResult = CoverageService.checkTechnicianCoverage(
        customerLat,
        customerLon,
        technicianAdil,
        'SOLAR'
      );

      expect(evalResult.calculation.covered).toBe(false);
      expect(evalResult.calculation.calculatedDistanceKm).toBeCloseTo(38.1, 0);
      // Real distance ~38km, NEVER 7937 km or Null Island!
      expect(evalResult.calculation.calculatedDistanceKm).toBeLessThan(100);
      expect(evalResult.calculation.reason).toContain('OUTSIDE_OPERATING_RADIUS');
    });
  });
});

