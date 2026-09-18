import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { loginSchema, companySignupSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';
import { ENV } from '../config/env';

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

    // 1. Create client Company document (No default Ahmedabad fallback!)
    const company = await Company.create({
      name: data.companyName.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      address: data.address?.trim() || '',
      servicesSupported,
      serviceAreas: (data.serviceAreas || []).map((sa) => ({
        city: sa.city.trim(),
        state: sa.state?.trim(),
        country: sa.country?.trim() || 'India',
        areas: sa.areas || [],
        pincodes: sa.pincodes || [],
        latitude: sa.latitude,
        longitude: sa.longitude,
        radius: sa.radius,
        services: sa.services || servicesSupported,
      })),
      isPilot: false,
      environmentContext: 'CLIENT',
      active: true,
    });

    // 2. Hash password securely
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 3. Create Service Manager User
    const user = await User.create({
      companyId: company._id,
      name: data.managerName.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      passwordHash,
      role: 'SERVICE_MANAGER',
      active: true,
      lastLogin: new Date(),
    });

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

