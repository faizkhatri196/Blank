import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  role?: 'SERVICE_MANAGER' | 'TECHNICIAN';
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. No token provided.' },
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      companyId: string;
      role: 'SERVICE_MANAGER' | 'TECHNICIAN';
    };

    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found or account is deactivated.' },
      });
      return;
    }

    req.user = user;
    req.userId = user._id as mongoose.Types.ObjectId;
    req.companyId = user.companyId as mongoose.Types.ObjectId;
    req.role = user.role;

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Session expired or token is invalid. Please log in again.' },
    });
  }
}

export function requireManager(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.role !== 'SERVICE_MANAGER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Manager access privileges required.' },
    });
    return;
  }
  next();
}

export function requireTechnician(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.role !== 'TECHNICIAN') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Technician access privileges required.' },
    });
    return;
  }
  next();
}
