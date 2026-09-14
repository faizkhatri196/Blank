import { Router } from 'express';
import {
  getSolarSystems,
  createSolarSystem,
  getACUnits,
  createACUnit,
} from '../controllers/assetController';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Solar Assets
router.get('/solar-systems', requireManager, getSolarSystems);
router.post('/solar-systems', requireManager, createSolarSystem);

// AC Assets
router.get('/ac-units', requireManager, getACUnits);
router.post('/ac-units', requireManager, createACUnit);

export default router;
