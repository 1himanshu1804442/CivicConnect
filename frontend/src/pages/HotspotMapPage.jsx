import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  ArrowRight,
  Filter,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Crosshair,
  Info,
  CheckCircle2
} from 'lucide-react';
import { fetchHotspotClusters } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { useGeolocation } from '../hooks/useGeolocation';
import { isValidCoordinate, DEFAULT_MUNICIPAL_COORDS } from '../services/mapUtils';

/**
 * Creates clean circular badge markers with colored boundary rings
 * Apple HIG-inspired: No ping animations or neon glows.
 */
const createHotspotIcon = (riskLevel, count) => {
  const isCritical = riskLevel === 'CRITICAL';
  const isHigh = riskLevel === 'HIGH';
  const ringColor = isCritical ? '#dc2626' : isHigh ? '#d97706' : '#2563eb';

  return L.divIcon({
    className: 'hotspot-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #ffffff;
        border: 2.5px solid ${ringColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #18181b;
        font-weight: 700;
        font-size: 12px;
        font-family: inherit;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transform: translate(-50%, -50%);
      ">
        ${count}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [0, 0]
  });
};

/**
 * User current GPS position marker with soft blue pulsing indicator
 */
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #2563eb;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.28), 0 3px 8px rgba(0,0,0,0.22);
        transform: translate(-50%, -50%);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [0, 0]
  });
};

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

/**
 * Map controller to smoothly pan/zoom to selected hotspot or user GPS location.
 * Safeguard: Verifies valid coordinates before flying to prevent Leaflet crash.
 */
