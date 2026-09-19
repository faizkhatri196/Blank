import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../../src/config/db';
import {
  Company,
  User,
  Technician,
  Customer,
  SolarSystem,
  ACUnit,
  ServiceTicket,
  AIAnalysis,
  ServiceReport,
  ServiceHistory,
} from '../../src/models';
import { calculateTechnicianMatches } from '../../src/services/matchingService';
import { AIFactory } from '../../src/ai/AIFactory';
import { compareAIVsActual } from '../../src/services/evaluationService';
import { calculatePilotMetrics } from '../../src/services/metricsService';

describe('End-to-End Operational Lifecycle Integration Tests', () => {
  let companyId: mongoose.Types.ObjectId;
  let managerUser: any;
  let rahulTech: any;
  let vikramTech: any;
  let solarCustomer: any;
  let acCustomer: any;
  let solarAsset: any;
  let acAsset: any;

  beforeAll(async () => {
    await connectDB();

    // Create isolated test company
    const comp = await Company.create({
      name: 'Integration Test Services',
      email: `test-corp-${Date.now()}@example.com`,
      phone: '+91 99999 00000',
      address: 'Test Tech Park',
      servicesSupported: ['SOLAR', 'AC'],
    });
    companyId = comp._id as mongoose.Types.ObjectId;

    const hash = await bcrypt.hash('Test@12345', 10);

    managerUser = await User.create({
      companyId,
      name: 'Test Manager',
      email: `mgr-${Date.now()}@test.com`,
      passwordHash: hash,
      role: 'SERVICE_MANAGER',
    });

    const rahulUser = await User.create({
      companyId,
      name: 'Rahul Test (Solar)',
      email: `rahul-${Date.now()}@test.com`,
      passwordHash: hash,
      role: 'TECHNICIAN',
    });

    rahulTech = await Technician.create({
      userId: rahulUser._id,
      companyId,
      name: 'Rahul Test (Solar)',
      email: rahulUser.email,
      phone: '+91 98000 11111',
      experienceYears: 5,
      serviceTypes: ['SOLAR'],
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
    });

    const vikramUser = await User.create({
      companyId,
      name: 'Vikram Test (AC)',
      email: `vikram-${Date.now()}@test.com`,
      passwordHash: hash,
      role: 'TECHNICIAN',
    });

    vikramTech = await Technician.create({
      userId: vikramUser._id,
      companyId,
      name: 'Vikram Test (AC)',
      email: vikramUser.email,
      phone: '+91 98000 22222',
      experienceYears: 4,
      serviceTypes: ['AC'],
      skills: ['AC_INSTALLATION', 'REFRIGERANT_CHARGING', 'COMPRESSOR_REPAIR', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MANIFOLD_GAUGE', 'VACUUM_PUMP', 'MULTIMETER', 'CLAMP_METER'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
    });

    solarCustomer = await Customer.create({
      companyId,
      name: 'Solar Customer Inc',
      phone: '+91 98000 33333',
      address: 'Solar Rooftop 45',
      city: 'Ahmedabad',
    });

    acCustomer = await Customer.create({
      companyId,
      name: 'AC Customer Labs',
      phone: '+91 98000 44444',
      address: 'Lab Suite 12',
      city: 'Ahmedabad',
    });

    solarAsset = await SolarSystem.create({
      companyId,
      customerId: solarCustomer._id,
      capacityKW: 10,
      panelMake: 'Tata Power',
      inverterMake: 'Sungrow',
      inverterModel: 'SG10KTL',
      systemType: 'ON_GRID',
      batteryPresent: false,
    });

    acAsset = await ACUnit.create({
      companyId,
      customerId: acCustomer._id,
      brand: 'Daikin',
      model: 'Inverter FTKF',
      acType: 'SPLIT',
      capacityTR: 2.0,
      refrigerantType: 'R32',
    });
  }, 20000);

  afterAll(async () => {
    if (companyId) {
      await Promise.all([
        User.deleteMany({ companyId }),
        Technician.deleteMany({ companyId }),
        Customer.deleteMany({ companyId }),
        SolarSystem.deleteMany({ companyId }),
        ACUnit.deleteMany({ companyId }),
        ServiceTicket.deleteMany({ companyId }),
        ServiceReport.deleteMany({}),
        ServiceHistory.deleteMany({ companyId }),
        Company.deleteOne({ _id: companyId }),
      ]);
    }
    await disconnectDB();
  });

  it('SCENARIO A: Full Solar Lifecycle (Intake -> AI -> Match -> Assign -> Field Report -> Evaluation -> History)', async () => {
    // 1. Create Solar Ticket
    const ticket = await ServiceTicket.create({
      companyId,
      ticketNumber: `SOL-TEST-001`,
      serviceType: 'SOLAR',
      customerId: solarCustomer._id,
      assetId: solarAsset._id,
      assetType: 'SolarSystem',
      complaint: 'Inverter showing Error 04 and generation dropped to zero',
      symptoms: ['Inverter offline', 'Zero generation'],
      errorCode: 'Error 04',
      priority: 'HIGH',
      status: 'NEW',
      createdBy: managerUser._id,
    });

    expect(ticket.status).toBe('NEW');
    expect(ticket.serviceType).toBe('SOLAR');

    // 2. AI Analysis
    const aiResult = await AIFactory.analyzeWithFallback({
      ticketNumber: ticket.ticketNumber,
      serviceType: 'SOLAR',
      complaint: ticket.complaint,
      symptoms: ticket.symptoms,
      errorCode: ticket.errorCode,
      assetDetails: { capacityKW: 10, inverterMake: 'Sungrow' },
    });

    expect(aiResult.serviceType).toBe('SOLAR');
    expect(aiResult.possibleIssues.length).toBeGreaterThan(0);
    expect(aiResult.safetyWarnings.length).toBeGreaterThan(0);

    const savedAI = await AIAnalysis.create({
      ticketId: ticket._id,
      provider: aiResult.provider || 'DemoAIProvider',
      model: aiResult.model || 'Deterministic',
      serviceType: 'SOLAR',
      possibleIssues: aiResult.possibleIssues,
      diagnosticSteps: aiResult.diagnosticSteps,
      recommendedTools: aiResult.recommendedTools,
      possibleParts: aiResult.possibleParts,
      safetyWarnings: aiResult.safetyWarnings,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      knowledgeSources: aiResult.knowledgeSources,
    });

    ticket.aiAnalysisId = savedAI._id as any;
    ticket.status = 'AI_ANALYZED';
    await ticket.save();

    // 3. Technician Matching
    const allTechs = await Technician.find({ companyId });
    const matches = calculateTechnicianMatches(ticket, allTechs, savedAI as any, 'Ahmedabad');

    expect(matches.length).toBe(1); // Only Rahul supports Solar! Vikram is filtered out!
    expect(matches[0].technicianName).toBe(rahulTech.name);
    expect(matches[0].score).toBeGreaterThan(70);

    // 4. Assign Technician
    ticket.assignedTechnicianId = rahulTech._id;
    ticket.status = 'ASSIGNED';
    await ticket.save();
    rahulTech.availability = 'BUSY';
    await rahulTech.save();

    // 5. Technician Field Groundwork Completion
    const serviceReport = await ServiceReport.create({
      ticketId: ticket._id,
      technicianId: rahulTech._id,
      actualDiagnosis: 'Loose AC grid terminal connection causing inverter error 04 surge trip',
      workPerformed: 'Tightened AC terminal blocks to rated torque and cleared inverter event log',
      readings: { acVoltage: 240, acCurrent: 18.2, dcVoltage: 480 },
      partsUsed: ['Copper Lugs'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER'],
      aiHelpful: true,
      aiAccuracyRating: 5,
      completedAt: new Date(),
    });

    ticket.status = 'COMPLETED';
    ticket.completedAt = new Date();
    await ticket.save();

    // 6. AI vs Actual Comparison
    const comparison = compareAIVsActual(savedAI as any, serviceReport as any);
    expect(comparison.diagnosisMatch).toBe('MATCH');
    expect(comparison.toolMatch).toBe('MATCH');

    // 7. Service History Record
    const history = await ServiceHistory.create({
      companyId,
      customerId: solarCustomer._id,
      assetId: solarAsset._id,
      assetType: 'SolarSystem',
      serviceType: 'SOLAR',
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      complaint: ticket.complaint,
      aiPredictionSummary: savedAI.possibleIssues[0].issue,
      actualDiagnosis: serviceReport.actualDiagnosis,
      workPerformed: serviceReport.workPerformed,
      partsUsed: serviceReport.partsUsed,
      readings: serviceReport.readings,
      technicianName: rahulTech.name,
      comparisonResult: {
        diagnosisMatch: comparison.diagnosisMatch,
        toolMatch: comparison.toolMatch,
        partMatch: 'MATCH',
      },
      completedAt: ticket.completedAt,
    });

    expect(history.ticketNumber).toBe(ticket.ticketNumber);

    // 8. Verify Pilot Metrics Calculation
    const metrics = await calculatePilotMetrics(companyId, 'SOLAR');
    expect(metrics.overview.completedTickets).toBe(1);
    expect(metrics.rates.diagnosisMatch.percentage).toBe(100);
  }, 30000);

  it('SCENARIO B: Full AC / HVAC Lifecycle (Intake -> AI -> Match -> Field Report -> History)', async () => {
    // 1. Create AC Ticket
    const ticket = await ServiceTicket.create({
      companyId,
      ticketNumber: `AC-TEST-001`,
      serviceType: 'AC',
      customerId: acCustomer._id,
      assetId: acAsset._id,
      assetType: 'ACUnit',
      complaint: 'Split AC running but blowing warm air and not cooling',
      symptoms: ['Warm air', 'Compressor not starting'],
      priority: 'HIGH',
      status: 'NEW',
      createdBy: managerUser._id,
    });

    // 2. AI Analysis
    const aiResult = await AIFactory.analyzeWithFallback({
      ticketNumber: ticket.ticketNumber,
      serviceType: 'AC',
      complaint: ticket.complaint,
      symptoms: ticket.symptoms,
      assetDetails: { capacityTR: 2.0, brand: 'Daikin', acType: 'SPLIT' },
    });

    expect(aiResult.serviceType).toBe('AC');

    const savedAI = await AIAnalysis.create({
      ticketId: ticket._id,
      provider: aiResult.provider || 'DemoAIProvider',
      model: aiResult.model || 'Deterministic',
      serviceType: 'AC',
      possibleIssues: aiResult.possibleIssues,
      diagnosticSteps: aiResult.diagnosticSteps,
      recommendedTools: aiResult.recommendedTools,
      possibleParts: aiResult.possibleParts,
      safetyWarnings: aiResult.safetyWarnings,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      knowledgeSources: aiResult.knowledgeSources,
    });

    ticket.aiAnalysisId = savedAI._id as any;
    ticket.status = 'AI_ANALYZED';
    await ticket.save();

    // 3. Technician Matching: Should recommend Vikram (AC), not Rahul (Solar only)
    const allTechs = await Technician.find({ companyId });
    const matches = calculateTechnicianMatches(ticket, allTechs, savedAI as any, 'Ahmedabad');

    expect(matches.length).toBe(1);
    expect(matches[0].technicianName).toBe(vikramTech.name);

    // 4. Assign Vikram & Fieldwork Completion
    ticket.assignedTechnicianId = vikramTech._id;
    ticket.status = 'ASSIGNED';
    await ticket.save();

    const serviceReport = await ServiceReport.create({
      ticketId: ticket._id,
      technicianId: vikramTech._id,
      actualDiagnosis: 'Outdoor unit compressor run capacitor 50uF failed open circuit',
      workPerformed: 'Replaced 50uF dual run capacitor and tested cooling delta',
      readings: { operatingCurrent: 9.1, indoorTemp: 24, grilleTemp: 13 },
      partsUsed: ['Run Capacitor 50uF'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER'],
      aiHelpful: true,
      aiAccuracyRating: 5,
      completedAt: new Date(),
    });

    ticket.status = 'COMPLETED';
    ticket.completedAt = new Date();
    await ticket.save();

    const comparison = compareAIVsActual(savedAI as any, serviceReport as any);
    expect(comparison.diagnosisMatch).toBe('MATCH');

    await ServiceHistory.create({
      companyId,
      customerId: acCustomer._id,
      assetId: acAsset._id,
      assetType: 'ACUnit',
      serviceType: 'AC',
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      complaint: ticket.complaint,
      aiPredictionSummary: savedAI.possibleIssues[0].issue,
      actualDiagnosis: serviceReport.actualDiagnosis,
      workPerformed: serviceReport.workPerformed,
      partsUsed: serviceReport.partsUsed,
      readings: serviceReport.readings,
      technicianName: vikramTech.name,
      comparisonResult: {
        diagnosisMatch: comparison.diagnosisMatch,
        toolMatch: comparison.toolMatch,
        partMatch: 'MATCH',
      },
      completedAt: ticket.completedAt,
    });

    const metrics = await calculatePilotMetrics(companyId, 'AC');
    expect(metrics.overview.completedTickets).toBe(1);
    expect(metrics.rates.diagnosisMatch.percentage).toBe(100);
  }, 30000);
});
