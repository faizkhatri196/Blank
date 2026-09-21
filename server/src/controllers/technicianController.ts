import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { Technician } from '../models/Technician';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { AuditLog } from '../models/AuditLog';
import {
  createTechnicianSchema,
  updateTechnicianSchema,
  updateTechnicianStatusSchema,
} from '../validators';
import { createGeoPoint, isValidCoordinate } from '../services/location/geospatial';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';

/**
 * Auto-resolves technician baseLocation and center coordinates.
 * Inherits from matching company service area or geocodes via Nominatim.
 */
async function resolveTechnicianBaseLocation(
  baseLocationInput: any,
  serviceAreasInput?: string[],
  companyId?: string
) {
  let baseLocation = baseLocationInput ? { ...baseLocationInput } : undefined;
  const lat = baseLocation?.latitude;
  const lon = baseLocation?.longitude;

  // If already valid coordinates, build GeoPoint
  if (isValidCoordinate(lat, lon)) {
    baseLocation.center = createGeoPoint(lat, lon);
    return baseLocation;
  }

  // Look for search query from base address, city, or first service area
  const query = (
    baseLocation?.formattedAddress ||
    baseLocation?.city ||
    (serviceAreasInput && serviceAreasInput[0]) ||
    ''
  ).trim();

  if (!query) {
    return baseLocation;
  }

  // 1. Check company's existing service areas first
  if (companyId) {
    try {
      const company = await Company.findById(companyId);
      if (company && company.serviceAreas && company.serviceAreas.length > 0) {
        const match = company.serviceAreas.find((sa: any) => {
          const name = (sa.locationName || sa.city || sa.formattedAddress || '').toLowerCase();
          return name.includes(query.toLowerCase()) || query.toLowerCase().includes(name);
        });

        const saLat = match?.latitude ?? match?.center?.coordinates?.[1];
        const saLon = match?.longitude ?? match?.center?.coordinates?.[0];

        if (isValidCoordinate(saLat, saLon)) {
          return {
            formattedAddress: match?.formattedAddress || match?.locationName || query,
            city: match?.city || query,
            state: match?.state || '',
            country: match?.country || 'India',
            postalCode: match?.postalCode || '',
            latitude: saLat,
            longitude: saLon,
            center: createGeoPoint(saLat!, saLon!),
          };
        }
      }
    } catch (cErr) {
      console.warn('[Technician] Error looking up company service areas:', cErr);
    }
  }

  // 2. Geocode via Nominatim
  try {
    const geo = await NominatimLocationProvider.search(query);
    if (geo && geo.length > 0 && isValidCoordinate(geo[0].latitude, geo[0].longitude)) {
      const top = geo[0];
      return {
        formattedAddress: top.formattedAddress || query,
        city: top.city || query,
        state: top.state || '',
        country: 'India',
        postalCode: top.postalCode || '',
        latitude: top.latitude,
        longitude: top.longitude,
        center: createGeoPoint(top.latitude, top.longitude),
      };
    }
  } catch (err) {
    console.warn('[Technician] Could not auto-resolve coordinates:', err);
  }

  if (baseLocation && !isValidCoordinate(baseLocation.latitude, baseLocation.longitude)) {
    delete baseLocation.center;
    baseLocation.latitude = undefined;
    baseLocation.longitude = undefined;
  }

  return baseLocation;
}

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

    // Auto-resolve baseLocation and coordinates from company area or city
    const resolvedBaseLocation = await resolveTechnicianBaseLocation(
      data.baseLocation,
      data.serviceAreas,
      req.companyId ? req.companyId.toString() : undefined
    );

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
      baseLocation: resolvedBaseLocation,
      coverageRadiusKm: data.coverageRadiusKm ?? 25,
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

    if (updateData.baseLocation || updateData.serviceAreas) {
      updateData.baseLocation = await resolveTechnicianBaseLocation(
        updateData.baseLocation || existingTech.baseLocation,
        updateData.serviceAreas || existingTech.serviceAreas,
        req.companyId.toString()
      );
    }

    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    // If name, phone, or email changed, sync with linked User account
    if (technician && (updateData.name || updateData.phone || updateData.email)) {
      await User.findByIdAndUpdate(technician.userId, {
        $set: {
          ...(updateData.name ? { name: updateData.name } : {}),
          ...(updateData.phone ? { phone: updateData.phone } : {}),
          ...(updateData.email ? { email: updateData.email.toLowerCase() } : {}),
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
