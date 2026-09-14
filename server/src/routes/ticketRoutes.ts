import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  analyzeTicket,
  reviewAIAnalysis,
  getRecommendedTechnicians,
  assignTechnician,
} from '../controllers/ticketController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTickets);
router.post('/', requireManager, createTicket);
router.get('/:id', getTicketById);
router.patch('/:id/status', updateTicketStatus);

// AI Diagnostic analysis & review
router.post('/:id/analyze', requireManager, analyzeTicket);
router.post('/:id/review', requireManager, reviewAIAnalysis);

// Matching & Assignment
router.get('/:id/recommended-technicians', requireManager, getRecommendedTechnicians);
router.post('/:id/assign', requireManager, assignTechnician);

export default router;
