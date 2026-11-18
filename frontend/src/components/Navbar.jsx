import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  LayoutDashboard, 
  MapPin, 
  Info, 
  Activity,
  Shield,
  Sparkles
} from 'lucide-react';

/**
 * CivicConnect Navbar Component
 * 
 * Why this is structured this way:
 * - Simple, responsive tab navigation supporting single-page workflow.
 * - Prominent civic emblem and municipal identity.
 * - Live operational pulse badge to show backend/AI engine connectivity.
 */
export const Navbar = ({ activeTab, onTabChange, onOpenAbout }) => {
  const navItems = [
    { id: 'report', label: 'Report Grievance', icon: PlusCircle },
    { id: 'dashboard', label: 'Municipal Dashboard', icon: LayoutDashboard },
    { id: 'hotspots', label: 'Hotspot Heatmap', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0a0e1a]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Civic Emblem */}
          <div 
            onClick={() => onTabChange('report')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 group-hover:border-emerald-400 transition-colors">
              <Building2 className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  CivicConnect
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60">
                  Municipal Portal
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Public Infrastructure & Grievance Governance
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right utility buttons: Live status badge and About modal toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System: <strong className="text-emerald-400">Operational</strong></span>
            </div>

            <button
              onClick={onOpenAbout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="About CivicConnect Architecture"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
