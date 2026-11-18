import React from 'react';
import { CheckCircle2, Ticket, Clock, ShieldCheck, ArrowRight, Share2, Copy } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

/**
 * Ticket Success Modal
 * 
 * Why this is structured this way:
 * - Provides immediate citizen confirmation and accountability.
 * - Generates official tracking reference and dynamic SLA delivery target.
 * - Shows transparent AI prioritization score that determines municipal queue order.
 */
export const TicketSuccessModal = ({ ticket, isOpen, onClose, onNavigateDashboard }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !ticket) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-emerald-500 to-cyan-400"></div>

        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Grievance Registered Successfully!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Your complaint has been logged and dispatched to the municipal rapid response crew.
          </p>
        </div>

        {/* Ticket Reference Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Official Ticket ID:</span>
              <span className="font-mono font-bold text-white text-sm">{ticket.id}</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Copy Ticket ID"
            >
              {copied ? <span className="text-[10px] text-emerald-400">Copied!</span> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Priority</span>
              <div className="mt-1">
                <PriorityBadge severity={ticket.severity} score={ticket.priorityScore} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">AI Vision Confidence</span>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-semibold text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                {ticket.aiConfidence || 95}% Match
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Target SLA Resolution</span>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Within {ticket.severity === 'CRITICAL' ? '12 Hours' : ticket.severity === 'HIGH' ? '24 Hours' : '48 Hours'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Ward Jurisdiction</span>
              <span className="mt-1 block font-medium text-slate-200 truncate">
                {ticket.ward || 'Central Municipal'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Report Another Defect
          </button>
          <button
            onClick={onNavigateDashboard}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
          >
            <span>View Municipal Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
