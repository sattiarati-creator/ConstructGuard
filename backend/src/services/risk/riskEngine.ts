import {
  RiskEngineInput,
  RiskAnalysisResult,
  ComponentScores,
  RiskLevel,
} from './types';
import { visualRiskCalculator } from './visualRisk';
import { changeRiskCalculator } from './changeRisk';
import { sensorRiskCalculator } from './sensorRisk';
import { timeRiskCalculator } from './timeRisk';
import { permitRiskCalculator } from './permitRisk';
import { riskExplanationGenerator } from './riskExplanation';

export interface RiskWeights {
  visual: number;
  change: number;
  sensor: number;
  time: number;
  permit: number;
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  visual: 0.35,
  change: 0.25,
  sensor: 0.20,
  time: 0.10,
  permit: 0.10,
};

export class RiskEngine {
  private weights: RiskWeights;

  constructor(customWeights?: Partial<RiskWeights>) {
    this.weights = {
      ...DEFAULT_RISK_WEIGHTS,
      ...customWeights,
    };
  }

  evaluate(input: RiskEngineInput): RiskAnalysisResult {
    const indicators: string[] = [];
    let detectedClasses: string[] = [];

    // 1. Visual Score Evaluation (0-100)
    let visual = 0;
    if (typeof input.visualScore === 'number') {
      visual = this.clampScore(input.visualScore);
    } else if (input.detectedObjects && input.detectedObjects.length > 0) {
      const visualEval = visualRiskCalculator.calculate(input.detectedObjects);
      visual = visualEval.score;
      indicators.push(...visualEval.indicators);
      detectedClasses = visualEval.detectedClasses;
    }

    // 2. Image Change Score Evaluation (0-100)
    let change = 0;
    if (typeof input.changeScore === 'number') {
      change = this.clampScore(input.changeScore);
    } else if (typeof input.imageChangePercentage === 'number') {
      const changeEval = changeRiskCalculator.calculate(input.imageChangePercentage);
      change = changeEval.score;
      indicators.push(...changeEval.indicators);
    }

    // 3. IoT Sensor Score Evaluation (0-100)
    let sensor = 0;
    if (typeof input.sensorScore === 'number') {
      sensor = this.clampScore(input.sensorScore);
    } else if (input.sensorAnomalies) {
      const sensorEval = sensorRiskCalculator.calculate(input.sensorAnomalies);
      sensor = sensorEval.score;
      indicators.push(...sensorEval.indicators);
    }

    // 4. Time of Day Score Evaluation (0-100)
    let time = 0;
    if (typeof input.timeScore === 'number') {
      time = this.clampScore(input.timeScore);
    } else if (input.permitInformation) {
      const timeEval = timeRiskCalculator.calculate(
        input.currentTime,
        input.permitInformation.permittedStartTime,
        input.permitInformation.permittedEndTime
      );
      time = timeEval.score;
      indicators.push(...timeEval.indicators);
    }

    // 5. Permit / Authorization Score Evaluation (0-100)
    let permit = 0;
    if (typeof input.permitScore === 'number') {
      permit = this.clampScore(input.permitScore);
    } else if (input.permitInformation) {
      const permitEval = permitRiskCalculator.calculate(input.permitInformation, input.currentTime);
      permit = permitEval.score;
      indicators.push(...permitEval.indicators);
    }

    // 6. Weighted Overall Score Calculation
    // formula: visual*0.35 + change*0.25 + sensor*0.20 + time*0.10 + permit*0.10
    const rawOverall =
      visual * this.weights.visual +
      change * this.weights.change +
      sensor * this.weights.sensor +
      time * this.weights.time +
      permit * this.weights.permit;

    // Round to two decimal places
    const overallScore = Math.round(rawOverall * 100) / 100;

    // 7. Assign Risk Level
    const riskLevel = this.determineRiskLevel(overallScore);

    const componentScores: ComponentScores = {
      visual: Math.round(visual * 100) / 100,
      change: Math.round(change * 100) / 100,
      sensor: Math.round(sensor * 100) / 100,
      time: Math.round(time * 100) / 100,
      permit: Math.round(permit * 100) / 100,
    };

    // 8. Generate Human-Readable Explanation
    const { explanation, uniqueIndicators } = riskExplanationGenerator.generate({
      overallScore,
      riskLevel,
      componentScores,
      indicators,
      detectedClasses,
    });

    return {
      overallScore,
      riskLevel,
      componentScores,
      explanation,
      indicators: uniqueIndicators,
    };
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80.0) return 'CRITICAL';
    if (score >= 60.0) return 'HIGH';
    if (score >= 30.0) return 'MEDIUM';
    return 'LOW';
  }

  private clampScore(val: number): number {
    if (isNaN(val)) return 0;
    return Math.max(0, Math.min(100, val));
  }
}

export const riskEngine = new RiskEngine();
