import { sensorRiskCalculator } from '../../src/services/risk/sensorRisk';
import { timeRiskCalculator } from '../../src/services/risk/timeRisk';
import { permitRiskCalculator } from '../../src/services/risk/permitRisk';
import { riskExplanationGenerator } from '../../src/services/risk/riskExplanation';

describe('Sensor, Temporal, Permit & Explanation Risk Tests', () => {
  describe('SensorRiskCalculator', () => {
    it('should return score 0 when all available sensors are normal', () => {
      const evalResult = sensorRiskCalculator.calculate({
        vibration: { sensorType: 'vibration', value: 0.12, unit: 'g', isAnomaly: false },
        noise: { sensorType: 'noise', value: 50.0, unit: 'dB', isAnomaly: false },
        motion: { sensorType: 'motion', value: 0.0, unit: 'state', isAnomaly: false },
        dust: { sensorType: 'dust', value: 20.0, unit: 'ug/m3', isAnomaly: false },
        temperature: { sensorType: 'temperature', value: 25.0, unit: 'C', isAnomaly: false },
      });
      expect(evalResult.score).toBe(0);
      expect(evalResult.anomaliesDetected).toEqual([]);
    });

    it('should compute moderate score for single sensor anomaly', () => {
      const evalResult = sensorRiskCalculator.calculate({
        vibration: { sensorType: 'vibration', value: 0.85, unit: 'g', isAnomaly: true },
        noise: { sensorType: 'noise', value: 50.0, unit: 'dB', isAnomaly: false },
        motion: { sensorType: 'motion', value: 0.0, unit: 'state', isAnomaly: false },
        dust: { sensorType: 'dust', value: 20.0, unit: 'ug/m3', isAnomaly: false },
        temperature: { sensorType: 'temperature', value: 25.0, unit: 'C', isAnomaly: false },
      });
      expect(evalResult.score).toBeGreaterThanOrEqual(25);
      expect(evalResult.score).toBeLessThan(50);
      expect(evalResult.indicators).toContain('VIBRATION_ANOMALY');
    });

    it('should scale score higher and flag MULTIPLE_SENSOR_ANOMALIES for two concurrent anomalies', () => {
      const evalResult = sensorRiskCalculator.calculate({
        vibration: { sensorType: 'vibration', value: 0.9, unit: 'g', isAnomaly: true },
        noise: { sensorType: 'noise', value: 92.0, unit: 'dB', isAnomaly: true },
        motion: { sensorType: 'motion', value: 0.0, unit: 'state', isAnomaly: false },
        dust: { sensorType: 'dust', value: 20.0, unit: 'ug/m3', isAnomaly: false },
        temperature: { sensorType: 'temperature', value: 25.0, unit: 'C', isAnomaly: false },
      });
      expect(evalResult.score).toBeGreaterThanOrEqual(60);
      expect(evalResult.indicators).toContain('MULTIPLE_SENSOR_ANOMALIES');
    });

    it('should scale to very high score and flag SEVERE_MULTI_SENSOR_SURGE for three or more anomalies', () => {
      const evalResult = sensorRiskCalculator.calculate({
        vibration: { sensorType: 'vibration', value: 0.95, unit: 'g', isAnomaly: true },
        noise: { sensorType: 'noise', value: 95.0, unit: 'dB', isAnomaly: true },
        motion: { sensorType: 'motion', value: 1.0, unit: 'state', isAnomaly: true },
        dust: { sensorType: 'dust', value: 110.0, unit: 'ug/m3', isAnomaly: true },
        temperature: { sensorType: 'temperature', value: 25.0, unit: 'C', isAnomaly: false },
      });
      expect(evalResult.score).toBeGreaterThanOrEqual(85);
      expect(evalResult.indicators).toContain('SEVERE_MULTI_SENSOR_SURGE');
    });

    it('should handle missing sensor data safely without artificial risk inflation', () => {
      // Only vibration and noise available, both normal
      const evalResult = sensorRiskCalculator.calculate({
        vibration: { sensorType: 'vibration', value: 0.15, unit: 'g', isAnomaly: false },
        noise: { sensorType: 'noise', value: 52.0, unit: 'dB', isAnomaly: false },
      });
      expect(evalResult.score).toBe(0); // Missing data does NOT become high risk
      expect(evalResult.indicators).toContain('MISSING_SENSOR_DATA');
      expect(evalResult.missingSensors).toContain('dust');
      expect(evalResult.missingSensors).toContain('temperature');
      expect(evalResult.missingSensors).toContain('motion');
    });

    it('should return 0 safely when no sensor data is available', () => {
      const evalResult = sensorRiskCalculator.calculate({});
      expect(evalResult.score).toBe(0);
      expect(evalResult.indicators).toContain('MISSING_SENSOR_DATA');
    });
  });

  describe('TimeRiskCalculator', () => {
    it('should return score 0 when activity is inside permitted daytime hours', () => {
      const evalResult = timeRiskCalculator.calculate(
        new Date('2026-10-08T12:30:00Z'),
        '08:00',
        '18:00'
      );
      expect(evalResult.score).toBe(0);
      expect(evalResult.isInsidePermittedHours).toBe(true);
    });

    it('should return score 80 and OUTSIDE_PERMITTED_HOURS when activity is outside daytime hours', () => {
      const evalResult = timeRiskCalculator.calculate(
        new Date('2026-10-08T23:45:00Z'),
        '08:00',
        '18:00'
      );
      expect(evalResult.score).toBe(80);
      expect(evalResult.indicators).toContain('OUTSIDE_PERMITTED_HOURS');
      expect(evalResult.isInsidePermittedHours).toBe(false);
    });

    it('should correctly handle overnight permitted windows crossing midnight', () => {
      // Window: 22:00 -> 06:00
      // 1. Time at 23:30 (inside overnight window)
      const lateNightResult = timeRiskCalculator.calculate(
        new Date('2026-10-08T23:30:00Z'),
        '22:00',
        '06:00'
      );
      expect(lateNightResult.score).toBe(0);
      expect(lateNightResult.isInsidePermittedHours).toBe(true);

      // 2. Time at 04:15 (inside overnight window)
      const earlyMorningResult = timeRiskCalculator.calculate(
        new Date('2026-10-08T04:15:00Z'),
        '22:00',
        '06:00'
      );
      expect(earlyMorningResult.score).toBe(0);
      expect(earlyMorningResult.isInsidePermittedHours).toBe(true);

      // 3. Time at 14:00 (outside overnight window)
      const afternoonResult = timeRiskCalculator.calculate(
        new Date('2026-10-08T14:00:00Z'),
        '22:00',
        '06:00'
      );
      expect(afternoonResult.score).toBe(80);
      expect(afternoonResult.indicators).toContain('OUTSIDE_PERMITTED_HOURS');
      expect(afternoonResult.isInsidePermittedHours).toBe(false);
    });

    it('should return neutral score and PERMIT_SCHEDULE_UNAVAILABLE when schedule is missing', () => {
      const evalResult = timeRiskCalculator.calculate(new Date(), null, null);
      expect(evalResult.score).toBe(30);
      expect(evalResult.indicators).toContain('PERMIT_SCHEDULE_UNAVAILABLE');
    });
  });

  describe('PermitRiskCalculator', () => {
    it('should return 0 for authorized site with active valid permit', () => {
      const evalResult = permitRiskCalculator.calculate(
        {
          authorized: true,
          permitStartDate: '2026-01-01',
          permitEndDate: '2026-12-31',
        },
        '2026-06-15'
      );
      expect(evalResult.score).toBe(0);
      expect(evalResult.permitStatus).toBe('VALID');
    });

    it('should return 95 and UNAUTHORIZED_SITE for unauthorized site', () => {
      const evalResult = permitRiskCalculator.calculate({
        authorized: false,
      });
      expect(evalResult.score).toBe(95);
      expect(evalResult.indicators).toContain('UNAUTHORIZED_SITE');
      expect(evalResult.permitStatus).toBe('UNAUTHORIZED');
    });

    it('should return 90 and EXPIRED_PERMIT for authorized site with expired permit', () => {
      const evalResult = permitRiskCalculator.calculate(
        {
          authorized: true,
          permitStartDate: '2025-01-01',
          permitEndDate: '2025-12-31',
        },
        '2026-10-08'
      );
      expect(evalResult.score).toBe(90);
      expect(evalResult.indicators).toContain('EXPIRED_PERMIT');
      expect(evalResult.permitStatus).toBe('EXPIRED');
    });

    it('should return 80 and PERMIT_NOT_YET_ACTIVE when observed prior to permit start date', () => {
      const evalResult = permitRiskCalculator.calculate(
        {
          authorized: true,
          permitStartDate: '2026-11-01',
          permitEndDate: '2026-12-31',
        },
        '2026-10-08'
      );
      expect(evalResult.score).toBe(80);
      expect(evalResult.indicators).toContain('PERMIT_NOT_YET_ACTIVE');
      expect(evalResult.permitStatus).toBe('NOT_YET_ACTIVE');
    });

    it('should return neutral 50 and MISSING_PERMIT_INFO when permit info is missing', () => {
      const evalResult = permitRiskCalculator.calculate(null);
      expect(evalResult.score).toBe(50);
      expect(evalResult.indicators).toContain('MISSING_PERMIT_INFO');
      expect(evalResult.permitStatus).toBe('UNKNOWN');
    });
  });

  describe('RiskExplanationGenerator', () => {
    it('should generate human-readable reason synthesizing evidence with non-legal disclaimer', () => {
      const { explanation, uniqueIndicators } = riskExplanationGenerator.generate({
        overallScore: 82.5,
        riskLevel: 'CRITICAL',
        componentScores: {
          visual: 80,
          change: 85,
          sensor: 90,
          time: 80,
          permit: 95,
        },
        indicators: [
          'HEAVY_MACHINERY_DETECTED',
          'HIGH_IMAGE_CHANGE',
          'VIBRATION_ANOMALY',
          'OUTSIDE_PERMITTED_HOURS',
          'UNAUTHORIZED_SITE',
        ],
        detectedClasses: ['excavator', 'truck'],
      });

      expect(explanation).toContain('CRITICAL risk assessment (82.5/100)');
      expect(explanation).toContain('excavator');
      expect(explanation).toContain('outside permitted operating hours');
      expect(explanation).toContain('potentially unauthorized construction activity requiring human inspection');
      expect(uniqueIndicators).toHaveLength(5);
    });
  });
});
