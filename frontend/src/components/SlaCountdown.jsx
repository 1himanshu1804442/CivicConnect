import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';

/**
 * Live SLA Countdown Component
 * 
 * Why this is structured this way:
 * - Municipal performance relies strictly on SLA compliance.
 * - This component recalculates the remaining time dynamically every minute.
 * - Displays a prominent overdue alert banner if SLA time expires before resolution.
 */
export const SlaCountdown = ({ deadline, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (status === 'RESOLVED') {
      setTimeLeft('Resolved on time');
      setIsOverdue(false);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (isNaN(diff)) {
        setTimeLeft('SLA not configured');
        return;
      }

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueHours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
        const overdueMins = Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        setTimeLeft(`OVERDUE by ${overdueHours}h ${overdueMins}m`);
      } else {
        setIsOverdue(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Recalculate every minute
    return () => clearInterval(interval);
  }, [deadline, status]);

  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Resolved
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
        isOverdue
          ? 'bg-red-950/40 border-red-500/50 text-red-400 animate-pulse'
          : 'bg-slate-800/80 border-slate-700 text-slate-300'
      }`}
    >
      {isOverdue ? (
        <AlertOctagon className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      )}
      <span>{timeLeft}</span>
    </span>
  );
};
