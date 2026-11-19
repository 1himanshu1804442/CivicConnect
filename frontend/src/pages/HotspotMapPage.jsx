import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  ArrowRight,
  Filter,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { fetchHotspotClusters, fetchComplaints } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
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
 * Map controller to smoothly pan/zoom to selected hotspot.
 * Safeguard: Verifies valid coordinates before flying to prevent Leaflet crash.
 */
const FlyToCluster = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && isValidCoordinate(center.latitude, center.longitude)) {
      map.flyTo([Number(center.latitude), Number(center.longitude)], 15, { duration: 1.5 });
    }
  }, [center, map]);
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
 * 
 * Edge Case Protection:
 * - Filters out invalid or (0,0) coordinates before passing to Leaflet Markers
 * - Mobile responsive heights (no layout overflow on small screens)
 * - Graceful network error alert banner
 */
export const HotspotMapPage = ({ onNavigateReport }) => {
  const [hotspots, setHotspots] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clustersData, complaintsData] = await Promise.all([
        fetchHotspotClusters(),
        fetchComplaints()
      ]);
      setHotspots(clustersData);
      setComplaints(complaintsData);
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

        {/* Risk Filter Select */}
        <div className="flex items-center gap-3">
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

            {selectedHotspot && <FlyToCluster center={selectedHotspot} />}
          </MapContainer>

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
