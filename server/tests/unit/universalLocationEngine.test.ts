import { describe, it, expect, vi } from 'vitest';
import { UniversalAddressParser } from '../../src/services/location/UniversalAddressParser';
import { isValidApplicationCoordinate, calculateHaversineDistanceKm } from '../../src/services/location/geospatial';
import { resolveServiceCoverage } from '../../src/services/location/coverageService';
import { Company } from '../../src/models/Company';

describe('UNIVERSAL LOCATION ENGINE — PRODUCTION TEST SUITE', () => {
  describe('Phase 3: Coordinate Validation Rules', () => {
    it('accepts valid geographic coordinates within range', () => {
      expect(isValidApplicationCoordinate(28.6139, 77.2090)).toBe(true); // New Delhi
      expect(isValidApplicationCoordinate(19.0760, 72.8777)).toBe(true); // Mumbai
      expect(isValidApplicationCoordinate(-33.8688, 151.2093)).toBe(true); // Sydney
      expect(isValidApplicationCoordinate(51.5074, -0.1278)).toBe(true); // London
      expect(isValidApplicationCoordinate(90, 180)).toBe(true); // Max boundary
      expect(isValidApplicationCoordinate(-90, -180)).toBe(true); // Min boundary
    });

    it('REJECTS [0,0] Null Island strictly without exception', () => {
      expect(isValidApplicationCoordinate(0, 0)).toBe(false);
      expect(UniversalAddressParser.parse({
        latitude: 0,
        longitude: 0,
        source: 'gps',
      })).toBeNull();
    });

    it('REJECTS out-of-range coordinates', () => {
      expect(isValidApplicationCoordinate(90.1, 50)).toBe(false);
      expect(isValidApplicationCoordinate(-90.1, 50)).toBe(false);
      expect(isValidApplicationCoordinate(50, 180.1)).toBe(false);
      expect(isValidApplicationCoordinate(50, -180.1)).toBe(false);
    });

    it('REJECTS null, undefined, NaN, and Infinity', () => {
      expect(isValidApplicationCoordinate(null, null)).toBe(false);
      expect(isValidApplicationCoordinate(undefined, undefined)).toBe(false);
      expect(isValidApplicationCoordinate(NaN, 50)).toBe(false);
      expect(isValidApplicationCoordinate(50, NaN)).toBe(false);
      expect(isValidApplicationCoordinate(Infinity, 50)).toBe(false);
      expect(isValidApplicationCoordinate(50, -Infinity)).toBe(false);
    });
  });

  describe('Phase 5 & 6: Universal Address Parser & Postcode Truth', () => {
    it('fixture 1: Urban Area with houseNumber, road, suburb, city, and verified postcode', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          house_number: 'Flat 402',
          road: 'Ring Road',
          suburb: 'Metro West',
          city: 'Metropolis',
          state: 'Central State',
          country: 'Sample Country',
          postcode: '90210',
        },
        displayName: 'Flat 402, Ring Road, Metro West, Metropolis, 90210',
        latitude: 25.1234,
        longitude: 75.4321,
        source: 'gps',
      });

      expect(parsed).not.toBeNull();
      expect(parsed?.address.houseNumber).toBe('Flat 402');
      expect(parsed?.address.road).toBe('Ring Road');
      expect(parsed?.address.suburb).toBe('Metro West');
      expect(parsed?.address.city).toBe('Metropolis');
      expect(parsed?.cityDisplayName).toBe('Metropolis');
      expect(parsed?.localityDisplayName).toBe('Metro West');
      expect(parsed?.address.postcode).toBe('90210');
      expect(parsed?.source).toBe('gps');
    });

    it('fixture 2: Rural Village without city or postcode — strictly preserves null postcode and village name', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          village: 'Kalyanpur',
          district: 'Kutch',
          state: 'Gujarat',
          country: 'India',
          // No postcode provided by provider
        },
        displayName: 'Kalyanpur, Kutch, Gujarat, India',
        latitude: 23.2155,
        longitude: 69.1234,
        source: 'gps',
      });

      expect(parsed).not.toBeNull();
      expect(parsed?.address.village).toBe('Kalyanpur');
      expect(parsed?.address.city).toBeUndefined();
      // Generic hierarchy should identify Kalyanpur as the primary place
      expect(parsed?.cityDisplayName).toBe('Kalyanpur');
      expect(parsed?.localityDisplayName).toBe('Kalyanpur');
      // POSTCODE RULE: Never invent a nearby postcode. Strictly null!
      expect(parsed?.address.postcode).toBeNull();
      // Should never invent Ahmedabad/Rajkot
      expect(parsed?.cityDisplayName.toLowerCase()).not.toBe('ahmedabad');
      expect(parsed?.cityDisplayName.toLowerCase()).not.toBe('rajkot');
    });

    it('fixture 3: Town without city entity', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          town: 'Coastal Town',
          county: 'Seaside Taluka',
          state: 'Maritime State',
          country: 'Coastal Nation',
          postcode: '123456',
        },
        displayName: 'Coastal Town, Seaside Taluka, 123456',
        latitude: 21.5000,
        longitude: 70.1000,
        source: 'manual_search',
      });

      expect(parsed).not.toBeNull();
      expect(parsed?.address.town).toBe('Coastal Town');
      expect(parsed?.cityDisplayName).toBe('Coastal Town');
      expect(parsed?.address.postcode).toBe('123456');
    });

    it('fixture 4: Suburb in large metropolitan district', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          suburb: 'Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postcode: '400050',
        },
        displayName: 'Bandra West, Mumbai, 400050',
        latitude: 19.0596,
        longitude: 72.8295,
        source: 'gps',
      });

      expect(parsed).not.toBeNull();
      expect(parsed?.localityDisplayName).toBe('Bandra West');
      expect(parsed?.cityDisplayName).toBe('Mumbai');
      expect(parsed?.address.postcode).toBe('400050');
    });

    it('fixture 5: Missing postcode NEVER invents one even if city is known', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          road: 'Unknown Highway',
          city: 'Some City',
          state: 'Some State',
        },
        latitude: 20.0,
        longitude: 75.0,
        source: 'gps',
      });

      expect(parsed).not.toBeNull();
      expect(parsed?.address.postcode).toBeNull();
    });
  });

  describe('Phase 7: Generic Locality & Administrative Hierarchy (No Hardcoded Cities)', () => {
    it('uses district when neither city, town, nor village is provided', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          state_district: 'Highland District',
          state: 'Northern Province',
          country: 'Countryland',
        },
        displayName: 'Highland District, Northern Province',
        latitude: 31.0,
        longitude: 76.0,
        source: 'manual_search',
      });

      expect(parsed).not.toBeNull();
      expect(parsed?.cityDisplayName).toBe('Highland District');
    });

    it('preserves all administrative fields without mutation', () => {
      const parsed = UniversalAddressParser.parse({
        rawAddress: {
          house_number: '12',
          road: 'Park Avenue',
          neighbourhood: 'Green Meadows',
          suburb: 'East Ward',
          village: undefined,
          town: undefined,
          city: 'Capital City',
          state_district: 'Metropolitan District',
          state: 'Grand State',
          country: 'Republic of Code',
          postcode: '778899',
        },
        displayName: '12, Park Avenue, Green Meadows, Capital City',
        latitude: 12.3456,
        longitude: 78.9012,
        source: 'gps',
      });

      expect(parsed?.address.houseNumber).toBe('12');
      expect(parsed?.address.road).toBe('Park Avenue');
      expect(parsed?.address.neighbourhood).toBe('Green Meadows');
      expect(parsed?.address.suburb).toBe('East Ward');
      expect(parsed?.address.city).toBe('Capital City');
      expect(parsed?.address.district).toBe('Metropolitan District');
      expect(parsed?.address.state).toBe('Grand State');
      expect(parsed?.address.country).toBe('Republic of Code');
      expect(parsed?.address.postcode).toBe('778899');
    });
  });

  describe('Phase 12: Generic Service Coverage Engine (Dynamic Coordinates & Radius)', () => {
    it('accurately calculates Haversine distance for generic points without city logic', () => {
      // 1 degree latitude is approx 111 km
      const dist = calculateHaversineDistanceKm(20.0, 75.0, 21.0, 75.0);
      expect(dist).toBeGreaterThan(110);
      expect(dist).toBeLessThan(112);
    });

    it('returns covered: false when customer is beyond company radius (never redirects to another city)', async () => {
      // Mock Company find
      const originalFind = Company.find;
      Company.find = vi.fn().mockResolvedValue([
        {
          _id: 'comp123',
          name: 'Regional Solar Tech',
          active: true,
          servicesSupported: ['SOLAR'],
          serviceAreas: [
            {
              city: 'Hub City',
              latitude: 22.0000,
              longitude: 70.0000,
              radiusKm: 20, // 20 km coverage radius
              services: ['SOLAR'],
              active: true,
            },
          ],
        },
      ]) as any;

      try {
        // Customer is 50 km away from center
        const coverage = await resolveServiceCoverage({
          latitude: 22.4500,
          longitude: 70.0000,
          serviceType: 'SOLAR',
        });

        expect(coverage.covered).toBe(false);
        expect(coverage.explanation).toContain('No active company provides SOLAR coverage');
      } finally {
        Company.find = originalFind;
      }
    });

    it('returns covered: true when customer is within company radius', async () => {
      const originalFind = Company.find;
      Company.find = vi.fn().mockResolvedValue([
        {
          _id: 'comp456',
          name: 'Local Climate Solutions',
          active: true,
          servicesSupported: ['AC'],
          serviceAreas: [
            {
              city: 'Service City',
              latitude: 19.0000,
              longitude: 72.8000,
              radiusKm: 25,
              services: ['AC'],
              active: true,
            },
          ],
        },
      ]) as any;

      try {
        // Customer is ~11 km away (well within 25 km radius)
        const coverage = await resolveServiceCoverage({
          latitude: 19.1000,
          longitude: 72.8000,
          serviceType: 'AC',
        });

        expect(coverage.covered).toBe(true);
        expect(coverage.matchedBy).toBe('RADIUS');
        expect(coverage.companyName).toBe('Local Climate Solutions');
      } finally {
        Company.find = originalFind;
      }
    });
  });
});
