import React from 'react';
import { RiskLevel } from '../types';
import { getRiskLevelColor } from '../utils/formatters';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = true,
  className = '',
}) => {
  const colors = getRiskLevelColor(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.badge} ${className}`}
      data-testid="risk-badge"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      <span>{level}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono">({score.toFixed(1)})</span>
      )}
    </span>
  );
};
