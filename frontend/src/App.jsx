import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AboutModal } from './components/AboutModal';
import { CitizenReportPage } from './pages/CitizenReportPage';
import { AuthorityDashboardPage } from './pages/AuthorityDashboardPage';
import { HotspotMapPage } from './pages/HotspotMapPage';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

/**
 * Root Application Component for CivicConnect
 * 
 * Why this is structured this way:
 * 1. Single Page Architecture: Seamless tab navigation between Citizen Grievance Reporting,
 *    Municipal Operations Dashboard, and Hotspot Heatmap without full page reloads.
 * 2. Rule 6 Compliance: Clean container layout wrapped directly under #root with native
 *    bounce physics and solid dark backdrop (#0a0e1a).
 * 3. State Preservation: Switching between tabs preserves report drafts and dashboard metrics.
 */
export function App() {
  const [activeTab, setActiveTab] = useState('report');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Municipal Navigation Header */}
      <div>
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAbout={() => setIsAboutOpen(true)}
        />

        {/* Dynamic Page View Rendering */}
        <main className="flex-1 pb-16">
          {activeTab === 'report' && (
            <CitizenReportPage onNavigateDashboard={() => setActiveTab('dashboard')} />
          )}

          {activeTab === 'dashboard' && (
            <AuthorityDashboardPage />
          )}

          {activeTab === 'hotspots' && (
            <HotspotMapPage onNavigateReport={() => setActiveTab('report')} />
          )}
        </main>
      </div>

      {/* Municipal Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e1a] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-400">CivicConnect Municipal Intelligence Engine</span>
            <span>•</span>
            <span>Version 2.4.0 (Firstmate Pipeline)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              Built for Urban Local Bodies with React 18, Leaflet &amp; Spring Boot
            </span>
          </div>
        </div>
      </footer>

      {/* Architecture & About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

export default App;
