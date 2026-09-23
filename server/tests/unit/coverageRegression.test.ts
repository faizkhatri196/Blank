import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateHaversineDistance,
  CoverageService,
} from '../../src/services/coverageService';
import {
  GeoPoint,
  GeoJSONPoint,
  toGeoJSONPoint,
  fromGeoJSONPoint,
  detectCoordinateOrderIssue,
  isValidCoordinate,
  calculateHaversineDistanceKm,
} from '../../src/services/location/geospatial';
import { ServiceType } from '../../src/types';

describe('Authoritative Coverage & Coordinate Regression Suite', () => {
  // A. Same coordinates: distance ≈ 0 km
  describe('A. Same Coordinates', () => {
    it('should return exactly 0 km when customer and technician have identical coordinates', () => {
      const mundraLat = 22.8393;
      const mundraLon = 69.7249;

      const dist = calculateDistance(mundraLat, mundraLon, mundraLat, mundraLon);
      expect(dist).toBe(0);

      const haversineDist = calculateHaversineDistance(mundraLat, mundraLon, mundraLat, mundraLon);
      expect(haversineDist).toBe(0);
    });
  });

  // B. Nearby locations: distance must be realistic
  describe('B. Nearby Locations', () => {
    it('should calculate realistic neighbourhood distance (~4.5 km in Rajkot)', () => {
      // Kalawad road (22.2850, 70.7750) to Yagnik road (22.3000, 70.7980)
      const dist = calculateDistance(22.2850, 70.7750, 22.3000, 70.7980);
      expect(dist).toBeGreaterThan(2);
      expect(dist).toBeLessThan(7);
      expect(dist).toBeCloseTo(2.88, 1);
    });
  });

  // C. Same Gujarat region: must not produce thousands of kilometers
  describe('C. Same Gujarat Region Locations', () => {
    it('should calculate realistic distances across Kutch villages and never produce thousands of km', () => {
      const mundraLat = 22.8393;
      const mundraLon = 69.7249;

      // Koday (~20.7 km away)
      const distKoday = calculateDistance(mundraLat, mundraLon, 22.8680, 69.5250);
      expect(distKoday).toBeGreaterThan(15);
      expect(distKoday).toBeLessThan(25);
      expect(distKoday).toBeCloseTo(20.7, 0);

      // Baroi (~1.1 km away)
      const distBaroi = calculateDistance(mundraLat, mundraLon, 22.8447, 69.7153);
      expect(distBaroi).toBeGreaterThan(0.5);
      expect(distBaroi).toBeLessThan(3);
      expect(distBaroi).toBeCloseTo(1.1, 0);

      // Samaghoga (~5.2 km away)
      const distSamaghoga = calculateDistance(mundraLat, mundraLon, 22.8850, 69.7350);
      expect(distSamaghoga).toBeGreaterThan(3);
      expect(distSamaghoga).toBeLessThan(8);
      expect(distSamaghoga).toBeCloseTo(5.2, 0);
    });
  });

  // D. Reversed coordinate regression: GeoJSON [longitude, latitude] vs GeoPoint { latitude, longitude }
  describe('D. Reversed Coordinate Regression & GeoJSON Contracts', () => {
    it('toGeoJSONPoint should strictly place longitude at index 0 and latitude at index 1', () => {
      const geoPoint: GeoPoint = { latitude: 22.8393, longitude: 69.7249 };
      const geoJSON: GeoJSONPoint = toGeoJSONPoint(geoPoint);

      expect(geoJSON.type).toBe('Point');
      expect(geoJSON.coordinates[0]).toBe(69.7249); // Longitude first
      expect(geoJSON.coordinates[1]).toBe(22.8393); // Latitude second
    });

    it('fromGeoJSONPoint should extract longitude from index 0 and latitude from index 1', () => {
      const coords: [number, number] = [69.7249, 22.8393];
      const point: GeoPoint = fromGeoJSONPoint(coords);

      expect(point.latitude).toBe(22.8393);
      expect(point.longitude).toBe(69.7249);
    });

    it('detectCoordinateOrderIssue should flag inverted [latitude, longitude] arrays', () => {
      // Inverted: lat=22.8393 in position 0, lon=69.7249 in position 1
      const invertedCoords: [number, number] = [22.8393, 69.7249];
      const warning = detectCoordinateOrderIssue(invertedCoords, 22.8393, 69.7249);

      expect(warning).toBeDefined();
      expect(warning).toContain('Inverted GeoJSON coordinate order');
    });

    it('detectCoordinateOrderIssue should flag uninitialized (0, 0) Null Island coordinates', () => {
      const nullIslandCoords: [number, number] = [0, 0];
      const warning = detectCoordinateOrderIssue(nullIslandCoords);

      expect(warning).toBeDefined();
      expect(warning).toContain('Null Island');
    });

    it('detectCoordinateOrderIssue should return undefined for canonical [longitude, latitude] coordinates', () => {
      const canonicalCoords: [number, number] = [69.7249, 22.8393];
      const warning = detectCoordinateOrderIssue(canonicalCoords, 22.8393, 69.7249);

      expect(warning).toBeUndefined();
    });
  });

  // E. Radius boundary: distance exactly equal to radius => COVERED
  describe('E. Radius Boundary (Inclusive)', () => {
    it('should mark coverage as covered when distance is exactly equal to the configured radius', () => {
      const centerLat = 22.8393;
      const centerLon = 69.7249;
      const radiusKm = 20;

      // Point exactly 20 km north (approx 0.180027 degrees lat)
      const dLatDeg = (radiusKm / 6371) * (180 / Math.PI);
      const boundaryCustomerLat = centerLat + dLatDeg;
      const boundaryCustomerLon = centerLon;

      const distance = calculateDistance(boundaryCustomerLat, boundaryCustomerLon, centerLat, centerLon);
      expect(distance).toBeCloseTo(radiusKm, 3);

      const technician = {
        name: 'Boundary Tech',
        baseLocation: {
          latitude: centerLat,
          longitude: centerLon,
          center: { type: 'Point', coordinates: [centerLon, centerLat] },
        },
        coverageRadiusKm: radiusKm,
        serviceTypes: ['SOLAR'],
        active: true,
      };

      const result = CoverageService.checkTechnicianCoverage(
        boundaryCustomerLat,
        boundaryCustomerLon,
        technician,
        'SOLAR'
      );

      expect(result.calculation.covered).toBe(true);
      expect(result.calculation.calculatedDistanceKm).toBeLessThanOrEqual(radiusKm);
    });
  });

  // F. Just outside radius: distance > radius => NOT COVERED
  describe('F. Just Outside Radius', () => {
    it('should mark coverage as NOT covered when distance exceeds radius by even 100 meters', () => {
      const centerLat = 22.8393;
      const centerLon = 69.7249;
      const radiusKm = 20;

      // Point 20.2 km north
      const dLatDeg = ((radiusKm + 0.2) / 6371) * (180 / Math.PI);
      const outsideCustomerLat = centerLat + dLatDeg;
      const outsideCustomerLon = centerLon;

      const distance = calculateDistance(outsideCustomerLat, outsideCustomerLon, centerLat, centerLon);
      expect(distance).toBeGreaterThan(radiusKm);

      const technician = {
        name: 'Boundary Tech',
        baseLocation: {
          latitude: centerLat,
          longitude: centerLon,
          center: { type: 'Point', coordinates: [centerLon, centerLat] },
        },
        coverageRadiusKm: radiusKm,
        serviceTypes: ['SOLAR'],
        active: true,
      };

      const result = CoverageService.checkTechnicianCoverage(
        outsideCustomerLat,
        outsideCustomerLon,
        technician,
        'SOLAR'
      );

      expect(result.calculation.covered).toBe(false);
      expect(result.calculation.reason).toContain('OUTSIDE_OPERATING_RADIUS');
    });
  });

  // G. Customer location change: new coordinates must be used
  describe('G. Customer Location Change', () => {
    it('should dynamically update coverage when customer location moves', () => {
      const techLat = 22.8393;
      const techLon = 69.7249;
      const technician = {
        name: 'Adil',
        baseLocation: {
          latitude: techLat,
          longitude: techLon,
          center: { type: 'Point', coordinates: [techLon, techLat] },
        },
        coverageRadiusKm: 20,
        serviceTypes: ['SOLAR', 'AC'],
        active: true,
      };

      // Customer in Mundra (~0 km): covered
      const evalMundra = CoverageService.checkTechnicianCoverage(22.8393, 69.7249, technician, 'SOLAR');
      expect(evalMundra.calculation.covered).toBe(true);
      expect(evalMundra.calculation.calculatedDistanceKm).toBe(0);

      // Customer changes location to Mandvi (22.8330, 69.3550, ~37.9 km away): outside 20km radius
      const evalMandvi = CoverageService.checkTechnicianCoverage(22.8330, 69.3550, technician, 'SOLAR');
      expect(evalMandvi.calculation.covered).toBe(false);
      expect(evalMandvi.calculation.calculatedDistanceKm).toBeGreaterThan(35);
      expect(evalMandvi.calculation.calculatedDistanceKm).toBeLessThan(40);
    });
  });

  // H. Technician base location change: new coordinates must be used
  describe('H. Technician Base Location Change', () => {
    it('should dynamically use new technician base coordinates after relocation', () => {
      const customerLat = 22.8393; // Mundra
      const customerLon = 69.7249;

      const techOriginal = {
        name: 'Adil',
        baseLocation: {
          latitude: 23.0225, // Ahmedabad (~295 km away)
          longitude: 72.5714,
          center: { type: 'Point', coordinates: [72.5714, 23.0225] },
        },
        coverageRadiusKm: 20,
        serviceTypes: ['SOLAR'],
        active: true,
      };

      const evalBefore = CoverageService.checkTechnicianCoverage(customerLat, customerLon, techOriginal, 'SOLAR');
      expect(evalBefore.calculation.covered).toBe(false);
      expect(evalBefore.calculation.calculatedDistanceKm).toBeGreaterThan(280);

      // Technician moves base to Mundra
      const techRelocated = {
        ...techOriginal,
        baseLocation: {
          latitude: customerLat,
          longitude: customerLon,
          center: { type: 'Point', coordinates: [customerLon, customerLat] },
        },
      };

      const evalAfter = CoverageService.checkTechnicianCoverage(customerLat, customerLon, techRelocated, 'SOLAR');
      expect(evalAfter.calculation.covered).toBe(true);
      expect(evalAfter.calculation.calculatedDistanceKm).toBe(0);
    });
  });

  // I. currentLocation: must NEVER replace baseLocation for coverage
  describe('I. Separation of currentLocation Telemetry from baseLocation Coverage', () => {
    it('must evaluate coverage strictly from baseLocation even if currentLocation is 500 km away', () => {
      const mundraLat = 22.8393;
      const mundraLon = 69.7249;

      const technician = {
        name: 'Adil',
        baseLocation: {
          formattedAddress: 'Mundra Operating Hub',
          latitude: mundraLat,
          longitude: mundraLon,
          center: { type: 'Point', coordinates: [mundraLon, mundraLat] },
        },
        coverageRadiusKm: 20,
        currentLocation: {
          latitude: 19.0760, // Mumbai (~570 km away)
          longitude: 72.8777,
          address: 'Mumbai Field Visit',
          timestamp: new Date(),
        },
        serviceTypes: ['SOLAR', 'AC'],
        active: true,
      };

      const result = CoverageService.checkTechnicianCoverage(mundraLat, mundraLon, technician, 'SOLAR');

      // Distance MUST be 0 km (measured against baseLocation at Mundra), NOT 570 km (Mumbai)
      expect(result.calculation.calculatedDistanceKm).toBe(0);
      expect(result.calculation.covered).toBe(true);
      expect(result.technician.currentLocation).toBeDefined();
      expect(result.technician.currentLocation?.latitude).toBe(19.0760);
    });
  });

  // J. Multiple technician/company coverage areas: each evaluated independently
  describe('J. Independent Multi-Technician Evaluation', () => {
    it('should evaluate multiple technicians independently without cross-contamination', () => {
      const customerLat = 22.8393; // Mundra
      const customerLon = 69.7249;

      const techAdil = {
        id: 'tech-1',
        name: 'Adil',
        baseLocation: {
          latitude: 22.8393,
          longitude: 69.7249,
          center: { type: 'Point', coordinates: [69.7249, 22.8393] },
        },
        coverageRadiusKm: 20,
        serviceTypes: ['SOLAR', 'AC'],
        active: true,
      };

      const techFarhan = {
        id: 'tech-2',
        name: 'Farhan',
        baseLocation: {
          latitude: 22.3039, // Rajkot (~125 km away)
          longitude: 70.8022,
          center: { type: 'Point', coordinates: [70.8022, 22.3039] },
        },
        coverageRadiusKm: 25,
        serviceTypes: ['SOLAR'],
        active: true,
      };

      const evalAdil = CoverageService.checkTechnicianCoverage(customerLat, customerLon, techAdil, 'SOLAR');
      const evalFarhan = CoverageService.checkTechnicianCoverage(customerLat, customerLon, techFarhan, 'SOLAR');

      expect(evalAdil.calculation.covered).toBe(true);
      expect(evalAdil.calculation.calculatedDistanceKm).toBe(0);

      expect(evalFarhan.calculation.covered).toBe(false);
      expect(evalFarhan.calculation.calculatedDistanceKm).toBeGreaterThan(120);
    });
  });

  // Reproduce the exact failing case from production
  describe('Exact Runtime Production Case: Customer Mundra vs Technician Adil', () => {
    it('should evaluate real runtime Mundra customer and Adil technician to ~0 km and COVERED', () => {
      // Real Customer Mundra coordinates
      const customerLat = 22.8393;
      const customerLon = 69.7249;

      // Real Technician Adil base profile
      const technicianAdil = {
        id: 'tech-adil-production-id',
        name: 'Adil',
        baseLocation: {
          formattedAddress: 'Mundra, Gujarat 370421',
          city: 'Mundra',
          latitude: 22.8393,
          longitude: 69.7249,
          center: {
            type: 'Point',
            coordinates: [69.7249, 22.8393] as [number, number], // [longitude, latitude]
          },
        },
        coverageRadiusKm: 20, // configured database value
        serviceTypes: ['SOLAR', 'AC'] as ServiceType[],
        active: true,
      };

      const result = CoverageService.checkTechnicianCoverage(
        customerLat,
        customerLon,
        technicianAdil,
        'SOLAR',
        'Mundra, Gujarat 370421'
      );

      expect(result.customer.latitude).toBe(customerLat);
      expect(result.customer.longitude).toBe(customerLon);
      expect(result.technician.name).toBe('Adil');
      expect(result.technician.coverageRadiusKm).toBe(20);
      expect(result.technician.geoJSONCoordinates).toEqual([69.7249, 22.8393]);
      expect(result.calculation.calculatedDistanceKm).toBe(0);
      expect(result.calculation.covered).toBe(true);
      expect(result.coordinateOrderWarning).toBeUndefined();
    });

    it('should detect Null Island (0, 0) and prevent false 7937 km distance evaluation', () => {
      const customerLat = 22.8393;
      const customerLon = 69.7249;

      // Uninitialized Adil with Null Island (0, 0) default
      const uninitializedAdil = {
        id: 'tech-adil-bad-coords',
        name: 'Adil',
        baseLocation: {
          city: 'Mundra',
          center: {
            type: 'Point',
            coordinates: [0, 0] as [number, number],
          },
        },
        coverageRadiusKm: 20,
        serviceTypes: ['SOLAR', 'AC'] as ServiceType[],
        active: true,
      };

      const result = CoverageService.checkTechnicianCoverage(
        customerLat,
        customerLon,
        uninitializedAdil,
        'SOLAR'
      );

      // Must NOT evaluate distance to (0, 0) as valid 7937 km!
      expect(result.calculation.covered).toBe(false);
      expect(result.coordinateOrderWarning).toBeDefined();
      expect(result.coordinateOrderWarning).toContain('Null Island');
    });
  });
});
