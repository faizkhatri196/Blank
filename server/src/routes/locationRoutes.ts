import { Router } from 'express';
import { searchLocations, reverseGeocode } from '../controllers/locationController';

const router = Router();

router.get('/search', searchLocations);
router.get('/reverse', reverseGeocode);

export default router;
