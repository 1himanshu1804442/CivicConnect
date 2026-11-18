import React from 'react';
import { X, Layers, ShieldCheck, MapPin, Zap, Database } from 'lucide-react';

/**
 * About Modal Component
 * 
 * Clean, Apple-inspired modal outlining the system architecture:
 * - Computer Vision defect classification
 * - Dynamic Priority Scoring Algorithm
 * - Geolocation and SLA governance engine
 */
export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900">About CivicConnect</h3>
              <p className="text-xs text-zinc-500">Municipal Grievance Operations &amp; SLA Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-xs text-zinc-600">
          <p className="leading-relaxed">
            <strong className="text-zinc-900 font-semibold">CivicConnect</strong> is a municipal workflow platform designed to streamline how urban local bodies and citizens manage and resolve public infrastructure issues. Built with React 18, Leaflet, and Spring Boot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <Layers className="w-4 h-4 text-zinc-700" />
                <span>Issue Classification</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Identifies road potholes, waste overflow, water leaks, and streetlight outages with confidence ratings and recommended SLA windows.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <Zap className="w-4 h-4 text-zinc-700" />
                <span>Dynamic Priority Formula</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Computes objective urgency using defect severity (35%), community report volume (20%), category hazard (15%), zone sensitivity (15%), and ticket age (15%).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <MapPin className="w-4 h-4 text-zinc-700" />
                <span>Geospatial Hotspots</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Interactive OpenStreetMap visualization displaying complaint density to optimize municipal maintenance deployment.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-zinc-700" />
                <span>Verified Remediation</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Before and after photographic evidence verification ensures transparency before work orders can be marked resolved.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
