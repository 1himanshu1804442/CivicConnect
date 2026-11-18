import React from 'react';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

/**
 * Reusable Priority Badge Component
 * 
 * Why this is structured this way:
 * - Visually establishes urgency at a glance for municipal operators.
 * - Standardized color coding (Critical: Red, High: Orange, Medium: Amber, Low: Blue).
 * - Includes animated pulse effects for Critical issues to draw immediate attention.
 */
export const PriorityBadge = ({ severity, score, showScore = true }) => {
  const getBadgeConfig = () => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          indicator: 'bg-rose-500',
          icon: AlertCircle,
          label: 'Critical'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          indicator: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'High'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
          indicator: 'bg-yellow-400',
          icon: Clock,
          label: 'Medium'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
          indicator: 'bg-sky-400',
          icon: Info,
          label: 'Low'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span className="relative flex h-2 w-2">
        {severity?.toUpperCase() === 'CRITICAL' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.indicator}`}></span>
      </span>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-black/40 font-mono text-[10px] text-gray-200">
          {score}
        </span>
      )}
    </span>
  );
};
