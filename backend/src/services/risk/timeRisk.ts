export interface TimeRiskConfig {
  outsideHoursScore: number;      // default 80
  unavailableHoursScore: number;  // default 30 (neutral)
}

export const DEFAULT_TIME_RISK_CONFIG: TimeRiskConfig = {
  outsideHoursScore: 80.0,
  unavailableHoursScore: 30.0,
};

export interface TimeRiskEvaluation {
  score: number;
  indicators: string[];
  isInsidePermittedHours: boolean | null;
  currentTimeString: string;
  permittedWindow?: string;
}

export class TimeRiskCalculator {
  private config: TimeRiskConfig;

  constructor(customConfig?: Partial<TimeRiskConfig>) {
    this.config = {
      ...DEFAULT_TIME_RISK_CONFIG,
      ...customConfig,
    };
  }

  calculate(
    currentTime?: Date | string,
    permittedStartTime?: string | null,
    permittedEndTime?: string | null
  ): TimeRiskEvaluation {
    let currHours = 0;
    let currMinutes = 0;

    if (typeof currentTime === 'string') {
      const timeMatch = currentTime.match(/T(\d{2}):(\d{2})/) || currentTime.match(/^(\d{2}):(\d{2})/);
      if (timeMatch) {
        currHours = parseInt(timeMatch[1], 10);
        currMinutes = parseInt(timeMatch[2], 10);
      } else {
        const d = new Date(currentTime);
        currHours = d.getUTCHours();
        currMinutes = d.getUTCMinutes();
      }
    } else if (currentTime instanceof Date) {
      currHours = currentTime.getUTCHours();
      currMinutes = currentTime.getUTCMinutes();
    } else {
      const now = new Date();
      currHours = now.getHours();
      currMinutes = now.getMinutes();
    }

    const currentMinutesFromMidnight = currHours * 60 + currMinutes;
    const currentTimeString = `${currHours.toString().padStart(2, '0')}:${currMinutes.toString().padStart(2, '0')}`;

    // Missing permit schedule
    if (!permittedStartTime || !permittedEndTime) {
      return {
        score: this.config.unavailableHoursScore,
        indicators: ['PERMIT_SCHEDULE_UNAVAILABLE'],
        isInsidePermittedHours: null,
        currentTimeString,
      };
    }

    const startMinutes = this.parseTimeStringToMinutes(permittedStartTime);
    const endMinutes = this.parseTimeStringToMinutes(permittedEndTime);

    if (startMinutes === null || endMinutes === null) {
      return {
        score: this.config.unavailableHoursScore,
        indicators: ['PERMIT_SCHEDULE_UNAVAILABLE'],
        isInsidePermittedHours: null,
        currentTimeString,
      };
    }

    const permittedWindow = `${permittedStartTime} - ${permittedEndTime}`;
    let isInside = false;

    if (startMinutes <= endMinutes) {
      // Standard daytime window (e.g., 07:00 to 18:00)
      isInside = currentMinutesFromMidnight >= startMinutes && currentMinutesFromMidnight <= endMinutes;
    } else {
      // Overnight window crossing midnight (e.g., 22:00 to 06:00)
      isInside = currentMinutesFromMidnight >= startMinutes || currentMinutesFromMidnight <= endMinutes;
    }

    if (isInside) {
      return {
        score: 0,
        indicators: [],
        isInsidePermittedHours: true,
        currentTimeString,
        permittedWindow,
      };
    }

    return {
      score: this.config.outsideHoursScore,
      indicators: ['OUTSIDE_PERMITTED_HOURS'],
      isInsidePermittedHours: false,
      currentTimeString,
      permittedWindow,
    };
  }

  private parseTimeStringToMinutes(timeStr: string): number | null {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      return null;
    }
    return h * 60 + m;
  }
}

export const timeRiskCalculator = new TimeRiskCalculator();
