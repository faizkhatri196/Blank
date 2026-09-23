import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Company } from '../models/Company';
import { AuditLog } from '../models/AuditLog';
import { serviceAreaSchema } from '../validators';
import { createGeoPoint, isValidApplicationCoordinate } from '../services/location/geospatial';
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

    const serviceAreas = parseResult.data.serviceAreas.map((sa) => {
      const lat = sa.latitude;
      const lon = sa.longitude;
      const radiusKm = sa.radiusKm ?? sa.radius ?? 20;
      const center = isValidApplicationCoordinate(lat, lon) ? createGeoPoint(lat!, lon!) : undefined;
      return {
        _id: sa._id,
        locationName: sa.locationName?.trim(),
        formattedAddress: sa.formattedAddress?.trim() || `${sa.city}, ${sa.state || ''} ${sa.country || 'India'}`.trim(),
        city: sa.city.trim(),
        state: sa.state?.trim(),
        country: sa.country?.trim() || 'India',
        postalCode: sa.postalCode?.trim(),
        areas: sa.areas || [],
        pincodes: sa.pincodes || [],
        latitude: lat,
        longitude: lon,
        center,
        radius: radiusKm,
        radiusKm,
        services: sa.services,
        active: sa.active ?? true,
      };
    });

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
    const lat = sa.latitude;
    const lon = sa.longitude;
    const radiusKm = sa.radiusKm ?? sa.radius ?? 20;
    const center = isValidApplicationCoordinate(lat, lon) ? createGeoPoint(lat!, lon!) : undefined;

    const newArea = {
      locationName: sa.locationName?.trim(),
      formattedAddress: sa.formattedAddress?.trim() || `${sa.city}, ${sa.state || ''} ${sa.country || 'India'}`.trim(),
      city: sa.city.trim(),
      state: sa.state?.trim(),
      country: sa.country?.trim() || 'India',
      postalCode: sa.postalCode?.trim(),
      areas: sa.areas || [],
      pincodes: sa.pincodes || [],
      latitude: lat,
      longitude: lon,
      center,
      radius: radiusKm,
      radiusKm,
      services: sa.services,
      active: sa.active ?? true,
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

export async function updateSingleServiceArea(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const identifier = req.params.indexOrId;
    let targetIndex = -1;

    // Check if identifier is an array index or MongoDB _id
    const parsedIdx = parseInt(identifier, 10);
    if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < company.serviceAreas.length) {
      targetIndex = parsedIdx;
    } else {
      targetIndex = company.serviceAreas.findIndex((a: any) => a._id && a._id.toString() === identifier);
    }

    if (targetIndex === -1) {
      res.status(404).json({ success: false, error: { code: 'AREA_NOT_FOUND', message: 'Service area not found' } });
      return;
    }

    const sa = parseResult.data;
    const lat = sa.latitude ?? company.serviceAreas[targetIndex].latitude;
    const lon = sa.longitude ?? company.serviceAreas[targetIndex].longitude;
    const radiusKm = sa.radiusKm ?? sa.radius ?? company.serviceAreas[targetIndex].radiusKm ?? 20;
    const center = isValidApplicationCoordinate(lat, lon) ? createGeoPoint(lat!, lon!) : undefined;

    company.serviceAreas[targetIndex] = {
      ...company.serviceAreas[targetIndex],
      locationName: sa.locationName !== undefined ? sa.locationName?.trim() : company.serviceAreas[targetIndex].locationName,
      formattedAddress: sa.formattedAddress !== undefined ? sa.formattedAddress?.trim() : company.serviceAreas[targetIndex].formattedAddress,
      city: sa.city !== undefined ? sa.city.trim() : company.serviceAreas[targetIndex].city,
      state: sa.state !== undefined ? sa.state?.trim() : company.serviceAreas[targetIndex].state,
      country: sa.country !== undefined ? sa.country?.trim() : company.serviceAreas[targetIndex].country,
      postalCode: sa.postalCode !== undefined ? sa.postalCode?.trim() : company.serviceAreas[targetIndex].postalCode,
      areas: sa.areas !== undefined ? sa.areas : company.serviceAreas[targetIndex].areas,
      pincodes: sa.pincodes !== undefined ? sa.pincodes : company.serviceAreas[targetIndex].pincodes,
      latitude: lat,
      longitude: lon,
      center,
      radius: radiusKm,
      radiusKm,
      services: sa.services !== undefined ? sa.services : company.serviceAreas[targetIndex].services,
      active: sa.active !== undefined ? sa.active : company.serviceAreas[targetIndex].active,
    } as any;

    const allServices = new Set<string>();
    company.serviceAreas.forEach((area) => area.services.forEach((s) => allServices.add(s)));
    company.servicesSupported = Array.from(allServices) as any;

    await company.save();

    res.json({
      success: true,
      data: {
        serviceAreas: company.serviceAreas,
        servicesSupported: company.servicesSupported,
        updatedArea: company.serviceAreas[targetIndex],
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

    const identifier = req.params.index;
    const company = await Company.findById(req.companyId);
    if (!company) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    let targetIndex = -1;
    const parsedIdx = parseInt(identifier, 10);
    if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < company.serviceAreas.length) {
      targetIndex = parsedIdx;
    } else {
      targetIndex = company.serviceAreas.findIndex((a: any) => a._id && a._id.toString() === identifier);
    }

    if (targetIndex === -1) {
      res.status(404).json({ success: false, error: { code: 'AREA_NOT_FOUND', message: 'Service area not found' } });
      return;
    }

    const removed = company.serviceAreas.splice(targetIndex, 1)[0];

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
