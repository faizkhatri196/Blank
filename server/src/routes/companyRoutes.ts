import { Router } from 'express';
import {
  getCompanyCoverage,
  updateCompanyCoverage,
  addServiceArea,
  deleteServiceArea,
} from '../controllers/companyController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/coverage', getCompanyCoverage);
router.put('/coverage', requireManager, updateCompanyCoverage);
router.post('/coverage/area', requireManager, addServiceArea);
router.delete('/coverage/area/:index', requireManager, deleteServiceArea);

export default router;
