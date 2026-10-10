import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendColor?: string;
  variant?: 'default' | 'critical' | 'warning' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendColor = 'text-gray-400',
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return 'border-red-500/30 bg-red-950/20';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/20';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/20';
      default:
        return 'border-slate-800 bg-slate-900/60';
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border backdrop-blur-sm transition-all hover:border-slate-700 ${getVariantStyles()}`}
      data-testid="stat-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {icon && <div className="text-slate-400 p-2 rounded-lg bg-slate-800/60">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        {trend && <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
