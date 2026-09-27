/**
 * PRODUCTION GPS & LOCATION ENGINE (SERVORA)
 *
 * Requirements:
 * 1. Request permission only when explicitly triggered by user ("Use my current location").
 * 2. 2-Stage Retry Strategy:
 *    - Stage 1: enableHighAccuracy = true (7000ms timeout)
 *    - Stage 2: enableHighAccuracy = false (7000ms timeout) if Stage 1 times out / unavailable
 * 3. Never freeze the UI. Never loop forever.
 * 4. Never invent fake or default locations (zero Ahmedabad/Rajkot/etc. fallbacks).
 * 5. Strict coordinate validation (reject null island [0,0] and out-of-range).
 * 6. Reverse geocode via server endpoint first with fallback.
 * 7. Race condition protection: Discard old autocomplete results if a fresh GPS result arrives.
 * 8. Never invent a postcode: strictly use provider's postcode; if absent, postcode is null.
 */

import { apiClient } from '../api/client';
import { CanonicalLocation, ClientAddressParser, isValidCoordinate } from '../utils/universalLocation';

export interface GpsEngineResult {
  success: boolean;
  location?: CanonicalLocation;
  error?: {
    code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'REVERSE_GEOCODE_FAILED' | 'INVALID_COORDINATES' | 'UNKNOWN';
    userMessage: string;
    technicalDetails?: string;
  };
  diagnostics?: {
    gpsAttempt: number;
    highAccuracy: boolean;
    durationMs: number;
    rawAccuracy?: number;
    provider: string;
  };
}

class GpsEngineService {
  private activeSearchController: AbortController | null = null;
  private activeGpsController: AbortController | null = null;
  private currentEpoch: number = 0;
  private lastResolvedGpsEpoch: number = -1;

