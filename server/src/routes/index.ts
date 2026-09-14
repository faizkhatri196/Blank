import { Router } from 'express';
import authRoutes from './authRoutes';
import technicianRoutes from './technicianRoutes';
import customerRoutes from './customerRoutes';
import assetRoutes from './assetRoutes';
import ticketRoutes from './ticketRoutes';
import reportRoutes from './reportRoutes';
import pilotRoutes from './pilotRoutes';
import uploadRoutes from './uploadRoutes';
import { getSystemHealth } from '../controllers/pilotController';

const router = Router();

// Public health check directly at /api/health
router.get('/health', getSystemHealth);

router.use('/auth', authRoutes);
router.use('/technicians', technicianRoutes);
router.use('/customers', customerRoutes);
router.use('/assets', assetRoutes);
router.use('/tickets', ticketRoutes);
router.use('/service-reports', reportRoutes);
router.use('/pilot', pilotRoutes);
router.use('/uploads', uploadRoutes);

export default router;
