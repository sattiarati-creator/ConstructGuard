import { sensorPayloadSchema } from '../../src/mqtt/validation';
import { buildSensorTopic, parseSensorTopic, SENSOR_TOPIC_WILDCARD } from '../../src/mqtt/topics';

describe('MQTT Validation and Topics Unit Tests', () => {
  describe('sensorPayloadSchema validation', () => {
    const validBasePayload = {
      site_id: 'site-101',
      sensor_id: 'vib-001',
      sensor_type: 'vibration',
      value: 0.18,
      unit: 'g',
      timestamp: '2026-10-08T10:00:00.000Z',
    };

    it('should successfully validate a correct vibration payload', () => {
      const result = sensorPayloadSchema.safeParse(validBasePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.site_id).toBe('site-101');
        expect(result.data.sensor_type).toBe('vibration');
        expect(result.data.value).toBe(0.18);
      }
    });

    it('should successfully validate noise, dust, motion, and temperature payloads', () => {
      const payloads = [
        { ...validBasePayload, sensor_id: 'noise-001', sensor_type: 'noise', value: 55.4, unit: 'dB' },
        { ...validBasePayload, sensor_id: 'dust-001', sensor_type: 'dust', value: 28.0, unit: 'ug/m3' },
        { ...validBasePayload, sensor_id: 'motion-001', sensor_type: 'motion', value: 1.0, unit: 'state' },
        { ...validBasePayload, sensor_id: 'temp-001', sensor_type: 'temperature', value: 27.5, unit: 'C' },
      ];

      for (const p of payloads) {
        const result = sensorPayloadSchema.safeParse(p);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid sensor type', () => {
      const invalid = { ...validBasePayload, sensor_type: 'radiation' };
      const result = sensorPayloadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject missing site_id or sensor_id', () => {
      const missingSite = { ...validBasePayload, site_id: '' };
      expect(sensorPayloadSchema.safeParse(missingSite).success).toBe(false);

      const missingSensor = { ...validBasePayload, sensor_id: '' };
      expect(sensorPayloadSchema.safeParse(missingSensor).success).toBe(false);
    });

    it('should reject invalid timestamp format', () => {
      const invalidTime = { ...validBasePayload, timestamp: 'invalid-date-string' };
      const result = sensorPayloadSchema.safeParse(invalidTime);
      expect(result.success).toBe(false);
    });

    it('should reject values outside physical bounds', () => {
      // Negative vibration
      expect(sensorPayloadSchema.safeParse({ ...validBasePayload, value: -1.0 }).success).toBe(false);
      // Vibration > 10.0g
      expect(sensorPayloadSchema.safeParse({ ...validBasePayload, value: 15.0 }).success).toBe(false);
      // Noise > 200 dB
      expect(
        sensorPayloadSchema.safeParse({
          ...validBasePayload,
          sensor_type: 'noise',
          value: 250.0,
        }).success
      ).toBe(false);
      // Dust > 1000 ug/m3
      expect(
        sensorPayloadSchema.safeParse({
          ...validBasePayload,
          sensor_type: 'dust',
          value: 1200.0,
        }).success
      ).toBe(false);
      // Temperature > 150 C
      expect(
        sensorPayloadSchema.safeParse({
          ...validBasePayload,
          sensor_type: 'temperature',
          value: 180.0,
        }).success
      ).toBe(false);
      // Motion not 0.0 or 1.0
      expect(
        sensorPayloadSchema.safeParse({
          ...validBasePayload,
          sensor_type: 'motion',
          value: 2.5,
        }).success
      ).toBe(false);
    });
  });

  describe('Topic helpers', () => {
    it('should build standardized topic strings', () => {
      const topic = buildSensorTopic('site-101', 'vibration');
      expect(topic).toBe('constructguard/sites/site-101/sensors/vibration');
    });

    it('should parse valid sensor topics', () => {
      const parsed = parseSensorTopic('constructguard/sites/site-102/sensors/noise');
      expect(parsed).toEqual({
        siteId: 'site-102',
        sensorType: 'noise',
      });
    });

    it('should return null for malformed topics', () => {
      expect(parseSensorTopic('random/unrelated/topic')).toBeNull();
      expect(parseSensorTopic('constructguard/sites/site-101')).toBeNull();
      expect(parseSensorTopic('constructguard/sites/site-101/cameras/cam-1')).toBeNull();
    });

    it('should match wildcard subscription pattern', () => {
      expect(SENSOR_TOPIC_WILDCARD).toBe('constructguard/sites/+/sensors/+');
    });
  });
});
