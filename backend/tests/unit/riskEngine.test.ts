import { RiskEngine } from '../../src/services/risk/riskEngine';

describe('RiskEngine Unit Tests', () => {
  let engine: RiskEngine;

  beforeEach(() => {
    engine = new RiskEngine();
  });

  describe('Weighted Score Formula', () => {
    it('should calculate exact weighted score according to specification', () => {
      // visual: 70 * 0.35 = 24.50
      // change: 80 * 0.25 = 20.00
      // sensor: 60 * 0.20 = 12.00
      // time: 80 * 0.10 = 8.00
      // permit: 50 * 0.10 = 5.00
      // Total = 24.50 + 20.00 + 12.00 + 8.00 + 5.00 = 69.50
      const result = engine.evaluate({
        siteId: 'site-101',
        visualScore: 70,
        changeScore: 80,
        sensorScore: 60,
        timeScore: 80,
        permitScore: 50,
      });

      expect(result.overallScore).toBe(69.5);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.componentScores).toEqual({
        visual: 70,
        change: 80,
        sensor: 60,
        time: 80,
        permit: 50,
      });
    });

    it('should round the final score to two decimal places', () => {
      // visual: 33.33 * 0.35 = 11.6655
      // change: 44.44 * 0.25 = 11.11
      // sensor: 55.55 * 0.20 = 11.11
      // time: 66.66 * 0.10 = 6.666
      // permit: 77.77 * 0.10 = 7.777
      // Total = 48.3285 -> rounded to 48.33
      const result = engine.evaluate({
        siteId: 'site-102',
        visualScore: 33.33,
        changeScore: 44.44,
        sensorScore: 55.55,
        timeScore: 66.66,
        permitScore: 77.77,
      });

      expect(result.overallScore).toBe(48.33);
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should clamp out-of-range component scores between 0 and 100', () => {
      const result = engine.evaluate({
        siteId: 'site-103',
        visualScore: -20,
        changeScore: 150,
        sensorScore: 50,
        timeScore: 0,
        permitScore: 100,
      });

      // visual clamped to 0 -> 0 * 0.35 = 0
      // change clamped to 100 -> 100 * 0.25 = 25
      // sensor -> 50 * 0.20 = 10
      // time -> 0 * 0.10 = 0
      // permit -> 100 * 0.10 = 10
      // Total = 45.0
      expect(result.componentScores.visual).toBe(0);
      expect(result.componentScores.change).toBe(100);
      expect(result.overallScore).toBe(45);
      expect(result.riskLevel).toBe('MEDIUM');
    });
  });

  describe('Risk Level Classification', () => {
    it('should assign LOW risk level for score 0–29', () => {
      const result = engine.evaluate({
        siteId: 'site-101',
        visualScore: 10,
        changeScore: 10,
        sensorScore: 0,
        timeScore: 0,
        permitScore: 0,
      });
      // 10*0.35 + 10*0.25 = 6.0
      expect(result.overallScore).toBe(6.0);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should assign MEDIUM risk level for score 30–59', () => {
      const result = engine.evaluate({
        siteId: 'site-101',
        visualScore: 40,
        changeScore: 40,
        sensorScore: 40,
        timeScore: 30,
        permitScore: 30,
      });
      // 40*0.35 + 40*0.25 + 40*0.20 + 30*0.10 + 30*0.10 = 14 + 10 + 8 + 3 + 3 = 38.0
      expect(result.overallScore).toBe(38.0);
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should assign HIGH risk level for score 60–79', () => {
      const result = engine.evaluate({
        siteId: 'site-101',
        visualScore: 70,
        changeScore: 65,
        sensorScore: 70,
        timeScore: 80,
        permitScore: 60,
      });
      // 70*0.35 + 65*0.25 + 70*0.20 + 80*0.10 + 60*0.10 = 24.5 + 16.25 + 14 + 8 + 6 = 68.75
      expect(result.overallScore).toBe(68.75);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should assign CRITICAL risk level for score 80–100', () => {
      const result = engine.evaluate({
        siteId: 'site-101',
        visualScore: 90,
        changeScore: 95,
        sensorScore: 85,
        timeScore: 80,
        permitScore: 90,
      });
      // 90*0.35 + 95*0.25 + 85*0.20 + 80*0.10 + 90*0.10 = 31.5 + 23.75 + 17 + 8 + 9 = 89.25
      expect(result.overallScore).toBe(89.25);
      expect(result.riskLevel).toBe('CRITICAL');
    });
  });

  describe('Raw Evidence Processing', () => {
    it('should evaluate end-to-end evidence when raw data is provided instead of pre-computed scores', () => {
      const result = engine.evaluate({
        siteId: 'site-104',
        detectedObjects: [
          { class: 'excavator', confidence: 0.9 },
          { class: 'truck', confidence: 0.8 },
        ],
        imageChangePercentage: 25.0,
        sensorAnomalies: {
          vibration: { sensorType: 'vibration', value: 0.95, unit: 'g', isAnomaly: true },
          noise: { sensorType: 'noise', value: 95.0, unit: 'dB', isAnomaly: true },
        },
        currentTime: '2026-10-08T23:30:00Z', // 11:30 PM (outside daytime hours)
        permitInformation: {
          authorized: false,
          permittedStartTime: '08:00',
          permittedEndTime: '18:00',
        },
      });

      expect(result.componentScores.visual).toBeGreaterThan(60);
      expect(result.componentScores.change).toBeGreaterThan(60);
      expect(result.componentScores.sensor).toBeGreaterThan(60);
      expect(result.componentScores.time).toBe(80);
      expect(result.componentScores.permit).toBe(95);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.indicators).toContain('HEAVY_MACHINERY_DETECTED');
      expect(result.indicators).toContain('UNAUTHORIZED_SITE');
      expect(result.indicators).toContain('OUTSIDE_PERMITTED_HOURS');
    });
  });
});
