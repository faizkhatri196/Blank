import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculatePilotMetrics } from '../services/metricsService';
import { generatePilotCSV } from '../services/exportService';
import { PilotFeedback } from '../models/PilotFeedback';
import { ServiceTicket } from '../models/ServiceTicket';
import { getDBStatus } from '../config/db';
import { AIFactory } from '../ai/AIFactory';
import { createPilotFeedbackSchema } from '../validators';
import { ServiceType } from '../types';

export async function getPilotMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { serviceType, includeDemoData } = req.query;
    const sType = serviceType && (serviceType === 'SOLAR' || serviceType === 'AC') ? serviceType : 'ALL';
    const incDemo = includeDemoData !== 'false';

    const metrics = await calculatePilotMetrics(req.companyId!, sType, incDemo);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function exportPilotCSV(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const csvContent = await generatePilotCSV(req.companyId!);
    const filename = `pilot-evaluation-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'EXPORT_FAILED', message: error.message } });
  }
}

export async function submitFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createPilotFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const { ticketId } = req.body;
    let serviceType: ServiceType = 'SOLAR';

    if (ticketId) {
      const ticket = await ServiceTicket.findById(ticketId);
      if (ticket) serviceType = ticket.serviceType;
    }

    const feedback = await PilotFeedback.create({
      companyId: req.companyId,
      ticketId,
      userId: req.userId,
      role: req.role,
      serviceType,
      ...parseResult.data,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getSystemHealth(_req: any, res: Response): Promise<void> {
  try {
    const db = getDBStatus();
    const ai = await AIFactory.getProviderStatus();

    res.json({
      success: true,
      data: {
        status: db.isConnected ? 'HEALTHY' : 'DEGRADED',
        database: {
          connected: db.isConnected,
          host: db.host,
          databaseName: db.dbName,
        },
        ai: {
          activeProvider: ai.activeProvider,
          configuredProvider: ai.configured,
          isFallback: ai.isFallback,
          details: ai.details,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
