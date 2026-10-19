import { DetectedObject } from './types';

export interface VisualRiskConfig {
  classWeights: Record<string, number>;
  defaultWeight: number;
}

export const DEFAULT_VISUAL_RISK_CONFIG: VisualRiskConfig = {
  classWeights: {
    excavator: 70,
    crane: 65,
    bulldozer: 65,
    truck: 45,
    machinery: 50,
    equipment: 40,
    person: 25,
    worker: 30,
    car: 15,
  },
  defaultWeight: 15,
};

export interface VisualRiskEvaluation {
  score: number;
  indicators: string[];
  detectedClasses: string[];
}

export class VisualRiskCalculator {
  private config: VisualRiskConfig;

  constructor(customConfig?: Partial<VisualRiskConfig>) {
    this.config = {
      ...DEFAULT_VISUAL_RISK_CONFIG,
      ...customConfig,
      classWeights: {
        ...DEFAULT_VISUAL_RISK_CONFIG.classWeights,
        ...(customConfig?.classWeights || {}),
      },
    };
  }

  calculate(detections: DetectedObject[] = []): VisualRiskEvaluation {
    if (!detections || detections.length === 0) {
      return {
        score: 0,
        indicators: [],
        detectedClasses: [],
      };
    }

    let totalWeight = 0;
    const indicators: string[] = [];
    const detectedClasses: string[] = [];
    const classCount: Record<string, number> = {};

    for (const det of detections) {
      const normalizedClass = det.class.toLowerCase().trim();
      detectedClasses.push(normalizedClass);
      classCount[normalizedClass] = (classCount[normalizedClass] || 0) + 1;

      const baseWeight = this.config.classWeights[normalizedClass] ?? this.config.defaultWeight;
      const confidence = Math.max(0, Math.min(1, det.confidence));

      // Each object contributes proportional to its class weight and detection confidence
      totalWeight += baseWeight * confidence;
    }

    // Identify high-value visual indicators
    if (classCount['excavator'] || classCount['bulldozer'] || classCount['crane']) {
      indicators.push('HEAVY_MACHINERY_DETECTED');
    }
    if (classCount['truck']) {
      indicators.push('TRUCK_DETECTED');
    }
    if ((classCount['person'] || 0) + (classCount['worker'] || 0) > 0) {
      indicators.push('PERSONNEL_DETECTED');
    }
    if (detections.length >= 3) {
      indicators.push('MULTIPLE_CONSTRUCTION_OBJECTS');
    }

    // Diminishing returns ceiling capped at 100
    const rawScore = Math.min(100, totalWeight);
    const score = Math.round(rawScore * 100) / 100;

    return {
      score,
      indicators,
      detectedClasses,
    };
  }
}

export const visualRiskCalculator = new VisualRiskCalculator();
