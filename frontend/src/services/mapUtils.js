/**
 * CivicConnect Map Utility & Coordinate Validation Service
 * 
 * Why this is extracted into services:
 * 1. Adheres to strict layered architecture (Rule 3).
 * 2. Edge Case Protection: Prevents Leaflet from crashing when rendering invalid,
 *    NaN, null, or (0,0) "Null Island" coordinates.
 * 3. Provides standardized Greater Noida NCR municipal center fallback coordinates.
 */

// Default municipal headquarters coordinates (Greater Noida Central, NCR)
export const DEFAULT_MUNICIPAL_COORDS = {
  lat: 28.4744,
  lng: 77.5040
};

/**
 * Validates whether latitude and longitude are valid earthly geographic coordinates.
 * 
 * Why this check is critical:
 * - Uninitialized GPS sensors often report (0,0) (Null Island in the Atlantic Ocean).
 * - Corrupted or null values cause Leaflet's L.LatLng constructor to throw uncaught exceptions.
 * - Restricts latitude to [-90, 90] and longitude to [-180, 180].
 * 
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @returns {boolean} True if coordinates are valid and non-zero
 */
export const isValidCoordinate = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  // Check for NaN or non-numeric values
  if (isNaN(numLat) || isNaN(numLng)) {
    return false;
  }

  // Reject (0, 0) Null Island coordinates which represent uninitialized sensors
  if (numLat === 0 && numLng === 0) {
    return false;
  }

  // Check valid Earth latitude and longitude boundaries
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return false;
  }

  return true;
};

/**
 * Normalizes coordinates, guaranteeing valid [lat, lng] array for Leaflet.
 * 
 * @param {object} coords - Object with lat and lng properties
 * @returns {[number, number]} Safe coordinate tuple [lat, lng]
 */
export const getSafeCoordinates = (coords) => {
  if (coords && isValidCoordinate(coords.lat, coords.lng)) {
    return [Number(coords.lat), Number(coords.lng)];
  }
  return [DEFAULT_MUNICIPAL_COORDS.lat, DEFAULT_MUNICIPAL_COORDS.lng];
};
