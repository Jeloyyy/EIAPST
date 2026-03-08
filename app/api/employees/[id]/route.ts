// app/api/employees/[id]/route.ts - Individual employee operations

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'on-leave';
}

// GET single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT id, first_name, last_name, email, department, position,
             phone, hire_date, status, created_at, updated_at
      FROM employees
      WHERE id = ?
    `);

    const employee = stmt.get(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body: UpdateEmployeeRequest = await request.json();

    const db = getDatabase();

    // Check if employee exists
    const getStmt = db.prepare('SELECT * FROM employees WHERE id = ?');
    const employee = getStmt.get(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (body.firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(body.firstName);
    }
    if (body.lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(body.lastName);
    }
    if (body.department !== undefined) {
      updates.push('department = ?');
      values.push(body.department);
    }
    if (body.position !== undefined) {
      updates.push('position = ?');
      values.push(body.position);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(body.phone);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = ?');
    values.push(getCurrentTimestamp());
    values.push(id);

    const updateStmt = db.prepare(`
      UPDATE employees
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    updateStmt.run(...values);

    logAuditTrail(
      user.id,
      'EMPLOYEE_UPDATED',
      'employee',
      id,
      body,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'Employee updated' });
  } catch (error: any) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDatabase();

    // Soft delete by setting status to inactive
    const stmt = db.prepare(`
      UPDATE employees
      SET status = 'inactive', updated_at = ?
      WHERE id = ?
    `);

    stmt.run(getCurrentTimestamp(), id);

    logAuditTrail(
      user.id,
      'EMPLOYEE_DELETED',
      'employee',
      id,
      {},
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'Employee deleted' });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
