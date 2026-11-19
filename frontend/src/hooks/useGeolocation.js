import { useState } from 'react';
import { isValidCoordinate, DEFAULT_MUNICIPAL_COORDS } from '../services/mapUtils';

/**
 * Custom React Hook for Browser Geolocation
 * 
 * Why this is extracted:
 * - Keeps UI components clean and decoupled from browser APIs (Rule 3).
 * - Gracefully falls back to default municipal headquarters coordinates if user denies permissions
 *   or if device reports invalid / (0,0) coordinates.
 * - Provides immediate feedback on whether GPS is acquiring, active, or errored.
 */
export const useGeolocation = (defaultCoords = DEFAULT_MUNICIPAL_COORDS) => {
  const [coordinates, setCoordinates] = useState(defaultCoords);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position?.coords?.latitude;
        const lng = position?.coords?.longitude;

        if (isValidCoordinate(lat, lng)) {
          setCoordinates({
            lat: Number(lat.toFixed(5)),
            lng: Number(lng.toFixed(5))
          });
          setError(null);
        } else {
          console.warn('[useGeolocation] Device reported invalid or (0,0) coordinates; falling back to municipal center:', lat, lng);
          setError('Invalid GPS coordinates received. Using municipal center.');
          setCoordinates(defaultCoords);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useGeolocation] Geolocation permission denied or failed:', err.message);
        setError('Location access denied. Using municipal center.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return {
    coordinates,
    setCoordinates,
    loading,
    error,
    getCurrentLocation
  };
};
