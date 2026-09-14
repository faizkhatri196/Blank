import { Router } from 'express';
import { submitServiceReport, getServiceReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/:ticketId', submitServiceReport);
router.get('/:ticketId', getServiceReport);

export default router;
