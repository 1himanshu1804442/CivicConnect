import React from 'react';
import { CheckCircle2, Ticket, Clock, ShieldCheck, ArrowRight, Copy } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

/**
 * Ticket Success Modal
 * 
 * Clean, Apple-inspired confirmation modal:
 * - Clear confirmation message and official tracking reference
 * - Objective priority level and target SLA resolution time
 * - Monospace used strictly for Ticket ID and numbers
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-zinc-200/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        <div className="text-center pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900">Report Submitted</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Your grievance has been registered and routed to the municipal response team.
          </p>
        </div>

        {/* Ticket Reference Card */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Ticket Reference:</span>
              <span className="font-mono font-semibold text-zinc-900 text-xs">{ticket.id}</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 transition-colors"
              title="Copy Ticket ID"
            >
              {copied ? <span className="text-[10px] text-emerald-600 font-medium">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block text-[11px]">Assigned Priority</span>
              <div className="mt-1">
                <PriorityBadge severity={ticket.severity} score={ticket.priorityScore} />
              </div>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Assessment Match</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                <span className="font-mono">{ticket.aiConfidence || 95}%</span> Match
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Target SLA Resolution</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                Within {ticket.severity === 'CRITICAL' ? '12 Hours' : ticket.severity === 'HIGH' ? '24 Hours' : '48 Hours'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Ward Jurisdiction</span>
              <span className="mt-1 block font-medium text-zinc-800 truncate">
                {ticket.ward || 'Central Municipal'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors border border-zinc-200/80"
          >
            Report Another Issue
          </button>
          <button
            onClick={onNavigateDashboard}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-medium shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>View Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
