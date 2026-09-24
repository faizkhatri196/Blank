import { describe, it, expect } from 'vitest';
import { resolveServiceCoverage } from '../../src/services/location/coverageService';
import { Company } from '../../src/models/Company';
import mongoose from 'mongoose';

describe('Multi-Tenant Coverage & Dynamic Provider Routing Unit Tests', () => {
  it('should rank a company with exact GPS coordinates inside radius higher than a coordinate-less legacy company', async () => {
    // Mock Company.find to return two companies:
    // Company 1 (Legacy): No GPS, but city is 'Mandvi', pincode '370465'
    // Company 2 (New Modern): Exact GPS [69.349, 22.835], 25km radius, covers Mandvi
    const legacyCompanyId = new mongoose.Types.ObjectId();
    const modernCompanyId = new mongoose.Types.ObjectId();

    const mockCompanies = [
      {
        _id: legacyCompanyId,
        name: "Legacy Provider",
        active: true,
        servicesSupported: ['SOLAR'],
        serviceAreas: [
          {
            city: 'Mandvi',
            pincode: '370465',
            areas: [],
            services: ['SOLAR'],
            active: true,
            // No coordinates
          }
        ]
      },
      {
        _id: modernCompanyId,
        name: "Modern Solar Enterprise",
        active: true,
        servicesSupported: ['SOLAR'],
        serviceAreas: [
          {
            city: 'Mandvi',
            pincode: '370465',
            latitude: 22.8355966,
            longitude: 69.349027,
            center: {
              type: 'Point',
              coordinates: [69.349027, 22.8355966]
            },
            radiusKm: 25,
            services: ['SOLAR'],
            active: true,
          }
        ]
      }
    ];

    const originalFind = Company.find;
    Company.find = ((query?: any) => {
      if (query?._id) {
        return Promise.resolve(mockCompanies.filter((c) => c._id.toString() === query._id.toString()));
      }
      return Promise.resolve(mockCompanies);
    }) as any;

    try {
      // Customer is at Mandvi coordinates
      const result = await resolveServiceCoverage({
        latitude: 22.8314482,
        longitude: 69.35081,
        city: 'Mandvi',
        pincode: '370465',
        serviceType: 'SOLAR',
      });

      expect(result.covered).toBe(true);
      // Modern provider with GPS must be primary over coordinate-less legacy provider
      expect(result.companyId?.toString()).toBe(modernCompanyId.toString());
      expect(result.matchedBy).toBe('RADIUS');
      expect(result.allMatches).toBeDefined();
      expect(result.allMatches!.length).toBe(2);
      expect(result.allMatches![0].companyId.toString()).toBe(modernCompanyId.toString());
    } finally {
      Company.find = originalFind;
    }
  });

  it('should honor requestedCompanyId when customer chooses a specific provider covering the area', async () => {
    const companyAId = new mongoose.Types.ObjectId();
    const companyBId = new mongoose.Types.ObjectId();

    const mockCompanies = [
      {
        _id: companyAId,
        name: "Provider Alpha",
        active: true,
        servicesSupported: ['SOLAR'],
        serviceAreas: [
          {
            city: 'Mandvi',
            latitude: 22.8355,
            longitude: 69.3490,
            radiusKm: 25,
            services: ['SOLAR'],
            active: true,
          }
        ]
      },
      {
        _id: companyBId,
        name: "Provider Beta",
        active: true,
        servicesSupported: ['SOLAR'],
        serviceAreas: [
          {
            city: 'Mandvi',
            latitude: 22.8350,
            longitude: 69.3480,
            radiusKm: 25,
            services: ['SOLAR'],
            active: true,
          }
        ]
      }
    ];

    const originalFind = Company.find;
    Company.find = ((query?: any) => {
      if (query?._id) {
        return Promise.resolve(mockCompanies.filter((c) => c._id.toString() === query._id.toString()));
      }
      return Promise.resolve(mockCompanies);
    }) as any;

    try {
      // Customer specifically selects Provider Beta
      const result = await resolveServiceCoverage({
        latitude: 22.8314,
        longitude: 69.3508,
        city: 'Mandvi',
        serviceType: 'SOLAR',
        requestedCompanyId: companyBId.toString(),
      });

      expect(result.covered).toBe(true);
      expect(result.companyId?.toString()).toBe(companyBId.toString());
      expect(result.companyName).toBe("Provider Beta");
    } finally {
      Company.find = originalFind;
    }
  });
});
