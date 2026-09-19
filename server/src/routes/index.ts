import { Router } from 'express';
import authRoutes from './authRoutes';
import technicianRoutes from './technicianRoutes';
import customerRoutes from './customerRoutes';
import assetRoutes from './assetRoutes';
import ticketRoutes from './ticketRoutes';
import reportRoutes from './reportRoutes';
import pilotRoutes from './pilotRoutes';
import uploadRoutes from './uploadRoutes';
import evaluationRoutes from './evaluationRoutes';
import customerPortalRoutes from './customerPortalRoutes';
import companyRoutes from './companyRoutes';
import fieldOperationsRoutes from './fieldOperationsRoutes';
import notificationRoutes from './notificationRoutes';
import { getSystemHealth } from '../controllers/pilotController';

const router = Router();

// Public health check directly at /api/health
router.get('/health', getSystemHealth);

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/field-operations', fieldOperationsRoutes);
router.use('/technicians', technicianRoutes);
router.use('/customers', customerRoutes);
router.use('/assets', assetRoutes);
router.use('/tickets', ticketRoutes);
router.use('/service-reports', reportRoutes);
router.use('/pilot', pilotRoutes);
router.use('/uploads', uploadRoutes);
router.use('/evaluation', evaluationRoutes);
router.use('/customer-portal', customerPortalRoutes);
router.use('/notifications', notificationRoutes);

export default router;
