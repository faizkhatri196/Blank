import { Request, Response } from 'express';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';
import { isValidCoordinate } from '../services/location/geospatial';

export async function searchLocations(req: Request, res: Response): Promise<void> {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    if (!query || query.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const results = await NominatimLocationProvider.search(query);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'LOCATION_SEARCH_FAILED', message: error.message || 'Failed to search locations' },
    });
  }
}

export async function reverseGeocode(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (!isValidCoordinate(lat, lon)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid latitude (-90..90) and longitude (-180..180) are required' },
      });
      return;
    }

    const result = await NominatimLocationProvider.reverseGeocode(lat, lon);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'REVERSE_GEOCODE_FAILED', message: error.message || 'Failed to reverse geocode coordinates' },
    });
  }
}
