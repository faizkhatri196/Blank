import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
} from '../controllers/customerController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireManager, getCustomers);
router.get('/:id', requireManager, getCustomerById);
router.post('/', requireManager, createCustomer);
router.patch('/:id', requireManager, updateCustomer);

export default router;
