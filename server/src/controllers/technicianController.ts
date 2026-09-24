import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { Technician } from '../models/Technician';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import {
  createTechnicianSchema,
  updateTechnicianSchema,
  updateTechnicianStatusSchema,
} from '../validators';
import { createGeoPoint, isValidCoordinate } from '../services/location/geospatial';

export async function getTechnicians(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { serviceType, availability, search } = req.query;
    const query: any = { companyId: req.companyId, active: true };

    // If technician role, only return self
    if (req.role === 'TECHNICIAN') {
      query.userId = req.userId;
    }

    if (serviceType && (serviceType === 'SOLAR' || serviceType === 'AC')) {
      query.serviceTypes = serviceType;
    }

    if (availability) {
      query.availability = availability;
    }

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } },
        { serviceAreas: { $regex: String(search), $options: 'i' } },
      ];
    }

    const technicians = await Technician.find(query).sort({ availability: 1, name: 1 });
    res.json({ success: true, data: technicians });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getTechnicianById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const technician = await Technician.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!technician) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Technician not found' },
      });
      return;
    }

    // If technician, allow only self profile
    if (req.role === 'TECHNICIAN' && !technician.userId.equals(req.userId!)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied. You can only view your own profile.' },
      });
      return;
    }

    res.json({ success: true, data: technician });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createTechnician(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createTechnicianSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const data = parseResult.data;

    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
      });
      return;
    }

    const rawPassword = (data.temporaryPassword || data.password)!;
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const user = await User.create({
      companyId: req.companyId,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      passwordHash,
      role: 'TECHNICIAN',
      active: true,
    });

    let baseLocation: any = data.baseLocation;
    if (
      baseLocation &&
      typeof baseLocation.latitude === 'number' &&
      typeof baseLocation.longitude === 'number'
    ) {
      const lat = baseLocation.latitude;
      const lon = baseLocation.longitude;
      if (isValidCoordinate(lat, lon)) {
        baseLocation = {
          ...baseLocation,
          center: createGeoPoint(lat, lon),
        };
      }
    }

    const technician = await Technician.create({
      userId: user._id,
      companyId: req.companyId,
      name: data.name,
      phone: data.phone,
      email: data.email.toLowerCase(),
      experienceYears: data.experienceYears,
      serviceTypes: data.serviceTypes,
      skills: data.skills,
      tools: data.tools,
      certifications: data.certifications,
      serviceAreas: data.serviceAreas,
      baseLocation,
      currentLocation:
        baseLocation && typeof baseLocation.latitude === 'number' && typeof baseLocation.longitude === 'number'
          ? {
              latitude: baseLocation.latitude,
              longitude: baseLocation.longitude,
              address: baseLocation.formattedAddress || baseLocation.city,
              timestamp: new Date(),
            }
          : undefined,
      coverageRadiusKm: data.coverageRadiusKm ?? 20,
      pincodes: data.pincodes ?? [],
      availability: data.availability,
      active: true,
    });

    await AuditLog.create({
      companyId: req.companyId,
      actorId: req.userId,
      actorRole: req.role,
      action: 'CREATE_TECHNICIAN',
      entityType: 'Technician',
      entityId: technician._id.toString(),
      newState: { name: technician.name, serviceTypes: technician.serviceTypes },
    });

    res.status(201).json({ success: true, data: technician });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateTechnician(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = updateTechnicianSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const existingTech = await Technician.findById(req.params.id);
    if (!existingTech) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technician not found' } });
      return;
    }

    if (!req.companyId || !existingTech.companyId.equals(req.companyId)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cross-tenant technician access denied' } });
      return;
    }

    const updateData: any = { ...parseResult.data };
    if (
      updateData.baseLocation &&
      typeof updateData.baseLocation.latitude === 'number' &&
      typeof updateData.baseLocation.longitude === 'number'
    ) {
      const lat = updateData.baseLocation.latitude;
      const lon = updateData.baseLocation.longitude;
      if (isValidCoordinate(lat, lon)) {
        updateData.baseLocation.center = createGeoPoint(lat, lon);
      }
    }

    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    // If name or phone changed, sync with linked User account
    if (technician && (updateData.name || updateData.phone)) {
      await User.findByIdAndUpdate(technician.userId, {
        $set: {
          ...(updateData.name ? { name: updateData.name } : {}),
          ...(updateData.phone ? { phone: updateData.phone } : {}),
        },
      });
    }

    res.json({ success: true, data: technician });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateTechnicianStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = updateTechnicianStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    let technician;
    if (req.role === 'TECHNICIAN') {
      // Technicians update their own status
      technician = await Technician.findOneAndUpdate(
        { userId: req.userId, companyId: req.companyId },
        { $set: { availability: parseResult.data.availability } },
        { new: true }
      );
    } else {
      // Manager can update status for specific technician id
      technician = await Technician.findOneAndUpdate(
        { _id: req.params.id, companyId: req.companyId },
        { $set: { availability: parseResult.data.availability } },
        { new: true }
      );
    }

    if (!technician) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technician profile not found' } });
      return;
    }

    res.json({ success: true, data: technician });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateTechnicianLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { latitude, longitude, address, accuracy, ticketId } = req.body;

    let technician;
    if (req.role === 'TECHNICIAN') {
      const myTech = await Technician.findOne({ userId: req.userId, companyId: req.companyId });
      if (!myTech) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technician profile not found' } });
        return;
      }
      // If updating via /:id and id does not match self, reject with 403
      if (req.params.id && req.params.id !== 'me' && req.params.id !== myTech._id.toString()) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Technicians can only update their own location' } });
        return;
      }
      technician = myTech;
    } else if (req.role === 'SERVICE_MANAGER' && req.params.id) {
      technician = await Technician.findOne({ _id: req.params.id, companyId: req.companyId });
    } else {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to update technician location' } });
      return;
    }

    if (!technician) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technician profile not found' } });
      return;
    }

    technician.currentLocation = {
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
      address: typeof address === 'string' ? address.trim() : undefined,
      accuracy: typeof accuracy === 'number' ? accuracy : undefined,
      timestamp: new Date(),
      lastActiveTicketId: ticketId ? ticketId : technician.currentLocation?.lastActiveTicketId,
    };

    await technician.save();

    res.json({
      success: true,
      data: {
        technicianId: technician._id,
        currentLocation: technician.currentLocation,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
