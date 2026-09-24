import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Company } from '../models/Company';
import { Customer } from '../models/Customer';
import { ServiceTicket, IServiceTicket } from '../models/ServiceTicket';
import { Technician } from '../models/Technician';
import { AIAnalysis } from '../models/AIAnalysis';
import { PilotFeedback } from '../models/PilotFeedback';
import { AuditLog } from '../models/AuditLog';
import { ServiceRegistry } from '../config/serviceRegistry';
import { normalizeComplaint } from '../ai/complaintNormalizer';
import { AIFactory } from '../ai/AIFactory';
import { generateTicketNumber } from '../services/ticketService';
import { calculateHaversineDistanceKm, isValidApplicationCoordinate, extractValidCoords } from '../services/location/geospatial';
import { resolveServiceCoverage, discoverAvailableServices } from '../services/location/coverageService';
import {
  ServiceType,
  TicketStatus,
  CustomerSafeTicketResponse,
  CustomerTimelineStep,
} from '../types';

/**
 * Customer-Safe Serializer
 * Strips all internal operational details (scores, rankings, other technicians,
 * personal technician phone, internal notes, raw AI prompts) server-side.
 */
export function serializeCustomerTicket(
  ticket: IServiceTicket,
  company?: any,
  technician?: any
): CustomerSafeTicketResponse {
  const status = ticket.status;

  // Timeline computation based on ticket status & history
  const steps: CustomerTimelineStep[] = [
    { key: 'SUBMITTED', label: 'Request Submitted', status: 'COMPLETED', timestamp: ticket.createdAt?.toISOString() },
    {
      key: 'REVIEWING',
      label: 'Service Team Reviewing',
      status:
        ['AI_ANALYZED', 'WAITING_FOR_ASSIGNMENT', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING', 'COMPLETED'].includes(status)
          ? 'COMPLETED'
          : status === 'NEW'
          ? 'CURRENT'
          : 'PENDING',
    },
    {
      key: 'ASSIGNED',
      label: 'Service Professional Assigned',
      status:
        ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING', 'COMPLETED'].includes(status)
          ? 'COMPLETED'
          : status === 'WAITING_FOR_ASSIGNMENT'
          ? 'CURRENT'
          : 'PENDING',
    },
    {
      key: 'ACCEPTED',
      label: 'Accepted',
      status:
        ['ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING', 'COMPLETED'].includes(status)
          ? 'COMPLETED'
          : status === 'ASSIGNED'
          ? 'CURRENT'
          : 'PENDING',
    },
    {
      key: 'ON_THE_WAY',
      label: 'On The Way',
      status:
        ['ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING', 'COMPLETED'].includes(status)
          ? 'COMPLETED'
          : status === 'ACCEPTED'
          ? 'PENDING'
          : 'PENDING',
    },
    {
      key: 'ON_SITE',
      label: 'Arrived / On Site',
      status:
        ['ON_SITE', 'DIAGNOSING', 'REPAIRING', 'COMPLETED'].includes(status)
          ? 'COMPLETED'
          : status === 'ON_THE_WAY'
          ? 'CURRENT'
          : 'PENDING',
    },
    {
      key: 'IN_PROGRESS',
      label: 'Service In Progress',
      status:
        ['DIAGNOSING', 'REPAIRING', 'COMPLETED'].includes(status)
          ? 'COMPLETED'
          : status === 'ON_SITE'
          ? 'CURRENT'
          : 'PENDING',
    },
    {
      key: 'COMPLETED',
      label: 'Completed',
      status: status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
      timestamp: ticket.completedAt?.toISOString(),
    },
  ];

  // Customer-friendly status label
  let customerStatusLabel = 'Request Submitted';
  switch (status) {
    case 'NEW':
      customerStatusLabel = 'Request Submitted';
      break;
    case 'AI_ANALYZED':
    case 'WAITING_FOR_ASSIGNMENT':
      customerStatusLabel = 'Service Team Reviewing';
      break;
    case 'ASSIGNED':
      customerStatusLabel = 'Service Professional Assigned';
      break;
    case 'ACCEPTED':
      customerStatusLabel = 'Accepted by Service Professional';
      break;
    case 'ON_THE_WAY':
      customerStatusLabel = 'Service Professional is on the way';
      break;
    case 'ON_SITE':
      customerStatusLabel = 'Service Professional has arrived';
      break;
    case 'DIAGNOSING':
    case 'REPAIRING':
      customerStatusLabel = 'Service In Progress';
      break;
    case 'COMPLETED':
      customerStatusLabel = 'Service Completed';
      break;
    case 'CANCELLED':
      customerStatusLabel = 'Request Cancelled';
      break;
  }

  const serviceDef = ServiceRegistry.getService(ticket.serviceType);
  const assignedProfessionalRole = serviceDef ? serviceDef.customerSafeRoleName : 'Service Professional';

  // Contact privacy enforcement: ONLY approved company contact, NEVER technician personal phone
  const showContact = company?.settings?.showApprovedContactToCustomer !== false;
  const approvedContact = showContact && (company?.approvedContactNumber || company?.phone)
    ? {
        phone: company.approvedContactNumber || company.phone,
        companyName: company.name || 'Servora Service Support',
      }
    : undefined;

  // Name privacy: Only show if explicitly enabled by company policy
  let assignedProfessionalName: string | undefined;
  if (company?.settings?.showTechnicianNameToCustomer && technician) {
    assignedProfessionalName = technician.name;
  }

  return {
    _id: ticket._id.toString(),
    ticketNumber: ticket.ticketNumber,
    serviceType: ticket.serviceType,
    problemCategory: ticket.problemCategory,
    problemCode: ticket.problemCode,
    rawComplaint: ticket.rawComplaint,
    normalizedComplaint: ticket.normalizedComplaint || ticket.complaint,
    serviceLocation: ticket.serviceLocation || {
      address: '',
      city: '',
    },
    photos: ticket.photos || [],
    status: ticket.status,
    customerStatusLabel,
    customerTimeline: steps,
    assignedProfessionalRole: ticket.assignedTechnicianId ? assignedProfessionalRole : undefined,
    assignedProfessionalName,
    approvedCompanyContact: approvedContact,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    completedAt: ticket.completedAt?.toISOString(),
    feedback: ticket.customerFeedback
      ? {
          rating: ticket.customerFeedback.rating,
          comment: ticket.customerFeedback.comment,
          submittedAt: ticket.customerFeedback.submittedAt?.toISOString(),
        }
      : undefined,
  };
}

/**
 * POST /api/customer-portal/services/available
 * Location-based service discovery (City + Pincode)
 */
export async function getAvailableServices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const locInput = req.body.location || req.body;
    const city = typeof locInput.city === 'string' ? locInput.city.trim() : (typeof req.body.city === 'string' ? req.body.city.trim() : '');
    const pincode = locInput.postalCode || locInput.pincode || req.body.pincode ? String(locInput.postalCode || locInput.pincode || req.body.pincode).trim() : undefined;
    const latitude = typeof locInput.latitude === 'number' ? locInput.latitude : (typeof req.body.latitude === 'number' ? req.body.latitude : undefined);
    const longitude = typeof locInput.longitude === 'number' ? locInput.longitude : (typeof req.body.longitude === 'number' ? req.body.longitude : undefined);
    const area = typeof locInput.area === 'string' ? locInput.area.trim() : undefined;

    if (!city && !isValidApplicationCoordinate(latitude, longitude)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_LOCATION', message: 'Valid location or city coordinates are required to check service availability.' },
      });
      return;
    }

    // Unified coverage engine — identical logic used for both discovery and request creation
    const discovery = await discoverAvailableServices({ latitude, longitude, city, area, pincode });

    if (!discovery.coverageAvailable) {
      res.json({
        success: true,
        data: {
          coverageAvailable: false,
          city: city || undefined,
          latitude,
          longitude,
          pincode,
          services: [],
          availableServices: [],
          message: discovery.message || 'Servora services are not currently available in this area.',
        },
      });
      return;
    }

    const serviceDefinitions = discovery.services
      .map((match) => {
        const def = ServiceRegistry.getService(match.serviceType);
        if (!def) return null;
        return {
          serviceType: def.serviceType,
          displayName: def.displayName,
          shortDescription: def.shortDescription,
          icon: def.icon,
          heroImage: def.heroImage,
          providerCount: 1,
          primaryCompanyId: match.companyId,
          providers: [{ companyId: match.companyId, companyName: match.companyName }],
          matchedBy: match.matchedBy,
          distanceKm: match.distanceKm,
          coverageRadiusKm: match.coverageRadiusKm,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    res.json({
      success: true,
      data: {
        coverageAvailable: true,
        city,
        pincode,
        companyId: serviceDefinitions[0]?.primaryCompanyId,
        services: serviceDefinitions,
        availableServices: serviceDefinitions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/**
 * GET /api/customer-portal/services/:serviceType
 * Returns full service catalog including visual problem cards and triage questions
 */
export async function getServiceCatalog(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rawType = (req.params.serviceType || '').toUpperCase() as ServiceType;
    const serviceDef = ServiceRegistry.getService(rawType);

    if (!serviceDef) {
      res.status(404).json({
        success: false,
        error: { code: 'SERVICE_NOT_FOUND', message: `Service '${rawType}' is not supported.` },
      });
      return;
    }

    res.json({
      success: true,
      data: serviceDef,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/**
 * POST /api/customer-portal/requests
 * Customer creates a service request
 */
export async function createCustomerRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      serviceType,
      problemCode,
      problemCategory,
      complaint,
      photos = [],
      customerDetails,
      isUnknownTriage,
      triageAnswers,
    } = req.body;

    const knownServices = ServiceRegistry.getAllServices().map((s) => s.serviceType);
    if (!serviceType || !knownServices.includes(serviceType)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_SERVICE', message: `Valid serviceType is required (${knownServices.join(', ')}).` },
      });
      return;
    }

    const location = req.body.location || req.body.serviceLocation;

    if (!location || !location.address || !location.city) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_LOCATION', message: 'Full address and city are required.' },
      });
      return;
    }

    if (!complaint || typeof complaint !== 'string' || complaint.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_COMPLAINT', message: 'Please describe the problem you are experiencing.' },
      });
      return;
    }

    const rawInput = complaint.trim();
    const cleanCity = location.city.trim().toLowerCase();
    const cleanPincode = location.pincode ? String(location.pincode).trim() : (location.postalCode ? String(location.postalCode).trim() : undefined);
    const custLat = location.coordinates?.latitude ?? location.latitude;
    const custLon = location.coordinates?.longitude ?? location.longitude;
    const hasCustCoords = isValidApplicationCoordinate(custLat, custLon);
    // Unified authoritative coverage check — identical engine as service discovery
    // Note: Do not restrict customers to req.companyId (their registration tenant)
    const requestedCompanyId = req.body.companyId;
    let coverageResult = await resolveServiceCoverage({
      latitude: custLat,
      longitude: custLon,
      city: location.city,
      area: location.area,
      pincode: cleanPincode,
      serviceType,
      requestedCompanyId,
    });

    // If requested company did not match, fallback to evaluate all active providers in the area
    if (!coverageResult.covered && requestedCompanyId) {
      coverageResult = await resolveServiceCoverage({
        latitude: custLat,
        longitude: custLon,
        city: location.city,
        area: location.area,
        pincode: cleanPincode,
        serviceType,
      });
    }

    if (!coverageResult.covered || !coverageResult.companyId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE_AT_LOCATION',
          message: `Servora ${serviceType} service is not currently available in ${location.city}${cleanPincode ? ' (' + cleanPincode + ')' : ''}.`,
        },
      });
      return;
    }

    const targetCompanyDoc = await Company.findById(coverageResult.companyId);
    if (!targetCompanyDoc) {
      res.status(400).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE_AT_LOCATION', message: 'Service provider not found.' },
      });
      return;
    }
    const targetCompany = targetCompanyDoc;

    const companyId = targetCompany._id as mongoose.Types.ObjectId;

    // Resolve customer entity
    let customerDoc: any = null;
    if (req.userId) {
      customerDoc = await Customer.findOne({ userId: req.userId, companyId });
    }

    if (!customerDoc) {
      const custName = customerDetails?.name || req.user?.name || 'Customer';
      const custPhone = customerDetails?.phone || req.user?.phone || '+91 90000 00000';
      const custEmail = customerDetails?.email || req.user?.email;

      customerDoc = await Customer.create({
        companyId,
        userId: req.userId,
        name: custName,
        phone: custPhone,
        email: custEmail,
        address: location.address,
        city: location.city,
        pincode: location.pincode,
        coordinates: location.coordinates || (hasCustCoords ? { latitude: custLat, longitude: custLon } : undefined),
      });
    }

    // AI Complaint Normalization
    const normalizedResult = normalizeComplaint(rawInput, serviceType);

    // Generate unique ticket number
    const ticketNumber = await generateTicketNumber(companyId, serviceType);

    // Snapshot service location
    const legacyLocationSnapshot = {
      address: location.address,
      city: location.city,
      area: location.area || '',
      pincode: location.pincode || '',
      coordinates: location.coordinates || (hasCustCoords ? { latitude: custLat, longitude: custLon } : undefined),
      locationSource: location.locationSource || 'MANUAL',
    };

    const richLocationSnapshot = {
      inputText: location.inputText || location.formattedAddress || location.address,
      formattedAddress: location.formattedAddress || location.address,
      city: location.city,
      state: location.state,
      country: location.country || 'India',
      postalCode: cleanPincode,
      latitude: custLat,
      longitude: custLon,
      provider: location.provider || 'nominatim',
      placeId: location.placeId,
      resolvedAt: new Date(),
    };

    const finalIsUnknown = Boolean(isUnknownTriage || normalizedResult.isUnknownTriage);

    const ticket = await ServiceTicket.create({
      companyId,
      ticketNumber,
      serviceType,
      customerId: customerDoc._id,
      problemCategory: problemCategory || problemCode || 'OTHER',
      problemCode: problemCode || 'OTHER',
      complaint: normalizedResult.normalizedComplaint,
      rawComplaint: rawInput,
      normalizedComplaint: normalizedResult.normalizedComplaint,
      isUnknownTriage: finalIsUnknown,
      triageClassification: finalIsUnknown ? 'UNKNOWN_TRIAGE' : normalizedResult.triageClassification,
      environmentContext: targetCompany.environmentContext || (targetCompany.isPilot ? 'PILOT' : 'DEMO'),
      photos: Array.isArray(photos)
        ? photos.map((p) => (typeof p === 'string' ? p : p?.url ? String(p.url) : JSON.stringify(p)))
        : [],
      priority: 'MEDIUM',
      status: 'NEW',
      serviceLocation: legacyLocationSnapshot,
      serviceLocationSnapshot: richLocationSnapshot,
      isDemoData: targetCompany.environmentContext === 'DEMO' || !targetCompany.isPilot,
      createdBy: req.userId || customerDoc._id,
      statusHistory: [
        {
          status: 'NEW',
          changedBy: req.userId || customerDoc._id,
          timestamp: new Date(),
          note: 'Customer requested service via Servora Customer Portal',
        },
      ],
    });

    // Run initial AI analysis
    try {
      const aiResult = await AIFactory.analyzeWithFallback({
        ticketNumber: ticket.ticketNumber,
        serviceType: ticket.serviceType,
        complaint: ticket.rawComplaint || ticket.complaint,
        symptoms: ticket.symptoms,
        priority: ticket.priority,
        assetDetails: {},
        previousHistory: [],
      });

      const savedAnalysis = await AIAnalysis.create({
        ticketId: ticket._id,
        provider: aiResult.provider || 'DemoAIProvider',
        model: aiResult.model || 'Standard',
        serviceType: ticket.serviceType,
        possibleIssues: aiResult.possibleIssues,
        diagnosticSteps: aiResult.diagnosticSteps,
        recommendedTools: aiResult.recommendedTools,
        possibleParts: aiResult.possibleParts,
        safetyWarnings: aiResult.safetyWarnings,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        knowledgeSources: aiResult.knowledgeSources,
        promptVersion: 'v2.0',
        rawComplaint: rawInput,
        normalizedComplaint: normalizedResult.normalizedComplaint,
        isUnknownTriage: finalIsUnknown,
        knownFacts: normalizedResult.knownFacts || [],
        unknownFacts: normalizedResult.unknownFacts || [],
        missingInformation: normalizedResult.missingInformation || [],
        statusMessage: normalizedResult.statusMessage || '',
        requiredEvidence: aiResult.requiredEvidence || [],
      });

      ticket.aiAnalysisId = savedAnalysis._id as mongoose.Types.ObjectId;
      ticket.status = 'AI_ANALYZED';
      ticket.statusHistory.push({
        status: 'AI_ANALYZED',
        changedBy: req.userId || customerDoc._id,
        timestamp: new Date(),
        note: `AI triage completed (${savedAnalysis.provider})`,
      });
      await ticket.save();
    } catch (_aiErr) {
      // AI failure does not block ticket creation
    }

    await AuditLog.create({
      companyId,
      actorId: req.userId || customerDoc._id,
      actorRole: 'CUSTOMER',
      action: 'CREATE_CUSTOMER_REQUEST',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      newState: { ticketNumber: ticket.ticketNumber, serviceType: ticket.serviceType },
    });

    const responseData = serializeCustomerTicket(ticket, targetCompany);

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/**
 * GET /api/customer-portal/requests
 * Lists the authenticated customer's own service requests
 */
