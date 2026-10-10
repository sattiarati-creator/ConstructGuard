import { PermitSchedule } from './types';

export interface PermitRiskConfig {
  validPermitScore: number;       // default 0
  unauthorizedSiteScore: number;  // default 95
  expiredPermitScore: number;     // default 90
  preActivePermitScore: number;   // default 80
  missingPermitScore: number;     // default 50 (neutral)
}

export const DEFAULT_PERMIT_RISK_CONFIG: PermitRiskConfig = {
  validPermitScore: 0.0,
  unauthorizedSiteScore: 95.0,
  expiredPermitScore: 90.0,
  preActivePermitScore: 80.0,
  missingPermitScore: 50.0,
};

export interface PermitRiskEvaluation {
  score: number;
  indicators: string[];
  permitStatus: 'VALID' | 'EXPIRED' | 'NOT_YET_ACTIVE' | 'UNAUTHORIZED' | 'UNKNOWN';
  details?: string;
}

export class PermitRiskCalculator {
  private config: PermitRiskConfig;

  constructor(customConfig?: Partial<PermitRiskConfig>) {
    this.config = {
      ...DEFAULT_PERMIT_RISK_CONFIG,
      ...customConfig,
    };
  }

  calculate(permitInfo?: PermitSchedule | null, currentDate?: Date | string): PermitRiskEvaluation {
    if (!permitInfo) {
      return {
        score: this.config.missingPermitScore,
        indicators: ['MISSING_PERMIT_INFO'],
        permitStatus: 'UNKNOWN',
        details: 'No site authorization or permit record provided.',
      };
    }

    if (!permitInfo.authorized) {
      return {
        score: this.config.unauthorizedSiteScore,
        indicators: ['UNAUTHORIZED_SITE'],
        permitStatus: 'UNAUTHORIZED',
        details: 'Site is explicitly designated as unauthorized for construction.',
      };
    }

    const today = currentDate
      ? typeof currentDate === 'string'
        ? new Date(currentDate)
        : currentDate
      : new Date();

    const todayDateStr = today.toISOString().split('T')[0];

    if (!permitInfo.permitStartDate || !permitInfo.permitEndDate) {
      return {
        score: 20.0,
        indicators: ['PERMIT_DATES_UNSPECIFIED'],
        permitStatus: 'UNKNOWN',
        details: 'Site is authorized but specific permit duration dates are unspecified.',
      };
    }

    const startDateStr = permitInfo.permitStartDate.split('T')[0];
    const endDateStr = permitInfo.permitEndDate.split('T')[0];

    if (todayDateStr < startDateStr) {
      return {
        score: this.config.preActivePermitScore,
        indicators: ['PERMIT_NOT_YET_ACTIVE'],
        permitStatus: 'NOT_YET_ACTIVE',
        details: `Permit valid starting ${startDateStr}; observed prior to active window.`,
      };
    }

    if (todayDateStr > endDateStr) {
      return {
        score: this.config.expiredPermitScore,
        indicators: ['EXPIRED_PERMIT'],
        permitStatus: 'EXPIRED',
        details: `Permit expired on ${endDateStr}.`,
      };
    }

    return {
      score: this.config.validPermitScore,
      indicators: [],
      permitStatus: 'VALID',
      details: `Active permit valid until ${endDateStr}.`,
    };
  }
}

export const permitRiskCalculator = new PermitRiskCalculator();
