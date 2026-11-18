import React from 'react';
import { X, Cpu, Layers, ShieldCheck, MapPin, Zap, Database } from 'lucide-react';

/**
 * About Modal Component
 * 
 * Explains the architectural pillars of CivicConnect:
 * - Computer Vision for civic defect classification
 * - Dynamic Priority Scoring Algorithm
 * - Geolocation and SLA governance engine
 */
export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">About CivicConnect Platform</h3>
              <p className="text-xs text-slate-400">Next-Generation AI Citizen Redressal & Municipal SLA Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            <strong className="text-white">CivicConnect</strong> is an intelligent municipal workflow platform that transforms how urban local bodies (ULBs) and citizens resolve public infrastructure grievances. Built with React 18, Leaflet, and Spring Boot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Cpu className="w-4 h-4" />
                <span>AI Vision Defect Classifier</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Automatically identifies road potholes, sanitation spills, water leaks, and streetlight outages with confidence scores and recommended SLA windows.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Zap className="w-4 h-4" />
                <span>Dynamic Priority Engine</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Calculates weighted urgency based on defect severity (40%), crowdsourced upvotes (30%), and ward vulnerability zones (30%).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <MapPin className="w-4 h-4" />
                <span>Geospatial Hotspot Map</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Full-screen interactive Leaflet heatmap visualizing ward-level complaint density to optimize departmental patrol routes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verifiable SLA Remediation</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Before/After image comparison sliders enforce transparency before municipal officers can close tickets and meet SLA targets.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
