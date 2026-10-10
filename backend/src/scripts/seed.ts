import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { hashPassword } from '../auth/password';

export const runSeed = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    logger.info('Beginning ConstructGuard database seeding...');
    await client.query('BEGIN');

    // 1. Clean existing seed records cleanly in reverse dependency order
    await client.query(`
      TRUNCATE TABLE audit_logs, refresh_tokens, alerts, risk_events, image_changes, detections,
      processing_jobs, images, sensor_readings, cameras, sites, users CASCADE;
    `);

    // 2. Generate Real Bcrypt Hashes for Seed Users
    const adminHash = await hashPassword('Admin@123');
    const inspectorHash = await hashPassword('Inspector@123');
    const viewerHash = await hashPassword('Viewer@123');

    // Insert Users
    const userRes = await client.query(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES 
        ('a1b2c3d4-0001-4000-8000-000000000001', 'Chief Inspector Sharma', 'inspector@constructguard.local', '${inspectorHash}', 'INSPECTOR'),
        ('a1b2c3d4-0001-4000-8000-000000000002', 'System Administrator', 'admin@constructguard.local', '${adminHash}', 'ADMIN'),
        ('a1b2c3d4-0001-4000-8000-000000000003', 'Public Viewer Auditor', 'viewer@constructguard.local', '${viewerHash}', 'VIEWER')
      RETURNING id, name, role;
    `);
    const inspectorId = userRes.rows[0].id;
    logger.info(`Seeded ${userRes.rowCount} users with valid bcrypt password hashes.`);

    // 3. Insert 5 Construction Sites
    const siteRes = await client.query(`
      INSERT INTO sites (id, code, name, latitude, longitude, address, authorized, permit_number, permit_start_date, permit_end_date, permitted_start_time, permitted_end_time)
      VALUES 
        ('b2c3d4e5-0002-4000-8000-000000000101', 'site-101', 'Site 101 - Metro Rail Extension', 12.9715987, 77.5945627, 'Plot 12, MG Road Metro Corridor, Bangalore', true, 'BLR-METRO-2026-091', '2026-01-01', '2026-12-31', '07:00:00', '18:00:00'),
        ('b2c3d4e5-0002-4000-8000-000000000102', 'site-102', 'Site 102 - Urban Green Residences', 12.9351929, 77.6244807, '4th Block, Koramangala Outer Ring, Bangalore', true, 'BBMP-RES-2026-4412', '2026-03-01', '2026-11-30', '08:00:00', '19:00:00'),
        ('b2c3d4e5-0002-4000-8000-000000000103', 'site-103', 'Site 103 - Downtown Commercial Complex', 12.9783692, 77.6408356, '100ft Road, Indiranagar, Bangalore', true, 'BBMP-COM-2026-1189', '2026-02-15', '2026-10-15', '06:00:00', '20:00:00'),
        ('b2c3d4e5-0002-4000-8000-000000000104', 'site-104', 'Site 104 - Riverside Waterfront Villa', 13.0358421, 77.5970222, 'Hebbal Lake Waterfront Buffer Zone, Bangalore', false, 'EXPIRED-2025-WTR-04', '2025-01-01', '2025-06-30', '08:00:00', '18:00:00'),
        ('b2c3d4e5-0002-4000-8000-000000000105', 'site-105', 'Site 105 - Tech Valley Industrial Park', 12.8399389, 77.6770031, 'Electronics City Phase 1, Bangalore', true, 'KIADB-IND-2026-8801', '2026-01-10', '2027-01-10', '07:00:00', '17:00:00')
      RETURNING id, name;
    `);
    logger.info(`Seeded ${siteRes.rowCount} sites.`);


    const s101 = 'b2c3d4e5-0002-4000-8000-000000000101';
    const s102 = 'b2c3d4e5-0002-4000-8000-000000000102';
    const s103 = 'b2c3d4e5-0002-4000-8000-000000000103';
    const s104 = 'b2c3d4e5-0002-4000-8000-000000000104';
    const s105 = 'b2c3d4e5-0002-4000-8000-000000000105';

    // 4. Insert 8 Cameras
    const camRes = await client.query(`
      INSERT INTO cameras (id, site_id, name, stream_url, status, last_seen_at)
      VALUES
        ('c3d4e5f6-0003-4000-8000-000000000201', '${s101}', 'CAM-101-North Gate', 'rtsp://stream.constructguard.internal/101/north', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000202', '${s101}', 'CAM-101-Excavation Pit', 'rtsp://stream.constructguard.internal/101/pit', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000203', '${s102}', 'CAM-102-East Perimeter', 'rtsp://stream.constructguard.internal/102/east', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000204', '${s102}', 'CAM-102-Tower Crane Base', 'rtsp://stream.constructguard.internal/102/crane', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000205', '${s103}', 'CAM-103-Main Entrance', 'rtsp://stream.constructguard.internal/103/main', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000206', '${s103}', 'CAM-103-Loading Bay', 'rtsp://stream.constructguard.internal/103/loading', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000207', '${s104}', 'CAM-104-Perimeter Cam', 'rtsp://stream.constructguard.internal/104/fence', 'ONLINE', NOW()),
        ('c3d4e5f6-0003-4000-8000-000000000208', '${s105}', 'CAM-105-Warehouse Grid', 'rtsp://stream.constructguard.internal/105/grid', 'ONLINE', NOW())
      RETURNING id, name;
    `);
    logger.info(`Seeded ${camRes.rowCount} cameras.`);

    const cam101 = 'c3d4e5f6-0003-4000-8000-000000000201';
    const cam102 = 'c3d4e5f6-0003-4000-8000-000000000203';
    const cam104 = 'c3d4e5f6-0003-4000-8000-000000000207';

    // 5. Insert Sensor Readings across sites
    await client.query(`
      INSERT INTO sensor_readings (site_id, sensor_id, sensor_type, value, unit, timestamp)
      VALUES
        ('${s101}', 'sens-101-vib-01', 'vibration', 0.12, 'g', NOW() - INTERVAL '30 minutes'),
        ('${s101}', 'sens-101-noise-01', 'noise', 52.40, 'dB', NOW() - INTERVAL '30 minutes'),
        ('${s101}', 'sens-101-mot-01', 'motion', 0.00, 'status', NOW() - INTERVAL '30 minutes'),
        ('${s102}', 'sens-102-vib-01', 'vibration', 0.85, 'g', NOW() - INTERVAL '15 minutes'),
        ('${s102}', 'sens-102-noise-01', 'noise', 86.50, 'dB', NOW() - INTERVAL '15 minutes'),
        ('${s102}', 'sens-102-dust-01', 'dust', 110.20, 'ug/m3', NOW() - INTERVAL '15 minutes'),
        ('${s104}', 'sens-104-vib-01', 'vibration', 1.45, 'g', NOW() - INTERVAL '5 minutes'),
        ('${s104}', 'sens-104-noise-01', 'noise', 98.70, 'dB', NOW() - INTERVAL '5 minutes'),
        ('${s104}', 'sens-104-mot-01', 'motion', 1.00, 'status', NOW() - INTERVAL '5 minutes'),
        ('${s104}', 'sens-104-dust-01', 'dust', 240.00, 'ug/m3', NOW() - INTERVAL '5 minutes'),
        ('${s105}', 'sens-105-temp-01', 'temperature', 26.50, 'C', NOW() - INTERVAL '10 minutes');
    `);
    logger.info('Seeded sensor readings across sites.');

    // 6. Insert Captured Images
    const imgRes = await client.query(`
      INSERT INTO images (id, camera_id, image_hash, storage_path, captured_at, processing_status)
      VALUES
        ('d4e5f6a7-0004-4000-8000-000000000301', '${cam101}', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '/storage/site101/cam1_baseline.jpg', NOW() - INTERVAL '2 hours', 'COMPLETED'),
        ('d4e5f6a7-0004-4000-8000-000000000302', '${cam101}', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', '/storage/site101/cam1_current.jpg', NOW() - INTERVAL '1 hour', 'COMPLETED'),
        ('d4e5f6a7-0004-4000-8000-000000000303', '${cam102}', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', '/storage/site102/cam3_current.jpg', NOW() - INTERVAL '20 minutes', 'COMPLETED'),
        ('d4e5f6a7-0004-4000-8000-000000000304', '${cam104}', '2e7d2c03a9507ae265ecf5b5356885a53393a2029d24139499ddf66f140665f9', '/storage/site104/cam7_night.jpg', NOW() - INTERVAL '5 minutes', 'COMPLETED')
      RETURNING id, image_hash;
    `);
    logger.info(`Seeded ${imgRes.rowCount} images.`);

    const img301 = 'd4e5f6a7-0004-4000-8000-000000000301';
    const img302 = 'd4e5f6a7-0004-4000-8000-000000000302';
    const img303 = 'd4e5f6a7-0004-4000-8000-000000000303';
    const img304 = 'd4e5f6a7-0004-4000-8000-000000000304';

    // 7. Insert Detections
    await client.query(`
      INSERT INTO detections (image_id, object_class, confidence, bounding_box, detected_at)
      VALUES
        ('${img302}', 'person', 0.88, '{"x": 120, "y": 200, "width": 45, "height": 110}', NOW() - INTERVAL '1 hour'),
        ('${img303}', 'truck', 0.92, '{"x": 300, "y": 180, "width": 210, "height": 140}', NOW() - INTERVAL '20 minutes'),
        ('${img303}', 'worker', 0.79, '{"x": 260, "y": 220, "width": 40, "height": 95}', NOW() - INTERVAL '20 minutes'),
        ('${img304}', 'excavator', 0.95, '{"x": 150, "y": 140, "width": 310, "height": 220}', NOW() - INTERVAL '5 minutes'),
        ('${img304}', 'crane', 0.91, '{"x": 420, "y": 60, "width": 120, "height": 380}', NOW() - INTERVAL '5 minutes'),
        ('${img304}', 'person', 0.84, '{"x": 190, "y": 260, "width": 35, "height": 85}', NOW() - INTERVAL '5 minutes');
    `);
    logger.info('Seeded CV detections.');

    // 8. Insert Image Change Comparisons
    await client.query(`
      INSERT INTO image_changes (image_id, previous_image_id, change_percentage, change_type, changed_regions, detected_at)
      VALUES
        ('${img302}', '${img301}', 4.20, 'MINOR_MOVEMENT', '[{"box": [100, 150, 40, 60], "area": 2400}]'::jsonb, NOW() - INTERVAL '1 hour'),
        ('${img304}', NULL, 48.60, 'STRUCTURAL_ALTERATION', '[{"box": [120, 80, 280, 200], "area": 56000}]'::jsonb, NOW() - INTERVAL '5 minutes');
    `);
    logger.info('Seeded image change analyses.');

    // 9. Insert Risk Events (Covering all 4 tiers: LOW, MEDIUM, HIGH, CRITICAL)
    const riskRes = await client.query(`
      INSERT INTO risk_events (id, site_id, visual_score, change_score, sensor_score, time_score, permit_score, overall_score, risk_level, explanation, indicators, created_at)
      VALUES
        -- LOW RISK: Routine authorized site with negligible activity
        ('e5f6a7b8-0005-4000-8000-000000000401', '${s101}', 10.00, 4.00, 5.00, 0.00, 0.00, 4.80, 'LOW', 'Routine site monitoring during permitted hours. Minimal visual movement.', '["ROUTINE_MONITORING"]'::jsonb, NOW() - INTERVAL '2 hours'),
        
        -- MEDIUM RISK: Authorized site with elevated sound and delivery truck near permitted boundary
        ('e5f6a7b8-0005-4000-8000-000000000402', '${s103}', 35.00, 22.00, 40.00, 20.00, 0.00, 42.50, 'MEDIUM', 'Moderate noise and delivery vehicle movement detected nearing curfew limit.', '["ELEVATED_NOISE", "CURFEW_PROXIMITY"]'::jsonb, NOW() - INTERVAL '1 hour'),

        -- HIGH RISK: Authorized site operating outside permitted hours with heavy concrete vibration
        ('e5f6a7b8-0005-4000-8000-000000000403', '${s102}', 75.00, 38.00, 82.00, 85.00, 0.00, 74.20, 'HIGH', 'Heavy vibration and acoustic noise outside permitted window. Excavation work suspected.', '["VIBRATION_ANOMALY", "OUTSIDE_PERMITTED_HOURS"]'::jsonb, NOW() - INTERVAL '30 minutes'),

        -- CRITICAL RISK: Completely UNAUTHORIZED site running excavator and crane at night with high vibration
        ('e5f6a7b8-0005-4000-8000-000000000404', '${s104}', 94.00, 48.60, 92.00, 95.00, 100.00, 93.80, 'CRITICAL', 'CRITICAL VIOLATION: Excavator and crane active on expired/unauthorized waterfront site outside permitted hours with heavy ground vibration (1.45g).', '["HIGH_IMAGE_CHANGE", "VIBRATION_ANOMALY", "MOTION_DETECTED", "OUTSIDE_PERMITTED_HOURS", "EXPIRED_PERMIT"]'::jsonb, NOW() - INTERVAL '5 minutes')
      RETURNING id, risk_level, overall_score;
    `);
    logger.info(`Seeded ${riskRes.rowCount} risk events across LOW, MEDIUM, HIGH, and CRITICAL levels.`);

    const rMed = 'e5f6a7b8-0005-4000-8000-000000000402';
    const rHigh = 'e5f6a7b8-0005-4000-8000-000000000403';
    const rCrit = 'e5f6a7b8-0005-4000-8000-000000000404';

    // 10. Insert Operator Alerts
    await client.query(`
      INSERT INTO alerts (id, risk_event_id, severity, status, acknowledged_by, acknowledged_at, resolved_at, created_at)
      VALUES
        ('f6a7b8c9-0006-4000-8000-000000000501', '${rCrit}', 'CRITICAL', 'OPEN', NULL, NULL, NULL, NOW() - INTERVAL '5 minutes'),
        ('f6a7b8c9-0006-4000-8000-000000000502', '${rHigh}', 'HIGH', 'OPEN', NULL, NULL, NULL, NOW() - INTERVAL '30 minutes'),
        ('f6a7b8c9-0006-4000-8000-000000000503', '${rMed}', 'MEDIUM', 'ACKNOWLEDGED', '${inspectorId}', NOW() - INTERVAL '45 minutes', NULL, NOW() - INTERVAL '1 hour');
    `);
    logger.info('Seeded operator alerts.');

    // 11. Insert Processing Jobs
    await client.query(`
      INSERT INTO processing_jobs (image_id, job_type, status, attempts, created_at, started_at, completed_at)
      VALUES
        ('${img304}', 'OBJECT_DETECTION', 'COMPLETED', 1, NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '5 minutes 50 seconds', NOW() - INTERVAL '5 minutes 45 seconds'),
        ('${img304}', 'CHANGE_DETECTION', 'COMPLETED', 1, NOW() - INTERVAL '5 minutes 45 seconds', NOW() - INTERVAL '5 minutes 40 seconds', NOW() - INTERVAL '5 minutes 35 seconds'),
        ('${img304}', 'RISK_CALCULATION', 'COMPLETED', 1, NOW() - INTERVAL '5 minutes 35 seconds', NOW() - INTERVAL '5 minutes 30 seconds', NOW() - INTERVAL '5 minutes 25 seconds');
    `);
    logger.info('Seeded processing jobs.');

    // 12. Insert Audit Logs
    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
      VALUES
        ('${inspectorId}', 'ALERT_ACKNOWLEDGED', 'ALERT', 'f6a7b8c9-0006-4000-8000-000000000503', '{"note": "Investigating medium risk delivery"}'::jsonb, NOW() - INTERVAL '45 minutes'),
        (NULL, 'SYSTEM_RISK_CALCULATION', 'RISK_EVENT', '${rCrit}', '{"score": 93.8, "level": "CRITICAL"}'::jsonb, NOW() - INTERVAL '5 minutes');
    `);
    logger.info('Seeded audit logs.');


    await client.query('COMMIT');
    logger.info('✅ ConstructGuard database seeding completed successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    logger.error({ err }, '❌ Database seeding failed.');
    throw err;
  } finally {
    client.release();
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('Seed runner completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
