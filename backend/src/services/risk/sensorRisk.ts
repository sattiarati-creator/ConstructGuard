import { SensorAnomalyEvidence } from './types';

export interface SensorRiskConfig {
  weights: Record<string, number>;
  anomalyMultipliers: {
    single: number;
    double: number;
    multiple: number;
  };
  baseAnomalyScore: number;
}

export const DEFAULT_SENSOR_RISK_CONFIG: SensorRiskConfig = {
  weights: {
    vibration: 0.30,
    noise: 0.20,
    motion: 0.20,
    dust: 0.20,
    temperature: 0.10,
  },
  anomalyMultipliers: {
    single: 1.0,
    double: 1.35,
    multiple: 1.65,
  },
  baseAnomalyScore: 50.0,
};

export interface SensorRiskEvaluation {
  score: number;
  indicators: string[];
  anomaliesDetected: string[];
  missingSensors: string[];
}

export class SensorRiskCalculator {
  private config: SensorRiskConfig;

  constructor(customConfig?: Partial<SensorRiskConfig>) {
    this.config = {
      ...DEFAULT_SENSOR_RISK_CONFIG,
      ...customConfig,
      weights: {
        ...DEFAULT_SENSOR_RISK_CONFIG.weights,
        ...(customConfig?.weights || {}),
      },
    };
  }

  calculate(readings?: Record<string, SensorAnomalyEvidence> | SensorAnomalyEvidence[]): SensorRiskEvaluation {
    const expectedSensors = Object.keys(this.config.weights);
    const readingMap: Record<string, SensorAnomalyEvidence> = {};

    if (Array.isArray(readings)) {
      for (const r of readings) {
        if (r && r.sensorType) {
          readingMap[r.sensorType.toLowerCase()] = r;
        }
      }
    } else if (readings && typeof readings === 'object') {
      for (const [k, v] of Object.entries(readings)) {
        if (v && v.sensorType) {
          readingMap[v.sensorType.toLowerCase()] = v;
        } else if (v && typeof (v as any).isAnomaly === 'boolean') {
          readingMap[k.toLowerCase()] = v;
        }
      }
    }

    const availableSensors: string[] = [];
    const missingSensors: string[] = [];
    const anomaliesDetected: string[] = [];
    const indicators: string[] = [];

    for (const sensorType of expectedSensors) {
      if (readingMap[sensorType]) {
        availableSensors.push(sensorType);
        if (readingMap[sensorType].isAnomaly) {
          anomaliesDetected.push(sensorType);
          this.addSensorSpecificIndicator(sensorType, indicators);
        }
      } else {
        missingSensors.push(sensorType);
      }
    }

    // Flag missing sensor data without artificially inflating risk score
    if (missingSensors.length > 0) {
      indicators.push('MISSING_SENSOR_DATA');
    }

    // If completely devoid of sensor evidence, return safe neutral 0
    if (availableSensors.length === 0) {
      return {
        score: 0,
        indicators,
        anomaliesDetected: [],
        missingSensors,
      };
    }

    if (anomaliesDetected.length === 0) {
      return {
        score: 0,
        indicators,
        anomaliesDetected: [],
        missingSensors,
      };
    }

    // Calculate sum of weights for available sensors to re-normalize
    let availableWeightSum = 0;
    for (const s of availableSensors) {
      availableWeightSum += this.config.weights[s] ?? 0.1;
    }

    // Weighted anomaly contribution
    let weightedAnomalyScore = 0;
    for (const s of anomaliesDetected) {
      const weight = this.config.weights[s] ?? 0.1;
      const normalizedWeight = availableWeightSum > 0 ? weight / availableWeightSum : 0.2;
      weightedAnomalyScore += normalizedWeight * 100;
    }

    // Compound multiplier based on simultaneous anomalies
    let multiplier = this.config.anomalyMultipliers.single;
    if (anomaliesDetected.length === 2) {
      multiplier = this.config.anomalyMultipliers.double;
      indicators.push('MULTIPLE_SENSOR_ANOMALIES');
    } else if (anomaliesDetected.length >= 3) {
      multiplier = this.config.anomalyMultipliers.multiple;
      indicators.push('SEVERE_MULTI_SENSOR_SURGE');
    }

    // Combine weighted anomaly presence and multi-sensor compounding
    // 1 anomaly -> moderate (40-60)
    // 2 anomalies -> higher (65-80)
    // 3+ anomalies -> very high (85-100)
    const rawScore = Math.min(100, weightedAnomalyScore * multiplier);
    const score = Math.round(rawScore * 100) / 100;

    return {
      score,
      indicators,
      anomaliesDetected,
      missingSensors,
    };
  }

  private addSensorSpecificIndicator(type: string, indicators: string[]): void {
    switch (type) {
      case 'vibration':
        indicators.push('VIBRATION_ANOMALY');
        break;
      case 'noise':
        indicators.push('NOISE_ANOMALY');
        break;
      case 'motion':
        indicators.push('MOTION_DETECTED');
        break;
      case 'dust':
        indicators.push('DUST_ANOMALY');
        break;
      case 'temperature':
        indicators.push('TEMPERATURE_ANOMALY');
        break;
      default:
        indicators.push(`${type.toUpperCase()}_ANOMALY`);
    }
  }
}

export const sensorRiskCalculator = new SensorRiskCalculator();
