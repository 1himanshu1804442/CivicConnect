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
  X
} from 'lucide-react';
import { PriorityBadge } from '../components/PriorityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { ResolutionModal } from '../components/ResolutionModal';
import { useComplaints } from '../hooks/useComplaints';
import { fetchDashboardMetrics, resolveComplaint } from '../services/api';

/**
 * Municipal Authority Operations Dashboard
 * 
 * Apple / Linear-inspired minimalist design system:
 * - Direct typography and layout without sci-fi hero badges
 * - High-contrast white metric KPI cards with soft diffused elevation
 * - Streamlined operational table with light zinc headers and dividers
 * - Transparent Before/After resolution verification signoff
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
      
      {/* Top Header (Without Hero Badge) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Municipal Grievance Operations &amp; SLA Oversight
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Monitor service request queues, active SLA countdowns, and verified field resolutions.
          </p>
        </div>

        <button
          onClick={() => { reload(); loadMetrics(); }}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200/80 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Logged */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Total Logged</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 font-mono">
              {metrics.totalComplaints}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">+18% MoM</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">Across 12 Municipal Wards</div>
        </div>

        {/* Card 2: Remediated & Closed */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Remediated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-700 font-mono">
              {metrics.resolvedComplaints}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              ({Math.round((metrics.resolvedComplaints / metrics.totalComplaints) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">Verified with photo proof</div>
        </div>

        {/* Card 3: Escalated */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Escalated</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-amber-700 font-mono">
              {metrics.escalatedComplaints}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">Priority Queue</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">Requires Senior PWD Review</div>
        </div>

        {/* Card 4: Overdue SLAs */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Overdue SLAs</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-red-700 font-mono">
              {metrics.overdueSlaCount}
            </span>
            <span className="text-[10px] text-red-700 font-medium">Breached</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">Past SLA timeframe</div>
        </div>

        {/* Card 5: Average Resolution Time */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Avg Resolution</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 font-mono">
              {metrics.avgResolutionHours}h
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Target: 24h</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">{metrics.citizenSatisfactionPercent}% Approval Rating</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by ticket ID, title, street, or ward..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mr-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
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
              className="bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
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
              className="bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200/90 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
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
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-zinc-200/80 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <span>Municipal Grievance Dispatch Queue</span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-mono text-zinc-700 border border-zinc-200/80">
              {complaints.length} tickets
            </span>
          </h3>
          <span className="text-xs text-zinc-500">Sorted by dynamic priority score</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
            <p className="text-xs">Synchronizing municipal registry...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <p className="text-sm font-medium text-zinc-700">No grievances match the active filter criteria.</p>
            <p className="text-xs text-zinc-400">Try resetting search filters or report a new issue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-500 font-medium text-[11px]">
                  <th className="py-3 px-4">Ticket &amp; Defect</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Ward &amp; Address</th>
                  <th className="py-3 px-3">SLA Countdown</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Community Votes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {complaints.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                    
                    {/* Ticket & Defect Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200/80 flex-shrink-0"
                        />
                        <div className="max-w-xs">
                          <span className="font-mono text-xs font-semibold text-zinc-900 block">
                            {item.id}
                          </span>
                          <span className="font-medium text-zinc-800 truncate block text-xs" title={item.title}>
                            {item.title}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            By {item.reporterName} • {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-[11px] font-medium">
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
                        <span className="font-medium text-zinc-800 block truncate">{item.ward}</span>
                        <span className="text-[11px] text-zinc-500 block truncate" title={item.address}>
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
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                          item.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : item.status === 'ESCALATED'
                            ? 'bg-red-50 text-red-700 border border-red-200/80'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Community Upvotes */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleUpvote(item.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 text-xs font-mono font-medium transition-all border border-zinc-200/80 shadow-sm"
                        title="Click to endorse urgency"
                      >
                        <ThumbsUp className="w-3 h-3 text-zinc-500" />
                        <span>{item.upvotes}</span>
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details Drawer */}
                        <button
                          onClick={() => setViewComplaint(item)}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Resolve Button */}
                        {item.status !== 'RESOLVED' ? (
                          <button
                            onClick={() => setSelectedForResolution(item)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium px-2 py-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white border border-zinc-200/80 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="font-mono text-xs font-semibold text-zinc-500">{viewComplaint.id}</span>
                <h3 className="text-base font-semibold tracking-tight text-zinc-900">{viewComplaint.title}</h3>
              </div>
              <button
                onClick={() => setViewComplaint(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <img
                src={viewComplaint.imageUrl}
                alt="Defect"
                className="w-full h-56 rounded-xl object-cover border border-zinc-200/80"
              />

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/80">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Location</span>
                  <span className="font-medium text-zinc-900">{viewComplaint.address}</span>
                  <span className="block text-zinc-400 text-[10px]">{viewComplaint.ward}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Priority</span>
                  <div className="mt-1">
                    <PriorityBadge severity={viewComplaint.severity} score={viewComplaint.priorityScore} />
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">SLA Target</span>
                  <div className="mt-1">
                    <SlaCountdown deadline={viewComplaint.slaDeadline} status={viewComplaint.status} />
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Reporter</span>
                  <span className="font-medium text-zinc-800 block">{viewComplaint.reporterName}</span>
                  <span className="text-[10px] text-zinc-400">{viewComplaint.reporterPhone}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-zinc-700 mb-1">Description</h4>
                <p className="text-zinc-600 bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80 leading-relaxed">
                  {viewComplaint.description}
                </p>
              </div>

              {viewComplaint.resolutionDetails && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resolution Verification Audit</span>
                  </div>
                  <p className="text-zinc-700 text-[11px] leading-relaxed">
                    <strong>Action:</strong> {viewComplaint.resolutionDetails.notes}
                  </p>
                  <p className="text-zinc-500 text-[10px]">
                    Signed off by: <strong className="text-zinc-800 font-medium">{viewComplaint.resolutionDetails.resolvedBy}</strong> on{' '}
                    {new Date(viewComplaint.resolutionDetails.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewComplaint(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium border border-zinc-200/80 transition-colors"
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
