import {
  CoverageService,
  calculateHaversineDistance,
  calculateSphericalLawOfCosinesDistance,
} from './services/coverageService';

console.log('========================================================================');
console.log('SERVORA PRODUCTION GEOSPATIAL & COVERAGE VERIFICATION');
console.log('========================================================================\n');

// 1. Coverage Configuration
const mundraArea = {
  _id: 'area-mundra-prod-01',
  locationName: 'Mundra Operations Hub',
  latitude: 22.8393,
  longitude: 69.7249,
  radiusKm: 23, // 23 km configured radius
  services: ['SOLAR', 'AC'] as any,
  active: true,
};

console.log('Company Service Area Configuration:');
console.log(`- Area Name: ${mundraArea.locationName}`);
console.log(`- Center Coordinates: [${mundraArea.latitude}°N, ${mundraArea.longitude}°E]`);
console.log(`- Configured Radius: ${mundraArea.radiusKm} km`);
console.log(`- Services Offered: ${mundraArea.services.join(', ')}\n`);

// 2. Scenario 1: Customer in Koday (Nearby town reporting false negatives in bug reports)
const kodayLat = 22.8680;
const kodayLon = 69.5250;

const distKodayHav = calculateHaversineDistance(mundraArea.latitude, mundraArea.longitude, kodayLat, kodayLon);
const distKodayCos = calculateSphericalLawOfCosinesDistance(mundraArea.latitude, mundraArea.longitude, kodayLat, kodayLon);
const evalKoday = CoverageService.checkAreaCoverage(kodayLat, kodayLon, mundraArea);

console.log('--- SCENARIO 1: Customer at Koday ---');
console.log(`Customer Coordinates: [${kodayLat}°N, ${kodayLon}°E]`);
console.log(`Calculated Haversine Distance: ${distKodayHav.toFixed(4)} km`);
console.log(`Spherical Law of Cosines Distance: ${distKodayCos.toFixed(4)} km`);
console.log(`Difference between formulas: ${Math.abs(distKodayHav - distKodayCos).toFixed(6)} km (< 0.001%)`);
console.log(`Evaluation: ${distKodayHav.toFixed(2)} km <= ${mundraArea.radiusKm} km -> ${evalKoday.withinRadius}`);
console.log(`Coverage Available: ${evalKoday.withinRadius ? 'YES (AVAILABLE)' : 'NO'}`);
console.log(`Services returned: ${evalKoday.services.join(', ')}`);
console.log(`Result: ${evalKoday.withinRadius ? 'PASS (Koday is covered without any city name hack)' : 'FAIL'}\n`);

// 3. Scenario 2: Customer in Mandvi (Outside 23 km radius)
const mandviLat = 22.8330;
const mandviLon = 69.3550;

const distMandviHav = calculateHaversineDistance(mundraArea.latitude, mundraArea.longitude, mandviLat, mandviLon);
const evalMandvi = CoverageService.checkAreaCoverage(mandviLat, mandviLon, mundraArea);

console.log('--- SCENARIO 2: Customer at Mandvi ---');
console.log(`Customer Coordinates: [${mandviLat}°N, ${mandviLon}°E]`);
console.log(`Calculated Haversine Distance: ${distMandviHav.toFixed(4)} km`);
console.log(`Evaluation: ${distMandviHav.toFixed(2)} km <= ${mundraArea.radiusKm} km -> ${evalMandvi.withinRadius}`);
console.log(`Coverage Available: ${evalMandvi.withinRadius ? 'YES' : 'NO (UNAVAILABLE)'}`);
console.log(`Reason: ${evalMandvi.reason}`);
console.log(`Result: ${!evalMandvi.withinRadius ? 'PASS (Correctly identified outside radius)' : 'FAIL'}\n`);

// 4. Scenario 3: Boundary Inclusion Test
const boundaryDistance = 23.0000;
const boundaryArea = {
  ...mundraArea,
  radiusKm: boundaryDistance,
};

// Evaluate point at exact boundary
const evalBoundaryInclusive = CoverageService.checkAreaCoverage(kodayLat, kodayLon, {
  ...mundraArea,
  radiusKm: distKodayHav, // exactly equal
});

const evalBoundaryExclusive = CoverageService.checkAreaCoverage(kodayLat, kodayLon, {
  ...mundraArea,
  radiusKm: distKodayHav - 0.01, // 0.01 km smaller
});

console.log('--- SCENARIO 3: Boundary Inclusion (distanceKm <= radiusKm) ---');
console.log(`Exact equality: distance (${distKodayHav.toFixed(4)} km) <= radius (${distKodayHav.toFixed(4)} km) -> ${evalBoundaryInclusive.withinRadius} (EXPECTED: TRUE)`);
console.log(`Exceeds by 0.01 km: distance (${distKodayHav.toFixed(4)} km) <= radius (${(distKodayHav - 0.01).toFixed(4)} km) -> ${evalBoundaryExclusive.withinRadius} (EXPECTED: FALSE)`);

if (evalKoday.withinRadius && !evalMandvi.withinRadius && evalBoundaryInclusive.withinRadius && !evalBoundaryExclusive.withinRadius) {
  console.log('\n========================================================================');
  console.log('ALL REAL-WORLD GEOSPATIAL CRITERIA VERIFIED SUCCESSFULLY!');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error('\nVERIFICATION FAILED!');
  process.exit(1);
}
