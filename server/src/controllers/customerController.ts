import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Customer } from '../models/Customer';
import { SolarSystem } from '../models/SolarSystem';
import { ACUnit } from '../models/ACUnit';
import { ServiceHistory } from '../models/ServiceHistory';
import { createCustomerSchema } from '../validators';

export async function getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, city } = req.query;
    const query: any = { companyId: req.companyId };

    if (city) {
      query.city = { $regex: String(city), $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { address: { $regex: String(search), $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!customer) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
      return;
    }

    const [solarSystems, acUnits, history] = await Promise.all([
      SolarSystem.find({ customerId: customer._id, companyId: req.companyId }),
      ACUnit.find({ customerId: customer._id, companyId: req.companyId }),
      ServiceHistory.find({ customerId: customer._id, companyId: req.companyId }).sort({ completedAt: -1 }),
    ]);

    res.json({
      success: true,
      data: {
        customer,
        solarSystems,
        acUnits,
        history,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message },
      });
      return;
    }

    const customer = await Customer.create({
      ...parseResult.data,
      companyId: req.companyId,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { $set: req.body },
      { new: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
