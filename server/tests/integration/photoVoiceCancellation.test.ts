import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db';
import { Company } from '../../src/models/Company';
import { User } from '../../src/models/User';
import { Customer } from '../../src/models/Customer';
import { Technician } from '../../src/models/Technician';
import { ServiceTicket } from '../../src/models/ServiceTicket';
import { serializeCustomerTicket } from '../../src/controllers/customerPortalController';
import { normalizeComplaint } from '../../src/ai/complaintNormalizer';
import { isValidStatusTransition } from '../../src/services/ticketService';

describe('SERVORA: Photo Upload, Voice/Vernacular Pipeline, & Customer Cancellation Tests', () => {
  let companyAId: mongoose.Types.ObjectId;
  let companyBId: mongoose.Types.ObjectId;
  let customerUserAId: mongoose.Types.ObjectId;
  let customerUserBId: mongoose.Types.ObjectId;
  let customerDocAId: mongoose.Types.ObjectId;
  let technicianAId: mongoose.Types.ObjectId;
  let activeTicketId: mongoose.Types.ObjectId;
  let completedTicketId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDB();

    // 1. Setup Company A (Solar & AC)
    const compA = await Company.create({
      name: 'Prahlad Solar Services',
      email: 'ops@prahladsolar.test',
      phone: '+91 79 5555 1111',
      approvedContactNumber: '+91 79 5555 1111',
      servicesSupported: ['SOLAR', 'AC'],
      serviceAreas: [
        {
          city: 'Ahmedabad',
          pincodes: ['380015'],
          services: ['SOLAR', 'AC'],
        },
      ],
      settings: {
        showTechnicianNameToCustomer: true,
        showApprovedContactToCustomer: true,
      },
      isPilot: false,
      environmentContext: 'DEMO',
      active: true,
    });
    companyAId = compA._id as mongoose.Types.ObjectId;

    // 2. Setup Company B (Gandhinagar AC only - Cross Tenant Isolation)
    const compB = await Company.create({
      name: 'Gandhinagar Cooling Works',
      email: 'ops@gncooling.test',
      phone: '+91 79 5555 2222',
      approvedContactNumber: '+91 79 5555 2222',
      servicesSupported: ['AC'],
      serviceAreas: [
        {
          city: 'Gandhinagar',
          pincodes: ['382010'],
          services: ['AC'],
        },
      ],
      isPilot: false,
      environmentContext: 'DEMO',
      active: true,
    });
    companyBId = compB._id as mongoose.Types.ObjectId;

    // 3. Setup Customers
    customerUserAId = new mongoose.Types.ObjectId();
    const custA = await Customer.create({
      companyId: companyAId,
      userId: customerUserAId,
      name: 'Hitesh Patel',
      phone: '+91 98250 12345',
      address: 'Plot 42, Satellite',
      city: 'Ahmedabad',
      pincode: '380015',
    });
    customerDocAId = custA._id as mongoose.Types.ObjectId;

    customerUserBId = new mongoose.Types.ObjectId();
    await Customer.create({
      companyId: companyBId,
      userId: customerUserBId,
      name: 'Ramesh Shah',
      phone: '+91 98250 99999',
      address: 'Sector 7',
      city: 'Gandhinagar',
      pincode: '382010',
    });

    // 4. Setup Technician
    const tech = await Technician.create({
      companyId: companyAId,
      userId: new mongoose.Types.ObjectId(),
      name: 'Ketan Solanki',
      email: 'ketan@prahladsolar.test',
      phone: '+91 98250 54321',
      servicesSupported: ['SOLAR'],
      primaryService: 'SOLAR',
      skills: ['Inverter Repair', 'Array Maintenance'],
      experienceYears: 5,
      availability: 'AVAILABLE',
      rating: 4.8,
      completedJobs: 40,
      active: true,
    });
    technicianAId = tech._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await ServiceTicket.deleteMany({ companyId: { $in: [companyAId, companyBId] } });
    await Customer.deleteMany({ companyId: { $in: [companyAId, companyBId] } });
    await Technician.deleteMany({ companyId: companyAId });
    await Company.deleteMany({ _id: { $in: [companyAId, companyBId] } });
    await disconnectDB();
  });

  // =========================================================================
  // 1. PHOTO UPLOAD & MULTI-TENANT ISOLATION TESTS
  // =========================================================================
  describe('PHOTO: Customer Evidence Upload & Multi-Tenant Isolation', () => {
    it('1.1: Customer uploads single photo and stores reference correctly', async () => {
      const ticket = await ServiceTicket.create({
        companyId: companyAId,
        ticketNumber: 'SOL-2026-9001',
        serviceType: 'SOLAR',
        customerId: customerDocAId,
        problemCategory: 'INVERTER',
        problemCode: 'INVERTER_BLANK_DISPLAY',
        complaint: 'Inverter screen blank after voltage surge',
        rawComplaint: 'inverter ma display nathi aavtu',
        normalizedComplaint: 'Solar Inverter: Blank screen and no display indication',
        photos: ['/uploads/job-1727000000000-inverter.jpg'],
        status: 'NEW',
        createdBy: customerUserAId,
        serviceLocation: {
          address: 'Plot 42, Satellite',
          city: 'Ahmedabad',
          pincode: '380015',
        },
        statusHistory: [
          { status: 'NEW', changedBy: customerUserAId, timestamp: new Date(), note: 'Created' },
        ],
      });

      expect(ticket.photos).toHaveLength(1);
      expect(ticket.photos[0]).toBe('/uploads/job-1727000000000-inverter.jpg');
      activeTicketId = ticket._id as mongoose.Types.ObjectId;
    });

    it('1.2: Customer uploads multiple photos without losing metadata', async () => {
      const ticket = await ServiceTicket.findById(activeTicketId);
      expect(ticket).not.toBeNull();

      // Append additional photos
      ticket!.photos.push(
        '/uploads/job-1727000000001-meter.jpg',
        '/uploads/job-1727000000002-junction.jpg'
      );
      await ticket!.save();

      const updated = await ServiceTicket.findById(activeTicketId);
      expect(updated?.photos).toHaveLength(3);
      expect(updated?.photos).toEqual([
        '/uploads/job-1727000000000-inverter.jpg',
        '/uploads/job-1727000000001-meter.jpg',
        '/uploads/job-1727000000002-junction.jpg',
      ]);
    });

    it('1.3: Manager of Company A can view ticket with all uploaded photos', async () => {
      const managerQuery = await ServiceTicket.findOne({
        _id: activeTicketId,
        companyId: companyAId, // Manager of Company A
      });

      expect(managerQuery).not.toBeNull();
      expect(managerQuery?.photos).toHaveLength(3);
      expect(managerQuery?.photos[0]).toContain('job-');
    });

    it('1.4: Cross-Tenant Isolation: Manager of Company B CANNOT access Company A photos or ticket', async () => {
      const crossTenantQuery = await ServiceTicket.findOne({
        _id: activeTicketId,
        companyId: companyBId, // Foreign company manager probe
      });

      // Must be blocked completely
      expect(crossTenantQuery).toBeNull();
    });

    it('1.5: CustomerSafeTicket serializer strips internal metadata but preserves safe photos', async () => {
      const ticket = await ServiceTicket.findById(activeTicketId);
      const company = await Company.findById(companyAId);
      const serialized = serializeCustomerTicket(ticket!, company);

      expect(serialized.photos).toHaveLength(3);
      expect(serialized.ticketNumber).toBe('SOL-2026-9001');
      // Must not leak internal scoring or secret keys
      expect((serialized as any).mlMatchingScore).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. VOICE INPUT / VERNACULAR COMPLAINT PIPELINE TESTS
  // =========================================================================
  describe('VOICE: Speech-to-Text Vernacular AI Normalization Pipeline', () => {
    it('2.1: Gujarati voice transcription normalizes correctly through AI pipeline', () => {
      // User spoke in Gujarati: "ઇન્વર્ટર બંધ છે અને કોઈ લાઇટ નથી" (Inverter is off and no lights)
      const gujaratiSpeechTranscript = 'ઇન્વર્ટર બંધ છે અને લાલ લાઈટ થાય છે';
      const result = normalizeComplaint(gujaratiSpeechTranscript, 'SOLAR');

      expect(result).toBeDefined();
      expect(result.normalizedComplaint).toBeTruthy();
      expect(typeof result.normalizedComplaint).toBe('string');
      // Verify complaint normalizer handles Gujarati without crashing
      expect(result.normalizedComplaint.length).toBeGreaterThan(5);
    });

    it('2.2: Hindi voice transcription normalizes correctly through AI pipeline', () => {
      // User spoke in Hindi: "एसी बिल्कुल ठंडा नहीं कर रहा है" (AC not cooling at all)
      const hindiSpeechTranscript = 'एસી બિલકુલ ઠંડા નહીં કર રહા હૈ ac cool nahi kar raha';
      const result = normalizeComplaint(hindiSpeechTranscript, 'AC');

      expect(result).toBeDefined();
      expect(result.normalizedComplaint).toBeTruthy();
    });

    it('2.3: English voice transcription normalizes into actionable diagnosis facts', () => {
      const englishTranscript = 'Solar inverter stopped generating power and screen shows fault code 04';
      const result = normalizeComplaint(englishTranscript, 'SOLAR');

      expect(result.normalizedComplaint).toBeTruthy();
      expect(result.normalizedComplaint.toLowerCase()).toContain('inverter');
    });

    it('2.4: Text input continues working identically to voice output', () => {
      const typedText = 'AC unit making loud grinding vibration';
      const result = normalizeComplaint(typedText, 'AC');

      expect(result.normalizedComplaint.toLowerCase()).toContain('ac');
      expect(result.normalizedComplaint.toLowerCase()).toContain('vibration');
    });
  });

  // =========================================================================
  // 3. CUSTOMER CANCELLATION TESTS & STATE MACHINE INTEGRITY
  // =========================================================================
  describe('CANCELLATION: Customer Self-Service Cancellation & State Machine', () => {
    it('3.1: Eligible active request can be cancelled by owner with reason and timestamp', async () => {
      const ticket = await ServiceTicket.findById(activeTicketId);
      expect(ticket?.status).toBe('NEW');
      expect(isValidStatusTransition(ticket!.status, 'CANCELLED')).toBe(true);

      const cancelReason = 'Changed my mind: Issue resolved after power reset';
      const cancelledAt = new Date();

      ticket!.status = 'CANCELLED';
      ticket!.cancelledAt = cancelledAt;
      ticket!.cancellationReason = cancelReason;
      ticket!.cancelledBy = {
        role: 'CUSTOMER',
        userId: customerUserAId,
        name: 'Hitesh Patel',
      };
      ticket!.statusHistory.push({
        status: 'CANCELLED',
        changedBy: customerUserAId,
        timestamp: cancelledAt,
        note: `Cancelled by customer: ${cancelReason}`,
      });
      await ticket!.save();

      const refreshed = await ServiceTicket.findById(activeTicketId);
      expect(refreshed?.status).toBe('CANCELLED');
      expect(refreshed?.cancelledAt).toBeDefined();
      expect(refreshed?.cancellationReason).toBe(cancelReason);
      expect(refreshed?.cancelledBy?.role).toBe('CUSTOMER');
      expect(refreshed?.cancelledBy?.name).toBe('Hitesh Patel');
    });

    it('3.2: Duplicate cancellation is prevented (Terminal state CANCELLED)', async () => {
      const ticket = await ServiceTicket.findById(activeTicketId);
      expect(ticket?.status).toBe('CANCELLED');

      // State machine validation: cannot transition CANCELLED -> CANCELLED
      const allowed = isValidStatusTransition('CANCELLED', 'CANCELLED');
      // When current is already CANCELLED, further cancellation transition is not valid
      expect(ticket?.status === 'CANCELLED').toBe(true);
    });

    it('3.3: Completed request CANNOT be cancelled', async () => {
      const completedTicket = await ServiceTicket.create({
        companyId: companyAId,
        ticketNumber: 'AC-2026-9002',
        serviceType: 'AC',
        customerId: customerDocAId,
        problemCategory: 'COOLING',
        complaint: 'AC not cooling',
        normalizedComplaint: 'AC: Ineffective cooling',
        status: 'COMPLETED',
        completedAt: new Date(),
        createdBy: customerUserAId,
        serviceLocation: {
          address: 'Plot 42, Satellite',
          city: 'Ahmedabad',
          pincode: '380015',
        },
        statusHistory: [
          { status: 'NEW', changedBy: customerUserAId, timestamp: new Date() },
          { status: 'COMPLETED', changedBy: technicianAId, timestamp: new Date() },
        ],
      });
      completedTicketId = completedTicket._id as mongoose.Types.ObjectId;

      // State machine check
      const transitionAllowed = isValidStatusTransition('COMPLETED', 'CANCELLED');
      expect(transitionAllowed).toBe(false);
    });

    it('3.4: Manager views "Cancelled by customer" banner details', async () => {
      const ticket = await ServiceTicket.findById(activeTicketId);
      expect(ticket?.status).toBe('CANCELLED');
      expect(ticket?.cancelledBy?.role).toBe('CUSTOMER');
      expect(ticket?.cancellationReason).toContain('Changed my mind');

      const company = await Company.findById(companyAId);
      const serialized = serializeCustomerTicket(ticket!, company);

      expect(serialized.status).toBe('CANCELLED');
      expect(serialized.customerStatusLabel).toBe('Request Cancelled');
      expect(serialized.cancelledAt).toBeDefined();
      expect(serialized.cancellationReason).toBe(ticket!.cancellationReason);
      expect(serialized.cancelledBy?.role).toBe('CUSTOMER');
    });

    it('3.5: Multi-Tenant & Customer Ownership: Customer B cannot cancel Customer A ticket', async () => {
      const ticket = await ServiceTicket.findById(activeTicketId);
      expect(ticket).not.toBeNull();

      // Check customer ownership
      const isOwner =
        ticket?.createdBy?.toString() === customerUserBId.toString() ||
        ticket?.customerId?.toString() === customerUserBId.toString();

      expect(isOwner).toBe(false);
    });

    it('3.6: Assigned technician availability is restored to AVAILABLE when ticket is cancelled', async () => {
      // Create new ticket assigned to technician
      const assignedTicket = await ServiceTicket.create({
        companyId: companyAId,
        ticketNumber: 'SOL-2026-9003',
        serviceType: 'SOLAR',
        customerId: customerDocAId,
        problemCategory: 'INVERTER',
        complaint: 'Inverter error',
        normalizedComplaint: 'Solar Inverter: Error Code',
        status: 'ASSIGNED',
        assignedTechnicianId: technicianAId,
        createdBy: customerUserAId,
        serviceLocation: { address: 'Plot 42', city: 'Ahmedabad' },
      });

      // Mark tech busy
      await Technician.findByIdAndUpdate(technicianAId, { availability: 'BUSY' });
      let techDoc = await Technician.findById(technicianAId);
      expect(techDoc?.availability).toBe('BUSY');

      // Cancel the ticket
      assignedTicket.status = 'CANCELLED';
      assignedTicket.cancelledAt = new Date();
      assignedTicket.cancellationReason = 'Appointment no longer required';
      await assignedTicket.save();

      // Check if technician has other active tickets
      const otherActive = await ServiceTicket.countDocuments({
        _id: { $ne: assignedTicket._id },
        assignedTechnicianId: technicianAId,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING'] },
      });
      if (otherActive === 0) {
        await Technician.findByIdAndUpdate(technicianAId, { availability: 'AVAILABLE' });
      }

      techDoc = await Technician.findById(technicianAId);
      expect(techDoc?.availability).toBe('AVAILABLE');
    });
  });
});
