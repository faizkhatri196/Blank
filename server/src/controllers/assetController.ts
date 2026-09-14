import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SolarSystem } from '../models/SolarSystem';
import { ACUnit } from '../models/ACUnit';
import { createSolarSystemSchema, createACUnitSchema } from '../validators';

export async function getSolarSystems(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { customerId } = req.query;
    const query: any = { companyId: req.companyId };
    if (customerId) query.customerId = customerId;

    const systems = await SolarSystem.find(query).populate('customerId', 'name phone address city');
    res.json({ success: true, data: systems });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createSolarSystem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createSolarSystemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const system = await SolarSystem.create({
      ...parseResult.data,
      companyId: req.companyId,
    });

    res.status(201).json({ success: true, data: system });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getACUnits(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { customerId } = req.query;
    const query: any = { companyId: req.companyId };
    if (customerId) query.customerId = customerId;

    const units = await ACUnit.find(query).populate('customerId', 'name phone address city');
    res.json({ success: true, data: units });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createACUnit(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createACUnitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const unit = await ACUnit.create({
      ...parseResult.data,
      companyId: req.companyId,
    });

    res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
