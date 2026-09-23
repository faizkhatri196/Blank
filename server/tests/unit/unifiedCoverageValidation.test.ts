import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { CoverageService } from '../../src/services/coverageService';
import { Technician } from '../../src/models/Technician';
import { Company } from '../../src/models/Company';

describe('Unified Technician Coverage Validation Suite (Customer & Manager Flows)', () => {
  const companyAId = new mongoose.Types.ObjectId('650000000000000000000001');
  const companyBId = new mongoose.Types.ObjectId('650000000000000000000002');
  const tech1Id = new mongoose.Types.ObjectId('650000000000000000000011');
  const tech2Id = new mongoose.Types.ObjectId('650000000000000000000012');

  // Mundra coordinates: 22.8393, 69.7249
  const mundraCoords = { lat: 22.8393, lon: 69.7249 };
  // Baroi coordinates (nearby Mundra, ~1.1 km away)
  const baroiCoords = { lat: 22.8447, lon: 69.7153 };
  // Koday coordinates (~20.72 km away)
  const kodayCoords = { lat: 22.8680, lon: 69.5250 };
  // Mandvi coordinates (~38.12 km away)
  const mandviCoords = { lat: 22.8330, lon: 69.3550 };
  // Ahmedabad coordinates (~295 km away)
  const ahmedabadCoords = { lat: 23.0225, lon: 72.5714 };

  const baseTech1: any = {
    _id: tech1Id,
    companyId: companyAId,
    name: 'Technician Adil',
    phone: '+91 98765 11111',
    email: 'adil@tech.com',
    serviceTypes: ['SOLAR'],
    serviceAreas: ['Mundra Area'],
    baseLocation: {
      formattedAddress: 'Mundra Operating Center',
      city: 'Mundra',
      latitude: mundraCoords.lat,
      longitude: mundraCoords.lon,
      center: { type: 'Point', coordinates: [mundraCoords.lon, mundraCoords.lat] },
    },
    coverageRadiusKm: 25,
    active: true,
  };

  const baseCompanyA: any = {
    _id: companyAId,
    name: 'Kutch Solar Field Services',
    active: true,
    serviceAreas: [
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000101'),
        locationName: 'Mundra Area',
        city: 'Mundra',
        latitude: mundraCoords.lat,
        longitude: mundraCoords.lon,
        radiusKm: 25,
        services: ['SOLAR', 'AC'],
        active: true,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Company, 'findById').mockReturnValue({
      lean: () => Promise.resolve(baseCompanyA),
    } as any);
    vi.spyOn(Company, 'find').mockReturnValue({
      lean: () => Promise.resolve([baseCompanyA]),
    } as any);
    vi.spyOn(Technician, 'find').mockReturnValue({
      lean: () => Promise.resolve([baseTech1]),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Same location
  it('1. Same location: distance = 0 km, eligible = true', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mundraCoords.lat,
      customerLongitude: mundraCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(true);
    expect(res.distanceKm).toBe(0);
    expect(res.radiusKm).toBe(25);
    expect(res.technician?.name).toBe('Technician Adil');
  });

  // 2. Inside radius
  it('2. Inside radius: customer 1.1 km away with 25 km radius, eligible = true', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: baroiCoords.lat,
      customerLongitude: baroiCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(true);
    expect(res.distanceKm).toBeCloseTo(1.1, 0);
    expect(res.distanceKm).toBeLessThanOrEqual(res.radiusKm);
  });

  // 3. Exactly on radius boundary
  it('3. Exactly on radius boundary: distance == radius, boundary is INCLUDED (eligible = true)', async () => {
    const exactDist = Math.round(CoverageService.checkTechnicianCoverage(kodayCoords.lat, kodayCoords.lon, baseTech1).calculation.calculatedDistanceKm * 100) / 100;
    const boundaryTech = {
      ...baseTech1,
      coverageRadiusKm: exactDist,
    };

    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(boundaryTech),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: kodayCoords.lat,
      customerLongitude: kodayCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(true);
    expect(res.distanceKm).toBeLessThanOrEqual(res.radiusKm);
  });

  // 4. Outside radius
  it('4. Outside radius: Mandvi (38.1 km away with 25 km radius), eligible = false', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mandviCoords.lat,
      customerLongitude: mandviCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(false);
    expect(res.distanceKm).toBeGreaterThan(25);
    expect(res.reason).toContain('OUTSIDE_COVERAGE');
    expect(res.technician?.name).toBe('Technician Adil');
    expect(res.coverageArea?.radiusKm).toBe(25);
  });

  // 5. Different city
  it('5. Different city: Ahmedabad (295 km away), eligible = false without large ~7900km error', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: ahmedabadCoords.lat,
      customerLongitude: ahmedabadCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(false);
    expect(res.distanceKm).toBeGreaterThan(280);
    expect(res.distanceKm).toBeLessThan(320);
    // MUST NOT be 7937 km!
    expect(res.distanceKm).not.toBeCloseTo(7937, -2);
  });

  // 6. Different area
  it('6. Different area: Koday inside 25 km -> covered; Mandvi outside 25 km -> not covered', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const coveredAreaRes = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: kodayCoords.lat,
      customerLongitude: kodayCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });
    expect(coveredAreaRes.eligible).toBe(true);

    const outsideAreaRes = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mandviCoords.lat,
      customerLongitude: mandviCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });
    expect(outsideAreaRes.eligible).toBe(false);
  });

  // 7. Missing coordinates
  it('7. Missing coordinates: customer coords missing/NaN, eligible = false', async () => {
    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: undefined as any,
      customerLongitude: undefined as any,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('CUSTOMER_COORDINATES_INVALID');
  });

  // 8. Invalid coordinates & Null Island
  it('8. Invalid coordinates & (0, 0) Null Island rejected as invalid', async () => {
    // (0, 0) Null Island in Atlantic Ocean
    const nullIslandRes = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: 0,
      customerLongitude: 0,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });
    expect(nullIslandRes.eligible).toBe(false);
    expect(nullIslandRes.reason).toBe('CUSTOMER_COORDINATES_INVALID');

    // Out of range coordinates
    const outOfRangeRes = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: 95,
      customerLongitude: 200,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });
    expect(outOfRangeRes.eligible).toBe(false);
  });

  // 9. Reversed coordinates warning
  it('9. Reversed coordinates: detects suspicious coordinate order in technician GeoJSON', async () => {
    const swappedTech = {
      ...baseTech1,
      baseLocation: {
        ...baseTech1.baseLocation,
        center: { type: 'Point', coordinates: [22.8393, 69.7249] }, // Swapped!
      },
    };

    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(swappedTech),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mundraCoords.lat,
      customerLongitude: mundraCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.coordinateOrderWarning).toBeDefined();
    expect(res.coordinateOrderWarning).toContain('Inverted GeoJSON coordinate order');
  });

  // 10. Unsupported service
  it('10. Unsupported service: technician certified only for SOLAR, customer requests AC', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mundraCoords.lat,
      customerLongitude: mundraCoords.lon,
      serviceType: 'AC',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('SERVICE_NOT_CERTIFIED');
  });

  // 11. Inactive coverage
  it('11. Inactive coverage: deactivated technician profile is rejected', async () => {
    const inactiveTech = { ...baseTech1, active: false };

    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(inactiveTech),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mundraCoords.lat,
      customerLongitude: mundraCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('TECHNICIAN_INACTIVE');
  });

  // 12. Multiple coverage areas (Section 13)
  it('12. Multiple coverage areas: customer covered under Area B even if outside Area A', async () => {
    const multiAreaCompany: any = {
      _id: companyAId,
      name: 'Kutch Solar Field Services',
      active: true,
      serviceAreas: [
        {
          _id: new mongoose.Types.ObjectId('650000000000000000000101'),
          locationName: 'Mundra Area A',
          city: 'Mundra',
          latitude: mundraCoords.lat,
          longitude: mundraCoords.lon,
          radiusKm: 20, // 20 km radius -> Koday is 20.72km away, outside!
          services: ['SOLAR'],
          active: true,
        },
        {
          _id: new mongoose.Types.ObjectId('650000000000000000000102'),
          locationName: 'Koday Area B',
          city: 'Koday',
          latitude: kodayCoords.lat,
          longitude: kodayCoords.lon,
          radiusKm: 15, // Koday center -> customer is inside!
          services: ['SOLAR'],
          active: true,
        },
      ],
    };

    const techWithMultiAreas = {
      ...baseTech1,
      coverageRadiusKm: 20,
      serviceAreas: ['Mundra Area A', 'Koday Area B'],
    };

    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(techWithMultiAreas),
    } as any);
    vi.spyOn(Company, 'findById').mockReturnValue({
      lean: () => Promise.resolve(multiAreaCompany),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: kodayCoords.lat,
      customerLongitude: kodayCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(true);
    expect(res.coverageArea?.name).toBe('Koday Area B');
    expect(res.distanceKm).toBe(0);
    expect(res.allAreasEvaluated?.length).toBeGreaterThanOrEqual(2);
  });

  // 13. Multiple technicians
  it('13. Multiple technicians: Tech 1 is outside radius, Tech 2 is inside radius', async () => {
    const tech2Inside: any = {
      _id: tech2Id,
      companyId: companyAId,
      name: 'Technician Mandvi Base',
      serviceTypes: ['SOLAR'],
      baseLocation: {
        formattedAddress: 'Mandvi Center',
        city: 'Mandvi',
        latitude: mandviCoords.lat,
        longitude: mandviCoords.lon,
        center: { type: 'Point', coordinates: [mandviCoords.lon, mandviCoords.lat] },
      },
      coverageRadiusKm: 25,
      active: true,
    };

    vi.spyOn(Technician, 'findOne').mockReturnValueOnce({
      lean: () => Promise.resolve(baseTech1),
    } as any);
    const resTech1 = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mandviCoords.lat,
      customerLongitude: mandviCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });
    expect(resTech1.eligible).toBe(false);

    vi.spyOn(Technician, 'findOne').mockReturnValueOnce({
      lean: () => Promise.resolve(tech2Inside),
    } as any);
    const resTech2 = await CoverageService.validateTechnicianCoverage({
      technicianId: tech2Id,
      customerLatitude: mandviCoords.lat,
      customerLongitude: mandviCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });
    expect(resTech2.eligible).toBe(true);
    expect(resTech2.distanceKm).toBe(0);
  });

  // 14. Multiple companies (Cross-tenant isolation)
  it('14. Multiple companies: Company A manager cannot access Company B technician', async () => {
    const techCompanyB = { ...baseTech1, companyId: companyBId };

    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(null),
    } as any);
    vi.spyOn(Technician, 'findById').mockReturnValue({
      lean: () => Promise.resolve(techCompanyB),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mundraCoords.lat,
      customerLongitude: mundraCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('CROSS_COMPANY_ACCESS_DENIED');
  });

  // 15. Newly created technician
  it('15. Newly created technician immediately participates in coverage validation', async () => {
    const newTechId = new mongoose.Types.ObjectId();
    const newlyCreatedTech: any = {
      _id: newTechId,
      companyId: companyAId,
      name: 'Newly Created Tech',
      serviceTypes: ['SOLAR', 'AC'],
      baseLocation: {
        formattedAddress: 'New Field Office, Mundra',
        city: 'Mundra',
        latitude: mundraCoords.lat,
        longitude: mundraCoords.lon,
      },
      coverageRadiusKm: 30,
      active: true,
    };

    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(newlyCreatedTech),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: newTechId,
      customerLatitude: kodayCoords.lat,
      customerLongitude: kodayCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(true);
    expect(res.technician?.name).toBe('Newly Created Tech');
    expect(res.radiusKm).toBe(30);
  });

  // 16. Existing technician
  it('16. Existing technician validates consistently across requests', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    const res = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: baroiCoords.lat,
      customerLongitude: baroiCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(res.eligible).toBe(true);
    expect(res.technician?.id).toBe(tech1Id.toString());
  });

  // 17. Customer dashboard request flow (technician pool evaluation)
  it('17. Customer request flow: evaluates technician pool and accepts if at least one tech covers location', async () => {
    vi.spyOn(Company, 'find').mockReturnValue({
      lean: () => Promise.resolve([baseCompanyA]),
    } as any);
    vi.spyOn(Technician, 'find').mockReturnValue({
      lean: () => Promise.resolve([baseTech1]),
    } as any);
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    // Within coverage area of tech1
    const resCovered = await CoverageService.validateTechnicianCoverage({
      customerLatitude: baroiCoords.lat,
      customerLongitude: baroiCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(resCovered.eligible).toBe(true);
    expect(resCovered.technician?.name).toBe('Technician Adil');

    // Outside coverage area of tech1 (Mandvi)
    const resOutside = await CoverageService.validateTechnicianCoverage({
      customerLatitude: mandviCoords.lat,
      customerLongitude: mandviCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
    });

    expect(resOutside.eligible).toBe(false);
    expect(resOutside.reason).toContain('OUTSIDE_COVERAGE');
  });

  // 18. Manager dashboard assignment flow (targeted technician assignment rejection & acceptance)
  it('18. Manager assignment flow: rejects assignment outside radius and accepts inside radius with identical calculation', async () => {
    vi.spyOn(Technician, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(baseTech1),
    } as any);

    // Outside radius -> rejected with full diagnostic properties
    const outsideAssignment = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: mandviCoords.lat,
      customerLongitude: mandviCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
      customerAddress: 'Mandvi, Gujarat',
    });

    expect(outsideAssignment.eligible).toBe(false);
    expect(outsideAssignment.distanceKm).toBeGreaterThan(25);
    expect(outsideAssignment.radiusKm).toBe(25);
    expect(outsideAssignment.technician?.name).toBe('Technician Adil');
    expect(outsideAssignment.coverageArea).toBeDefined();

    // Inside radius -> accepted
    const insideAssignment = await CoverageService.validateTechnicianCoverage({
      technicianId: tech1Id,
      customerLatitude: baroiCoords.lat,
      customerLongitude: baroiCoords.lon,
      serviceType: 'SOLAR',
      companyId: companyAId,
      customerAddress: 'Baroi, Mundra',
    });

    expect(insideAssignment.eligible).toBe(true);
    expect(insideAssignment.distanceKm).toBeLessThanOrEqual(25);
    expect(insideAssignment.technician?.name).toBe('Technician Adil');
  });
});
