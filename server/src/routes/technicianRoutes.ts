import { Router } from 'express';
import {
  getTechnicians,
  getTechnicianById,
  createTechnician,
  updateTechnician,
  updateTechnicianStatus,
} from '../controllers/technicianController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTechnicians);
router.get('/:id', getTechnicianById);
router.post('/', requireManager, createTechnician);
router.patch('/:id', requireManager, updateTechnician);
router.patch('/:id/status', updateTechnicianStatus);

export default router;
