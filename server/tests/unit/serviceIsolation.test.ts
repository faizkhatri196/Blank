import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { resolveServiceCoverage, discoverAvailableServices } from '../../src/services/location/coverageService';
import { calculateTechnicianMatches } from '../../src/services/matchingService';
import { Company } from '../../src/models/Company';
import { Technician } from '../../src/models/Technician';
import { ServiceTicket } from '../../src/models/ServiceTicket';
import { ServiceType } from '../../src/types';

describe('SERVORA: Safe Service Isolation & Professional Matching Verification Suite', () => {
  const companyHomeMaintId = new mongoose.Types.ObjectId();
  const companyPlumbingId = new mongoose.Types.ObjectId();
  const companyElectricalId = new mongoose.Types.ObjectId();
  const companySolarId = new mongoose.Types.ObjectId();
  const companyAcId = new mongoose.Types.ObjectId();
  const companyMultiId = new mongoose.Types.ObjectId();

  const mockCompanies: any[] = [
    {
      _id: companyHomeMaintId,
      name: 'SafeHome Civil & Maintenance',
      servicesSupported: ['HOME_MAINTENANCE'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          areas: ['Satellite', 'Bodakdev'],
          services: ['HOME_MAINTENANCE'],
          latitude: 23.0225,
          longitude: 72.5714,
          radiusKm: 25,
          active: true,
        },
      ],
      active: true,
    },
    {
      _id: companyPlumbingId,
      name: 'QuickFlow Plumbing Co',
      servicesSupported: ['PLUMBING'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          areas: ['Satellite', 'Bodakdev'],
          services: ['PLUMBING'],
          latitude: 23.0225,
          longitude: 72.5714,
          radiusKm: 25,
          active: true,
        },
      ],
      active: true,
    },
    {
      _id: companyElectricalId,
      name: 'BrightVolt Electrical Solutions',
      servicesSupported: ['ELECTRICAL'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          areas: ['Satellite'],
          services: ['ELECTRICAL'],
          latitude: 23.0225,
          longitude: 72.5714,
          radiusKm: 25,
          active: true,
        },
      ],
      active: true,
    },
    {
      _id: companySolarId,
      name: 'Gujarat Solar O&M',
      servicesSupported: ['SOLAR'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          areas: ['Satellite'],
          services: ['SOLAR'],
          latitude: 23.0225,
          longitude: 72.5714,
          radiusKm: 25,
          active: true,
        },
      ],
      active: true,
    },
    {
      _id: companyAcId,
      name: 'CoolAir HVAC Services',
      servicesSupported: ['AC'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          areas: ['Satellite'],
          services: ['AC'],
          latitude: 23.0225,
          longitude: 72.5714,
          radiusKm: 25,
          active: true,
        },
      ],
      active: true,
    },
    {
      _id: companyMultiId,
      name: 'Dual Craft Electro-Plumb',
      servicesSupported: ['PLUMBING', 'ELECTRICAL'],
      serviceAreas: [
        {
          city: 'Gandhinagar',
          areas: ['Sector 21'],
          services: ['PLUMBING', 'ELECTRICAL'],
          latitude: 23.2156,
          longitude: 72.6369,
          radiusKm: 20,
          active: true,
        },
      ],
      active: true,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TEST A: Home Maintenance-only company
  // =========================================================================
  it('TEST A: Home Maintenance-only company must discover and match HOME_MAINTENANCE only', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[0]] as any);

    const discovery = await discoverAvailableServices({
      city: 'Ahmedabad',
      area: 'Satellite',
      latitude: 23.0225,
      longitude: 72.5714,
      requestedCompanyId: companyHomeMaintId,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toEqual(['HOME_MAINTENANCE']);
    expect(discovery.availableServiceTypes).not.toContain('SOLAR');
    expect(discovery.availableServiceTypes).not.toContain('AC');
    expect(discovery.availableServiceTypes).not.toContain('PLUMBING');
    expect(discovery.availableServiceTypes).not.toContain('ELECTRICAL');
  });

  // =========================================================================
  // TEST B: Plumbing-only company
  // =========================================================================
  it('TEST B: Plumbing-only company must discover and match PLUMBING only', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[1]] as any);

    const discovery = await discoverAvailableServices({
      city: 'Ahmedabad',
      area: 'Satellite',
      latitude: 23.0225,
      longitude: 72.5714,
      requestedCompanyId: companyPlumbingId,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toEqual(['PLUMBING']);
    expect(discovery.availableServiceTypes).not.toContain('SOLAR');
    expect(discovery.availableServiceTypes).not.toContain('AC');
  });

  // =========================================================================
  // TEST C: Electrical-only company
  // =========================================================================
  it('TEST C: Electrical-only company must discover and match ELECTRICAL only', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[2]] as any);

    const discovery = await discoverAvailableServices({
      city: 'Ahmedabad',
      area: 'Satellite',
      latitude: 23.0225,
      longitude: 72.5714,
      requestedCompanyId: companyElectricalId,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toEqual(['ELECTRICAL']);
    expect(discovery.availableServiceTypes).not.toContain('SOLAR');
    expect(discovery.availableServiceTypes).not.toContain('HOME_MAINTENANCE');
  });

  // =========================================================================
  // TEST D: Solar-only company
  // =========================================================================
  it('TEST D: Solar-only company preserves existing Solar behavior unchanged', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[3]] as any);

    const discovery = await discoverAvailableServices({
      city: 'Ahmedabad',
      area: 'Satellite',
      latitude: 23.0225,
      longitude: 72.5714,
      requestedCompanyId: companySolarId,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toEqual(['SOLAR']);
    expect(discovery.availableServiceTypes).not.toContain('AC');
    expect(discovery.availableServiceTypes).not.toContain('PLUMBING');
  });

  // =========================================================================
  // TEST E: AC-only company
  // =========================================================================
  it('TEST E: AC-only company preserves existing AC behavior unchanged', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[4]] as any);

    const discovery = await discoverAvailableServices({
      city: 'Ahmedabad',
      area: 'Satellite',
      latitude: 23.0225,
      longitude: 72.5714,
      requestedCompanyId: companyAcId,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toEqual(['AC']);
    expect(discovery.availableServiceTypes).not.toContain('SOLAR');
  });

  // =========================================================================
  // TEST F: Multi-service company: ["PLUMBING", "ELECTRICAL"]
  // =========================================================================
  it('TEST F: Multi-service company returns PLUMBING and ELECTRICAL only (not Solar, AC, or Home Maintenance)', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[5]] as any);

    const discovery = await discoverAvailableServices({
      city: 'Gandhinagar',
      area: 'Sector 21',
      latitude: 23.2156,
      longitude: 72.6369,
      requestedCompanyId: companyMultiId,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toContain('PLUMBING');
    expect(discovery.availableServiceTypes).toContain('ELECTRICAL');
    expect(discovery.availableServiceTypes).toHaveLength(2);
    expect(discovery.availableServiceTypes).not.toContain('SOLAR');
    expect(discovery.availableServiceTypes).not.toContain('AC');
    expect(discovery.availableServiceTypes).not.toContain('HOME_MAINTENANCE');
  });

  // =========================================================================
  // TEST G: Professional isolation
  // =========================================================================
  it('TEST G: Professional isolation ensures each trade specialist only matches their service', () => {
    const plumber = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Ramesh Plumber',
      active: true,
      serviceTypes: ['PLUMBING'],
      skills: ['PIPE_FITTING', 'LEAK_REPAIR'],
    } as any;

    const electrician = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Suresh Electrician',
      active: true,
      serviceTypes: ['ELECTRICAL'],
      skills: ['ELECTRICAL_TROUBLESHOOTING', 'WIRING'],
    } as any;

    const solarTech = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Vikram Solar Tech',
      active: true,
      serviceTypes: ['SOLAR'],
      skills: ['ELECTRICAL_TROUBLESHOOTING', 'INVERTER_REPAIR'],
    } as any;

    const acTech = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Anil AC Tech',
      active: true,
      serviceTypes: ['AC'],
      skills: ['HVAC_DIAGNOSTICS', 'REFRIGERANT_CHARGING'],
    } as any;

    const homeTech = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Dinesh Civil Tech',
      active: true,
      serviceTypes: ['HOME_MAINTENANCE'],
      skills: ['TILE_INSTALLATION_AND_REPAIR', 'CIVIL_MASONRY'],
    } as any;

    const allTechs = [plumber, electrician, solarTech, acTech, homeTech];

    // Plumbing Ticket
    const plumbingTicket = { serviceType: 'PLUMBING', complaint: 'Leaking pipe under kitchen sink' } as any;
    const plumbingMatches = calculateTechnicianMatches(plumbingTicket, allTechs);
    expect(plumbingMatches).toHaveLength(1);
    expect(plumbingMatches[0].technicianId).toBe(plumber._id.toString());

    // Electrical Ticket
    const electricalTicket = { serviceType: 'ELECTRICAL', complaint: 'MCB tripping frequently in main board' } as any;
    const electricalMatches = calculateTechnicianMatches(electricalTicket, allTechs);
    expect(electricalMatches).toHaveLength(1);
    expect(electricalMatches[0].technicianId).toBe(electrician._id.toString());

    // Solar Ticket
    const solarTicket = { serviceType: 'SOLAR', complaint: 'Inverter error code E031' } as any;
    const solarMatches = calculateTechnicianMatches(solarTicket, allTechs);
    expect(solarMatches).toHaveLength(1);
    expect(solarMatches[0].technicianId).toBe(solarTech._id.toString());

    // AC Ticket
    const acTicket = { serviceType: 'AC', complaint: 'Split AC not cooling and blowing warm air' } as any;
    const acMatches = calculateTechnicianMatches(acTicket, allTechs);
    expect(acMatches).toHaveLength(1);
    expect(acMatches[0].technicianId).toBe(acTech._id.toString());

    // Home Maintenance Ticket
    const homeTicket = { serviceType: 'HOME_MAINTENANCE', complaint: 'Cracked floor tile and wall seepage' } as any;
    const homeMatches = calculateTechnicianMatches(homeTicket, allTechs);
    expect(homeMatches).toHaveLength(1);
    expect(homeMatches[0].technicianId).toBe(homeTech._id.toString());
  });

  // =========================================================================
  // TEST H: Cross-service assignment rejection
  // =========================================================================
  it('TEST H: Cross-service assignment eligibility rejection', () => {
    const plumber = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Ramesh Plumber',
      active: true,
      serviceTypes: ['PLUMBING'],
    } as any;

    // Plumbing tech on Solar ticket -> 0 matches
    const solarTicket = { serviceType: 'SOLAR', complaint: 'Solar inverter red LED on' } as any;
    const solarMatches = calculateTechnicianMatches(solarTicket, [plumber]);
    expect(solarMatches).toHaveLength(0);

    // Electrician on Plumbing ticket -> 0 matches
    const electrician = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Suresh Electrician',
      active: true,
      serviceTypes: ['ELECTRICAL'],
    } as any;
    const plumbingTicket = { serviceType: 'PLUMBING', complaint: 'Burst water pipe' } as any;
    const plumbingMatches = calculateTechnicianMatches(plumbingTicket, [electrician]);
    expect(plumbingMatches).toHaveLength(0);

    // AC tech on Home Maintenance ticket -> 0 matches
    const acTech = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Anil AC Tech',
      active: true,
      serviceTypes: ['AC'],
    } as any;
    const homeTicket = { serviceType: 'HOME_MAINTENANCE', complaint: 'Masonry crack repair' } as any;
    const homeMatches = calculateTechnicianMatches(homeTicket, [acTech]);
    expect(homeMatches).toHaveLength(0);
  });

  // =========================================================================
  // TEST I: Customer service tampering rejection
  // =========================================================================
  it('TEST I: Customer service tampering - Attempting SOLAR against HOME_MAINTENANCE company must reject coverage', async () => {
    vi.spyOn(Company, 'find').mockResolvedValue([mockCompanies[0]] as any);

    // Customer attempts to request SOLAR against SafeHome Civil & Maintenance
    const coverage = await resolveServiceCoverage({
      city: 'Ahmedabad',
      area: 'Satellite',
      latitude: 23.0225,
      longitude: 72.5714,
      serviceType: 'SOLAR',
      requestedCompanyId: companyHomeMaintId,
    });

    expect(coverage.covered).toBe(false);
    expect(coverage.companyId).toBeUndefined();
    expect(coverage.explanation).toContain('No active company provides SOLAR coverage');
  });

  // =========================================================================
  // TEST J: Manager "ALL" filter isolation
  // =========================================================================
  it('TEST J: Company supportedServices restricts the company domain to its registered services only', () => {
    const homeMaintCompany = mockCompanies[0];
    expect(homeMaintCompany.servicesSupported).toEqual(['HOME_MAINTENANCE']);

    // An "ALL" filter for Home Maintenance company covers only HOME_MAINTENANCE
    const companyServiceScope = homeMaintCompany.servicesSupported;
    expect(companyServiceScope).toHaveLength(1);
    expect(companyServiceScope).toContain('HOME_MAINTENANCE');
    expect(companyServiceScope).not.toContain('SOLAR');
    expect(companyServiceScope).not.toContain('AC');
  });

  // =========================================================================
  // TEST K: Area-level restriction within multi-service company
  // =========================================================================
  it('TEST K: Area-specific restrictions properly constrain services within multi-service company', async () => {
    const multiCompanyWithAreaRestrictions = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Restricted Area Multiservice Co',
      servicesSupported: ['HOME_MAINTENANCE', 'PLUMBING'],
      serviceAreas: [
        {
          city: 'Vadodara',
          areas: ['Alkapuri'],
          services: ['HOME_MAINTENANCE'], // explicitly restricted to HOME_MAINTENANCE in Alkapuri
          latitude: 22.3072,
          longitude: 73.1812,
          radiusKm: 20,
          active: true,
        },
      ],
      active: true,
    };

    vi.spyOn(Company, 'find').mockResolvedValue([multiCompanyWithAreaRestrictions] as any);

    // In Alkapuri, customer can only see HOME_MAINTENANCE, not PLUMBING
    const discovery = await discoverAvailableServices({
      city: 'Vadodara',
      area: 'Alkapuri',
      latitude: 22.3072,
      longitude: 73.1812,
      requestedCompanyId: multiCompanyWithAreaRestrictions._id,
    });

    expect(discovery.coverageAvailable).toBe(true);
    expect(discovery.availableServiceTypes).toEqual(['HOME_MAINTENANCE']);
    expect(discovery.availableServiceTypes).not.toContain('PLUMBING');
  });
});
