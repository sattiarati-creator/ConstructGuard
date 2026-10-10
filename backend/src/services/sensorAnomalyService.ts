import { AllowedSensorType } from '../mqtt/validation';

export interface AnomalyThresholds {
  vibration: number;
  noise: number;
  dust: number;
  temperature: number;
  motion: number;
}

export interface AnomalyResult {
  is_anomaly: boolean;
  reason?: string;
  details?: {
    sensorType: string;
    value: number;
    unit: string;
    threshold: number;
  };
}

/**
 * Baseline Sensor Anomaly Detection Service.
 * Evaluates whether high-frequency sensor readings exceed demonstration thresholds.
 *
 * NOTE: These baseline thresholds are configurable demonstration values,
 * not claims about real-world statutory noise, vibration, or environmental safety limits.
 */
export class SensorAnomalyService {
  private thresholds: AnomalyThresholds;

  constructor(customThresholds?: Partial<AnomalyThresholds>) {
    this.thresholds = {
      vibration: 0.40,   // g (heavy machinery vibration)
      noise: 75.0,       // dB (demolition / generator noise)
      dust: 60.0,        // ug/m3 (particulate air concentration)
      temperature: 42.0, // C (exhaust / engine overheating)
      motion: 1.0,       // 1.0 indicates perimeter breach or motion detected
      ...customThresholds,
    };
  }

  evaluate(sensorType: AllowedSensorType, value: number, unit: string): AnomalyResult {
    switch (sensorType) {
      case 'vibration':
        if (value > this.thresholds.vibration) {
          return {
            is_anomaly: true,
            reason: `Vibration of ${value}${unit} exceeds baseline threshold of ${this.thresholds.vibration}${unit}`,
            details: { sensorType, value, unit, threshold: this.thresholds.vibration },
          };
        }
        break;

      case 'noise':
        if (value > this.thresholds.noise) {
          return {
            is_anomaly: true,
            reason: `Noise level of ${value}${unit} exceeds baseline threshold of ${this.thresholds.noise}${unit}`,
            details: { sensorType, value, unit, threshold: this.thresholds.noise },
          };
        }
        break;

      case 'dust':
        if (value > this.thresholds.dust) {
          return {
            is_anomaly: true,
            reason: `Dust concentration of ${value}${unit} exceeds baseline threshold of ${this.thresholds.dust}${unit}`,
            details: { sensorType, value, unit, threshold: this.thresholds.dust },
          };
        }
        break;

      case 'temperature':
        if (value > this.thresholds.temperature) {
          return {
            is_anomaly: true,
            reason: `Temperature of ${value}${unit} exceeds baseline threshold of ${this.thresholds.temperature}${unit}`,
            details: { sensorType, value, unit, threshold: this.thresholds.temperature },
          };
        }
        break;

      case 'motion':
        if (value >= this.thresholds.motion) {
          return {
            is_anomaly: true,
            reason: 'Active perimeter motion detected',
            details: { sensorType, value, unit, threshold: this.thresholds.motion },
          };
        }
        break;
    }

    return { is_anomaly: false };
  }

  getThresholds(): AnomalyThresholds {
    return { ...this.thresholds };
  }
}

export const sensorAnomalyService = new SensorAnomalyService();
