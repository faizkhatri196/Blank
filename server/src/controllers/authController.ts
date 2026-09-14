import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { loginSchema } from '../validators';
import { ENV } from '../config/env';

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
