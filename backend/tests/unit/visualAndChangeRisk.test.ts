import { visualRiskCalculator, VisualRiskCalculator } from '../../src/services/risk/visualRisk';
import { changeRiskCalculator, ChangeRiskCalculator } from '../../src/services/risk/changeRisk';

describe('Visual Risk & Change Risk Unit Tests', () => {
  describe('VisualRiskCalculator', () => {
    it('should return score 0 when no objects are detected', () => {
      const evalResult = visualRiskCalculator.calculate([]);
      expect(evalResult.score).toBe(0);
      expect(evalResult.indicators).toEqual([]);
      expect(evalResult.detectedClasses).toEqual([]);
    });

    it('should calculate high score and flag HEAVY_MACHINERY_DETECTED for excavator', () => {
      const evalResult = visualRiskCalculator.calculate([
        { class: 'excavator', confidence: 0.95 },
      ]);
      // 70 * 0.95 = 66.5
      expect(evalResult.score).toBe(66.5);
      expect(evalResult.indicators).toContain('HEAVY_MACHINERY_DETECTED');
    });

    it('should flag TRUCK_DETECTED and PERSONNEL_DETECTED for truck and workers', () => {
      const evalResult = visualRiskCalculator.calculate([
        { class: 'truck', confidence: 0.8 },
        { class: 'person', confidence: 0.9 },
      ]);
      expect(evalResult.indicators).toContain('TRUCK_DETECTED');
      expect(evalResult.indicators).toContain('PERSONNEL_DETECTED');
    });

    it('should flag MULTIPLE_CONSTRUCTION_OBJECTS and cap score at 100 for high volume of machinery', () => {
      const evalResult = visualRiskCalculator.calculate([
        { class: 'excavator', confidence: 0.9 },
        { class: 'crane', confidence: 0.9 },
        { class: 'truck', confidence: 0.85 },
        { class: 'worker', confidence: 0.9 },
      ]);
      expect(evalResult.indicators).toContain('MULTIPLE_CONSTRUCTION_OBJECTS');
      expect(evalResult.score).toBe(100);
    });

    it('should respect custom class weight configurations', () => {
      const customCalculator = new VisualRiskCalculator({
        classWeights: { crane: 10 },
      });
      const evalResult = customCalculator.calculate([
        { class: 'crane', confidence: 1.0 },
      ]);
      expect(evalResult.score).toBe(10);
    });
  });

  describe('ChangeRiskCalculator', () => {
    it('should return 0 when change percentage is 0', () => {
      const evalResult = changeRiskCalculator.calculate(0);
      expect(evalResult.score).toBe(0);
      expect(evalResult.indicators).toEqual([]);
    });

    it('should return low score and LOW_IMAGE_CHANGE for 0–5% delta', () => {
      const evalResult = changeRiskCalculator.calculate(4.0);
      // (4/5) * 25 = 20.0
      expect(evalResult.score).toBe(20.0);
      expect(evalResult.indicators).toContain('LOW_IMAGE_CHANGE');
    });

    it('should return moderate score and MODERATE_IMAGE_CHANGE for 5–15% delta', () => {
      const evalResult = changeRiskCalculator.calculate(10.0);
      // 25 + (5/10)*30 = 40.0
      expect(evalResult.score).toBe(40.0);
      expect(evalResult.indicators).toContain('MODERATE_IMAGE_CHANGE');
    });

    it('should return high score and HIGH_IMAGE_CHANGE for 15–30% delta', () => {
      const evalResult = changeRiskCalculator.calculate(20.0);
      // 55 + (5/15)*30 = 65.0
      expect(evalResult.score).toBe(65.0);
      expect(evalResult.indicators).toContain('HIGH_IMAGE_CHANGE');
    });

    it('should return critical score and CRITICAL_IMAGE_CHANGE for > 30% delta', () => {
      const evalResult = changeRiskCalculator.calculate(50.0);
      expect(evalResult.score).toBeGreaterThanOrEqual(85.0);
      expect(evalResult.indicators).toContain('CRITICAL_IMAGE_CHANGE');
    });

    it('should preserve changeType and changedRegions in structured result', () => {
      const evalResult = changeRiskCalculator.calculate({
        changePercentage: 18.5,
        changeType: 'STRUCTURAL_ADDITION',
        changedRegions: [{ x: 10, y: 20, w: 100, h: 80 }],
      });
      expect(evalResult.changePercentage).toBe(18.5);
      expect(evalResult.changeType).toBe('STRUCTURAL_ADDITION');
      expect(evalResult.changedRegions).toHaveLength(1);
    });
  });
});
