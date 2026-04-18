// app/api/supply-logs/surrender/route.ts - Surrender supply from employee

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface SurrenderSupplyRequest {
  logId: string;
  status: 'surrendered' | 'damaged' | 'lost';
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body: SurrenderSupplyRequest = await request.json();
    const { logId, status, notes } = body;

    if (!logId || !['surrendered', 'damaged', 'lost'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get supply log
    const getLogStmt = db.prepare('SELECT * FROM supply_logs WHERE id = ?');
    const log = getLogStmt.get(logId) as any;

    if (!log) {
      return NextResponse.json(
        { success: false, message: 'Supply log not found' },
        { status: 404 }
      );
    }

    if (log.status !== 'issued') {
      return NextResponse.json(
        { success: false, message: 'Supply is not currently issued' },
        { status: 400 }
      );
    }

    const now = getCurrentTimestamp();

    // Update supply log
    const updateLogStmt = db.prepare(`
      UPDATE supply_logs
      SET status = ?, surrendered_date = ?, notes = ?, received_by = ?, updated_at = ?
      WHERE id = ?
    `);

    updateLogStmt.run(status, now, notes || null, user.id, now, logId);

    // If status is 'surrendered', restore supply quantity
    if (status === 'surrendered') {
      const restoreStmt = db.prepare(`
        UPDATE supplies
        SET quantity = quantity + ?, updated_at = ?
        WHERE id = ?
      `);
      restoreStmt.run(log.quantity, now, log.supply_id);
    }

    logAuditTrail(
      user.id,
      'SUPPLY_SURRENDERED',
      'supply_log',
      logId,
      { status, reason: notes },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'Supply status updated' });
  } catch (error: any) {
    console.error('Surrender supply error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
