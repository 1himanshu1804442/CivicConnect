import { useState, useEffect } from 'react';

/**
 * Custom React Hook for Browser Geolocation
 * 
 * Why this is extracted:
 * - Keeps UI components clean and decoupled from browser APIs.
 * - Gracefully falls back to default municipal headquarters coordinates if user denies permissions.
 * - Provides immediate feedback on whether GPS is acquiring, active, or errored.
 */
export const useGeolocation = (defaultCoords = { lat: 28.4744, lng: 77.5040 }) => {
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
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
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
