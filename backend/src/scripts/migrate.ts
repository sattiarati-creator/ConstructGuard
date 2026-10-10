import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    logger.info('Starting ConstructGuard database migrations...');
    await client.query('BEGIN');

    const migrationsDir = path.resolve(__dirname, '../migrations');
    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(migrationsDir, sqlFile);
      const sql = fs.readFileSync(filePath, 'utf-8');
      logger.info(`Executing migration: ${sqlFile}...`);
      await client.query(sql);
      logger.info(`✅ Successfully executed migration: ${sqlFile}`);
    }

    await client.query('COMMIT');
    logger.info('✅ All database migrations applied successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    logger.error({ err }, '❌ Database migration failed.');
    throw err;
  } finally {
    client.release();
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration runner completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