  /**
   * Acquire live GPS location with controlled 2-stage retry strategy.
   */
  public async acquireCurrentLocation(): Promise<GpsEngineResult> {
    const startTime = Date.now();
    this.currentEpoch++;
    const thisEpoch = this.currentEpoch;

    // Cancel any pending search request so it cannot overwrite this GPS action
    if (this.activeSearchController) {
      this.activeSearchController.abort();
      this.activeSearchController = null;
    }

    if (this.activeGpsController) {
      this.activeGpsController.abort();
    }
    this.activeGpsController = new AbortController();

    if (typeof window === 'undefined' || !navigator.geolocation) {
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          userMessage: 'Geolocation is not supported by your browser. You can enter your location manually.',
        },
      };
    }

    // --- STAGE 1: High Accuracy (GPS hardware / Wi-Fi triangulation) ---
    try {
      const pos = await this.getPositionPromise({
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0,
      });

      return await this.processGpsCoordinates(pos, 1, true, startTime, thisEpoch);
    } catch (stage1Err: any) {
      // If user denied permission, do NOT attempt stage 2 — exit immediately
      if (stage1Err?.code === 1 /* PERMISSION_DENIED */) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            userMessage: 'Location permission was denied. You can search for your location manually.',
            technicalDetails: stage1Err.message,
          },
        };
      }

      // --- STAGE 2: Standard Accuracy (Cell tower / IP network fallback) ---
      try {
        const pos2 = await this.getPositionPromise({
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 0,
        });

        return await this.processGpsCoordinates(pos2, 2, false, startTime, thisEpoch);
      } catch (stage2Err: any) {
        const code = this.mapGeolocationErrorCode(stage2Err?.code);
        let userMessage = 'Unable to get your exact location. You can enter your location manually.';
        if (code === 'TIMEOUT') {
          userMessage = 'GPS timed out while getting your location. You can enter your location manually.';
        } else if (code === 'PERMISSION_DENIED') {
          userMessage = 'Location permission was denied. You can search for your location manually.';
        }

        return {
          success: false,
          error: {
            code,
            userMessage,
            technicalDetails: `Stage 1: ${stage1Err?.message || 'failed'}, Stage 2: ${stage2Err?.message || 'failed'}`,
          },
        };
      }
    }
  }

  /**
   * Helper promise wrapper around navigator.geolocation.getCurrentPosition
   */
  private getPositionPromise(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Validate and reverse geocode obtained GPS position
   */
  private async processGpsCoordinates(
    pos: GeolocationPosition,
    attempt: number,
    highAccuracy: boolean,
    startTime: number,
    epoch: number
  ): Promise<GpsEngineResult> {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    // Validate coordinates
    if (!isValidCoordinate(lat, lon)) {
      return {
        success: false,
        error: {
          code: 'INVALID_COORDINATES',
          userMessage: 'GPS returned an invalid coordinate. You can enter your location manually.',
          technicalDetails: `lat=${lat}, lon=${lon}`,
        },
      };
    }

    // Reverse geocode coordinate-driven via server endpoint first
    let canonical: CanonicalLocation | null = null;
    let providerName = 'internal_reverse';

    try {
      const res = await apiClient.get('/location/reverse', {
        params: { lat, lon },
        signal: this.activeGpsController?.signal,
      });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.canonicalLocation) {
          canonical = {
            ...d.canonicalLocation,
            accuracy,
            source: 'gps',
            // Backwards compatibility mappings
            city: d.canonicalLocation.cityDisplayName,
            area: d.canonicalLocation.localityDisplayName,
            locality: d.canonicalLocation.localityDisplayName,
            pincode: d.canonicalLocation.address.postcode || undefined,
            state: d.canonicalLocation.address.state,
            country: d.canonicalLocation.address.country,
            latitude: lat,
            longitude: lon,
          };
          providerName = d.canonicalLocation.rawProviderData?.provider || 'server_nominatim';
        } else {
          // Parse legacy server response with ClientAddressParser
          canonical = ClientAddressParser.parse({
            rawAddress: {
              house_number: d.houseNumber,
              road: d.road,
              neighbourhood: d.neighbourhood,
              suburb: d.suburb || d.area,
              village: d.village,
              town: d.town,
              city: d.city,
              district: d.district,
              state: d.state,
              country: d.country,
              postcode: d.postcode || d.postalCode,
            },
            displayName: d.formattedAddress,
            latitude: lat,
            longitude: lon,
            accuracy,
            source: 'gps',
            provider: 'server_nominatim',
          });
        }
      }
    } catch (serverErr: any) {
      // If user navigated away or aborted
      if (serverErr.name === 'CanceledError' || serverErr.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'UNKNOWN',
            userMessage: 'Location detection was cancelled.',
          },
        };
      }

      // Emergency direct client-side fallback if server reverse geocode failed
      try {
        const directUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
        const directRes = await fetch(directUrl, {
          headers: { Accept: 'application/json' },
          signal: this.activeGpsController?.signal,
        });

        if (directRes.ok) {
          const directData = await directRes.json();
          providerName = 'client_nominatim_fallback';
          canonical = ClientAddressParser.parse({
            rawAddress: directData.address || {},
            displayName: directData.display_name,
            latitude: lat,
            longitude: lon,
            accuracy,
            source: 'gps',
            provider: 'client_nominatim',
            placeId: String(directData.place_id),
          });
        }
      } catch {
        // Fallback also failed
      }
    }

    // If reverse geocoder returned no address (e.g. middle of desert or network failure)
    // create generic coordinate-based canonical representation (never drop coordinates, never invent city)
    if (!canonical) {
      canonical = {
        coordinates: { latitude: lat, longitude: lon },
        accuracy,
        address: { postcode: null },
        formattedAddress: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        cityDisplayName: 'Verified Location',
        source: 'gps',
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lon,
        city: 'Verified Location',
      };
    }

    this.lastResolvedGpsEpoch = epoch;

    return {
      success: true,
      location: canonical,
      diagnostics: {
        gpsAttempt: attempt,
        highAccuracy,
        durationMs: Date.now() - startTime,
        rawAccuracy: accuracy,
        provider: providerName,
      },
    };
  }

  /**
   * Search for locations by text query with race condition protection.
   */
  public async searchLocations(
    query: string,
    cityContext?: string
  ): Promise<CanonicalLocation[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    // Abort any pending search
    if (this.activeSearchController) {
      this.activeSearchController.abort();
    }
    this.activeSearchController = new AbortController();
    const searchEpoch = ++this.currentEpoch;

    try {
      const res = await apiClient.get('/location/search', {
        params: { q: trimmed, city: cityContext || undefined },
        signal: this.activeSearchController.signal,
      });

      // Race condition check: If GPS or a newer search arrived while this was inflight, discard!
      if (this.lastResolvedGpsEpoch >= searchEpoch) {
        return [];
      }

      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data
          .map((item: any) => {
            const lat = Number(item.latitude);
            const lon = Number(item.longitude);
            if (!isValidCoordinate(lat, lon)) return null;

            return ClientAddressParser.parse({
              rawAddress: {
                house_number: item.houseNumber,
                road: item.road,
                neighbourhood: item.neighbourhood,
                suburb: item.suburb || item.area,
                village: item.village,
                town: item.town,
                city: item.city,
                district: item.district,
                state: item.state,
                country: item.country,
                postcode: item.postcode || item.postalCode,
              },
              displayName: item.formattedAddress,
              latitude: lat,
              longitude: lon,
              source: 'manual_search',
              provider: item.provider || 'nominatim',
              placeId: item.placeId,
            });
          })
          .filter((loc: CanonicalLocation | null): loc is CanonicalLocation => loc !== null);
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return [];
      }
    }

    return [];
  }

  private mapGeolocationErrorCode(code?: number): 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN' {
    switch (code) {
      case 1:
        return 'PERMISSION_DENIED';
      case 2:
        return 'POSITION_UNAVAILABLE';
      case 3:
        return 'TIMEOUT';
      default:
        return 'UNKNOWN';
    }
  }
}

export const gpsEngine = new GpsEngineService();
