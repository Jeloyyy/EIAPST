// app/api/supply-requests/[id]/route.ts - Approve or deny supply requests

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/db/schema';
import { generateId, getCurrentTimestamp } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

// PUT - Approve or deny a request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: requestId } = await params;
    const body = await request.json();
    const { action } = body; // action: 'approve' or 'deny'

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = getCurrentTimestamp();

    // Get the pending request from supply_requests table
    const getStmt = db.prepare('SELECT * FROM supply_requests WHERE id = ? AND status = ?');
    const pendingRequest = getStmt.get(requestId, 'pending') as any;

    if (!pendingRequest) {
      return NextResponse.json(
        { success: false, message: 'Pending request not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Check if enough supply is available
      const supplyStmt = db.prepare('SELECT quantity FROM supplies WHERE id = ?');
      const supply = supplyStmt.get(pendingRequest.supply_id) as any;

      if (!supply || supply.quantity < pendingRequest.quantity) {
        return NextResponse.json(
          { success: false, message: 'Insufficient supply quantity' },
          { status: 400 }
        );
      }

      // Update supply quantity (decrement)
      const updateSupplyStmt = db.prepare(`
        UPDATE supplies 
        SET quantity = quantity - ?, updated_at = ?
        WHERE id = ?
      `);
      updateSupplyStmt.run(pendingRequest.quantity, now, pendingRequest.supply_id);

      // Create a supply_logs entry for the issued supply
      const insertLogStmt = db.prepare(`
        INSERT INTO supply_logs (id, employee_id, supply_id, quantity, issued_date, issued_by, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const logId = generateId();
      insertLogStmt.run(
        logId,
        pendingRequest.user_id,
        pendingRequest.supply_id,
        pendingRequest.quantity,
        now,
        user.id,
        'issued',
        'Approved from supply request',
        now,
        now
      );

      // Delete from supply_requests (temporary record no longer needed)
      const deleteStmt = db.prepare('DELETE FROM supply_requests WHERE id = ?');
      deleteStmt.run(requestId);

      return NextResponse.json({
        success: true,
        message: 'Request approved and supply issued',
      });
    } else if (action === 'deny') {
      // Create a supply_logs entry with status 'denied' for audit trail
      const insertLogStmt = db.prepare(`
        INSERT INTO supply_logs (id, employee_id, supply_id, quantity, issued_date, issued_by, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const logId = generateId();
      insertLogStmt.run(
        logId,
        pendingRequest.user_id,
        pendingRequest.supply_id,
        pendingRequest.quantity,
        now,
        user.id,
        'denied',
        'Request denied by admin',
        now,
        now
      );

      // Delete from supply_requests (temporary record no longer needed)
      const deleteStmt = db.prepare('DELETE FROM supply_requests WHERE id = ?');
      deleteStmt.run(requestId);

      return NextResponse.json({
        success: true,
        message: 'Request denied',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Process request error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}