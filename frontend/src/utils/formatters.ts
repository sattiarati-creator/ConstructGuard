import { RiskLevel, AlertSeverity, AlertStatus } from '../types';

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getRiskLevelColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-600/50',
        badge: 'bg-red-500/20 text-red-400 border-red-500/40',
        dot: 'bg-red-500',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-950/40',
        text: 'text-orange-400',
        border: 'border-orange-600/50',
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        dot: 'bg-orange-500',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-600/50',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        dot: 'bg-amber-500',
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-600/50',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        dot: 'bg-emerald-500',
      };
  }
}

export function getAlertSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    case 'MEDIUM':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    case 'LOW':
    default:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  }
}

export function getAlertStatusColor(status: AlertStatus): string {
  switch (status) {
    case 'OPEN':
      return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
    case 'ACKNOWLEDGED':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'RESOLVED':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }
}

export function formatScore(score: number): string {
  return (Math.round(score * 10) / 10).toFixed(1);
}
