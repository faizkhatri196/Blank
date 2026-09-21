import '../config/env';
import { connectDB, disconnectDB } from '../config/db';
import { Company } from '../models/Company';
import { Technician } from '../models/Technician';
import { isValidCoordinate, detectCoordinateOrderIssue } from '../services/location/geospatial';
import { NominatimLocationProvider } from '../services/location/NominatimProvider';

export interface GeospatialAuditItem {
  recordId: string;
  type: 'COMPANY_SERVICE_AREA' | 'TECHNICIAN_BASE_LOCATION';
  owner: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  storedCoordinates: [number, number] | null;
  problem: string;
  fixable: boolean;
  proposedFix?: {
    latitude: number;
    longitude: number;
    geoJSONCoordinates: [number, number]; // [longitude, latitude]
  };
}

export async function runGeospatialAudit(shouldFix: boolean = false): Promise<GeospatialAuditItem[]> {
  console.log('================================================================');
  console.log('           SERVORA GEOSPATIAL AUDIT & MIGRATION TOOL            ');
  console.log('================================================================');
  console.log(`Execution Mode: ${shouldFix ? 'LIVE MIGRATION (--fix)' : 'DRY-RUN AUDIT ONLY'}`);

  await connectDB();

  const auditItems: GeospatialAuditItem[] = [];

  // 1. Audit Company Service Areas
  const companies = await Company.find({});
  for (const company of companies) {
    const companyIdStr = company._id.toString();
    const companyName = company.name;
    const areas = company.serviceAreas || [];

    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      const areaIdStr = area._id ? area._id.toString() : `${companyIdStr}-area-${i}`;
      const areaName = area.locationName || area.city || 'Service Area';
      const lat = area.latitude ?? null;
      const lon = area.longitude ?? null;
      const coords = area.center?.coordinates as [number, number] | undefined;

      const issue = detectCoordinateOrderIssue(coords, lat ?? undefined, lon ?? undefined);
      const isNullIsland = coords && Math.abs(coords[0]) < 0.0001 && Math.abs(coords[1]) < 0.0001;
      const missingCoords = !isValidCoordinate(lat ?? undefined, lon ?? undefined) && (!coords || isNullIsland);

      if (issue || isNullIsland || missingCoords) {
        let problemDescription = issue || (isNullIsland ? 'Uninitialized (0, 0) Null Island coordinates' : 'Missing coordinates');
        let proposedFix: GeospatialAuditItem['proposedFix'] = undefined;

        if (issue && coords && coords.length >= 2) {
          // Check if inverted [lat, lon]
          if (coords[0] >= 6 && coords[0] <= 38 && coords[1] >= 68 && coords[1] <= 98) {
            proposedFix = {
              latitude: coords[0],
              longitude: coords[1],
              geoJSONCoordinates: [coords[1], coords[0]],
            };
          }
        }

        auditItems.push({
          recordId: areaIdStr,
          type: 'COMPANY_SERVICE_AREA',
          owner: `${companyName} (${companyIdStr})`,
          name: areaName,
          latitude: lat,
          longitude: lon,
          storedCoordinates: coords || null,
          problem: problemDescription,
          fixable: Boolean(proposedFix),
          proposedFix,
        });

        if (shouldFix && proposedFix) {
          area.latitude = proposedFix.latitude;
          area.longitude = proposedFix.longitude;
          area.center = {
            type: 'Point',
            coordinates: proposedFix.geoJSONCoordinates,
          };
          await company.save();
          console.log(`[FIXED] Company Service Area: ${areaName} updated to [lon=${proposedFix.geoJSONCoordinates[0]}, lat=${proposedFix.geoJSONCoordinates[1]}]`);
        }
      }
    }
  }

  // 2. Audit Technician Base Locations
  const technicians = await Technician.find({});
  for (const tech of technicians) {
    const techIdStr = tech._id.toString();
    const techName = tech.name;
    const baseLoc = tech.baseLocation;
    const lat = baseLoc?.latitude ?? null;
    const lon = baseLoc?.longitude ?? null;
    const coords = baseLoc?.center?.coordinates as [number, number] | undefined;

    const issue = detectCoordinateOrderIssue(coords, lat ?? undefined, lon ?? undefined);
    const isNullIsland = coords && Math.abs(coords[0]) < 0.0001 && Math.abs(coords[1]) < 0.0001;
    const missingCoords = !isValidCoordinate(lat ?? undefined, lon ?? undefined) && (!coords || isNullIsland);

    if (issue || isNullIsland || missingCoords) {
      let problemDescription = issue || (isNullIsland ? 'Uninitialized (0, 0) Null Island coordinates' : 'Missing coordinates');
      let proposedFix: GeospatialAuditItem['proposedFix'] = undefined;

      if (issue && coords && coords.length >= 2) {
        // Inverted [lat, lon]
        if (coords[0] >= 6 && coords[0] <= 38 && coords[1] >= 68 && coords[1] <= 98) {
          proposedFix = {
            latitude: coords[0],
            longitude: coords[1],
            geoJSONCoordinates: [coords[1], coords[0]],
          };
        }
      }

      // If Null Island or missing, try resolving from technician service areas or city
      if (!proposedFix && (isNullIsland || missingCoords)) {
        const query = (baseLoc?.city || (tech.serviceAreas && tech.serviceAreas[0]) || '').trim();
        if (query) {
          // Check if parent company has matching service area
          const comp = await Company.findById(tech.companyId);
          const matchArea = comp?.serviceAreas?.find((sa: any) => {
            const name = (sa.locationName || sa.city || sa.formattedAddress || '').toLowerCase();
            return name.includes(query.toLowerCase()) || query.toLowerCase().includes(name);
          });

          if (matchArea && isValidCoordinate(matchArea.latitude, matchArea.longitude)) {
            proposedFix = {
              latitude: matchArea.latitude!,
              longitude: matchArea.longitude!,
              geoJSONCoordinates: [matchArea.longitude!, matchArea.latitude!],
            };
          } else {
            // Geocode via Nominatim
            try {
              const geoResults = await NominatimLocationProvider.search(query);
              if (geoResults && geoResults.length > 0 && isValidCoordinate(geoResults[0].latitude, geoResults[0].longitude)) {
                proposedFix = {
                  latitude: geoResults[0].latitude,
                  longitude: geoResults[0].longitude,
                  geoJSONCoordinates: [geoResults[0].longitude, geoResults[0].latitude],
                };
              }
            } catch (err) {
              // Ignore geocode error during audit
            }
          }
        }
      }

      auditItems.push({
        recordId: techIdStr,
        type: 'TECHNICIAN_BASE_LOCATION',
        owner: techName,
        name: baseLoc?.city || baseLoc?.formattedAddress || 'Base Location',
        latitude: lat,
        longitude: lon,
        storedCoordinates: coords || null,
        problem: problemDescription,
        fixable: Boolean(proposedFix),
        proposedFix,
      });

      if (shouldFix && proposedFix) {
        if (!tech.baseLocation) {
          tech.baseLocation = {};
        }
        tech.baseLocation.latitude = proposedFix.latitude;
        tech.baseLocation.longitude = proposedFix.longitude;
        tech.baseLocation.center = {
          type: 'Point',
          coordinates: proposedFix.geoJSONCoordinates,
        };
        await tech.save();
        console.log(`[FIXED] Technician ${techName} base location updated to [lon=${proposedFix.geoJSONCoordinates[0]}, lat=${proposedFix.geoJSONCoordinates[1]}]`);
      }
    }
  }

  // 3. Print Diagnostic Table
  console.log('\n--- AUDIT RESULTS ---');
  if (auditItems.length === 0) {
    console.log('✅ All company service areas and technician base locations have valid GeoJSON [longitude, latitude] coordinates.');
  } else {
    console.log(`Found ${auditItems.length} records with potential geospatial anomalies:`);
    console.table(
      auditItems.map((item) => ({
        'Record ID': item.recordId,
        Type: item.type,
        Owner: item.owner,
        'Stored [c0, c1]': item.storedCoordinates ? `[${item.storedCoordinates.join(', ')}]` : 'None',
        'Lat, Lon': item.latitude !== null && item.longitude !== null ? `${item.latitude}, ${item.longitude}` : 'None',
        Problem: item.problem,
        Fixable: item.fixable ? 'YES' : 'NO',
      }))
    );
  }

  return auditItems;
}

// If run directly from CLI
if (require.main === module) {
  const shouldFix = process.argv.includes('--fix');
  runGeospatialAudit(shouldFix)
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Audit script failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}
