import { Router } from 'express';
import {
  getEvaluationCases,
  triggerEvaluationRun,
  getEvaluationRuns,
  getEvaluationSummary,
} from '../controllers/evaluationController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

// Strict Manager-Only routes
router.use(authenticate);
router.use(requireManager);

router.get('/cases', getEvaluationCases);
router.get('/runs', getEvaluationRuns);
router.post('/run', triggerEvaluationRun);
router.get('/summary', getEvaluationSummary);

export default router;
