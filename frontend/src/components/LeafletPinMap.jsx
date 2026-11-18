import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

/**
 * Custom Pin Marker Icon using L.divIcon
 * Avoids leaflet default asset 404 bugs and matches the modern dark theme.
 */
const customPinIcon = L.divIcon({
  className: 'civic-custom-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
      <div style="background: #2563eb; color: white; border-radius: 50%; padding: 6px; box-shadow: 0 0 15px rgba(37, 99, 235, 0.5); border: 2px solid #ffffff;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="width: 2px; height: 8px; background: #2563eb;"></div>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42]
});

// Helper component to listen to user map clicks and update coordinates
const LocationMarkerListener = ({ coordinates, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5))
      });
    },
  });

  return coordinates ? (
    <Marker position={[coordinates.lat, coordinates.lng]} icon={customPinIcon} />
  ) : null;
};

// Helper component to dynamically re-center map when coordinates change
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], map.getZoom() || 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

/**
 * Interactive Leaflet Pin Map for Citizen Reporting
 * 
 * Why this is structured this way:
 * - Allows citizens to visually pinpoint the exact spot of a pothole or streetlight
 * - Supports one-click browser Geolocation centering
 * - Works offline/hybrid with OpenStreetMap CartoDB Dark Matter tiles matching dark theme
 */
export const LeafletPinMap = ({
  coordinates,
  onLocationSelect,
  onUseCurrentLocation,
  isLocating = false
}) => {
  const defaultPosition = coordinates?.lat && coordinates?.lng 
    ? [coordinates.lat, coordinates.lng] 
    : [28.6139, 77.2090]; // Default New Delhi Municipal Central

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <MapContainer
        center={defaultPosition}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        {/* CartoDB Dark Matter tiles for clean dark theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <LocationMarkerListener
          coordinates={coordinates}
          onLocationSelect={onLocationSelect}
        />

        <MapRecenter center={coordinates} />
      </MapContainer>

      {/* Floating GPS button */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-md transition-all border border-blue-500/40 disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Acquiring GPS...' : 'Use My GPS'}
        </button>
      </div>

      {/* Bottom coordinate pill */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-mono text-blue-400 border border-slate-700 flex items-center gap-2">
        <MapPin className="w-3 h-3 text-blue-400" />
        <span>
          Lat: {coordinates?.lat?.toFixed(5) || '28.61390'}, Lng: {coordinates?.lng?.toFixed(5) || '77.20900'}
        </span>
        <span className="text-slate-400 text-[10px] hidden sm:inline">(Click map to relocate)</span>
      </div>
    </div>
  );
};
