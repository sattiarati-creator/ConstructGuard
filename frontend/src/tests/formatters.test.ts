import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatDate,
  getRiskLevelColor,
  getAlertSeverityColor,
  getAlertStatusColor,
  formatScore,
} from '../utils/formatters';

describe('Formatters Utility', () => {
  it('formats ISO dates correctly', () => {
    const iso = '2026-10-08T12:00:00Z';
    const formatted = formatDateTime(iso);
    expect(formatted).toBeDefined();
    expect(formatted).not.toBe('N/A');

    expect(formatDateTime(null)).toBe('N/A');
    expect(formatDateTime(undefined)).toBe('N/A');
  });

  it('formats date only', () => {
    const iso = '2026-10-08T12:00:00Z';
    const formatted = formatDate(iso);
    expect(formatted).toContain('2026');
  });

  it('returns appropriate color schemes for risk levels', () => {
    const crit = getRiskLevelColor('CRITICAL');
    expect(crit.text).toContain('red');
    expect(crit.badge).toContain('red');

    const high = getRiskLevelColor('HIGH');
    expect(high.text).toContain('orange');

    const med = getRiskLevelColor('MEDIUM');
    expect(med.text).toContain('amber');

    const low = getRiskLevelColor('LOW');
    expect(low.text).toContain('emerald');
  });

  it('returns appropriate alert severity colors', () => {
    expect(getAlertSeverityColor('CRITICAL')).toContain('red');
    expect(getAlertSeverityColor('HIGH')).toContain('orange');
    expect(getAlertSeverityColor('MEDIUM')).toContain('amber');
    expect(getAlertSeverityColor('LOW')).toContain('blue');
  });

  it('returns appropriate alert status colors', () => {
    expect(getAlertStatusColor('OPEN')).toContain('red');
    expect(getAlertStatusColor('ACKNOWLEDGED')).toContain('amber');
    expect(getAlertStatusColor('RESOLVED')).toContain('emerald');
  });

  it('formats decimal scores accurately', () => {
    expect(formatScore(84.349)).toBe('84.3');
    expect(formatScore(12)).toBe('12.0');
  });
});
