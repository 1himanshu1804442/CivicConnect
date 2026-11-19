import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';

/**
 * Live SLA Countdown Component
 * 
 * Apple HIG light-mode countdown badge:
 * - Overdue: Soft red pastel badge with prominent OVERDUE indicator
 * - Pending/Active: Clean subtle zinc badge with remaining hours and minutes
 * - Resolved: Soft emerald pastel badge
 * 
 * Why robust validation is needed here:
 * 1. Edge Case Protection: When deadline is null, undefined, or empty, new Date(null).getTime()
 *    evaluates to 0 (epoch 1970), which diffs to -1.7 billion ms and incorrectly renders
 *    "Overdue 490,000h".
 * 2. Past Due Rendering: Correctly computes overdue hours and minutes without negative sign bugs,
 *    and displays 'OVERDUE' gracefully without crashing.
 */
export const SlaCountdown = ({ deadline, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    // Resolved tickets do not tick countdowns
    if (status === 'RESOLVED') {
      setTimeLeft('Resolved');
      setIsOverdue(false);
      return;
    }

    const calculateTime = () => {
      // Guard 1: Missing or null deadline
      if (!deadline) {
        setTimeLeft('SLA pending');
        setIsOverdue(false);
        return;
      }

      const target = new Date(deadline).getTime();

      // Guard 2: Invalid Date string or epoch 0 (1970)
      if (isNaN(target) || target <= 0) {
        setTimeLeft('SLA not set');
        setIsOverdue(false);
        return;
      }

      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        // Ticket SLA is breached / overdue
        setIsOverdue(true);
        const overdueTotalMinutes = Math.floor(Math.abs(diff) / (1000 * 60));
        const overdueHours = Math.floor(overdueTotalMinutes / 60);
        const overdueMins = overdueTotalMinutes % 60;

        if (overdueHours > 0) {
          setTimeLeft(`OVERDUE: ${overdueHours}h ${overdueMins}m`);
        } else {
          setTimeLeft(`OVERDUE: ${overdueMins}m`);
        }
      } else {
        // Ticket is within active SLA timeframe
        setIsOverdue(false);
        const remainingTotalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(remainingTotalMinutes / 60);
        const minutes = remainingTotalMinutes % 60;
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Recalculate every minute
    return () => clearInterval(interval);
  }, [deadline, status]);

  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200/80">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Resolved</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
        isOverdue
          ? 'bg-red-50 text-red-700 border-red-200/80 font-semibold'
          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
      }`}
    >
      {isOverdue ? (
        <AlertOctagon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
      )}
      <span className="font-mono">{timeLeft}</span>
    </span>
  );
};