const FlyToCluster = ({ center, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && isValidCoordinate(center.latitude ?? center.lat, center.longitude ?? center.lng)) {
      const lat = Number(center.latitude ?? center.lat);
      const lng = Number(center.longitude ?? center.lng);
      map.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

/**
 * Hotspot Heatmap & Ward Density Explorer
 * 
 * Apple / Linear-inspired minimalist design system:
 * - Direct typography and layout without hero badges
 * - Standard, reliable OpenStreetMap tiles (no API key required)
 * - Clean circular cluster markers with subtle elevation
 * - Streamlined ward drill-down sidebar in pure white
 * - Live GPS locate mode with automatic closest-ward proximity calculation
 * 
 * Edge Case Protection:
 * - Filters out invalid or (0,0) coordinates before passing to Leaflet Markers
 * - Mobile responsive heights (no layout overflow on small screens)
 * - Graceful network error alert banner
 */
export const HotspotMapPage = ({ onNavigateReport }) => {
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live GPS geolocation hook
  const { coordinates: userCoords, loading: gpsLoading, error: gpsError, getCurrentLocation } = useGeolocation();
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [nearestCluster, setNearestCluster] = useState(null);
  const [nearestDistanceKm, setNearestDistanceKm] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clustersData = await fetchHotspotClusters();
      setHotspots(clustersData);
      if (clustersData.length > 0) {
        setSelectedHotspot(clustersData[0]);
      }
    } catch (err) {
      console.error('[HotspotMapPage] Error loading hotspot data with context:', err);
      setError('Unable to reach backend hotspot service. Displaying standard municipal ward clusters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Filter by risk level and safeguard valid geographic coordinates
  const filteredHotspots = hotspots
    .filter(h => isValidCoordinate(h.latitude, h.longitude))
    .filter(h => {
      if (filterRisk === 'ALL') return true;
      return h.riskLevel?.toUpperCase() === filterRisk.toUpperCase();
    });

  // Toggle user GPS tracking mode
  const handleToggleGps = () => {
    if (isGpsActive) {
      setIsGpsActive(false);
      setNearestCluster(null);
      setNearestDistanceKm(null);
      setMapTarget(null);
      if (filteredHotspots.length > 0) {
        setSelectedHotspot(filteredHotspots[0]);
      }
    } else {
      setIsGpsActive(true);
      getCurrentLocation();
    }
  };

  // Recalculate nearest municipal hotspot whenever user GPS coordinates update
  useEffect(() => {
    if (isGpsActive && userCoords && isValidCoordinate(userCoords.lat, userCoords.lng)) {
      setMapTarget({ latitude: userCoords.lat, longitude: userCoords.lng });

      if (hotspots.length > 0) {
        let closest = null;
        let minDistance = Infinity;

        hotspots.forEach((h) => {
          if (isValidCoordinate(h.latitude, h.longitude)) {
            const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, h.latitude, h.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              closest = h;
            }
          }
        });

        if (closest) {
          setNearestCluster(closest);
          setNearestDistanceKm(minDistance);
          setSelectedHotspot(closest);
        }
      }
    }
  }, [userCoords, isGpsActive, hotspots]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-6">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Municipal Defect Hotspot Density
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Geospatial overview of civic reports to identify high-density clusters across municipal wards.
          </p>
        </div>

        {/* Action Controls: Use My GPS & Risk Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Use My GPS Button */}
          <button
            onClick={handleToggleGps}
            disabled={gpsLoading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border shadow-sm transition-all ${
              isGpsActive
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-blue-500/10 ring-1 ring-blue-300'
                : 'bg-white hover:bg-zinc-50 active:bg-zinc-100 border-zinc-200/80 text-zinc-700'
            }`}
            title="Locate my position and detect closest municipal ward cluster"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-blue-600' : isGpsActive ? 'text-blue-600 fill-blue-600' : 'text-zinc-500'}`} />
            <span>{gpsLoading ? 'Acquiring GPS...' : isGpsActive ? 'GPS Active (Tracked)' : 'Use My GPS'}</span>
            {isGpsActive && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>}
          </button>

          {/* Risk Filter Select */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200/80 px-3.5 py-2 rounded-xl text-xs text-zinc-700 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium text-zinc-500">Density:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-transparent text-zinc-900 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Clusters</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Network / Offline Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">{error}</p>
          </div>
          <button
            onClick={loadMapData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* GPS Error Banner */}
      {isGpsActive && gpsError && (
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-blue-900 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p>{gpsError}</p>
          </div>
          <button
            onClick={() => getCurrentLocation()}
            className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium transition-colors"
          >
            Retry GPS
          </button>
        </div>
      )}

      {/* Main Map + Sidebar Grid - Responsive for mobile without layout overflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] lg:h-[640px]">
        
        {/* Interactive Full Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 h-[380px] sm:h-[450px] lg:h-full rounded-2xl overflow-hidden border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative">
          <MapContainer
            center={[DEFAULT_MUNICIPAL_COORDS.lat, DEFAULT_MUNICIPAL_COORDS.lng]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            {/* Standard OpenStreetMap tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Hotspot Cluster Markers (only valid coordinates) */}
            {filteredHotspots.map((hotspot) => (
              <Marker
                key={hotspot.id}
                position={[Number(hotspot.latitude), Number(hotspot.longitude)]}
                icon={createHotspotIcon(hotspot.riskLevel, hotspot.activeCount)}
                eventHandlers={{
                  click: () => setSelectedHotspot(hotspot)
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-1">
                      <span className="font-semibold text-zinc-900">{hotspot.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        hotspot.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {hotspot.riskLevel}
                      </span>
                    </div>
                    <div className="text-zinc-600">
                      <div>Active Reports: <strong className="text-zinc-900 font-mono">{hotspot.activeCount}</strong></div>
                      <div>Primary Issue: <strong className="text-zinc-800">{hotspot.dominantCategory}</strong></div>
                    </div>
                    <p className="text-[11px] text-zinc-500">{hotspot.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* User GPS Location Marker */}
            {isGpsActive && isValidCoordinate(userCoords?.lat, userCoords?.lng) && (
              <Marker
                position={[Number(userCoords.lat), Number(userCoords.lng)]}
                icon={createUserLocationIcon()}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-semibold text-blue-700 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                      <span>Your GPS Position</span>
                    </div>
                    <div className="text-zinc-500 font-mono text-[10px]">
                      {userCoords.lat}, {userCoords.lng}
                    </div>
                    {nearestCluster && (
                      <div className="mt-1 pt-1 border-t border-zinc-100 text-zinc-600 text-[11px]">
                        Closest Ward: <strong className="text-zinc-900">{nearestCluster.name}</strong> ({nearestDistanceKm} km)
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {mapTarget ? (
              <FlyToCluster center={mapTarget} zoom={14} />
            ) : selectedHotspot ? (
              <FlyToCluster center={selectedHotspot} zoom={15} />
            ) : null}
          </MapContainer>

          {/* Floating On-Map GPS Locator Button */}
          <div className="absolute top-4 right-4 z-[400]">
            <button
              onClick={handleToggleGps}
              disabled={gpsLoading}
              className={`p-2.5 rounded-xl border shadow-md backdrop-blur-md transition-all flex items-center justify-center ${
                isGpsActive
                  ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/40 shadow-blue-500/20'
                  : 'bg-white/95 text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:bg-white'
              }`}
              title={isGpsActive ? 'GPS Mode Active — Click to reset' : 'Center on My GPS Location'}
            >
              <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin text-blue-600' : isGpsActive ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200/80 shadow-md space-y-1.5 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900 block text-[11px]">
              Cluster Density
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Critical (&gt; 15 issues)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>High (10 - 15 issues)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Moderate (&lt; 10 issues)</span>
            </div>
          </div>
        </div>

        {/* Hotspot Cluster Inspector Sidebar (4 cols) */}
        <div className="lg:col-span-4 h-[420px] sm:h-[460px] lg:h-full flex flex-col bg-white rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-5 overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-600" />
              <h3 className="text-sm font-semibold text-zinc-900">Ward Hotspot Inspector</h3>
            </div>
            <span className="text-xs text-zinc-500">{filteredHotspots.length} Clusters</span>
          </div>

          {/* GPS Proximity Status Chip */}
          {isGpsActive && nearestCluster && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50/90 border border-blue-200/90 text-xs text-blue-900 space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Nearest Municipal Ward</span>
                </span>
                <span className="font-mono text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md text-[11px]">
                  {nearestDistanceKm} km
                </span>
              </div>
              <p className="text-[11px] text-blue-800">
                You are currently closest to <strong>{nearestCluster.name}</strong> ({nearestCluster.ward}).
              </p>
            </div>
          )}

          {/* Selected Cluster Details Card */}
          {selectedHotspot ? (
            <div className="mt-4 p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                    {selectedHotspot.ward}
                  </span>
                  <h4 className="text-sm font-semibold text-zinc-900">{selectedHotspot.name}</h4>
                </div>
                <PriorityBadge severity={selectedHotspot.riskLevel} />
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                {selectedHotspot.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Active Density</span>
                  <span className="font-semibold font-mono text-zinc-900 text-sm">
                    {selectedHotspot.activeCount} Incidents
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block">Dominant Issue</span>
                  <span className="font-medium text-zinc-800">
                    {selectedHotspot.dominantCategory}
                  </span>
                </div>
              </div>

              <button
                onClick={onNavigateReport}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Report Issue in this Ward</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-4 p-4 text-center text-zinc-400 text-xs">
              Select a cluster marker on the map to inspect ward metrics.
            </div>
          )}

          {/* Quick Hotspot Cluster List */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
            <span className="text-[11px] font-medium text-zinc-500 block mb-1">
              Select Cluster to Focus:
            </span>
            {filteredHotspots.length === 0 && !loading && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-center text-xs text-zinc-500">
                No clusters match the "{filterRisk}" filter. Try "All Clusters".
              </div>
            )}
            {filteredHotspots.map((hotspot) => {
              const isSelected = selectedHotspot?.id === hotspot.id;
              return (
                <div
                  key={hotspot.id}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-100 border-zinc-300 shadow-sm'
                      : 'bg-zinc-50/60 border-zinc-200/70 hover:bg-zinc-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900 truncate max-w-[170px]">
                      {hotspot.name}
                    </span>
                    <span className="font-mono text-zinc-700 font-semibold text-[11px]">
                      {hotspot.activeCount} issues
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{hotspot.dominantCategory}</span>
                    <span className={hotspot.riskLevel === 'CRITICAL' ? 'text-red-700 font-medium' : 'text-amber-700 font-medium'}>
                      {hotspot.riskLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
