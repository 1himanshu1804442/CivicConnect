import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  LayoutDashboard, 
  MapPin, 
  Info
} from 'lucide-react';

/**
 * Navbar Component
 * 
 * Apple HIG frosted-glass header with segmented pill controls:
 * - Translucent white background with backdrop blur
 * - Segmented-control pill bar with crisp white active tab
 * - Clean system status indicator
 */
export const Navbar = ({ activeTab, onTabChange, onOpenAbout }) => {
  const navItems = [
    { id: 'report', label: 'Report Issue', ariaLabel: 'Report Grievance', icon: PlusCircle },
    { id: 'dashboard', label: 'Dashboard', ariaLabel: 'Municipal Dashboard', icon: LayoutDashboard },
    { id: 'hotspots', label: 'Density Map', ariaLabel: 'Hotspot Heatmap', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Emblem */}
          <div 
            onClick={() => onTabChange('report')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-900 group-hover:bg-zinc-200/70 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-zinc-900">
                  CivicConnect
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200/80">
                  Portal
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 block leading-tight">
                Municipal Operations & Grievance AI
              </span>
            </div>
          </div>

          {/* Segmented Pill Navigation Control */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  aria-label={item.ariaLabel}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right utility buttons: Status pill and About modal */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-[11px] text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System Operational</span>
            </div>

            <button
              onClick={onOpenAbout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200/80 transition-colors"
              title="About CivicConnect Architecture"
            >
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              <span>About</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-zinc-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                aria-label={item.ariaLabel}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-800'
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
