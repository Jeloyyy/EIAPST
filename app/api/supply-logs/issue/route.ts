// app/api/supply-logs/issue/route.ts - Issue supply to employee

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { generateId, getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface IssueSupplyRequest {
  employeeId: string;
  supplyId: string;
  quantity: number;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body: IssueSupplyRequest = await request.json();
    const { employeeId, supplyId, quantity, notes } = body;

    if (!employeeId || !supplyId || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Verify employee exists
    const empStmt = db.prepare('SELECT id FROM employees WHERE id = ?');
    const employee = empStmt.get(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify supply exists and has enough quantity
    const supplyStmt = db.prepare('SELECT id, quantity FROM supplies WHERE id = ?');
    const supply = supplyStmt.get(supplyId) as any;
    if (!supply) {
      return NextResponse.json(
        { success: false, message: 'Supply not found' },
        { status: 404 }
      );
    }

    if (supply.quantity < quantity) {
      return NextResponse.json(
        { success: false, message: 'Insufficient quantity available' },
        { status: 400 }
      );
    }

    // Create supply log
    const logId = generateId();
    const now = getCurrentTimestamp();

    const createLogStmt = db.prepare(`
      INSERT INTO supply_logs (
        id, employee_id, supply_id, quantity, issued_date, issued_by,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    createLogStmt.run(
      logId,
      employeeId,
      supplyId,
      quantity,
      now,
      user.id,
      'issued',
      notes || null,
      now,
      now
    );

    // Update supply quantity
    const updateSupplyStmt = db.prepare(`
      UPDATE supplies
      SET quantity = quantity - ?, updated_at = ?
      WHERE id = ?
    `);
    updateSupplyStmt.run(quantity, now, supplyId);

    logAuditTrail(
      user.id,
      'SUPPLY_ISSUED',
      'supply_log',
      logId,
      { employeeId, supplyId, quantity },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json(
      { success: true, message: 'Supply issued successfully', logId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Issue supply error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
