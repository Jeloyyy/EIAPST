// lib/database.ts - Database helper utilities

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema';

export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Execute a query safely with error handling
 */
export function executeQuery<T>(
  callback: (db: DatabaseType) => T
): QueryResult<T> {
  try {
    const db = getDatabase();
    const result = callback(db);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message || 'Database operation failed',
    };
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Sanitize SQL string to prevent injection
 * Note: Always use prepared statements instead of string concatenation
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[;'"\\]/g, '');
}

/**
 * Parse database row to ensure type safety
 */
export function parseRow<T>(row: any): T {
  if (!row) {
    throw new Error('No data found');
  }
  return row as T;
}

/**
 * Log audit trail for security and compliance
 */
export function logAuditTrail(
  userId: string | null,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  details: any = null,
  ipAddress: string = 'unknown',
  userAgent: string = 'unknown',
  status: 'success' | 'failure' = 'success'
) {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, resource_type, resource_id, details,
        ip_address, user_agent, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      generateId(),
      userId,
      action,
      resourceType,
      resourceId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
      status,
      getCurrentTimestamp()
    );
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
}
