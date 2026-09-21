import { describe, it, expect } from 'vitest';
import { CoverageService } from '../../src/services/coverageService';
import { calculateDistance, toGeoJSONPoint, detectCoordinateOrderIssue } from '../../src/services/location/geospatial';
import { ServiceType } from '../../src/types';

/**
 * Direct geodetic formula to generate exact destination point given distance and bearing
 */
function destinationPoint(latDeg: number, lonDeg: number, distanceKm: number, bearingDeg: number = 45): { lat: number; lon: number } {
  const R = 6371; // Earth radius in km
  const d = distanceKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (latDeg * Math.PI) / 180;
  const lon1 = (lonDeg * Math.PI) / 180;

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));

  return {
    lat: (lat2 * 180) / Math.PI,
    lon: (lon2 * 180) / Math.PI,
  };
}

describe('GENERIC GEOSPATIAL TEST MATRIX (Section 16 & 17)', () => {
  // 5 distinct technicians across different cities and varied operating radii
  const testTechnicians = [
    {
      id: 'tech_delhi_01',
      name: 'Vikram Sharma',
      city: 'Delhi',
      area: 'Connaught Place',
      lat: 28.6304,
      lon: 77.2177,
      radiusKm: 15,
      services: ['SOLAR' as ServiceType],
      active: true,
    },
    {
      id: 'tech_bengaluru_02',
      name: 'Ananya Iyer',
      city: 'Bengaluru',
      area: 'Indiranagar',
      lat: 12.9716,
      lon: 77.5946,
      radiusKm: 25,
      services: ['AC' as ServiceType],
      active: true,
    },
    {
      id: 'tech_pune_03',
      name: 'Rohan Kulkarni',
      city: 'Pune',
      area: 'Kothrud',
      lat: 18.5204,
      lon: 73.8567,
      radiusKm: 20,
      services: ['SOLAR' as ServiceType, 'AC' as ServiceType],
      active: true,
    },
    {
      id: 'tech_jaipur_04',
      name: 'Pooja Shekhawat',
      city: 'Jaipur',
      area: 'Malviya Nagar',
      lat: 26.9124,
      lon: 75.7873,
      radiusKm: 10,
      services: ['SOLAR' as ServiceType],
      active: true,
    },
    {
      id: 'tech_kolkata_05',
      name: 'Debabrata Roy',
      city: 'Kolkata',
      area: 'Salt Lake',
      lat: 22.5726,
      lon: 88.3639,
      radiusKm: 30,
      services: ['AC' as ServiceType],
      active: true,
    },
  ];

  describe('1. Systematic Evaluation for Every Technician', () => {
    testTechnicians.forEach((tech) => {
      describe(`Technician ${tech.name} (${tech.city}, Radius: ${tech.radiusKm}km)`, () => {
        const buildTechObj = (overrides?: any) => ({
          _id: tech.id,
          name: tech.name,
          serviceTypes: tech.services,
          coverageRadiusKm: tech.radiusKm,
          active: tech.active,
          baseLocation: {
            city: tech.city,
            area: tech.area,
            latitude: tech.lat,
            longitude: tech.lon,
            center: toGeoJSONPoint({ latitude: tech.lat, longitude: tech.lon }),
          },
          ...overrides,
        });

        it('should cover customer at identical coordinates (~0 km)', () => {
          const techObj = buildTechObj();
          const evalRes = CoverageService.checkTechnicianCoverage(
            tech.lat,
            tech.lon,
            techObj,
            tech.services[0]
          );

          expect(evalRes.calculation.covered).toBe(true);
          expect(evalRes.calculation.calculatedDistanceKm).toBeLessThan(0.01);
          expect(evalRes.technician.coverageRadiusKm).toBe(tech.radiusKm);
        });

        it('should cover customer inside operating radius (half-way point)', () => {
          const insidePoint = destinationPoint(tech.lat, tech.lon, tech.radiusKm * 0.5);
          const techObj = buildTechObj();
          const evalRes = CoverageService.checkTechnicianCoverage(
            insidePoint.lat,
            insidePoint.lon,
            techObj,
            tech.services[0]
          );

          expect(evalRes.calculation.covered).toBe(true);
          expect(evalRes.calculation.calculatedDistanceKm).toBeLessThanOrEqual(tech.radiusKm);
        });

        it('should cover customer exactly at operating radius boundary (d = r)', () => {
          const boundaryPoint = destinationPoint(tech.lat, tech.lon, tech.radiusKm);
          const techObj = buildTechObj();
          const evalRes = CoverageService.checkTechnicianCoverage(
            boundaryPoint.lat,
            boundaryPoint.lon,
            techObj,
            tech.services[0]
          );

          expect(evalRes.calculation.covered).toBe(true);
          expect(Math.abs(evalRes.calculation.calculatedDistanceKm - tech.radiusKm)).toBeLessThan(0.05);
        });

        it('should reject customer outside operating radius (d > r)', () => {
          const outsidePoint = destinationPoint(tech.lat, tech.lon, tech.radiusKm + 5);
          const techObj = buildTechObj();
          const evalRes = CoverageService.checkTechnicianCoverage(
            outsidePoint.lat,
            outsidePoint.lon,
            techObj,
            tech.services[0]
          );

          expect(evalRes.calculation.covered).toBe(false);
          expect(evalRes.calculation.calculatedDistanceKm).toBeGreaterThan(tech.radiusKm);
          expect(evalRes.calculation.reason).toContain('OUTSIDE_OPERATING_RADIUS');
        });

        it('should reject customer in a completely different city', () => {
          // Opposite side of the country (approx 1000+ km away)
          const farPoint = { lat: 8.5241, lon: 76.9366 }; // Thiruvananthapuram
          const techObj = buildTechObj();
          const evalRes = CoverageService.checkTechnicianCoverage(
            farPoint.lat,
            farPoint.lon,
            techObj,
            tech.services[0]
          );

          expect(evalRes.calculation.covered).toBe(false);
          expect(evalRes.calculation.calculatedDistanceKm).toBeGreaterThan(200);
          expect(evalRes.calculation.reason).toContain('OUTSIDE_OPERATING_RADIUS');
        });

        it('should reject if technician is inactive', () => {
          const techObj = buildTechObj({ active: false });
          const evalRes = CoverageService.checkTechnicianCoverage(
            tech.lat,
            tech.lon,
            techObj,
            tech.services[0]
          );

          expect(evalRes.calculation.covered).toBe(false);
          expect(evalRes.calculation.reason).toBe('TECHNICIAN_INACTIVE');
        });

        it('should reject if service requested is not supported by technician', () => {
          // Service that is definitely not in tech.services
          const unsupportedService = (['SOLAR', 'AC', 'INVERTER', 'BATTERY'] as ServiceType[]).find(
            (s) => !tech.services.includes(s)
          ) || ('WIND' as ServiceType);
          const techObj = buildTechObj();
          const evalRes = CoverageService.checkTechnicianCoverage(
            tech.lat,
            tech.lon,
            techObj,
            unsupportedService
          );

          expect(evalRes.calculation.covered).toBe(false);
          expect(evalRes.calculation.reason).toContain('SERVICE_NOT_CERTIFIED');
        });
      });
    });
  });

  describe('2. Missing, Swapped, and Invalid Coordinates', () => {
    const validTech = {
      _id: 'tech_robustness',
      name: 'Robustness Tech',
      serviceTypes: ['SOLAR' as ServiceType],
      coverageRadiusKm: 20,
      active: true,
      baseLocation: {
        latitude: 23.0225,
        longitude: 72.5714,
        center: { type: 'Point' as const, coordinates: [72.5714, 23.0225] as [number, number] },
      },
    };

    it('should reject missing or NaN customer coordinates with CUSTOMER_COORDINATES_INVALID', () => {
      const evalRes1 = CoverageService.checkTechnicianCoverage(NaN, 72.5714, validTech, 'SOLAR');
      expect(evalRes1.calculation.covered).toBe(false);
      expect(evalRes1.calculation.reason).toBe('CUSTOMER_COORDINATES_INVALID');

      const evalRes2 = CoverageService.checkTechnicianCoverage(undefined as any, undefined as any, validTech, 'SOLAR');
      expect(evalRes2.calculation.covered).toBe(false);
      expect(evalRes2.calculation.reason).toBe('CUSTOMER_COORDINATES_INVALID');
    });

    it('should reject missing technician base coordinates with TECHNICIAN_BASE_LOCATION_COORDINATES_MISSING_OR_INVALID', () => {
      const techWithoutCoords = {
        _id: 'tech_no_coords',
        name: 'No Coords Tech',
        serviceTypes: ['SOLAR' as ServiceType],
        coverageRadiusKm: 20,
        active: true,
        baseLocation: {
          city: 'Anywhere',
        },
      };

      const evalRes = CoverageService.checkTechnicianCoverage(23.0225, 72.5714, techWithoutCoords, 'SOLAR');
      expect(evalRes.calculation.covered).toBe(false);
      expect(evalRes.calculation.reason).toContain('TECHNICIAN_BASE_LOCATION_COORDINATES_MISSING');
    });

    it('should detect swapped GeoJSON coordinate order [lat, lon] instead of [lon, lat]', () => {
      const warning = detectCoordinateOrderIssue([23.0225, 72.5714], 23.0225, 72.5714);
      expect(warning).toBeDefined();
      expect(warning).toContain('Inverted GeoJSON coordinate order');
    });

    it('should detect uninitialized Null Island [0, 0] coordinates', () => {
      const warning = detectCoordinateOrderIssue([0, 0], 0, 0);
      expect(warning).toBeDefined();
      expect(warning).toContain('uninitialized');
    });
  });

  describe('3. Multi-Coverage Area & Company Isolation', () => {
    it('evaluates every company service area independently based on coordinates and radius', () => {
      const companyServiceAreas = [
        {
          _id: 'area_mundra',
          locationName: 'Mundra Hub',
          latitude: 22.8393,
          longitude: 69.7249,
          radiusKm: 20,
          services: ['SOLAR' as ServiceType],
          active: true,
        },
        {
          _id: 'area_koday',
          locationName: 'Koday Hub',
          latitude: 22.8712,
          longitude: 69.5312,
          radiusKm: 15,
          services: ['SOLAR' as ServiceType],
          active: true,
        },
        {
          _id: 'area_mandvi',
          locationName: 'Mandvi Hub',
          latitude: 22.8329,
          longitude: 69.3541,
          radiusKm: 30,
          services: ['SOLAR' as ServiceType],
          active: true,
        },
      ];

      // Customer in Koday (22.8712, 69.5312)
      const kodayEval = companyServiceAreas.map((area) =>
        CoverageService.checkAreaCoverage(22.8712, 69.5312, area, 'company_1', 'Solar Corp', 'SOLAR')
      );

      // Koday area should cover Koday customer within 0 km
      const kodayResult = kodayEval.find((a) => a.areaId === 'area_koday');
      expect(kodayResult?.withinRadius).toBe(true);
      expect(kodayResult?.distanceKm).toBeLessThan(0.01);

      // Mundra is approx 20 km away from Koday
      const mundraResult = kodayEval.find((a) => a.areaId === 'area_mundra');
      expect(mundraResult?.distanceKm).toBeGreaterThan(15);
    });
  });

  describe('4. Randomized / Data-Driven Generator Test (Section 17)', () => {
    it('automatically generates 20 random technician coordinates and validates mathematical coverage', () => {
      for (let i = 0; i < 20; i++) {
        // Random latitude (-55 to +55) and longitude (-160 to +160)
        const randLat = Math.round((Math.random() * 110 - 55) * 10000) / 10000;
        const randLon = Math.round((Math.random() * 320 - 160) * 10000) / 10000;
        const randRadius = Math.round(5 + Math.random() * 95); // 5 to 100 km

        const generatedTech = {
          _id: `tech_rand_${i}`,
          name: `Automated Tech ${i}`,
          serviceTypes: ['SOLAR' as ServiceType],
          coverageRadiusKm: randRadius,
          active: true,
          baseLocation: {
            latitude: randLat,
            longitude: randLon,
            center: toGeoJSONPoint({ latitude: randLat, longitude: randLon }),
          },
        };

        // 1. Inside point (70% of radius)
        const inside = destinationPoint(randLat, randLon, randRadius * 0.7);
        const insideEval = CoverageService.checkTechnicianCoverage(
          inside.lat,
          inside.lon,
          generatedTech,
          'SOLAR'
        );
        expect(insideEval.calculation.covered).toBe(true);
        expect(insideEval.calculation.calculatedDistanceKm).toBeLessThanOrEqual(randRadius);

        // 2. Outside point (130% of radius)
        const outside = destinationPoint(randLat, randLon, randRadius * 1.3);
        const outsideEval = CoverageService.checkTechnicianCoverage(
          outside.lat,
          outside.lon,
          generatedTech,
          'SOLAR'
        );
        expect(outsideEval.calculation.covered).toBe(false);
        expect(outsideEval.calculation.calculatedDistanceKm).toBeGreaterThan(randRadius);
      }
    });
  });
});
