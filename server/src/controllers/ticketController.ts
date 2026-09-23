import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceTicket } from '../models/ServiceTicket';
import { Company } from '../models/Company';
import { Customer } from '../models/Customer';
import { SolarSystem } from '../models/SolarSystem';
import { ACUnit } from '../models/ACUnit';
import { Technician } from '../models/Technician';
import { AIAnalysis } from '../models/AIAnalysis';
import { AIAnalysisReview } from '../models/AIAnalysisReview';
import { ServiceReport } from '../models/ServiceReport';
import { ServiceHistory } from '../models/ServiceHistory';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { AIFactory } from '../ai/AIFactory';
import { calculateTechnicianMatches } from '../services/matchingService';
import { generateTicketNumber, isValidStatusTransition } from '../services/ticketService';
import { NotificationService } from '../services/notificationService';
import {
  createServiceTicketSchema,
  updateTicketStatusSchema,
  assignTechnicianSchema,
  aiAnalysisReviewSchema,
} from '../validators';
import { calculateHaversineDistanceKm, isValidCoordinate } from '../services/location/geospatial';
import { CoverageService } from '../services/coverageService';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';
import mongoose from 'mongoose';

export async function getTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      serviceType,
      status,
      priority,
      search,
      isDemoData,
      page = '1',
      limit = '25',
    } = req.query;

    const query: any = { companyId: req.companyId };

    // If technician, filter to their assigned jobs
    if (req.role === 'TECHNICIAN') {
      const techProfile = await Technician.findOne({ userId: req.userId, companyId: req.companyId });
      if (techProfile) {
        query.assignedTechnicianId = techProfile._id;
      } else {
        query.assignedTechnicianId = new mongoose.Types.ObjectId();
      }
    }

    if (serviceType && (serviceType === 'SOLAR' || serviceType === 'AC')) {
      query.serviceType = serviceType;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (isDemoData !== undefined) {
      query.isDemoData = isDemoData === 'true';
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: String(search), $options: 'i' } },
        { complaint: { $regex: String(search), $options: 'i' } },
        { errorCode: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      ServiceTicket.find(query)
        .populate('customerId', 'name phone address city')
        .populate('assignedTechnicianId', 'name phone availability')
        .populate('aiAnalysisId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ServiceTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getTicketById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ticket = await ServiceTicket.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    })
      .populate('customerId')
      .populate('assignedTechnicianId')
      .populate('aiAnalysisId')
      .populate('createdBy', 'name email role');

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    // Role-based authorization: technicians may only view tickets assigned to them
    if (req.role === 'TECHNICIAN') {
      const techProfile = await Technician.findOne({ userId: req.userId, companyId: req.companyId });
      const assignedId = ticket.assignedTechnicianId && ((ticket.assignedTechnicianId as any)._id || ticket.assignedTechnicianId);
      if (!techProfile || !assignedId || !techProfile._id.equals(assignedId)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied. You can only view jobs assigned to you.' },
        });
        return;
      }
    }

    // Populate asset details dynamically
    let asset = null;
    if (ticket.serviceType === 'SOLAR') {
      asset = await SolarSystem.findById(ticket.assetId);
    } else {
      asset = await ACUnit.findById(ticket.assetId);
    }

    // Fetch review and service report if available
    const [review, serviceReport, assetHistory] = await Promise.all([
      AIAnalysisReview.findOne({ ticketId: ticket._id }),
      ServiceReport.findOne({ ticketId: ticket._id }),
      ServiceHistory.find({ assetId: ticket.assetId }).sort({ completedAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      data: {
        ticket,
        asset,
        review,
        serviceReport,
        assetHistory,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createServiceTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const data = parseResult.data;

    // Verify customer exists
    const customer = await Customer.findOne({ _id: data.customerId, companyId: req.companyId });
    if (!customer) {
      res.status(400).json({ success: false, error: { code: 'INVALID_CUSTOMER', message: 'Customer not found' } });
      return;
    }

    // Verify asset exists
    const assetType = data.serviceType === 'SOLAR' ? 'SolarSystem' : 'ACUnit';
    if (data.serviceType === 'SOLAR') {
      const solarSys = await SolarSystem.findOne({ _id: data.assetId, companyId: req.companyId });
      if (!solarSys) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ASSET', message: 'Solar system not found' } });
        return;
      }
    } else {
      const acUnit = await ACUnit.findOne({ _id: data.assetId, companyId: req.companyId });
      if (!acUnit) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ASSET', message: 'AC unit not found' } });
        return;
      }
    }

    const ticketNumber = await generateTicketNumber(req.companyId!, data.serviceType);

    const rawInput = (data as any).rawComplaint || data.complaint;
    const { normalizeComplaint } = await import('../ai/complaintNormalizer');
    const normalizedResult = normalizeComplaint(rawInput, data.serviceType);

    const company = await Company.findById(req.companyId);

    const ticket = await ServiceTicket.create({
      companyId: req.companyId,
      ticketNumber,
      serviceType: data.serviceType,
      customerId: data.customerId,
      assetId: data.assetId,
      assetType,
      complaint: normalizedResult.normalizedComplaint,
      rawComplaint: rawInput,
      normalizedComplaint: normalizedResult.normalizedComplaint,
      isUnknownTriage: normalizedResult.isUnknownTriage,
      triageClassification: normalizedResult.triageClassification,
      environmentContext: company?.environmentContext || (company?.isPilot ? 'PILOT' : 'DEMO'),
      symptoms: data.symptoms,
      errorCode: data.errorCode,
      priority: data.priority,
      photos: data.photos,
      status: 'NEW',
      repeatVisit: data.repeatVisit || false,
      previousTicketId: data.previousTicketId,
      repeatVisitReason: data.repeatVisitReason,
      isDemoData: (company?.isPilot || company?.environmentContext === 'CLIENT') ? false : (data.isDemoData || false),
      createdBy: req.userId,
      statusHistory: [
        {
          status: 'NEW',
          changedBy: req.userId,
          timestamp: new Date(),
          note: 'Ticket created by service manager',
        },
      ],
    });

    await AuditLog.create({
      companyId: req.companyId,
      actorId: req.userId,
      actorRole: req.role,
      action: 'CREATE_TICKET',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      newState: { ticketNumber: ticket.ticketNumber, serviceType: ticket.serviceType },
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateTicketStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = updateTicketStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const ticket = await ServiceTicket.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    const isManager = req.role === 'SERVICE_MANAGER';
    if (!isManager) {
      const techProfile = await Technician.findOne({ userId: req.userId, companyId: req.companyId });
      const assignedId = ticket.assignedTechnicianId && ((ticket.assignedTechnicianId as any)._id || ticket.assignedTechnicianId);
      if (!techProfile || !assignedId || !techProfile._id.equals(assignedId)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only update tickets assigned to you.' },
        });
        return;
      }
    }

    const targetStatus = parseResult.data.status;

    if (!isValidStatusTransition(ticket.status, targetStatus, isManager)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition status from ${ticket.status} to ${targetStatus}`,
        },
      });
      return;
    }

    const previousStatus = ticket.status;
    ticket.status = targetStatus;

    if ((targetStatus === 'ON_SITE' || targetStatus === 'DIAGNOSING') && !ticket.startedAt) {
      ticket.startedAt = new Date();
    }

    ticket.statusHistory.push({
      status: targetStatus,
      changedBy: req.userId!,
      timestamp: new Date(),
      note: parseResult.data.note,
    });

    await ticket.save();

    await AuditLog.create({
      companyId: req.companyId,
      actorId: req.userId,
      actorRole: req.role,
      action: 'UPDATE_JOB_STATUS',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      previousState: { status: previousStatus },
      newState: { status: targetStatus },
    });

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function analyzeTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ticket = await ServiceTicket.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    // Fetch asset details
    let assetDetails: Record<string, any> = {};
    if (ticket.serviceType === 'SOLAR') {
      const solar = await SolarSystem.findById(ticket.assetId);
      if (solar) {
        assetDetails = {
          capacityKW: solar.capacityKW,
          panelMake: solar.panelMake,
          panelModel: solar.panelModel,
          inverterMake: solar.inverterMake,
          inverterModel: solar.inverterModel,
          inverterSerial: solar.inverterSerial,
          systemType: solar.systemType,
          batteryPresent: solar.batteryPresent,
        };
      }
    } else {
      const ac = await ACUnit.findById(ticket.assetId);
      if (ac) {
        assetDetails = {
          brand: ac.brand,
          model: ac.model,
          serialNumber: ac.serialNumber,
          acType: ac.acType,
          capacityTR: ac.capacityTR,
          refrigerantType: ac.refrigerantType,
          compressorType: ac.compressorType,
        };
      }
    }

    // Fetch prior service history for this asset
    const priorHistory = await ServiceHistory.find({ assetId: ticket.assetId })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('completedAt complaint actualDiagnosis workPerformed');

    const formattedHistory = priorHistory.map((h) => ({
      date: h.completedAt,
      complaint: h.complaint,
      actualDiagnosis: h.actualDiagnosis,
      workPerformed: h.workPerformed,
    }));

    // Run AI analysis through AIFactory with fallback (passing raw customer complaint)
    const analysisResult = await AIFactory.analyzeWithFallback({
      ticketNumber: ticket.ticketNumber,
      serviceType: ticket.serviceType,
      complaint: ticket.rawComplaint || ticket.complaint,
      symptoms: ticket.symptoms,
      errorCode: ticket.errorCode,
      priority: ticket.priority,
      assetDetails,
      previousHistory: formattedHistory,
    });

    // Save AIAnalysis document
    const savedAnalysis = await AIAnalysis.create({
      ticketId: ticket._id,
      provider: analysisResult.provider || 'DemoAIProvider',
      model: analysisResult.model || 'Standard',
      serviceType: ticket.serviceType,
      possibleIssues: analysisResult.possibleIssues,
      diagnosticSteps: analysisResult.diagnosticSteps,
      recommendedTools: analysisResult.recommendedTools,
      possibleParts: analysisResult.possibleParts,
      safetyWarnings: analysisResult.safetyWarnings,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      knowledgeSources: analysisResult.knowledgeSources,
      promptVersion: analysisResult.promptVersion || 'v0.1',
      rawComplaint: analysisResult.rawComplaint || ticket.rawComplaint || ticket.complaint,
      normalizedComplaint: analysisResult.normalizedComplaint || ticket.normalizedComplaint || ticket.complaint,
      isUnknownTriage: analysisResult.isUnknownTriage || false,
      knownFacts: analysisResult.knownFacts || [],
      unknownFacts: analysisResult.unknownFacts || [],
      missingInformation: analysisResult.missingInformation || [],
      statusMessage: analysisResult.statusMessage || '',
      requiredEvidence: analysisResult.requiredEvidence || [],
    });

    ticket.aiAnalysisId = savedAnalysis._id as mongoose.Types.ObjectId;
    if (analysisResult.rawComplaint) ticket.rawComplaint = analysisResult.rawComplaint;
    if (analysisResult.normalizedComplaint) ticket.normalizedComplaint = analysisResult.normalizedComplaint;
    ticket.isUnknownTriage = analysisResult.isUnknownTriage || false;
    if (analysisResult.isUnknownTriage) {
      ticket.triageClassification = 'UNKNOWN_TRIAGE';
    }

    if (ticket.status === 'NEW') {
      ticket.status = 'AI_ANALYZED';
      ticket.statusHistory.push({
        status: 'AI_ANALYZED',
        changedBy: req.userId!,
        timestamp: new Date(),
        note: `AI analysis completed using ${savedAnalysis.provider}${analysisResult.isUnknownTriage ? ' (UNKNOWN / NEEDS TRIAGE)' : ''}`,
      });
    }
    await ticket.save();

    await AuditLog.create({
      companyId: req.companyId,
      actorId: req.userId,
      actorRole: req.role,
      action: 'RUN_AI_ANALYSIS',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      metadata: { provider: savedAnalysis.provider, confidence: savedAnalysis.confidence },
    });

    res.json({ success: true, data: savedAnalysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'AI_ANALYSIS_FAILED', message: error.message } });
  }
}

export async function reviewAIAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = aiAnalysisReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const ticket = await ServiceTicket.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!ticket || !ticket.aiAnalysisId) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_AI_ANALYSIS', message: 'Ticket has no AI analysis to review' },
      });
      return;
    }

    const review = await AIAnalysisReview.findOneAndUpdate(
      { ticketId: ticket._id },
      {
        $set: {
          originalAIAnalysisId: ticket.aiAnalysisId,
          reviewedBy: req.userId,
          accepted: parseResult.data.accepted,
          editedChecklist: parseResult.data.editedChecklist,
          editedTools: parseResult.data.editedTools,
          editedParts: parseResult.data.editedParts,
          managerNotes: parseResult.data.managerNotes,
          reviewedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    if (ticket.status === 'AI_ANALYZED') {
      ticket.status = 'WAITING_FOR_ASSIGNMENT';
      ticket.statusHistory.push({
        status: 'WAITING_FOR_ASSIGNMENT',
        changedBy: req.userId!,
        timestamp: new Date(),
        note: 'Manager reviewed AI diagnostic preparation',
      });
      await ticket.save();
    }

    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getRecommendedTechnicians(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ticket = await ServiceTicket.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    const aiAnalysis = ticket.aiAnalysisId
      ? await AIAnalysis.findById(ticket.aiAnalysisId)
      : null;

    const technicians = await Technician.find({
      companyId: req.companyId,
    });

    let customerCity = '';
    let customerArea = '';
    let customerAddress = '';
    let customerPincode = '';
    let custCoords: any = undefined;

    if (ticket.customerId) {
      const cust = await Customer.findById(ticket.customerId);
      if (cust) {
        customerCity = cust.city || '';
        customerAddress = cust.address || '';
        customerPincode = cust.pincode || '';
        custCoords = cust.coordinates;
      }
    }

    let ticketLat = ticket.serviceLocationSnapshot?.latitude ?? ticket.serviceLocation?.coordinates?.latitude;
    let ticketLon = ticket.serviceLocationSnapshot?.longitude ?? ticket.serviceLocation?.coordinates?.longitude;

    if (!isValidCoordinate(ticketLat, ticketLon) && custCoords && isValidCoordinate(custCoords.latitude, custCoords.longitude)) {
      ticketLat = custCoords.latitude;
      ticketLon = custCoords.longitude;
    }

    if (!isValidCoordinate(ticketLat, ticketLon) && ticket.coverageSnapshot?.coverageCoordinates && isValidCoordinate(ticket.coverageSnapshot.coverageCoordinates.latitude, ticket.coverageSnapshot.coverageCoordinates.longitude)) {
      ticketLat = ticket.coverageSnapshot.coverageCoordinates.latitude;
      ticketLon = ticket.coverageSnapshot.coverageCoordinates.longitude;
    }

    if (!isValidCoordinate(ticketLat, ticketLon)) {
      const queryLoc = [ticket.serviceLocation?.area, ticket.serviceLocation?.city || customerCity].filter(Boolean).join(', ');
      if (queryLoc && queryLoc.trim().length >= 3) {
        try {
          const geoResults = await NominatimLocationProvider.search(queryLoc);
          if (geoResults && geoResults.length > 0 && isValidCoordinate(geoResults[0].latitude, geoResults[0].longitude)) {
            ticketLat = geoResults[0].latitude;
            ticketLon = geoResults[0].longitude;
          }
        } catch {}
      }
    }

    const locationContext = {
      city: ticket.serviceLocation?.city || customerCity,
      area: ticket.serviceLocation?.area || customerArea,
      pincode: ticket.serviceLocation?.pincode || customerPincode,
      address: ticket.serviceLocation?.address || customerAddress,
      latitude: isValidCoordinate(ticketLat, ticketLon) ? ticketLat : undefined,
      longitude: isValidCoordinate(ticketLat, ticketLon) ? ticketLon : undefined,
    };

    const rawRecommendations = calculateTechnicianMatches(ticket, technicians, aiAnalysis, locationContext);

    const recommendations = await Promise.all(
      rawRecommendations.map(async (rec) => {
        if (isValidCoordinate(ticketLat, ticketLon)) {
          const val = await CoverageService.validateTechnicianCoverage({
            technicianId: rec.technicianId,
            customerLatitude: ticketLat!,
            customerLongitude: ticketLon!,
            serviceType: ticket.serviceType,
            companyId: req.companyId,
            customerAddress: locationContext.address,
            ticketId: ticket._id,
          });

          return {
            ...rec,
            isEligible: val.eligible,
            distanceKm: val.distanceKm,
            coverageRadiusKm: val.radiusKm,
            coverageStatus: val.eligible ? ('COVERS_LOCATION' as const) : ('OUTSIDE_SERVICE_AREA' as const),
            coverageExplanation: val.eligible
              ? `Customer is ${val.distanceKm.toFixed(1)} km away (within ${val.radiusKm} km radius)`
              : `Customer is ${val.distanceKm.toFixed(1)} km away (exceeds ${val.radiusKm} km coverage radius)`,
            ineligibilityReason: val.eligible ? undefined : val.reason,
            technicianCoverageSummary: val.coverageArea?.name || rec.technicianCoverageSummary,
            diagnostics: val,
          };
        }
        return rec;
      })
    );

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function assignTechnician(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = assignTechnicianSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const ticket = await ServiceTicket.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    const technician = await Technician.findOne({
      _id: parseResult.data.technicianId,
      companyId: req.companyId,
      active: true,
    });

    if (!technician) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TECHNICIAN', message: 'Technician not found or inactive' },
      });
      return;
    }

    if (!technician.serviceTypes.includes(ticket.serviceType)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SERVICE_TYPE_MISMATCH',
          message: `Technician ${technician.name} is not certified for ${ticket.serviceType} service`,
        },
      });
      return;
    }

    // Customer / Ticket location context for coverage evaluation
    const ticketCity = (ticket.serviceLocation?.city || '').toLowerCase();
    const ticketArea = (ticket.serviceLocation?.area || '').toLowerCase();
    const ticketAddress = (ticket.serviceLocation?.address || '').toLowerCase();
    const ticketPincode = ticket.serviceLocation?.pincode || '';

    let customerCity = '';
    let customerAddress = '';
    let customerPincode = '';
    let cust: any = null;

    if (ticket.customerId) {
      cust = await Customer.findById(ticket.customerId);
      if (cust) {
        customerCity = (cust.city || '').toLowerCase();
        customerAddress = (cust.address || '').toLowerCase();
        customerPincode = cust.pincode || '';
      }
    }

    const customerLocationSummary = [ticket.serviceLocation?.area, ticket.serviceLocation?.city || customerCity].filter(Boolean).join(', ') || 'Customer location';
    const techCoverageSummary = technician.serviceAreas && technician.serviceAreas.length > 0 ? technician.serviceAreas.join(', ') : 'Universal Company Area';

    // 1. Resolve ticket / customer coordinates
    let ticketLat = ticket.serviceLocationSnapshot?.latitude ?? ticket.serviceLocation?.coordinates?.latitude;
    let ticketLng = ticket.serviceLocationSnapshot?.longitude ?? ticket.serviceLocation?.coordinates?.longitude;

    if (!isValidCoordinate(ticketLat, ticketLng) && cust?.coordinates && isValidCoordinate(cust.coordinates.latitude, cust.coordinates.longitude)) {
      ticketLat = cust.coordinates.latitude;
      ticketLng = cust.coordinates.longitude;
    }

    if (!isValidCoordinate(ticketLat, ticketLng) && ticket.coverageSnapshot?.coverageCoordinates && isValidCoordinate(ticket.coverageSnapshot.coverageCoordinates.latitude, ticket.coverageSnapshot.coverageCoordinates.longitude)) {
      ticketLat = ticket.coverageSnapshot.coverageCoordinates.latitude;
      ticketLng = ticket.coverageSnapshot.coverageCoordinates.longitude;
    }

    if (!isValidCoordinate(ticketLat, ticketLng) && customerLocationSummary && customerLocationSummary.trim().length >= 3) {
      try {
        const geoResults = await NominatimLocationProvider.search(customerLocationSummary);
        if (geoResults && geoResults.length > 0 && isValidCoordinate(geoResults[0].latitude, geoResults[0].longitude)) {
          ticketLat = geoResults[0].latitude;
          ticketLng = geoResults[0].longitude;
        }
      } catch {}
    }

    if (!isValidCoordinate(ticketLat, ticketLng)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CUSTOMER_COORDINATES_REQUIRED',
          message: 'Customer service location coordinates are missing or invalid. Real geographic coordinates are required for assignment.',
          details: {
            customerLocation: customerLocationSummary,
            ticketId: ticket._id,
          },
        },
      });
      return;
    }

    // 2. Validate technician coverage via authoritative centralized CoverageService
    const validation = await CoverageService.validateTechnicianCoverage({
      technicianId: technician._id,
      customerLatitude: ticketLat!,
      customerLongitude: ticketLng!,
      serviceType: ticket.serviceType,
      companyId: req.companyId,
      customerAddress: customerLocationSummary,
      ticketId: ticket._id,
    });

    if (!validation.eligible) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TECHNICIAN_OUTSIDE_COVERAGE',
          message:
            validation.reason ||
            `Technician ${technician.name} is ${Math.round(validation.distanceKm)}km away, exceeding their ${validation.radiusKm}km operating radius.`,
          details: {
            technicianId: technician._id.toString(),
            technicianName: technician.name,
            customerLatitude: ticketLat,
            customerLongitude: ticketLng,
            technicianCoverageLatitude: validation.coverageArea?.latitude ?? validation.technician?.latitude,
            technicianCoverageLongitude: validation.coverageArea?.longitude ?? validation.technician?.longitude,
            distanceKm: validation.distanceKm,
            radiusKm: validation.radiusKm,
            coverageAreaId: validation.coverageArea?.id,
            customerAddress: customerLocationSummary,
            technicianCoverageAddress: validation.technician?.baseAddress || validation.coverageArea?.name || 'Technician Base Location',
            customerLocation: customerLocationSummary,
            technicianCoverage: techCoverageSummary,
            coordinateOrderWarning: validation.coordinateOrderWarning,
            coordinateSource: validation.coordinateSource,
            diagnostics: validation,
            reason: validation.reason,
          },
        },
      });
      return;
    }

    ticket.assignedTechnicianId = technician._id as mongoose.Types.ObjectId;
    ticket.status = 'ASSIGNED';
    ticket.statusHistory.push({
      status: 'ASSIGNED',
      changedBy: req.userId!,
      timestamp: new Date(),
      note: `Assigned to technician: ${technician.name}`,
    });

    await ticket.save();

    // Mark technician as BUSY
    technician.availability = 'BUSY';
    await technician.save();

    // Dispatch In-App Assignment Notification for the Technician
    try {
      const managerUser = await User.findById(req.userId);
      const assignedLocationName = ticket.serviceLocation?.city || customerCity || 'service location';
      const problemSummary = ticket.problemCategory || ticket.normalizedComplaint || ticket.complaint || 'Service Request';

      await NotificationService.sendNotification({
        recipientUserId: technician.userId,
        companyId: req.companyId!,
        type: 'NEW_ASSIGNMENT',
        title: 'New Service Assignment',
        message: `You have been assigned a ${ticket.serviceType} service request in ${assignedLocationName}.`,
        metadata: {
          serviceType: ticket.serviceType,
          customerArea: customerLocationSummary,
          problem: problemSummary,
          assignedByName: managerUser?.name || 'Manager',
          ticketNumber: ticket.ticketNumber,
        },
        relatedTicketId: ticket._id,
      });
    } catch (notifErr) {
      console.error('Failed to create in-app technician notification:', notifErr);
    }

    await AuditLog.create({
      companyId: req.companyId,
      actorId: req.userId,
      actorRole: req.role,
      action: 'ASSIGN_TECHNICIAN',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      metadata: { technicianId: technician._id.toString(), technicianName: technician.name },
    });

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
