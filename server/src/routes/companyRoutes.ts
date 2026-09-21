import { Router } from 'express';
import {
  getCompanyCoverage,
  updateCompanyCoverage,
  addServiceArea,
  updateSingleServiceArea,
  deleteServiceArea,
  diagnoseCoverage,
  validateTechnicianCoverageEndpoint,
} from '../controllers/companyController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Coverage management endpoints
router.get('/coverage', getCompanyCoverage);
router.put('/coverage', requireManager, updateCompanyCoverage);
router.post('/coverage/area', requireManager, addServiceArea);
router.patch('/coverage/area/:indexOrId', requireManager, updateSingleServiceArea);
router.put('/coverage/area/:indexOrId', requireManager, updateSingleServiceArea);
router.delete('/coverage/area/:index', requireManager, deleteServiceArea);

// Aliases for /service-areas
router.get('/service-areas', getCompanyCoverage);
router.put('/service-areas', requireManager, updateCompanyCoverage);
router.post('/service-areas', requireManager, addServiceArea);
router.patch('/service-areas/:indexOrId', requireManager, updateSingleServiceArea);
router.put('/service-areas/:indexOrId', requireManager, updateSingleServiceArea);
router.delete('/service-areas/:index', requireManager, deleteServiceArea);

// Coverage Diagnostic Endpoint
router.post('/coverage/diagnose', requireManager, diagnoseCoverage);
router.post('/coverage/validate-technician', requireManager, validateTechnicianCoverageEndpoint);

export default router;
