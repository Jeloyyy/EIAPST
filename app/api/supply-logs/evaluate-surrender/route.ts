// app/api/supply-logs/evaluate-surrender/route.ts - Admin evaluates surrender requests

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/db/schema';
import { generateId, getCurrentTimestamp } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { logId, action, adminNotes } = body;

    // action: 'surrendered', 'disposed', 'lost', 'consumed', 'deny'
    const validActions = ['surrendered', 'disposed', 'lost', 'consumed', 'deny'];
    if (!logId || !validActions.includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid parameters' }, { status: 400 });
    }

    const db = getDatabase();
    const now = getCurrentTimestamp();

    // Get the supply log
    const getStmt = db.prepare('SELECT * FROM supply_logs WHERE id = ?');
    const log = getStmt.get(logId) as any;

    if (!log) {
      return NextResponse.json({ success: false, message: 'Supply log not found' }, { status: 404 });
    }

    if (log.status !== 'pending-surrender-evaluation') {
      return NextResponse.json({ success: false, message: 'Not a pending surrender request' }, { status: 400 });
    }

    if (action === 'deny') {
      // Deny - revert to issued status
      const updateStmt = db.prepare(`
        UPDATE supply_logs
        SET status = 'issued', surrender_reason = NULL, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(now, logId);

      return NextResponse.json({ success: true, message: 'Surrender request denied' });
    }

    // Update status based on admin decision
    const updateStmt = db.prepare(`
      UPDATE supply_logs
      SET status = ?, notes = ?, received_by = ?, returned_date = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(action, adminNotes || '', user.id, now, now, logId);

    // If surrendered, restore quantity to inventory
    if (action === 'surrendered') {
      const restoreStmt = db.prepare(`
        UPDATE supplies
        SET quantity = quantity + ?, updated_at = ?
        WHERE id = ?
      `);
      restoreStmt.run(log.quantity, now, log.supply_id);
    }

    const actionMessages: Record<string, string> = {
      surrendered: 'Supply surrendered and returned to inventory',
      disposed: 'Supply marked for disposal',
      lost: 'Supply marked as lost',
      consumed: 'Supply marked as consumed',
    };

    return NextResponse.json({ 
      success: true, 
      message: actionMessages[action] || 'Surrender evaluated' 
    });
  } catch (error: any) {
    console.error('Evaluate surrender error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 });
  }
}

// GET - Get all pending surrender evaluations (for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT sl.*, u.first_name, u.last_name, u.email, s.name as supply_name, s.category, s.unit
      FROM supply_logs sl
      JOIN users u ON sl.employee_id = u.id
      JOIN supplies s ON sl.supply_id = s.id
      WHERE sl.status = 'pending-surrender-evaluation'
      ORDER BY sl.updated_at DESC
    `);
    const logs = stmt.all();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Get pending surrenders error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 });
  }
}