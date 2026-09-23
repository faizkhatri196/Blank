import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { normalizeComplaint } from '../../src/ai/complaintNormalizer';
import { ServiceRegistry } from '../../src/config/serviceRegistry';
import { serializeCustomerTicket } from '../../src/controllers/customerPortalController';
import { IServiceTicket } from '../../src/models/ServiceTicket';

describe('Customer Portal & Privacy Unit Tests', () => {
  describe('Location & Service Discovery', () => {
    it('should return registered services for supported service areas', () => {
      const allServices = ServiceRegistry.getAllServices();
      expect(allServices.length).toBeGreaterThanOrEqual(2);

      const solar = ServiceRegistry.getService('SOLAR');
      expect(solar).toBeDefined();
      expect(solar?.displayName).toBe('Solar Service');
      expect(solar?.problemCategories.length).toBeGreaterThanOrEqual(8);

      const ac = ServiceRegistry.getService('AC');
      expect(ac).toBeDefined();
      expect(ac?.displayName).toBe('AC & HVAC Service');
      expect(ac?.problemCategories.length).toBeGreaterThanOrEqual(8);
    });

    it('should filter services based on company supported service types', () => {
      const solarOnly = ServiceRegistry.getAvailableServicesForLocation('Ahmedabad', '380015', ['SOLAR']);
      expect(solarOnly.length).toBe(1);
      expect(solarOnly[0].serviceType).toBe('SOLAR');

      const both = ServiceRegistry.getAvailableServicesForLocation('Ahmedabad', '380015', ['SOLAR', 'AC']);
      expect(both.length).toBe(2);
    });

    it('should include "I\'m not sure what\'s wrong" triage problem card in all services', () => {
      const solar = ServiceRegistry.getService('SOLAR');
      const unsureSolar = solar?.problemCategories.find((p) => p.code === 'NOT_SURE_TRIAGE');
      expect(unsureSolar).toBeDefined();
      expect(unsureSolar?.triageQuestions?.length).toBeGreaterThanOrEqual(4);

      const ac = ServiceRegistry.getService('AC');
      const unsureAc = ac?.problemCategories.find((p) => p.code === 'NOT_SURE_TRIAGE');
      expect(unsureAc).toBeDefined();
      expect(unsureAc?.triageQuestions?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('AC & Solar Complaint Normalization', () => {
    it('should normalize AC colloquial/Hinglish complaints while preserving raw input', () => {
      const rawAC = 'ac cool nai karto pani pade che';
      const result = normalizeComplaint(rawAC, 'AC');

      expect(result.rawComplaint).toBe(rawAC);
      expect(result.normalizedComplaint).toContain('AC is not cooling and water leakage has been reported');
      expect(result.isUnknownTriage).toBe(false);
      expect(result.inferredKeywords).toContain('water leak');
    });

    it('should classify vague AC complaints as UNKNOWN_TRIAGE with adaptive questions', () => {
      const rawVague = 'something wrong with my AC';
      const result = normalizeComplaint(rawVague, 'AC');

      expect(result.isUnknownTriage).toBe(true);
      expect(result.triageClassification).toBe('UNKNOWN_TRIAGE');
      expect(result.missingInformation.length).toBeGreaterThanOrEqual(4);
      expect(result.statusMessage).toContain('VERIFY ON SITE');
    });

    it('should normalize Solar messy complaint while preserving raw input', () => {
      const rawSolar = 'invrtr not wrkng genration bandh';
      const result = normalizeComplaint(rawSolar, 'SOLAR');

      expect(result.rawComplaint).toBe(rawSolar);
      expect(result.normalizedComplaint).toContain('Solar inverter appears to be offline');
      expect(result.isUnknownTriage).toBe(false);
    });
  });

  describe('Customer-Safe Serialization & Privacy Guardrails', () => {
    const mockTicket: Partial<IServiceTicket> = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') as any,
      ticketNumber: 'SOL-2026-0099',
      serviceType: 'SOLAR',
      problemCategory: 'INVERTER_NOT_WORKING',
      problemCode: 'INVERTER_NOT_WORKING',
      rawComplaint: 'invrtr not wrkng genration bandh',
      normalizedComplaint: 'Solar inverter appears to be offline/not operating and the customer reports zero generation.',
      serviceLocation: {
        address: 'B-402, Titanium City Centre',
        city: 'Ahmedabad',
        area: 'Prahlad Nagar',
        pincode: '380015',
      },
      photos: ['/uploads/inverter-test.jpg'],
      status: 'ASSIGNED',
      assignedTechnicianId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022') as any,
      createdAt: new Date('2026-09-17T10:00:00Z'),
      updatedAt: new Date('2026-09-17T10:15:00Z'),
      customerFeedback: {
        rating: 5,
        comment: 'Great prompt service',
        submittedAt: new Date('2026-09-17T12:00:00Z'),
      },
    };

    const mockCompany = {
      name: 'Demo Field Services',
      phone: '+91 79 4000 1234',
      approvedContactNumber: '+91 79 4000 1234',
      settings: {
        showTechnicianNameToCustomer: false,
        showApprovedContactToCustomer: true,
      },
    };

    const mockTechnician = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
      name: 'Rahul Sharma',
      phone: '+91 98765 22221', // PERSONAL PHONE - MUST NEVER BE EXPOSED
      matchScore: 96, // INTERNAL MATCH SCORE - MUST NEVER BE EXPOSED
    };

    it('should strictly strip technician personal phone, match score, and other internal fields', () => {
      const serialized: any = serializeCustomerTicket(
        mockTicket as IServiceTicket,
        mockCompany,
        mockTechnician
      );

      // Verify safe fields exist
      expect(serialized.ticketNumber).toBe('SOL-2026-0099');
      expect(serialized.serviceType).toBe('SOLAR');
      expect(serialized.normalizedComplaint).toBeDefined();
      expect(serialized.customerStatusLabel).toBe('Service Professional Assigned');
      expect(serialized.assignedProfessionalRole).toBe('Solar Service Professional');
      expect(serialized.customerTimeline).toBeDefined();

      // Verify approved company contact is used
      expect(serialized.approvedCompanyContact).toBeDefined();
      expect(serialized.approvedCompanyContact.phone).toBe('+91 79 4000 1234');
      expect(serialized.approvedCompanyContact.companyName).toBe('Demo Field Services');

      // CRITICAL PRIVACY CHECKS: NEVER EXPOSE INTERNAL OPERATIONAL FIELDS
      expect(serialized.assignedTechnicianId).toBeUndefined();
      expect(serialized.matchScore).toBeUndefined();
      expect(serialized.ranking).toBeUndefined();
      expect(serialized.internalNotes).toBeUndefined();
      expect(serialized.aiReasoning).toBeUndefined();
      expect(serialized.aiAnalysisId).toBeUndefined();

      // Personal phone number check
      expect(JSON.stringify(serialized)).not.toContain('+91 98765 22221');
      expect(JSON.stringify(serialized)).not.toContain('96'); // match score

      // Name hidden by default
      expect(serialized.assignedProfessionalName).toBeUndefined();
      expect(JSON.stringify(serialized)).not.toContain('Rahul Sharma');
    });

    it('should reveal technician name only if explicitly allowed by company settings', () => {
      const openCompany = {
        ...mockCompany,
        settings: {
          ...mockCompany.settings,
          showTechnicianNameToCustomer: true,
        },
      };

      const serialized: any = serializeCustomerTicket(
        mockTicket as IServiceTicket,
        openCompany,
        mockTechnician
      );

      expect(serialized.assignedProfessionalName).toBe('Rahul Sharma');
      // But still NEVER expose personal phone
      expect(JSON.stringify(serialized)).not.toContain('+91 98765 22221');
    });

    it('should hide company contact if showApprovedContactToCustomer is false', () => {
      const privateContactCompany = {
        ...mockCompany,
        settings: {
          showApprovedContactToCustomer: false,
        },
      };

      const serialized = serializeCustomerTicket(
        mockTicket as IServiceTicket,
        privateContactCompany,
        mockTechnician
      );

      expect(serialized.approvedCompanyContact).toBeUndefined();
    });

    it('should properly serialize CANCELLED and REJECTED status and include notes and timeline steps', () => {
      const cancelledTicket: any = {
        ...mockTicket,
        status: 'CANCELLED',
        statusHistory: [
          { status: 'NEW', note: 'Customer booked service', timestamp: new Date('2026-09-17T10:00:00Z') },
          { status: 'CANCELLED', note: 'Cancelled by customer via Servora Customer Portal', timestamp: new Date('2026-09-17T10:30:00Z') },
        ],
      };

      const serializedCancelled = serializeCustomerTicket(
        cancelledTicket as IServiceTicket,
        mockCompany
      );

      expect(serializedCancelled.status).toBe('CANCELLED');
      expect(serializedCancelled.customerStatusLabel).toBe('Request Cancelled');
      expect(serializedCancelled.cancellationReason).toBe('Cancelled by customer via Servora Customer Portal');
      const cancelStep = serializedCancelled.customerTimeline.find((s) => s.key === 'CANCELLED');
      expect(cancelStep).toBeDefined();
      expect(cancelStep?.status).toBe('COMPLETED');

      const rejectedTicket: any = {
        ...mockTicket,
        status: 'CANCELLED',
        statusHistory: [
          { status: 'NEW', note: 'Customer booked service', timestamp: new Date('2026-09-17T10:00:00Z') },
          { status: 'CANCELLED', note: 'Service request was rejected: outside certified service boundary', timestamp: new Date('2026-09-17T10:30:00Z') },
        ],
      };

      const serializedRejected = serializeCustomerTicket(
        rejectedTicket as IServiceTicket,
        mockCompany
      );

      expect(serializedRejected.customerStatusLabel).toBe('Request Rejected');
      expect(serializedRejected.cancellationReason).toContain('outside certified service boundary');
    });
  });
});
