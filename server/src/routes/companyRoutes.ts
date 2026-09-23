import { Router } from 'express';
import {
  getCompanyCoverage,
  updateCompanyCoverage,
  addServiceArea,
  updateSingleServiceArea,
  deleteServiceArea,
} from '../controllers/companyController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/coverage', getCompanyCoverage);
router.put('/coverage', requireManager, updateCompanyCoverage);
router.post('/coverage/area', requireManager, addServiceArea);
router.patch('/coverage/area/:indexOrId', requireManager, updateSingleServiceArea);
router.put('/coverage/area/:indexOrId', requireManager, updateSingleServiceArea);
router.delete('/coverage/area/:index', requireManager, deleteServiceArea);

export default router;
