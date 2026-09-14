import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceTicket } from '../models/ServiceTicket';
import { ServiceReport } from '../models/ServiceReport';
import { ServiceHistory } from '../models/ServiceHistory';
import { Technician } from '../models/Technician';
import { AIAnalysis } from '../models/AIAnalysis';
import { PilotFeedback } from '../models/PilotFeedback';
import { AuditLog } from '../models/AuditLog';
import { compareAIVsActual } from '../services/evaluationService';
import { createServiceReportSchema } from '../validators';
import mongoose from 'mongoose';

export async function submitServiceReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createServiceReportSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const ticket = await ServiceTicket.findOne({
      _id: req.params.ticketId,
      companyId: req.companyId,
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    // Identify technician submitting
    let technicianId: mongoose.Types.ObjectId;
    let technicianName = 'Field Technician';

    if (req.role === 'TECHNICIAN') {
      const tech = await Technician.findOne({ userId: req.userId, companyId: req.companyId });
      if (!tech) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Technician profile not found' } });
        return;
      }
      const assignedId = ticket.assignedTechnicianId && ((ticket.assignedTechnicianId as any)._id || ticket.assignedTechnicianId);
      if (!assignedId || !tech._id.equals(assignedId)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only submit service reports for jobs assigned to you.' },
        });
        return;
      }
      technicianId = tech._id as mongoose.Types.ObjectId;
      technicianName = tech.name;
    } else {
      // Manager submitting on behalf of technician
      technicianId = (ticket.assignedTechnicianId || req.userId) as mongoose.Types.ObjectId;
      const tech = await Technician.findById(technicianId);
      if (tech) technicianName = tech.name;
    }

    const data = parseResult.data;

    // 1. Create or update ServiceReport
    const report = await ServiceReport.findOneAndUpdate(
      { ticketId: ticket._id },
      {
        $set: {
          ticketId: ticket._id,
          technicianId,
          actualDiagnosis: data.actualDiagnosis,
          workPerformed: data.workPerformed,
          readings: data.readings || {},
          partsUsed: data.partsUsed || [],
          toolsUsed: data.toolsUsed || [],
          beforePhotos: data.beforePhotos || [],
          afterPhotos: data.afterPhotos || [],
          technicianNotes: data.technicianNotes,
          aiHelpful: data.aiHelpful,
          aiAccuracyRating: data.aiAccuracyRating,
          toolsHelpful: data.toolsHelpful,
          partsHelpful: data.partsHelpful,
          additionalFeedback: data.additionalFeedback,
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 2. Transition ticket to COMPLETED
    ticket.status = 'COMPLETED';
    ticket.completedAt = new Date();
    ticket.statusHistory.push({
      status: 'COMPLETED',
      changedBy: req.userId!,
      timestamp: new Date(),
      note: `Job completed with actual diagnosis: ${data.actualDiagnosis}`,
    });
    await ticket.save();

    // 3. Mark technician as AVAILABLE
    await Technician.findByIdAndUpdate(technicianId, { $set: { availability: 'AVAILABLE' } });

    // 4. Load AI Analysis and compute comparison
    const aiAnalysis = ticket.aiAnalysisId ? await AIAnalysis.findById(ticket.aiAnalysisId) : null;
    const comparison = compareAIVsActual(aiAnalysis, report);

    // 5. Create longitudinal Service History
    await ServiceHistory.create({
      companyId: req.companyId,
      customerId: ticket.customerId,
      assetId: ticket.assetId,
      assetType: ticket.assetType,
      serviceType: ticket.serviceType,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      complaint: ticket.complaint,
      aiPredictionSummary: aiAnalysis?.possibleIssues[0]?.issue || 'N/A',
      actualDiagnosis: data.actualDiagnosis,
      workPerformed: data.workPerformed,
      partsUsed: data.partsUsed || [],
      readings: data.readings || {},
      technicianName,
      comparisonResult: {
        diagnosisMatch: comparison.diagnosisMatch,
        toolMatch: comparison.toolMatch,
        partMatch: comparison.partMatch,
      },
      completedAt: new Date(),
    });

    // 6. Record Pilot Feedback if provided
    if (
      data.aiAccuracyRating !== undefined ||
      data.aiHelpful !== undefined ||
      data.wasAiSuggestionUseful !== undefined ||
      data.aiUtilityRating !== undefined
    ) {
      await PilotFeedback.create({
        companyId: req.companyId,
        ticketId: ticket._id,
        userId: req.userId,
        role: req.role,
        serviceType: ticket.serviceType,
        aiUtilityRating: data.aiUtilityRating || data.aiAccuracyRating || (data.aiHelpful ? 5 : 2),
        wasAiSuggestionUseful: data.wasAiSuggestionUseful || (data.aiHelpful ? 'YES' : 'NO'),
        didTechnicianHaveRequiredTools: data.didTechnicianHaveRequiredTools || (data.toolsHelpful ? 'YES' : 'NO'),
        wasSecondVisitRequired: data.wasSecondVisitRequired || 'NO',
        secondVisitReason: data.secondVisitReason || '',
        additionalFeedback: data.additionalFeedback || data.technicianNotes || '',
        diagnosisHelpfulness: data.aiAccuracyRating || data.aiUtilityRating,
        toolHelpfulness: data.toolsHelpful ? 5 : 3,
        partsHelpfulness: data.partsHelpful ? 5 : 3,
        comments: data.additionalFeedback || data.technicianNotes,
      });
    }

    // 7. Audit log
    await AuditLog.create({
      companyId: req.companyId,
      actorId: req.userId,
      actorRole: req.role,
      action: 'COMPLETE_JOB',
      entityType: 'ServiceTicket',
      entityId: ticket._id.toString(),
      metadata: {
        actualDiagnosis: data.actualDiagnosis,
        diagnosisMatch: comparison.diagnosisMatch,
      },
    });

    res.json({
      success: true,
      data: {
        report,
        comparison,
        ticket,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getServiceReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const report = await ServiceReport.findOne({ ticketId: req.params.ticketId })
      .populate('technicianId', 'name phone skills');

    if (!report) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