export async function getCustomerRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required.' } });
      return;
    }

    // Customers are consumers — find ALL their requests across ALL companies.
    // Query by userId, phone, and email to ensure guest/unlinked bookings are seamlessly accessible.
    const userPhone = req.user?.phone?.trim();
    const userEmail = req.user?.email?.trim().toLowerCase();

    const customerConditions: any[] = [{ userId: req.userId }];
    if (userPhone) {
      const digits = userPhone.replace(/\D/g, '').slice(-10);
      if (digits.length >= 10) {
        customerConditions.push({ phone: { $regex: `${digits}$` } });
      } else {
        customerConditions.push({ phone: userPhone });
      }
    }
    if (userEmail) {
      customerConditions.push({ email: { $regex: new RegExp(`^${userEmail}$`, 'i') } });
    }

    const customerDocs = await Customer.find({ $or: customerConditions });
    const customerIds = customerDocs.map((c) => c._id);

    // Proactively link unlinked customer records so future queries are instant
    for (const c of customerDocs) {
      if (!c.userId) {
        c.userId = req.userId as any;
        await c.save().catch(() => {});
      }
    }

    const query: any = {
      $or: [{ customerId: { $in: customerIds } }, { createdBy: req.userId }],
    };
    // NOTE: NO companyId filter here — customers may have tickets across multiple company areas.

    const tickets = await ServiceTicket.find(query).sort({ createdAt: -1 });

    // Fetch unique companies for this customer's tickets (multi-company serialization)
    const companyIds = [...new Set(tickets.map((t) => t.companyId?.toString()).filter(Boolean))];
    const companies = await Company.find({ _id: { $in: companyIds } });
    const companyMap = new Map(companies.map((c) => [c._id.toString(), c]));

    const serialized = tickets.map((t) => {
      const ticketCompany = companyMap.get(t.companyId?.toString()) || null;
      return serializeCustomerTicket(t, ticketCompany);
    });

    res.json({
      success: true,
      data: serialized,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/**
 * GET /api/customer-portal/requests/:id
 * Customer views their own request status & timeline
 */
export async function getCustomerRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ticket = await ServiceTicket.findById(req.params.id);

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service request not found.' } });
      return;
    }

    // Authorization & Tenant Isolation check
    if (req.userId) {
      const userPhone = req.user?.phone?.trim();
      const userEmail = req.user?.email?.trim().toLowerCase();

      const customerConditions: any[] = [{ userId: req.userId }];
      if (userPhone) {
        const digits = userPhone.replace(/\D/g, '').slice(-10);
        if (digits.length >= 10) {
          customerConditions.push({ phone: { $regex: `${digits}$` } });
        } else {
          customerConditions.push({ phone: userPhone });
        }
      }
      if (userEmail) {
        customerConditions.push({ email: { $regex: new RegExp(`^${userEmail}$`, 'i') } });
      }

      const customerDocs = await Customer.find({ $or: customerConditions });
      const customerIds = customerDocs.map((c) => c._id.toString());

      // Also inspect the ticket's customer directly
      const ticketCustomer = await Customer.findById(ticket.customerId);
      const userPhoneDigits = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';
      const custPhoneDigits = ticketCustomer?.phone ? ticketCustomer.phone.replace(/\D/g, '').slice(-10) : '';
      const phoneMatches = Boolean(userPhoneDigits && custPhoneDigits && userPhoneDigits === custPhoneDigits);
      const emailMatches = Boolean(
        userEmail && ticketCustomer?.email && ticketCustomer.email.trim().toLowerCase() === userEmail
      );

      const isOwner =
        customerIds.includes(ticket.customerId.toString()) ||
        (ticket.createdBy && ticket.createdBy.toString() === req.userId.toString()) ||
        phoneMatches ||
        emailMatches;

      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied. You can only view your own service requests.' },
        });
        return;
      }

      // Proactively link customer to user
      if (ticketCustomer && !ticketCustomer.userId) {
        ticketCustomer.userId = req.userId as any;
        await ticketCustomer.save().catch(() => {});
      }
    }

    const company = await Company.findById(ticket.companyId);
    let technician: any = null;
    if (ticket.assignedTechnicianId && company?.settings?.showTechnicianNameToCustomer) {
      technician = await Technician.findById(ticket.assignedTechnicianId).select('name');
    }

    const serialized = serializeCustomerTicket(ticket, company, technician);

    res.json({
      success: true,
      data: serialized,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/**
 * POST /api/customer-portal/requests/:id/feedback
 * Customer submits rating and feedback upon job completion
 */
export async function submitCustomerFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { rating, comment, onTime, resolved } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be an integer between 1 and 5.' },
      });
      return;
    }

    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service request not found.' } });
      return;
    }

    if (ticket.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_COMPLETED', message: 'Feedback can only be provided for completed services.' },
      });
      return;
    }

    ticket.customerFeedback = {
      rating,
      comment: (comment || '').trim(),
      onTime: onTime !== undefined ? Boolean(onTime) : undefined,
      resolved: resolved !== undefined ? Boolean(resolved) : undefined,
      submittedAt: new Date(),
    };

    await ticket.save();

    if (req.userId) {
      await PilotFeedback.create({
        companyId: ticket.companyId,
        ticketId: ticket._id,
        userId: req.userId,
        role: 'CUSTOMER',
        serviceType: ticket.serviceType,
        aiUtilityRating: rating,
        comments: comment || '',
        onTime: Boolean(onTime),
        resolved: Boolean(resolved),
      });
    }

    await AuditLog.create({
      companyId: ticket.companyId,
      actorId: req.userId || ticket.customerId,
      actorRole: 'CUSTOMER',
      action: 'SUBMIT_CUSTOMER_FEEDBACK',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      metadata: { rating, comment },
    });

    const company = await Company.findById(ticket.companyId);
    const serialized = serializeCustomerTicket(ticket, company);

    res.json({
      success: true,
      data: serialized,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
