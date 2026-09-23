import { Request, Response } from 'express';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';
import { isValidApplicationCoordinate } from '../services/location/geospatial';

import { Company } from '../models/Company';

export async function searchLocations(req: Request, res: Response): Promise<void> {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const cityContext = typeof req.query.city === 'string' ? req.query.city.trim() : '';

    if (!query && !cityContext) {
      res.json({ success: true, data: [] });
      return;
    }

    // 1. Fetch provider search results
    const results = await NominatimLocationProvider.search(query, cityContext || undefined);

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
            for (const areaName of sa.areas || []) {
              const lower = areaName.toLowerCase();
              if (!seenAreas.has(lower) && (!query || lower.includes(query.toLowerCase()))) {
                seenAreas.add(lower);

                // Only include area coordinates if they are real and valid (never 0,0)
                const hasValidCoords = isValidApplicationCoordinate(sa.latitude, sa.longitude);

                dbAreaResults.push({
                  city: sa.city,
                  state: sa.state || '',
                  country: sa.country || 'India',
                  locality: areaName,
                  area: areaName,
                  postalCode: (sa.pincodes && sa.pincodes[0]) || '',
                  // Only attach coordinates if they are real geocoded values
                  latitude: hasValidCoords ? sa.latitude : undefined,
                  longitude: hasValidCoords ? sa.longitude : undefined,
                  formattedAddress: `${areaName}, ${sa.city}, ${sa.state || ''} ${(sa.pincodes && sa.pincodes[0]) || ''}, India`.trim(),
                  provider: 'company_coverage',
                  geocodingStatus: hasValidCoords ? 'VERIFIED' : 'MISSING',
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

    if (!isValidApplicationCoordinate(lat, lon)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid latitude (-90..90) and longitude (-180..180) are required. (0,0) is not a valid location.' },
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
