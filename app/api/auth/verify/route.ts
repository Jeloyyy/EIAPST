// app/api/auth/verify/route.ts - Verify authentication token

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      request.cookies.get('authToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const db = getDatabase();

    // Get session and user info
    const sessionStmt = db.prepare(`
      SELECT s.id, s.user_id, s.expires_at, u.email, u.first_name, u.last_name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.revoked_at IS NULL AND s.expires_at > datetime('now')
    `);

    const session = sessionStmt.get(token) as any;

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user_id,
        email: session.email,
        firstName: session.first_name,
        lastName: session.last_name,
        role: session.role,
      },
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
