import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';

/**
 * Live SLA Countdown Component
 * 
 * Apple HIG light-mode countdown badge:
 * - Overdue: Soft red pastel badge without pulsing animations
 * - Pending/Active: Clean subtle zinc badge
 * - Resolved: Soft emerald pastel badge
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
        setTimeLeft('SLA not set');
        return;
      }

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueHours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
        const overdueMins = Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        setTimeLeft(`Overdue ${overdueHours}h ${overdueMins}m`);
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
          ? 'bg-red-50 text-red-700 border-red-200/80'
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
