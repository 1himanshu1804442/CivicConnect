import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  TrendingUp, 
  Filter, 
  Search, 
  ThumbsUp, 
  ShieldCheck, 
  Eye, 
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { ResolutionModal } from '../components/ResolutionModal';
import { useComplaints } from '../hooks/useComplaints';
import { fetchDashboardMetrics, resolveComplaint } from '../services/api';

/**
 * Municipal Authority Command & Operations Dashboard
 * 
 * Why this is structured this way:
 * - Real-time Operational Visibility: City officials need instant awareness of SLA deadlines,
 *   escalated hazards, and queue velocity.
 * - Enforces Resolution Transparency: The 'Resolve' button triggers an engineering sign-off modal
 *   with Before/After comparison rather than simple blind checkbox clicking.
 * - Granular Filtering: Allows ward engineers to isolate tickets by priority, status, and category.
 */
export const AuthorityDashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalComplaints: 1428,
    resolvedComplaints: 1184,
    escalatedComplaints: 38,
    overdueSlaCount: 14,
    avgResolutionHours: 18.4,
    citizenSatisfactionPercent: 94.2
  });

  // Complaint data hook
  const { complaints, loading, error, filters, setFilters, reload, handleUpvote } = useComplaints({
    status: 'ALL',
    category: 'ALL',
    severity: 'ALL',
    search: ''
  });

  // Resolution modal state
  const [selectedForResolution, setSelectedForResolution] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  // Detail drawer modal state
  const [viewComplaint, setViewComplaint] = useState(null);

  // Load KPI metrics
  const loadMetrics = async () => {
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('[AuthorityDashboardPage] Failed to fetch metrics:', err);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [complaints]);

  // Handle resolution submit
  const handleConfirmResolution = async (id, resolutionPayload) => {
    setIsResolving(true);
    try {
      await resolveComplaint(id, resolutionPayload);
      setSelectedForResolution(null);
      await reload();
      await loadMetrics();
    } catch (err) {
      console.error('[AuthorityDashboardPage] Error resolving complaint:', err);
      alert('Failed to resolve complaint. Please check log.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Central Municipal Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Municipal Grievance Operations & SLA Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time tracking of civic remediation workflows, automated SLA countdowns, and verified field resolutions.
          </p>
        </div>

        <button
          onClick={() => { reload(); loadMetrics(); }}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Logged */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Logged</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {metrics.totalComplaints}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">+18% MoM</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across 12 Municipal Wards</div>
        </div>

        {/* Card 2: Remediated & Closed */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Remediated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {metrics.resolvedComplaints}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ({Math.round((metrics.resolvedComplaints / metrics.totalComplaints) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Audit verified with photo proof</div>
        </div>

        {/* Card 3: Escalated Hazards */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Escalated</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {metrics.escalatedComplaints}
            </span>
            <span className="text-[10px] text-amber-400/80 font-semibold">Priority Queue</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Requires Senior PWD Signoff</div>
        </div>

        {/* Card 4: Overdue SLAs */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overdue SLAs</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
              {metrics.overdueSlaCount}
            </span>
            <span className="text-[10px] text-rose-400 font-semibold animate-pulse">Breached</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Penalty risk for contractor</div>
        </div>

        {/* Card 5: Average Resolution Time */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Resolution</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">
              {metrics.avgResolutionHours}h
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">Target: 24h</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{metrics.citizenSatisfactionPercent}% Citizen Approval</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by ticket ID, title, street, or ward..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Triage</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="POTHOLE">Potholes / Road</option>
              <option value="GARBAGE">Garbage Overflow</option>
              <option value="WATER_LEAK">Water Leakage</option>
              <option value="STREETLIGHT">Streetlights</option>
            </select>

            {/* Severity Filter */}
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Issue Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Municipal Grievance Dispatch Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-emerald-400 border border-slate-700">
              {complaints.length} tickets
            </span>
          </h3>
          <span className="text-xs text-slate-500">Sorted by dynamic AI priority score</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
            <p className="text-xs">Synchronizing municipal registry...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No grievances match the active filter criteria.</p>
            <p className="text-xs">Try resetting search filters or report a new issue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ticket & Defect</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority / Score</th>
                  <th className="py-3 px-3">Ward & Address</th>
                  <th className="py-3 px-3">SLA Countdown</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Community Votes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {complaints.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Ticket & Defect Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                        />
                        <div className="max-w-xs">
                          <span className="font-mono text-[11px] font-bold text-emerald-400 block">
                            {item.id}
                          </span>
                          <span className="font-medium text-white truncate block text-xs" title={item.title}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            By {item.reporterName} • {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-3">
                      <PriorityBadge severity={item.severity} score={item.priorityScore} />
                    </td>

                    {/* Ward & Address */}
                    <td className="py-3 px-3">
                      <div className="max-w-[180px]">
                        <span className="font-semibold text-slate-200 block truncate">{item.ward}</span>
                        <span className="text-[10px] text-slate-400 block truncate" title={item.address}>
                          {item.address}
                        </span>
                      </div>
                    </td>

                    {/* Live SLA Countdown */}
                    <td className="py-3 px-3">
                      <SlaCountdown deadline={item.slaDeadline} status={item.status} />
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'ESCALATED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Community Upvotes */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleUpvote(item.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-emerald-400 text-xs font-mono font-semibold transition-all border border-slate-700"
                        title="Click to endorse/upvote urgency"
                      >
                        <ThumbsUp className="w-3 h-3 text-emerald-400" />
                        <span>{item.upvotes}</span>
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details Drawer */}
                        <button
                          onClick={() => setViewComplaint(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Grievance Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Resolve Button */}
                        {item.status !== 'RESOLVED' ? (
                          <button
                            onClick={() => setSelectedForResolution(item)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-1">
                            Audited ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal with Before/After Slider */}
      <ResolutionModal
        complaint={selectedForResolution}
        isOpen={Boolean(selectedForResolution)}
        onClose={() => setSelectedForResolution(null)}
        onConfirmResolve={handleConfirmResolution}
        isSubmitting={isResolving}
      />

      {/* Details View Modal */}
      {viewComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{viewComplaint.id}</span>
                <h3 className="text-base font-bold text-white">{viewComplaint.title}</h3>
              </div>
              <button
                onClick={() => setViewComplaint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <img
                src={viewComplaint.imageUrl}
                alt="Defect"
                className="w-full h-56 rounded-xl object-cover border border-slate-800"
              />

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-semibold text-white">{viewComplaint.address}</span>
                  <span className="block text-slate-400 text-[10px]">{viewComplaint.ward}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Priority & Score</span>
                  <div className="mt-1">
                    <PriorityBadge severity={viewComplaint.severity} score={viewComplaint.priorityScore} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">SLA Target</span>
                  <div className="mt-1">
                    <SlaCountdown deadline={viewComplaint.slaDeadline} status={viewComplaint.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Reporter</span>
                  <span className="font-medium text-slate-200 block">{viewComplaint.reporterName}</span>
                  <span className="text-[10px] text-slate-400">{viewComplaint.reporterPhone}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-1">Description</h4>
                <p className="text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {viewComplaint.description}
                </p>
              </div>

              {viewComplaint.resolutionDetails && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolution Verification Audit</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>Action:</strong> {viewComplaint.resolutionDetails.notes}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Signed off by: <strong className="text-slate-200">{viewComplaint.resolutionDetails.resolvedBy}</strong> on{' '}
                    {new Date(viewComplaint.resolutionDetails.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewComplaint(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
