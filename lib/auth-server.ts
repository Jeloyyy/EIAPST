// lib/auth-server.ts - Server-side authentication utilities

import { NextRequest } from 'next/server';
import getDatabase from '@/db/schema';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Extract and verify JWT token from request
 * Returns user if valid, null otherwise
 */
export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from cookie or Authorization header
    const token =
      request.cookies.get('authToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const db = getDatabase();

    // Verify token exists and is not revoked, not expired
    const sessionStmt = db.prepare(`
      SELECT s.user_id, u.email, u.first_name, u.last_name, u.role, s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.revoked_at IS NULL
    `);

    const session = sessionStmt.get(token) as any;

    if (!session) {
      return null;
    }

    // Check if token is expired
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    return {
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      role: session.role,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Require authentication and specific roles
 */
export async function requireAuth(
  request: NextRequest,
  requiredRoles?: string[]
): Promise<{ user: AuthUser; isValid: true } | { isValid: false }> {
  const user = await verifyToken(request);

  if (!user) {
    return { isValid: false };
  }

  if (requiredRoles && !hasRole(user, requiredRoles)) {
    return { isValid: false };
  }

  return { user, isValid: true };
}
