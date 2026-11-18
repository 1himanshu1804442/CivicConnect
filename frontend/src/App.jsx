import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AboutModal } from './components/AboutModal';
import { CitizenReportPage } from './pages/CitizenReportPage';
import { AuthorityDashboardPage } from './pages/AuthorityDashboardPage';
import { HotspotMapPage } from './pages/HotspotMapPage';

/**
 * Root Application Component for CivicConnect
 * 
 * Clean, Apple / Linear-inspired minimalist design system:
 * - Single-page tab navigation between Report, Dashboard, and Incident Density Map.
 * - Solid warm off-white surface (#F5F5F7) adhering strictly to Rule 6.
 * - Unified typography, subtle elevation, and responsive structure.
 */
export function App() {
  const [activeTab, setActiveTab] = useState('report');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between text-zinc-900 bg-[#F5F5F7] selection:bg-zinc-900 selection:text-white">
      {/* Top Navigation Header */}
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

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
            <span className="font-medium text-zinc-700">CivicConnect Municipal Redressal</span>
            <span>•</span>
            <span>Version 2.4.0</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <span>Built for Urban Local Bodies • Spring Boot &amp; React</span>
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
