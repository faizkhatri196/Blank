import { describe, it, expect } from 'vitest';
import { calculateTechnicianMatches } from '../../src/services/matchingService';
import mongoose from 'mongoose';

describe('Technician Matching Algorithm Tests', () => {
  const dummySolarTicket: any = {
    _id: new mongoose.Types.ObjectId(),
    serviceType: 'SOLAR',
    complaint: 'Inverter showing error and not generating',
    symptoms: ['Inverter error', 'Zero generation'],
    errorCode: 'Error 04',
  };

  const dummyACTicket: any = {
    _id: new mongoose.Types.ObjectId(),
    serviceType: 'AC',
    complaint: 'Split AC running but not cooling',
    symptoms: ['Warm air', 'Compressor humming'],
    errorCode: '',
  };

  const dummyTechnicians: any[] = [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Rahul (Solar Only)',
      phone: '9876500001',
      experienceYears: 5,
      serviceTypes: ['SOLAR'],
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Vikram (AC Only)',
      phone: '9876500002',
      experienceYears: 4,
      serviceTypes: ['AC'],
      skills: ['AC_INSTALLATION', 'REFRIGERANT_CHARGING', 'ELECTRICAL_TROUBLESHOOTING', 'COMPRESSOR_REPAIR'],
      tools: ['MANIFOLD_GAUGE', 'VACUUM_PUMP', 'MULTIMETER', 'CLAMP_METER'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Jay (Dual Solar + AC)',
      phone: '9876500003',
      experienceYears: 7,
      serviceTypes: ['SOLAR', 'AC'],
      skills: ['INVERTER_REPAIR', 'REFRIGERANT_CHARGING', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MANIFOLD_GAUGE'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Inactive Tech',
      phone: '9876500004',
      experienceYears: 10,
      serviceTypes: ['SOLAR', 'AC'],
      skills: ['INVERTER_REPAIR'],
      tools: ['MULTIMETER'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: false,
    },
  ];

  it('should filter out technicians who do not support the serviceType', () => {
    const solarMatches = calculateTechnicianMatches(dummySolarTicket, dummyTechnicians, null, 'Ahmedabad');

    // Vikram (AC Only) and Inactive Tech must be excluded
    const matchedNames = solarMatches.map((m) => m.technicianName);
    expect(matchedNames).toContain('Rahul (Solar Only)');
    expect(matchedNames).toContain('Jay (Dual Solar + AC)');
    expect(matchedNames).not.toContain('Vikram (AC Only)');
    expect(matchedNames).not.toContain('Inactive Tech');
  });

  it('should filter out Solar technicians for AC service tickets', () => {
    const acMatches = calculateTechnicianMatches(dummyACTicket, dummyTechnicians, null, 'Ahmedabad');

    const matchedNames = acMatches.map((m) => m.technicianName);
    expect(matchedNames).toContain('Vikram (AC Only)');
    expect(matchedNames).toContain('Jay (Dual Solar + AC)');
    expect(matchedNames).not.toContain('Rahul (Solar Only)');
  });

  it('should compute explainable reasons and sort by score', () => {
    const solarMatches = calculateTechnicianMatches(dummySolarTicket, dummyTechnicians, null, 'Ahmedabad');

    expect(solarMatches.length).toBeGreaterThan(0);
    expect(solarMatches[0].score).toBeGreaterThanOrEqual(solarMatches[1].score);
    expect(solarMatches[0].reasons.length).toBeGreaterThan(0);
    expect(solarMatches[0].score).toBeLessThanOrEqual(100);
  });
});
