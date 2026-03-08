// lib/auth-updated.ts - Updated authentication utilities with database

import getDatabase from '@/db/schema';
import { verifyPassword, generateToken } from './password';
import { generateId, getCurrentTimestamp } from './database';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token?: string;
}

/**
 * Login with database authentication
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;

  // Validate inputs
  if (!email || !password) {
    return {
      success: false,
      message: 'Email and password are required',
    };
  }

  const db = getDatabase();

  try {
    // Get user from database
    const stmt = db.prepare(`
      SELECT id, email, password_hash, first_name, last_name, role, status
      FROM users
      WHERE email = ?
    `);

    const user = stmt.get(email) as any;

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return {
        success: false,
        message: 'Your account is not active',
      };
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create session
    const sessionStmt = db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    sessionStmt.run(
      generateId(),
      user.id,
      token,
      expiresAt,
      getCurrentTimestamp()
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login',
    };
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('authToken');
}

/**
 * Get current user from storage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  return userEmail ? { email: userEmail, id: userId } : null;
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('authToken');

  // Notify backend to revoke token
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
}
