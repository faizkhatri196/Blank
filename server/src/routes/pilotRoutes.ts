import { Router } from 'express';
import {
  getPilotMetrics,
  exportPilotCSV,
  exportPilotReportMarkdown,
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
router.get('/export.md', authenticate, requireManager, exportPilotReportMarkdown);
router.post('/feedback', authenticate, submitFeedback);

export default router;
