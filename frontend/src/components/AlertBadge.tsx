import React from 'react';
import { AlertSeverity, AlertStatus } from '../types';
import { getAlertSeverityColor, getAlertStatusColor } from '../utils/formatters';

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

export const AlertSeverityBadge: React.FC<AlertSeverityBadgeProps> = ({
  severity,
  className = '',
}) => {
  const colorClass = getAlertSeverityColor(severity);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClass} ${className}`}
      data-testid="alert-severity-badge"
    >
      {severity}
    </span>
  );
};

interface AlertStatusBadgeProps {
  status: AlertStatus;
  className?: string;
}

export const AlertStatusBadge: React.FC<AlertStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const colorClass = getAlertStatusColor(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClass} ${className}`}
      data-testid="alert-status-badge"
    >
      {status}
    </span>
  );
};
