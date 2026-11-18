import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Flame, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  Layers, 
  Eye, 
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { fetchHotspotClusters, fetchComplaints } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';

/**
 * Creates dynamic glowing cluster marker icons based on risk level and density
 */
const createHotspotIcon = (riskLevel, count) => {
  const isCritical = riskLevel === 'CRITICAL';
  const isHigh = riskLevel === 'HIGH';
  const color = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#38bdf8';
  const pulseColor = isCritical ? 'rgba(244, 63, 94, 0.4)' : isHigh ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)';

  return L.divIcon({
    className: 'hotspot-marker',
    html: `
      <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: ${pulseColor};
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          top: -22px;
          left: -22px;
        "></div>
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #111827;
          border: 3px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 13px;
          font-family: monospace;
          box-shadow: 0 0 15px ${color};
          top: -19px;
          left: -19px;
        ">
          ${count}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [0, 0]
  });
};

// Map controller to smoothly pan/zoom to selected hotspot
const FlyToCluster = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.latitude, center.longitude], 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

/**
 * Hotspot Heatmap & Ward Density Explorer
 * 
 * Why this is structured this way:
 * - City planners and ward contractors need geospatial intelligence to deploy equipment
 *   where defects cluster together (e.g. repeated road potholes or drainage bursts).
 * - Displays interactive SVG cluster markers that pulse with risk severity.
 * - Integrates real-time ward drill-down sidebar for direct actionable inspection.
 */
export const HotspotMapPage = ({ onNavigateReport }) => {
  const [hotspots, setHotspots] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
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
        console.error('[HotspotMapPage] Error loading hotspot data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, []);

  const filteredHotspots = hotspots.filter(h => {
    if (filterRisk === 'ALL') return true;
    return h.riskLevel === filterRisk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-6">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Geospatial AI Heatmap & Ward Clusters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Municipal Defect Hotspot Density
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visualizing spatial clustering of civic complaints to allocate asphalt rollers, sanitation crews, and maintenance teams.
          </p>
        </div>

        {/* Risk Filter Select */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Risk Level:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none"
            >
              <option value="ALL" className="bg-slate-900">All Clusters</option>
              <option value="CRITICAL" className="bg-slate-900">Critical Priority Only</option>
              <option value="HIGH" className="bg-slate-900">High Density Only</option>
              <option value="MEDIUM" className="bg-slate-900">Medium Density Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px]">
        
        {/* Interactive Full Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <MapContainer
            center={[28.6139, 77.2090]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Render Hotspot Cluster Markers */}
            {filteredHotspots.map((hotspot) => (
              <Marker
                key={hotspot.id}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createHotspotIcon(hotspot.riskLevel, hotspot.activeCount)}
                eventHandlers={{
                  click: () => setSelectedHotspot(hotspot)
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                      <span className="font-bold text-white">{hotspot.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        hotspot.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {hotspot.riskLevel}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <div>Active Complaints: <strong className="text-white">{hotspot.activeCount}</strong></div>
                      <div>Primary Defect: <strong className="text-blue-400">{hotspot.dominantCategory}</strong></div>
                    </div>
                    <p className="text-[11px] text-slate-400">{hotspot.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {selectedHotspot && <FlyToCluster center={selectedHotspot} />}
          </MapContainer>

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl space-y-1.5 text-[11px]">
            <span className="font-bold text-slate-300 uppercase tracking-wider block text-[10px]">
              Cluster Density Legend
            </span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/40"></span>
              <span className="text-slate-300">Critical Density (&gt; 15 issues)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/40"></span>
              <span className="text-slate-300">High Density (10 - 15 issues)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400 ring-2 ring-sky-400/40"></span>
              <span className="text-slate-300">Moderate Density (&lt; 10 issues)</span>
            </div>
          </div>
        </div>

        {/* Hotspot Cluster Inspector Sidebar (4 cols) */}
        <div className="lg:col-span-4 h-full flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-5 overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Ward Hotspot Inspector</h3>
            </div>
            <span className="text-xs text-slate-500">{filteredHotspots.length} Clusters</span>
          </div>

          {/* Selected Cluster Details Card */}
          {selectedHotspot ? (
            <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                    {selectedHotspot.ward}
                  </span>
                  <h4 className="text-sm font-bold text-white">{selectedHotspot.name}</h4>
                </div>
                <PriorityBadge severity={selectedHotspot.riskLevel} />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedHotspot.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Active Density</span>
                  <span className="font-bold font-mono text-blue-400 text-sm">
                    {selectedHotspot.activeCount} Incidents
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Dominant Issue</span>
                  <span className="font-semibold text-slate-200">
                    {selectedHotspot.dominantCategory}
                  </span>
                </div>
              </div>

              <button
                onClick={onNavigateReport}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Report Grievance in this Ward</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-4 p-4 text-center text-slate-400 text-xs">
              Select a cluster marker on the map to inspect ward metrics.
            </div>
          )}

          {/* Quick Hotspot Cluster List */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
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
                      ? 'bg-slate-800 border-blue-500/50 shadow-md'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[170px]">
                      {hotspot.name}
                    </span>
                    <span className="font-mono text-blue-400 font-bold text-[11px]">
                      {hotspot.activeCount} issues
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{hotspot.dominantCategory}</span>
                    <span className={hotspot.riskLevel === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}>
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
