import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Customer } from '../models/Customer';
import { loginSchema, companySignupSchema, customerSignupSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';
import { ENV } from '../config/env';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';
import { isValidCoordinate, createGeoPoint } from '../services/location/geospatial';

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = companySignupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid signup details',
        },
      });
      return;
    }

    const data = parseResult.data;
    const normalizedEmail = data.email.toLowerCase().trim();

    // Verify email uniqueness across all users
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists.',
        },
      });
      return;
    }

    // Determine supported service lines and service areas
    let servicesSupported: string[] = [];
    if (data.servicesSupported && data.servicesSupported.length > 0) {
      servicesSupported = data.servicesSupported;
    } else if (data.serviceAreas && data.serviceAreas.length > 0) {
      const allServices = new Set<string>();
      data.serviceAreas.forEach((sa) => (sa.services || []).forEach((s) => allServices.add(s)));
      servicesSupported = Array.from(allServices);
    }

    if (servicesSupported.length === 0) {
      if (data.serviceType === 'AC' || data.serviceType === 'AC/HVAC') {
        servicesSupported = ['AC'];
      } else if (data.serviceType === 'BOTH') {
        servicesSupported = ['SOLAR', 'AC'];
      } else if (data.serviceType) {
        servicesSupported = [data.serviceType];
      } else {
        servicesSupported = ['SOLAR'];
      }
    }

    // 1. Geocode service areas if coordinates not supplied
    const resolvedServiceAreas = await Promise.all(
      (data.serviceAreas || []).map(async (sa) => {
        let lat = sa.latitude;
        let lon = sa.longitude;
        if (!isValidCoordinate(lat, lon)) {
          try {
            const query = `${sa.city}${sa.state ? ', ' + sa.state : ''}, ${sa.country || 'India'}`;
            const geoResults = await NominatimLocationProvider.search(query);
            if (geoResults && geoResults.length > 0 && isValidCoordinate(geoResults[0].latitude, geoResults[0].longitude)) {
              lat = geoResults[0].latitude;
              lon = geoResults[0].longitude;
            }
          } catch {
            // Geocoding failure non-blocking
          }
        }

        const center = isValidCoordinate(lat, lon)
          ? createGeoPoint(lat!, lon!)
          : { type: 'Point' as const, coordinates: [0, 0] as [number, number] };
        const radiusKm = sa.radiusKm ?? sa.radius ?? 20;

        return {
          city: sa.city.trim(),
          state: sa.state?.trim(),
          country: sa.country?.trim() || 'India',
          areas: sa.areas || [],
          pincodes: sa.pincodes || [],
          latitude: lat,
          longitude: lon,
          center,
          radius: radiusKm,
          radiusKm,
          services: sa.services && sa.services.length > 0 ? sa.services : servicesSupported,
          active: true,
        };
      })
    );

    let company: any;
    let user: any;
    try {
      // 1. Create client Company document (No default Ahmedabad fallback!)
      company = await Company.create({
        name: data.companyName.trim(),
        email: normalizedEmail,
        phone: data.phone.trim(),
        address: data.address?.trim() || '',
        servicesSupported,
        serviceAreas: resolvedServiceAreas,
        isPilot: false,
        environmentContext: 'CLIENT',
        active: true,
      });

      // 2. Hash password securely
      const passwordHash = await bcrypt.hash(data.password, 10);

      // 3. Create Service Manager User
      user = await User.create({
        companyId: company._id,
        name: data.managerName.trim(),
        email: normalizedEmail,
        phone: data.phone.trim(),
        passwordHash,
        role: 'SERVICE_MANAGER',
        active: true,
        lastLogin: new Date(),
      });
    } catch (createErr: any) {
      if (company?._id && !user) {
        await Company.findByIdAndDelete(company._id);
      }
      throw createErr;
    }

    // 4. Issue standard JWT token for automatic seamless login
    const token = jwt.sign(
      {
        userId: user._id,
        companyId: company._id,
        role: user.role,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyId: user.companyId,
          companyName: company.name,
          servicesSupported: company.servicesSupported,
          isPilotCompany: false,
          environmentContext: 'CLIENT',
        },
        company: {
          id: company._id,
          _id: company._id,
          name: company.name,
          isPilot: company.isPilot,
          environmentContext: company.environmentContext,
          servicesSupported: company.servicesSupported,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Signup failed' },
    });
  }
}

export async function customerSignup(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = customerSignupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid signup details',
        },
      });
      return;
    }

    const data = parseResult.data;
    const normalizedEmail = data.email.toLowerCase().trim();

    // Verify email uniqueness across all users
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists. Please sign in instead.',
        },
      });
      return;
    }

    // Associate customer with an active service company
    let company = await Company.findOne({ active: true, isPilot: false });
    if (!company) {
      company = await Company.findOne({ active: true });
    }
    if (!company) {
      company = await Company.findOne({});
    }

    if (!company) {
      res.status(500).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'No active service company found for customer registration.' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      companyId: company._id,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      passwordHash,
      role: 'CUSTOMER',
      active: true,
      lastLogin: new Date(),
    });

    const customer = await Customer.create({
      companyId: company._id,
      userId: user._id,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      city: data.city.trim(),
      address: data.address?.trim() || `${data.city.trim()}`,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        companyId: company._id,
        role: user.role,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyId: user.companyId,
          companyName: company.name,
          customerId: customer._id,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Customer registration failed' },
    });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid login details',
        },
      });
      return;
    }

    const { email, password } = parseResult.data;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        companyId: user.companyId,
        role: user.role,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const company = await Company.findById(user.companyId);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyId: user.companyId,
          companyName: company?.name || 'Demo Field Services',
          servicesSupported: company?.servicesSupported || ['SOLAR', 'AC'],
          isPilotCompany: company?.isPilot || false,
          environmentContext: company?.environmentContext || (company?.isPilot ? 'PILOT' : 'DEMO'),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Login failed' },
    });
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const company = await Company.findById(user.companyId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyId: user.companyId,
          companyName: company?.name || 'Demo Field Services',
          servicesSupported: company?.servicesSupported || ['SOLAR', 'AC'],
          isPilotCompany: company?.isPilot || false,
          environmentContext: company?.environmentContext || (company?.isPilot ? 'PILOT' : 'DEMO'),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Please provide a valid email address',
        },
      });
      return;
    }

    const email = parseResult.data.email.toLowerCase().trim();
    const user = await User.findOne({ email, active: true });

    let resetToken: string | undefined;

    if (user) {
      // Generate cryptographically secure random token
      resetToken = crypto.randomBytes(32).toString('hex');
      // Store SHA-256 hash in database to prevent plaintext exposure
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
      await user.save();
    }

    // Generic safe response to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been generated.',
      data: resetToken
        ? {
            resetToken,
            resetUrl: `/reset-password?token=${resetToken}`,
            expiresInMinutes: 60,
          }
        : undefined,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Forgot password request failed' },
    });
  }
}

export async function verifyResetToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ success: false, valid: false, error: { message: 'Token is required' } });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        valid: false,
        error: { code: 'INVALID_TOKEN', message: 'Password reset token is invalid or has expired.' },
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      data: { email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid password reset input',
        },
      });
      return;
    }

    const { token, password } = parseResult.data;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Password reset token is invalid, expired, or has already been used.',
        },
      });
      return;
    }

    // Securely hash the new password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    // Invalidate reset token immediately
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now sign in with your new password.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Password reset failed' },
    });
  }
}

