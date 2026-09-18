import { Router } from 'express';
import { getActiveFieldOperations } from '../controllers/fieldOperationsController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireManager);

router.get('/active', getActiveFieldOperations);

export default router;
