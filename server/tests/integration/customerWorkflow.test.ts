import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db';
import { Company } from '../../src/models/Company';
import { User } from '../../src/models/User';
import { Customer } from '../../src/models/Customer';
import { Technician } from '../../src/models/Technician';
import { ServiceTicket } from '../../src/models/ServiceTicket';
import { ServiceReport } from '../../src/models/ServiceReport';
import { PilotFeedback } from '../../src/models/PilotFeedback';
import { serializeCustomerTicket } from '../../src/controllers/customerPortalController';
import { normalizeComplaint } from '../../src/ai/complaintNormalizer';

describe('SERVORA V2 End-to-End Customer Lifecycle Integration Tests', () => {
  let companyAId: mongoose.Types.ObjectId;
  let companyBId: mongoose.Types.ObjectId;
  let customerAId: mongoose.Types.ObjectId;
  let technicianAId: mongoose.Types.ObjectId;
  let ticketId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDB();

    // Setup Company A (Ahmedabad Solar & AC)
    const compA = await Company.create({
      name: 'Alpha Energy Services',
      email: 'contact@alphaenergy.test',
      phone: '+91 79 1111 2222',
      approvedContactNumber: '+91 79 1111 2222',
      servicesSupported: ['SOLAR', 'AC'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          pincodes: ['380015'],
          services: ['SOLAR', 'AC'],
        },
      ],
      settings: {
        showTechnicianNameToCustomer: false,
        showApprovedContactToCustomer: true,
      },
      isPilot: false,
      environmentContext: 'DEMO',
      active: true,
    });
    companyAId = compA._id as mongoose.Types.ObjectId;

    // Setup Company B (Gandhinagar AC only - Cross-tenant isolation test)
    const compB = await Company.create({
      name: 'Beta Climate Ops',
      email: 'contact@betaclimate.test',
      phone: '+91 79 3333 4444',
      approvedContactNumber: '+91 79 3333 4444',
      servicesSupported: ['AC'],
      serviceAreas: [
        {
          city: 'Gandhinagar',
          pincodes: ['382007'],
          services: ['AC'],
        },
      ],
      isPilot: false,
      environmentContext: 'DEMO',
      active: true,
    });
    companyBId = compB._id as mongoose.Types.ObjectId;

    // Setup Customer A in Company A
    const custA = await Customer.create({
      companyId: companyAId,
      name: 'Aarav Mehta',
      phone: '+91 98980 11111',
      address: 'A-102, Shivalik High Street, Prahlad Nagar',
      city: 'Ahmedabad',
      pincode: '380015',
    });
    customerAId = custA._id as mongoose.Types.ObjectId;

    // Setup Technician A in Company A
    const techA = await Technician.create({
      companyId: companyAId,
      userId: new mongoose.Types.ObjectId(),
      name: 'Dhaval Shah',
      phone: '+91 98250 99999', // PERSONAL NUMBER - MUST NEVER BE EXPOSED
      email: 'dhaval@alphaenergy.test',
      experienceYears: 6,
      serviceTypes: ['SOLAR'],
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL'],
      serviceAreas: ['Ahmedabad'],
      availability: 'AVAILABLE',
      active: true,
    });
    technicianAId = techA._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await Promise.all([
      Company.deleteMany({ _id: { $in: [companyAId, companyBId] } }),
      Customer.deleteMany({ companyId: { $in: [companyAId, companyBId] } }),
      Technician.deleteMany({ companyId: { $in: [companyAId, companyBId] } }),
      ServiceTicket.deleteMany({ companyId: { $in: [companyAId, companyBId] } }),
      ServiceReport.deleteMany({}),
      PilotFeedback.deleteMany({ companyId: { $in: [companyAId, companyBId] } }),
    ]);
    await disconnectDB();
  });

  it('STAGE 1: Customer creates Solar request with messy Hinglish input', async () => {
    const rawComplaint = 'invrtr not wrkng genration bandh';
    const normalized = normalizeComplaint(rawComplaint, 'SOLAR');

    expect(normalized.rawComplaint).toBe(rawComplaint);
    expect(normalized.normalizedComplaint).toContain('Solar inverter appears to be offline');

    const ticket = await ServiceTicket.create({
      companyId: companyAId,
      ticketNumber: 'SOL-CUST-WORKFLOW-001',
      serviceType: 'SOLAR',
      customerId: customerAId,
      problemCategory: 'Inverter not working',
      problemCode: 'INVERTER_NOT_WORKING',
      complaint: normalized.normalizedComplaint,
      rawComplaint,
      normalizedComplaint: normalized.normalizedComplaint,
      serviceLocation: {
        address: 'A-102, Shivalik High Street, Prahlad Nagar',
        city: 'Ahmedabad',
        pincode: '380015',
      },
      photos: ['/uploads/test-inverter-display.jpg'],
      priority: 'MEDIUM',
      status: 'NEW',
      createdBy: new mongoose.Types.ObjectId(),
    });

    ticketId = ticket._id as mongoose.Types.ObjectId;
    expect(ticket._id).toBeDefined();
    expect(ticket.rawComplaint).toBe(rawComplaint);
    expect(ticket.status).toBe('NEW');
  });

  it('STAGE 2: Manager assigns technician and status transitions to ASSIGNED', async () => {
    const ticket = await ServiceTicket.findById(ticketId);
    expect(ticket).toBeDefined();

    ticket!.assignedTechnicianId = technicianAId;
    ticket!.status = 'ASSIGNED';
    await ticket!.save();

    const tech = await Technician.findById(technicianAId);
    tech!.availability = 'BUSY';
    await tech!.save();

    expect(ticket!.status).toBe('ASSIGNED');
    expect(tech!.availability).toBe('BUSY');
  });

  it('STAGE 3: Customer sees customer-safe tracking view without leaking internal operational fields', async () => {
    const ticket = await ServiceTicket.findById(ticketId);
    const company = await Company.findById(companyAId);
    const tech = await Technician.findById(technicianAId);

    const customerView = serializeCustomerTicket(ticket!, company, tech);

    // Verify customer sees timeline & role
    expect(customerView.customerStatusLabel).toBe('Service Professional Assigned');
    expect(customerView.assignedProfessionalRole).toBe('Solar Service Professional');
    expect(customerView.serviceLocation.city).toBe('Ahmedabad');

    // Verify company approved contact is displayed
    expect(customerView.approvedCompanyContact?.phone).toBe('+91 79 1111 2222');

    // STRICT PRIVACY VERIFICATION: Technician personal phone and ranking/matching details stripped
    expect(JSON.stringify(customerView)).not.toContain('+91 98250 99999'); // Technician personal phone
    expect((customerView as any).matchScore).toBeUndefined();
    expect((customerView as any).ranking).toBeUndefined();
    expect((customerView as any).assignedTechnicianId).toBeUndefined();
  });

  it('STAGE 4: Technician accepts, travels on the way, reaches on site, and completes job', async () => {
    const ticket = await ServiceTicket.findById(ticketId);

    // Technician accepts
    ticket!.status = 'ACCEPTED';
    await ticket!.save();

    // Technician on the way
    ticket!.status = 'ON_THE_WAY';
    await ticket!.save();

    // Technician on site
    ticket!.status = 'ON_SITE';
    await ticket!.save();

    // Technician completes with actual physical findings
    ticket!.status = 'COMPLETED';
    ticket!.completedAt = new Date();
    await ticket!.save();

    await ServiceReport.create({
      ticketId,
      technicianId: technicianAId,
      actualDiagnosis: 'Loose MC4 connector at string combiner box',
      workPerformed: 'Crimped replacement MC4 connector pair and verified Voc string voltage',
      readings: {
        dcVoltage: 485,
        acVoltage: 238,
        acCurrent: 14.2,
      },
      partsUsed: ['MC4 Connector Pair'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL'],
      completedAt: new Date(),
    });

    const updated = await ServiceTicket.findById(ticketId);
    expect(updated?.status).toBe('COMPLETED');
  });

  it('STAGE 5: Customer submits 5-star feedback upon completion', async () => {
    const ticket = await ServiceTicket.findById(ticketId);
    expect(ticket?.status).toBe('COMPLETED');

    ticket!.customerFeedback = {
      rating: 5,
      comment: 'Technician was prompt, diagnosed the issue quickly, and fixed the solar generation.',
      resolved: true,
      onTime: true,
      submittedAt: new Date(),
    };
    await ticket!.save();

    await PilotFeedback.create({
      companyId: companyAId,
      ticketId,
      userId: new mongoose.Types.ObjectId(),
      role: 'CUSTOMER',
      serviceType: 'SOLAR',
      aiUtilityRating: 5,
      comments: ticket!.customerFeedback.comment,
      onTime: true,
      resolved: true,
    });

    const refreshed = await ServiceTicket.findById(ticketId);
    expect(refreshed?.customerFeedback?.rating).toBe(5);
    expect(refreshed?.customerFeedback?.resolved).toBe(true);
  });

  it('STAGE 6: Cross-Tenant Isolation Security Test', async () => {
    // Attempting to query Company A's ticket with Company B's tenant context must return null
    const crossTenantTicket = await ServiceTicket.findOne({
      _id: ticketId,
      companyId: companyBId, // Cross-tenant probe
    });

    expect(crossTenantTicket).toBeNull();
  });
});
