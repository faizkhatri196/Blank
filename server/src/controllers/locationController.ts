import { Request, Response } from 'express';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';
import { GoogleMapsLocationProvider } from '../services/location/GoogleMapsProvider';
import { isValidCoordinate } from '../services/location/geospatial';
import { Company } from '../models/Company';

function getCustomApiKey(req: Request): string | undefined {
  const headerKey = req.headers['x-google-maps-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  const queryKey = req.query.apiKey || req.query.googleApiKey;
  if (typeof queryKey === 'string' && queryKey.trim()) {
    return queryKey.trim();
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    return req.body.apiKey.trim();
  }
  return undefined;
}

export async function searchLocations(req: Request, res: Response): Promise<void> {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const cityContext = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const customApiKey = getCustomApiKey(req);

    if (!query && !cityContext) {
      res.json({ success: true, data: [] });
      return;
    }

    // 1. Fetch provider search results: Try Google Maps if configured, fallback to Nominatim
    let results: any[] = [];
    if (GoogleMapsLocationProvider.isConfigured(customApiKey)) {
      results = await GoogleMapsLocationProvider.search(query, cityContext || undefined, customApiKey);
    }

    if (results.length === 0) {
      results = await NominatimLocationProvider.search(query, cityContext || undefined);
    }

    // 2. If cityContext provided, also fetch active company configured areas for this city from DB
    if (cityContext) {
      const companies = await Company.find({
        active: true,
        'serviceAreas.city': { $regex: new RegExp(`^${cityContext}$`, 'i') },
      });

      const dbAreaResults: any[] = [];
      const seenAreas = new Set<string>();

      for (const comp of companies) {
        for (const sa of comp.serviceAreas) {
          if (sa.city.toLowerCase() === cityContext.toLowerCase()) {
          if (!isValidCoordinate(sa.latitude, sa.longitude)) continue;
          for (const areaName of sa.areas || []) {
              const lower = areaName.toLowerCase();
              if (!seenAreas.has(lower) && (!query || lower.includes(query.toLowerCase()))) {
                seenAreas.add(lower);
                dbAreaResults.push({
                  city: sa.city,
                  state: sa.state || '',
                  country: sa.country || 'India',
                  locality: areaName,
                  area: areaName,
                  postalCode: (sa.pincodes && sa.pincodes[0]) || '',
                  latitude: sa.latitude,
                  longitude: sa.longitude,
                  formattedAddress: `${areaName}, ${sa.city}, ${sa.state || ''} ${(sa.pincodes && sa.pincodes[0]) || ''}, India`.trim(),
                  provider: 'company_coverage',
                });
              }
            }
          }
        }
      }

      // Merge DB company areas first, then external/known provider results
      const combined = [
        ...dbAreaResults,
        ...results.filter((r) => !seenAreas.has((r.locality || '').toLowerCase())),
      ];
      res.json({ success: true, data: combined });
      return;
    }

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
    const customApiKey = getCustomApiKey(req);

    if (!isValidCoordinate(lat, lon)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid latitude (-90..90) and longitude (-180..180) are required' },
      });
      return;
    }

    let result = null;
    if (GoogleMapsLocationProvider.isConfigured(customApiKey)) {
      result = await GoogleMapsLocationProvider.reverseGeocode(lat, lon, customApiKey);
    }

    if (!result) {
      result = await NominatimLocationProvider.reverseGeocode(lat, lon);
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'REVERSE_GEOCODE_FAILED', message: error.message || 'Failed to reverse geocode coordinates' },
    });
  }
}

export async function geolocate(req: Request, res: Response): Promise<void> {
  try {
    const customApiKey = getCustomApiKey(req);
    if (!GoogleMapsLocationProvider.isConfigured(customApiKey)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GOOGLE_MAPS_NOT_CONFIGURED',
          message: 'Google Maps API key is required for network-assisted live geolocation',
        },
      });
      return;
    }

    const location = await GoogleMapsLocationProvider.geolocate(customApiKey);
    if (!location) {
      res.status(502).json({
        success: false,
        error: {
          code: 'GEOLOCATION_FAILED',
          message: 'Failed to acquire location via Google Maps Geolocation API',
        },
      });
      return;
    }

    const reverse = await GoogleMapsLocationProvider.reverseGeocode(
      location.latitude,
      location.longitude,
      customApiKey
    );

    res.json({
      success: true,
      data: {
        ...location,
        address: reverse?.formattedAddress,
        city: reverse?.city,
        area: reverse?.locality,
        state: reverse?.state,
        pincode: reverse?.postalCode,
        provider: 'google_maps',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'GEOLOCATION_ERROR', message: error.message || 'Geolocation resolution error' },
    });
  }
}

export async function getLocationStatus(req: Request, res: Response): Promise<void> {
  try {
    const customApiKey = getCustomApiKey(req);
    const isGoogleConfigured = GoogleMapsLocationProvider.isConfigured(customApiKey);
    res.json({
      success: true,
      data: {
        activeProvider: isGoogleConfigured ? 'google_maps' : 'nominatim',
        googleMapsConfigured: isGoogleConfigured,
        fallbackProvider: 'nominatim',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}
