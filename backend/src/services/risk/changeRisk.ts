import { ImageChangeEvidence } from './types';

export interface ChangeRiskConfig {
  lowThreshold: number;       // default 5%
  moderateThreshold: number;  // default 15%
  highThreshold: number;      // default 30%
}

export const DEFAULT_CHANGE_RISK_CONFIG: ChangeRiskConfig = {
  lowThreshold: 5.0,
  moderateThreshold: 15.0,
  highThreshold: 30.0,
};

export interface ChangeRiskEvaluation {
  score: number;
  indicators: string[];
  changePercentage: number;
  changeType?: string;
  changedRegions?: any[];
}

export class ChangeRiskCalculator {
  private config: ChangeRiskConfig;

  constructor(customConfig?: Partial<ChangeRiskConfig>) {
    this.config = {
      ...DEFAULT_CHANGE_RISK_CONFIG,
      ...customConfig,
    };
  }

  calculate(evidence?: ImageChangeEvidence | number): ChangeRiskEvaluation {
    let percentage = 0;
    let changeType: string | undefined;
    let changedRegions: any[] | undefined;

    if (typeof evidence === 'number') {
      percentage = evidence;
    } else if (evidence && typeof evidence.changePercentage === 'number') {
      percentage = evidence.changePercentage;
      changeType = evidence.changeType;
      changedRegions = evidence.changedRegions;
    }

    const safePercentage = Math.max(0, Math.min(100, percentage));
    const indicators: string[] = [];
    let score = 0;

    if (safePercentage <= this.config.lowThreshold) {
      // 0 - 5% -> score 0 - 25
      score = (safePercentage / this.config.lowThreshold) * 25;
      if (safePercentage > 0) {
        indicators.push('LOW_IMAGE_CHANGE');
      }
    } else if (safePercentage <= this.config.moderateThreshold) {
      // 5% - 15% -> score 25 - 55
      const ratio = (safePercentage - this.config.lowThreshold) / (this.config.moderateThreshold - this.config.lowThreshold);
      score = 25 + ratio * 30;
      indicators.push('MODERATE_IMAGE_CHANGE');
    } else if (safePercentage <= this.config.highThreshold) {
      // 15% - 30% -> score 55 - 85
      const ratio = (safePercentage - this.config.moderateThreshold) / (this.config.highThreshold - this.config.moderateThreshold);
      score = 55 + ratio * 30;
      indicators.push('HIGH_IMAGE_CHANGE');
    } else {
      // > 30% -> score 85 - 100
      const excess = Math.min(70, safePercentage - this.config.highThreshold);
      score = 85 + (excess / 70) * 15;
      indicators.push('CRITICAL_IMAGE_CHANGE');
    }

    const roundedScore = Math.round(score * 100) / 100;

    return {
      score: roundedScore,
      indicators,
      changePercentage: safePercentage,
      changeType,
      changedRegions,
    };
  }
}

export const changeRiskCalculator = new ChangeRiskCalculator();
