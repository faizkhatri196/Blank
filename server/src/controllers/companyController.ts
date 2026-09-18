import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Company } from '../models/Company';
import { AuditLog } from '../models/AuditLog';
import { serviceAreaSchema } from '../validators';
import { z } from 'zod';

export async function getCompanyCoverage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.companyId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Company context required' } });
      return;
    }

    const company = await Company.findById(req.companyId);
    if (!company) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    res.json({
      success: true,
      data: {
        companyId: company._id,
        name: company.name,
        serviceAreas: company.serviceAreas || [],
        servicesSupported: company.servicesSupported || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateCompanyCoverage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.companyId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Company context required' } });
      return;
    }

    const schema = z.object({
      serviceAreas: z.array(serviceAreaSchema),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message || 'Invalid service areas' },
      });
      return;
    }

    const company = await Company.findById(req.companyId);
    if (!company) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    const serviceAreas = parseResult.data.serviceAreas.map((sa) => ({
      city: sa.city.trim(),
      state: sa.state?.trim(),
      country: sa.country?.trim() || 'India',
      areas: sa.areas || [],
      pincodes: sa.pincodes || [],
      latitude: sa.latitude,
      longitude: sa.longitude,
      radius: sa.radius,
      services: sa.services,
    }));

    const allServices = new Set<string>();
    serviceAreas.forEach((sa) => sa.services.forEach((s) => allServices.add(s)));
    const servicesSupported = Array.from(allServices);

    const prevAreas = company.serviceAreas;
    company.serviceAreas = serviceAreas as any;
    company.servicesSupported = servicesSupported as any;
    await company.save();

    await AuditLog.create({
      companyId: company._id,
      actorId: req.userId,
      actorRole: req.role,
      action: 'UPDATE_SERVICE_COVERAGE',
      entityType: 'Company',
      entityId: company._id.toString(),
      previousState: { serviceAreasCount: prevAreas.length },
      newState: { serviceAreasCount: serviceAreas.length, servicesSupported },
    });

    res.json({
      success: true,
      data: {
        companyId: company._id,
        name: company.name,
        serviceAreas: company.serviceAreas,
        servicesSupported: company.servicesSupported,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function addServiceArea(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.companyId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Company context required' } });
      return;
    }

    const parseResult = serviceAreaSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message || 'Invalid service area' },
      });
      return;
    }

    const company = await Company.findById(req.companyId);
    if (!company) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    const sa = parseResult.data;
    const newArea = {
      city: sa.city.trim(),
      state: sa.state?.trim(),
      country: sa.country?.trim() || 'India',
      areas: sa.areas || [],
      pincodes: sa.pincodes || [],
      latitude: sa.latitude,
      longitude: sa.longitude,
      radius: sa.radius,
      services: sa.services,
    };

    company.serviceAreas.push(newArea as any);

    const allServices = new Set<string>(company.servicesSupported || []);
    sa.services.forEach((s) => allServices.add(s));
    company.servicesSupported = Array.from(allServices) as any;

    await company.save();

    await AuditLog.create({
      companyId: company._id,
      actorId: req.userId,
      actorRole: req.role,
      action: 'ADD_SERVICE_AREA',
      entityType: 'Company',
      entityId: company._id.toString(),
      newState: { addedCity: newArea.city, services: newArea.services },
    });

    res.status(201).json({
      success: true,
      data: {
        serviceAreas: company.serviceAreas,
        servicesSupported: company.servicesSupported,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function deleteServiceArea(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.companyId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Company context required' } });
      return;
    }

    const index = parseInt(req.params.index, 10);
    if (isNaN(index)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INDEX', message: 'Valid index is required' } });
      return;
    }

    const company = await Company.findById(req.companyId);
    if (!company) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    if (index < 0 || index >= company.serviceAreas.length) {
      res.status(404).json({ success: false, error: { code: 'AREA_NOT_FOUND', message: 'Service area index not found' } });
      return;
    }

    const removed = company.serviceAreas.splice(index, 1)[0];

    const allServices = new Set<string>();
    company.serviceAreas.forEach((sa) => sa.services.forEach((s) => allServices.add(s)));
    company.servicesSupported = Array.from(allServices) as any;

    await company.save();

    await AuditLog.create({
      companyId: company._id,
      actorId: req.userId,
      actorRole: req.role,
      action: 'REMOVE_SERVICE_AREA',
      entityType: 'Company',
      entityId: company._id.toString(),
      previousState: { removedCity: removed?.city },
    });

    res.json({
      success: true,
      data: {
        serviceAreas: company.serviceAreas,
        servicesSupported: company.servicesSupported,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
