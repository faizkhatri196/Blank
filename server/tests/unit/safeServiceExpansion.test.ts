import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { ServiceRegistry } from '../../src/config/serviceRegistry';
import { calculateTechnicianMatches } from '../../src/services/matchingService';
import { normalizeComplaint } from '../../src/ai/complaintNormalizer';
import { DemoAIProvider } from '../../src/ai/DemoAIProvider';
import { aiOutputSchema } from '../../src/validators';

describe('Safe Home & Field Service Expansion Unit Tests', () => {
  // 1. Service Catalog & Registry Configuration
  describe('Service Catalog & Problem Definitions', () => {
    it('should register all core and expanded service verticals in ServiceRegistry', () => {
      const allServices = ServiceRegistry.getAllServices();
      const serviceTypes = allServices.map((s) => s.serviceType);

      expect(serviceTypes).toContain('SOLAR');
      expect(serviceTypes).toContain('AC');
      expect(serviceTypes).toContain('PLUMBING');
      expect(serviceTypes).toContain('HOME_MAINTENANCE');
      expect(serviceTypes).toContain('ELECTRICAL');
    });

    it('should return correct distinct ticket prefixes for all service types', () => {
      expect(ServiceRegistry.getTicketPrefix('SOLAR')).toBe('SOL');
      expect(ServiceRegistry.getTicketPrefix('AC')).toBe('AC');
      expect(ServiceRegistry.getTicketPrefix('PLUMBING')).toBe('PLM');
      expect(ServiceRegistry.getTicketPrefix('HOME_MAINTENANCE')).toBe('HMT');
      expect(ServiceRegistry.getTicketPrefix('ELECTRICAL')).toBe('ELE');
    });

    it('should configure complete problem cards for Home Maintenance & Civil Services', () => {
      const homeDef = ServiceRegistry.getService('HOME_MAINTENANCE');
      expect(homeDef).toBeDefined();
      expect(homeDef?.displayName).toBe('Home Maintenance / Civil Services');

      const problemCodes = (homeDef?.problemCategories || []).map((p) => p.code);
      expect(problemCodes).toContain('TILE_REPLACEMENT_OR_REPAIR');
      expect(problemCodes).toContain('WATER_LEAKAGE');
      expect(problemCodes).toContain('WALL_REPAIR');
      expect(problemCodes).toContain('FLOOR_REPAIR');
      expect(problemCodes).toContain('BATHROOM_REPAIR');
      expect(problemCodes).toContain('KITCHEN_REPAIR');
      expect(problemCodes).toContain('DOOR_WINDOW_REPAIR');
      expect(problemCodes).toContain('MINOR_MASONRY_WORK');
      expect(problemCodes).toContain('SOMETHING_ELSE');
    });

    it('should configure complete problem cards for Plumbing Services', () => {
      const plumbingDef = ServiceRegistry.getService('PLUMBING');
      expect(plumbingDef).toBeDefined();
      expect(plumbingDef?.displayName).toBe('Plumbing Service');

      const problemCodes = (plumbingDef?.problemCategories || []).map((p) => p.code);
      expect(problemCodes).toContain('PIPE_LEAKAGE');
      expect(problemCodes).toContain('TAP_REPAIR');
      expect(problemCodes).toContain('PIPE_BURST_LEAK');
      expect(problemCodes).toContain('DRAIN_BLOCKED');
      expect(problemCodes).toContain('BATHROOM_PLUMBING');
      expect(problemCodes).toContain('LOW_WATER_PRESSURE');
      expect(problemCodes).toContain('SOMETHING_ELSE');
    });
  });

  // 2. Service-Aware Technician Matching & Hard Disqualification
  describe('Service-Aware Matching & Strict Disqualification', () => {
    const solarTech: any = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Ramesh (Solar Only)',
      phone: '9876500001',
      experienceYears: 5,
      serviceTypes: ['SOLAR'],
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR'],
      tools: ['MULTIMETER', 'CLAMP_METER'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    };

    const acTech: any = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Anil (AC Only)',
      phone: '9876500002',
      experienceYears: 4,
      serviceTypes: ['AC'],
      skills: ['AC_INSTALLATION', 'REFRIGERANT_CHARGING'],
      tools: ['MANIFOLD_GAUGE', 'VACUUM_PUMP'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    };

    const plumberTech: any = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Mahesh (Plumber Only)',
      phone: '9876500003',
      experienceYears: 6,
      serviceTypes: ['PLUMBING'],
      skills: ['PIPE_FITTING', 'LEAK_DETECTION_REPAIR', 'TAP_VALVE_REPLACEMENT', 'DRAIN_CLEANING'],
      tools: ['PIPE_WRENCH', 'PLUMBERS_TAPE', 'BASIN_WRENCH'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    };

    const civilHomeTech: any = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Dinesh (Civil/Home Only)',
      phone: '9876500004',
      experienceYears: 8,
      serviceTypes: ['HOME_MAINTENANCE'],
      skills: ['TILE_REPLACEMENT', 'WATERPROOFING_SEEPAGE', 'WALL_PLASTER_REPAIR', 'FLOOR_REPAIR'],
      tools: ['TROWEL', 'TILE_CUTTER', 'SPIRIT_LEVEL'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    };

    const multiTech: any = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Karan (Dual Plumbing + Home)',
      phone: '9876500005',
      experienceYears: 7,
      serviceTypes: ['PLUMBING', 'HOME_MAINTENANCE'],
      skills: ['PIPE_FITTING', 'TILE_REPLACEMENT', 'WATERPROOFING_SEEPAGE'],
      tools: ['PIPE_WRENCH', 'TROWEL'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    };

    const pool = [solarTech, acTech, plumberTech, civilHomeTech, multiTech];

    it('PLUMBING ticket: Only plumbers and certified multi-techs are eligible; Solar and AC are strictly excluded', () => {
      const plumbingTicket: any = {
        _id: new mongoose.Types.ObjectId(),
        serviceType: 'PLUMBING',
        complaint: 'Severe pipe burst leaking under bathroom sink',
        symptoms: ['Burst pipe', 'Water spray'],
      };

      const matches = calculateTechnicianMatches(plumbingTicket, pool, null, 'Ahmedabad');
      const matchedNames = matches.map((m) => m.technicianName);

      // Plumber and multi-tech must be included
      expect(matchedNames).toContain('Mahesh (Plumber Only)');
      expect(matchedNames).toContain('Karan (Dual Plumbing + Home)');

      // Solar-only, AC-only, and Home-only technicians must NEVER match a Plumbing ticket
      expect(matchedNames).not.toContain('Ramesh (Solar Only)');
      expect(matchedNames).not.toContain('Anil (AC Only)');
      expect(matchedNames).not.toContain('Dinesh (Civil/Home Only)');
    });

    it('HOME_MAINTENANCE ticket: Only home repair / civil techs are eligible; Solar, AC, and Plumbing-only are excluded', () => {
      const homeTicket: any = {
        _id: new mongoose.Types.ObjectId(),
        serviceType: 'HOME_MAINTENANCE',
        complaint: 'Three broken bathroom floor tiles need urgent replacement',
        symptoms: ['Broken tiles', 'Loose floor'],
      };

      const matches = calculateTechnicianMatches(homeTicket, pool, null, 'Ahmedabad');
      const matchedNames = matches.map((m) => m.technicianName);

      // Home maintenance tech and multi-tech must be included
      expect(matchedNames).toContain('Dinesh (Civil/Home Only)');
      expect(matchedNames).toContain('Karan (Dual Plumbing + Home)');

      // Solar-only, AC-only, and Plumbing-only techs must NEVER receive a Home Maintenance ticket
      expect(matchedNames).not.toContain('Ramesh (Solar Only)');
      expect(matchedNames).not.toContain('Anil (AC Only)');
      expect(matchedNames).not.toContain('Mahesh (Plumber Only)');
    });

    it('SOLAR ticket: Plumber and Civil technicians are strictly excluded', () => {
      const solarTicket: any = {
        _id: new mongoose.Types.ObjectId(),
        serviceType: 'SOLAR',
        complaint: 'Solar inverter display off with zero generation',
        symptoms: ['Inverter black screen'],
      };

      const matches = calculateTechnicianMatches(solarTicket, pool, null, 'Ahmedabad');
      const matchedNames = matches.map((m) => m.technicianName);

      expect(matchedNames).toContain('Ramesh (Solar Only)');
      expect(matchedNames).not.toContain('Mahesh (Plumber Only)');
      expect(matchedNames).not.toContain('Dinesh (Civil/Home Only)');
      expect(matchedNames).not.toContain('Anil (AC Only)');
    });
  });

  // 3. AI Service-Aware Complaint Triage & Normalization
  describe('AI Complaint Normalization & Service Classification', () => {
    it('should correctly normalize Home Maintenance complaint with tile damage keywords', () => {
      const text = 'Some tiles in my bathroom are broken and coming loose';
      const result = normalizeComplaint(text, 'HOME_MAINTENANCE');

      expect(result.rawComplaint).toBe(text);
      expect(result.normalizedComplaint.toLowerCase()).toContain('tile');
      expect(result.inferredKeywords).toContain('tiles');
      expect(result.triageClassification).toBe('KNOWN_PROBLEM');
    });

    it('should correctly normalize Plumbing complaint with leaking tap and pipe keywords', () => {
      const text = 'Water is leaking from bathroom wall pipe continuously';
      const result = normalizeComplaint(text, 'PLUMBING');

      expect(result.rawComplaint).toBe(text);
      expect(result.normalizedComplaint.toLowerCase()).toContain('leak');
      expect(result.inferredKeywords).toContain('pipe leakage');
      expect(result.triageClassification).toBe('KNOWN_PROBLEM');
    });

    it('should preserve existing Solar complaint normalization without regression', () => {
      const text = 'Inverter screen has gone black and reading zero units';
      const result = normalizeComplaint(text, 'SOLAR');

      expect(result.rawComplaint).toBe(text);
      expect(result.normalizedComplaint.toLowerCase()).toContain('inverter');
    });

    it('should preserve existing AC complaint normalization without regression', () => {
      const text = 'AC is blowing normal warm air instead of cooling';
      const result = normalizeComplaint(text, 'AC');

      expect(result.rawComplaint).toBe(text);
      expect(result.normalizedComplaint.toLowerCase()).toContain('cooling');
    });

    it('DemoAIProvider: should produce structured diagnosis for Home Maintenance without hallucination', async () => {
      const aiProvider = new DemoAIProvider();
      const analysis = await aiProvider.analyzeServiceTicket({
        ticketNumber: 'HMT-2026-TEST',
        serviceType: 'HOME_MAINTENANCE',
        complaint: 'Broken kitchen platform tiles and crumbling wall plaster',
        symptoms: ['Broken tiles', 'Wall crack'],
      });

      const validated = aiOutputSchema.safeParse(analysis);
      expect(validated.success).toBe(true);

      expect(analysis.serviceType).toBe('HOME_MAINTENANCE');
      expect(analysis.possibleIssues.length).toBeGreaterThan(0);
      expect(analysis.diagnosticSteps.length).toBeGreaterThan(0);
      expect(analysis.safetyWarnings.length).toBeGreaterThan(0);
      expect(analysis.safetyWarnings.some((w) => w.toLowerCase().includes('goggles') || w.toLowerCase().includes('concealed'))).toBe(true);
    });

    it('DemoAIProvider: should produce structured diagnosis for Plumbing without hallucination', async () => {
      const aiProvider = new DemoAIProvider();
      const analysis = await aiProvider.analyzeServiceTicket({
        ticketNumber: 'PLM-2026-TEST',
        serviceType: 'PLUMBING',
        complaint: 'Tap is leaking and drain is completely choked in bathroom',
        symptoms: ['Tap leaking', 'Drain blocked'],
      });

      const validated = aiOutputSchema.safeParse(analysis);
      expect(validated.success).toBe(true);

      expect(analysis.serviceType).toBe('PLUMBING');
      expect(analysis.possibleIssues.length).toBeGreaterThan(0);
      expect(analysis.diagnosticSteps.length).toBeGreaterThan(0);
      expect(analysis.safetyWarnings.some((w) => w.toLowerCase().includes('shut off') || w.toLowerCase().includes('water supply'))).toBe(true);
      expect(analysis.recommendedTools).toContain('PIPE_WRENCH');
    });
  });

  // 4. Coverage Engine Dynamic Registration
  describe('Coverage Engine Dynamic Service Integration', () => {
    it('should query all registered services dynamically without hardcoded [SOLAR, AC]', () => {
      const registeredTypes = ServiceRegistry.getAllServices().map((s) => s.serviceType);
      expect(registeredTypes).toEqual(
        expect.arrayContaining(['SOLAR', 'AC', 'PLUMBING', 'HOME_MAINTENANCE', 'ELECTRICAL'])
      );
    });
  });
});
