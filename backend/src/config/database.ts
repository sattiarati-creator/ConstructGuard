import { Pool, PoolClient } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.db.ssl,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
});

pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL pool');
});

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

/**
 * Health check helper returning status and latency of the database connection.
 */
export const checkDatabaseHealth = async (): Promise<{ isHealthy: boolean; latencyMs?: number; error?: string }> => {
  const start = Date.now();
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    const latencyMs = Date.now() - start;
    return { isHealthy: true, latencyMs };
  } catch (err: any) {
    logger.error({ err }, 'Database health check failed');
    return { isHealthy: false, error: err.message };
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Gracefully shuts down the PostgreSQL connection pool.
 */
export const closeDatabasePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('PostgreSQL pool has ended.');
  } catch (err) {
    logger.error({ err }, 'Error closing PostgreSQL pool');
  }
};
