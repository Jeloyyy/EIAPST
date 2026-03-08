// app/api/auth/logout/route.ts - Secure logout endpoint

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { getCurrentTimestamp, logAuditTrail } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      request.cookies.get('authToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Find session and user
    const sessionStmt = db.prepare(`
      SELECT id, user_id FROM sessions WHERE token = ? AND revoked_at IS NULL
    `);
    const session = sessionStmt.get(token) as any;

    if (session) {
      // Revoke session
      const revokeStmt = db.prepare(`
        UPDATE sessions SET revoked_at = ? WHERE id = ?
      `);
      revokeStmt.run(getCurrentTimestamp(), session.id);

      // Log logout
      logAuditTrail(
        session.user_id,
        'LOGOUT',
        'session',
        session.id,
        {},
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'success'
      );
    }

    // Clear cookie
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.set({
      name: 'authToken',
      value: '',
      httpOnly: true,
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
