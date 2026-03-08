// app/api/audit-logs/route.ts - Get audit logs for compliance

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { verifyToken } from '@/lib/auth-server';

// Only admins can view audit logs
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const db = getDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT id, user_id, action, resource_type, resource_id, details,
             ip_address, user_agent, status, created_at
      FROM audit_logs
      WHERE 1=1
    `;

    const params: any[] = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const logs = stmt.all(...params);

    return NextResponse.json(
      { success: true, data: logs },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
