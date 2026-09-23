import { Router } from 'express';
import {
  searchLocations,
  reverseGeocode,
  geolocate,
  getLocationStatus,
} from '../controllers/locationController';

const router = Router();

router.get('/search', searchLocations);
router.get('/reverse', reverseGeocode);
router.post('/geolocate', geolocate);
router.get('/status', getLocationStatus);

export default router;

