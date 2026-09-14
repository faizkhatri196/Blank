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

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'User with this email already exists' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      companyId: req.companyId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: 'TECHNICIAN',
      active: true,
    });

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

    const technician = await Technician.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { $set: parseResult.data },
      { new: true }
    );

    if (!technician) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technician not found' } });
      return;
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
