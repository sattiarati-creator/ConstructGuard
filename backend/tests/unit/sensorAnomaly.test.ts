import { SensorAnomalyService } from '../../src/services/sensorAnomalyService';

describe('SensorAnomalyService Unit Tests', () => {
  let service: SensorAnomalyService;

  beforeEach(() => {
    service = new SensorAnomalyService();
  });

  describe('Vibration Anomaly Evaluation', () => {
    it('should mark vibration <= 0.40g as normal', () => {
      const result = service.evaluate('vibration', 0.15, 'g');
      expect(result.is_anomaly).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should mark vibration > 0.40g as anomalous', () => {
      const result = service.evaluate('vibration', 0.85, 'g');
      expect(result.is_anomaly).toBe(true);
      expect(result.reason).toContain('exceeds baseline threshold');
      expect(result.details?.sensorType).toBe('vibration');
      expect(result.details?.value).toBe(0.85);
    });
  });

  describe('Noise Anomaly Evaluation', () => {
    it('should mark noise <= 75.0 dB as normal', () => {
      const result = service.evaluate('noise', 55.0, 'dB');
      expect(result.is_anomaly).toBe(false);
    });

    it('should mark noise > 75.0 dB as anomalous', () => {
      const result = service.evaluate('noise', 92.5, 'dB');
      expect(result.is_anomaly).toBe(true);
      expect(result.reason).toContain('exceeds baseline threshold');
    });
  });

  describe('Dust Anomaly Evaluation', () => {
    it('should mark dust <= 60.0 ug/m3 as normal', () => {
      const result = service.evaluate('dust', 30.0, 'ug/m3');
      expect(result.is_anomaly).toBe(false);
    });

    it('should mark dust > 60.0 ug/m3 as anomalous', () => {
      const result = service.evaluate('dust', 110.0, 'ug/m3');
      expect(result.is_anomaly).toBe(true);
      expect(result.reason).toContain('exceeds baseline threshold');
    });
  });

  describe('Temperature Anomaly Evaluation', () => {
    it('should mark temperature <= 42.0 C as normal', () => {
      const result = service.evaluate('temperature', 28.0, 'C');
      expect(result.is_anomaly).toBe(false);
    });

    it('should mark temperature > 42.0 C as anomalous', () => {
      const result = service.evaluate('temperature', 52.0, 'C');
      expect(result.is_anomaly).toBe(true);
      expect(result.reason).toContain('exceeds baseline threshold');
    });
  });

  describe('Motion Anomaly Evaluation', () => {
    it('should mark motion 0.0 as normal', () => {
      const result = service.evaluate('motion', 0.0, 'state');
      expect(result.is_anomaly).toBe(false);
    });

    it('should mark motion >= 1.0 as anomalous perimeter event', () => {
      const result = service.evaluate('motion', 1.0, 'state');
      expect(result.is_anomaly).toBe(true);
      expect(result.reason).toBe('Active perimeter motion detected');
    });
  });

  describe('Custom Threshold Overrides', () => {
    it('should support customized threshold configurations', () => {
      const customService = new SensorAnomalyService({ vibration: 0.60 });
      expect(customService.evaluate('vibration', 0.50, 'g').is_anomaly).toBe(false);
      expect(customService.evaluate('vibration', 0.65, 'g').is_anomaly).toBe(true);
    });
  });
});
