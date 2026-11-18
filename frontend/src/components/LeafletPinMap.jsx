import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

/**
 * Custom Pin Marker Icon using L.divIcon
 * Crisp, modern design matching Apple / Linear aesthetic.
 */
const customPinIcon = L.divIcon({
  className: 'civic-custom-marker',
  html: `
    <div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
      <div style="background: #18181b; color: white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); border: 2px solid #ffffff;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="width: 2px; height: 6px; background: #18181b;"></div>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38]
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
 * Clean OpenStreetMap tiles with no API key requirement:
 * - High accuracy GPS centering button
 * - Click anywhere to position pin
 * - Apple-grade container elevation and typography
 */
export const LeafletPinMap = ({
  coordinates,
  onLocationSelect,
  onUseCurrentLocation,
  isLocating = false
}) => {
  const defaultPosition = coordinates?.lat && coordinates?.lng 
    ? [coordinates.lat, coordinates.lng] 
    : [28.4744, 77.5040]; // Default Greater Noida Central

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <MapContainer
        center={defaultPosition}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        {/* Standard, reliable OpenStreetMap tiles (no API key required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Use My GPS'}</span>
        </button>
      </div>

      {/* Bottom coordinate pill */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-zinc-700 border border-zinc-200/80 shadow-sm flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-zinc-600" />
        <span className="font-mono text-[11px]">
          {coordinates?.lat?.toFixed(5) || '28.47440'}, {coordinates?.lng?.toFixed(5) || '77.50400'}
        </span>
        <span className="text-zinc-400 text-[11px] hidden sm:inline">(Click map to move)</span>
      </div>
    </div>
  );
};
