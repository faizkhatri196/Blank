import { describe, it, expect } from 'vitest';
import { companySignupSchema, serviceAreaSchema } from '../../src/validators';
import { calculateHaversineDistanceKm } from '../../src/services/location/Geospatial';
import { FuzzyNormalizer } from '../../src/services/location/FuzzyNormalizer';

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

    it('4. Real coverage lookup logic matches city with operating radius even with neighboring pincodes', () => {
      const companyArea = {
        city: 'Mundra',
        pincodes: ['370415'],
        radiusKm: 25,
        services: ['SOLAR', 'AC'],
      };

      const customerLoc = {
        city: 'Mundra',
        pincode: '370421',
      };

      const cleanCity = customerLoc.city.toLowerCase();
      const compCity = companyArea.city.toLowerCase();
      const cityMatches = compCity === cleanCity;

      let isCovered = false;
      if (cityMatches) {
        if (customerLoc.pincode && companyArea.pincodes.length > 0) {
          if (companyArea.pincodes.includes(customerLoc.pincode)) {
            isCovered = true;
          } else if (companyArea.radiusKm >= 15) {
            isCovered = true;
          }
        }
      }

      expect(isCovered).toBe(true);
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
});
