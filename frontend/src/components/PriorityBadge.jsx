import React from 'react';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

/**
 * Reusable Priority Badge Component
 * 
 * Apple HIG-inspired pastel status badge:
 * - High-contrast text on soft pastel backgrounds with subtle borders
 * - Zero ping/pulse animations for calm, professional readability
 * - Clean typography with score tag in monospace
 */
export const PriorityBadge = ({ severity, score, showScore = true }) => {
  const getBadgeConfig = () => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200/80',
          indicator: 'bg-red-600',
          icon: AlertCircle,
          label: 'Critical'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          indicator: 'bg-amber-600',
          icon: AlertTriangle,
          label: 'High'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          indicator: 'bg-zinc-500',
          icon: Clock,
          label: 'Medium'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          indicator: 'bg-blue-600',
          icon: Info,
          label: 'Low'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
      <span className={`inline-flex rounded-full h-1.5 w-1.5 ${config.indicator}`}></span>
      <Icon className="w-3.5 h-3.5 opacity-80" />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-black/5 font-mono text-[10px] text-zinc-700">
          {score}
        </span>
      )}
    </span>
  );
};
