import { pool } from '../config/database';
import { User, UserRole } from '../models';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const res = await pool.query<User>(
      'SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const res = await pool.query<User>(
      'SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  async createUser(data: {
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
  }): Promise<User> {
    const res = await pool.query<User>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, name, email, password_hash, role, created_at, updated_at`,
      [data.name, data.email, data.password_hash, data.role]
    );
    return res.rows[0];
  }

  async listUsers(): Promise<Omit<User, 'password_hash'>[]> {
    const res = await pool.query<Omit<User, 'password_hash'>>(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at ASC'
    );
    return res.rows;
  }
}

export const userRepository = new UserRepository();
