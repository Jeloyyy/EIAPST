// app/api/supply-logs/surrender-request/route.ts - Employee requests surrender

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/db/schema';
import { getCurrentTimestamp } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { logId, reason } = body;

    if (!logId) {
      return NextResponse.json({ success: false, message: 'Missing log ID' }, { status: 400 });
    }

    const db = getDatabase();
    const now = getCurrentTimestamp();

    // Get the supply log
    const getStmt = db.prepare('SELECT * FROM supply_logs WHERE id = ? AND employee_id = ?');
    const log = getStmt.get(logId, user.id) as any;

    if (!log) {
      return NextResponse.json({ success: false, message: 'Supply log not found or not yours' }, { status: 404 });
    }

    if (log.status !== 'issued') {
      return NextResponse.json({ success: false, message: 'Can only surrender issued supplies' }, { status: 400 });
    }

    // Update status to pending-surrender-evaluation
    const updateStmt = db.prepare(`
      UPDATE supply_logs
      SET status = 'pending-surrender-evaluation', surrender_reason = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(reason || '', now, logId);

    return NextResponse.json({ 
      success: true, 
      message: 'Surrender request submitted. Admin will evaluate.' 
    });
  } catch (error: any) {
    console.error('Surrender request error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 });
  }
}

// GET - Get employee's issued supplies that can be surrendered
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT sl.*, s.name as supply_name, s.category, s.unit
      FROM supply_logs sl
      JOIN supplies s ON sl.supply_id = s.id
      WHERE sl.employee_id = ? AND sl.status = 'issued'
      ORDER BY sl.issued_date DESC
    `);
    const logs = stmt.all(user.id);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Get issued supplies error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 });
  }
}