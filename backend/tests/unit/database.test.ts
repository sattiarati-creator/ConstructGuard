import { checkDatabaseHealth, pool } from '../../src/config/database';

describe('Database Connection Pool Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should report healthy when database client queries successfully', async () => {
    const mockRelease = jest.fn();
    const mockQuery = jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] });
    (jest.spyOn(pool, 'connect') as any).mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });

    const health = await checkDatabaseHealth();
    expect(health.isHealthy).toBe(true);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
    expect(mockRelease).toHaveBeenCalled();
  });

  it('should report unhealthy and capture error when database connection fails', async () => {
    (jest.spyOn(pool, 'connect') as any).mockRejectedValue(new Error('Connection refused: 5432'));

    const health = await checkDatabaseHealth();
    expect(health.isHealthy).toBe(false);
    expect(health.error).toContain('Connection refused');
  });
});
