import { ComponentScores, RiskLevel } from './types';

export interface ExplanationInput {
  overallScore: number;
  riskLevel: RiskLevel;
  componentScores: ComponentScores;
  indicators: string[];
  detectedClasses?: string[];
  permitDetails?: string;
}

export class RiskExplanationGenerator {
  generate(input: ExplanationInput): { explanation: string; uniqueIndicators: string[] } {
    const { overallScore, riskLevel, componentScores, indicators, detectedClasses } = input;

    // Deduplicate indicators while preserving order
    const uniqueIndicators = Array.from(new Set(indicators));

    const evidenceClauses: string[] = [];

    // 1. Visual evidence description
    if (componentScores.visual >= 60) {
      const machinery = detectedClasses?.filter((c) =>
        ['excavator', 'crane', 'bulldozer', 'truck', 'machinery'].includes(c)
      );
      if (machinery && machinery.length > 0) {
        evidenceClauses.push(`heavy construction machinery (${Array.from(new Set(machinery)).join(', ')}) was visually identified`);
      } else {
        evidenceClauses.push('intensive visual construction activity was detected');
      }
    } else if (componentScores.visual >= 30) {
      evidenceClauses.push('moderate construction equipment or personnel presence was observed');
    }

    // 2. Structural change description
    if (uniqueIndicators.includes('CRITICAL_IMAGE_CHANGE')) {
      evidenceClauses.push('major structural transformation (>30% visual change) occurred');
    } else if (uniqueIndicators.includes('HIGH_IMAGE_CHANGE')) {
      evidenceClauses.push('significant image change (15-30%) was detected');
    } else if (uniqueIndicators.includes('MODERATE_IMAGE_CHANGE')) {
      evidenceClauses.push('moderate visual terrain/structural change was detected');
    }

    // 3. IoT Sensor anomalies description
    const sensorAnomalies: string[] = [];
    if (uniqueIndicators.includes('VIBRATION_ANOMALY')) sensorAnomalies.push('vibration');
    if (uniqueIndicators.includes('NOISE_ANOMALY')) sensorAnomalies.push('noise');
    if (uniqueIndicators.includes('MOTION_DETECTED')) sensorAnomalies.push('motion');
    if (uniqueIndicators.includes('DUST_ANOMALY')) sensorAnomalies.push('particulate dust');
    if (uniqueIndicators.includes('TEMPERATURE_ANOMALY')) sensorAnomalies.push('temperature');

    if (sensorAnomalies.length > 0) {
      evidenceClauses.push(`IoT perimeter sensors reported abnormal ${sensorAnomalies.join(' and ')} telemetry`);
    }

    // 4. Temporal schedule description
    if (uniqueIndicators.includes('OUTSIDE_PERMITTED_HOURS')) {
      evidenceClauses.push('activity occurred outside permitted operating hours');
    }

    // 5. Authorization / Permit status description
    if (uniqueIndicators.includes('UNAUTHORIZED_SITE')) {
      evidenceClauses.push('site has no authorization for construction');
    } else if (uniqueIndicators.includes('EXPIRED_PERMIT')) {
      evidenceClauses.push('site permit has expired');
    } else if (uniqueIndicators.includes('PERMIT_NOT_YET_ACTIVE')) {
      evidenceClauses.push('activity preceded the authorized permit start date');
    }

    // 6. Assemble human-readable text
    let explanation = '';
    if (evidenceClauses.length > 0) {
      const joinedEvidence = evidenceClauses.length === 1
        ? evidenceClauses[0]
        : `${evidenceClauses.slice(0, -1).join(', ')}, and ${evidenceClauses[evidenceClauses.length - 1]}`;

      explanation = `${riskLevel} risk assessment (${overallScore}/100) because ${joinedEvidence}.`;
    } else {
      explanation = `Normal baseline site conditions (${overallScore}/100) with no anomalous physical or visual indicators detected.`;
    }

    // Non-legal disclaimer requirement
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      explanation += ' System identifies potentially unauthorized construction activity requiring human inspection.';
    } else if (riskLevel === 'MEDIUM') {
      explanation += ' Routine surveillance advisory: recommended for inspector review if unexpected.';
    }

    return {
      explanation,
      uniqueIndicators,
    };
  }
}

export const riskExplanationGenerator = new RiskExplanationGenerator();
