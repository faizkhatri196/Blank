import { Router } from 'express';
import {
  getPilotMetrics,
  exportPilotCSV,
  submitFeedback,
  getSystemHealth,
} from '../controllers/pilotController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

// Health check is public
router.get('/health', getSystemHealth);

// Protected pilot endpoints
router.get('/metrics', authenticate, requireManager, getPilotMetrics);
router.get('/export.csv', authenticate, requireManager, exportPilotCSV);
router.post('/feedback', authenticate, submitFeedback);

export default router;
