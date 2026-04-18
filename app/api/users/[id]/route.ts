// app/api/users/[id]/route.ts - Individual user operations

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface UpdateUserRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  extensionName?: string;
  role?: string;
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'on-leave';
  password?: string;
}

// GET single user
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
      SELECT id, email, first_name, middle_name, last_name, extension_name, role, department, phone, status, created_at, updated_at
      FROM users
      WHERE id = ?
    `);

    const userData = stmt.get(id);

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: userData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateUserRequest = await request.json();

    // Check if user is updating their own profile or is admin
    const isSelf = user.id === id;
    const isAdmin = user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const db = getDatabase();

    // Check if user exists
    const getStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const existingUser = getStmt.get(id);

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Build dynamic update query
    const updates = [];
    const values: any[] = [];

    if (body.firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(body.firstName);
    }
    if (body.middleName !== undefined) {
      updates.push('middle_name = ?');
      values.push(body.middleName || null);
    }
    if (body.lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(body.lastName);
    }
    if (body.extensionName !== undefined) {
      updates.push('extension_name = ?');
      values.push(body.extensionName || null);
    }
    if (body.department !== undefined) {
      updates.push('department = ?');
      values.push(body.department);
    }
    if (body.role !== undefined) {
      if (!['admin', 'employee'].includes(body.role)) {
        return NextResponse.json(
          { success: false, message: 'Invalid role selected' },
          { status: 400 }
        );
      }
      updates.push('role = ?');
      values.push(body.role);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(body.phone);
    }
    if (body.status !== undefined) {
      if (!['active', 'inactive', 'on-leave'].includes(body.status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status' },
          { status: 400 }
        );
      }
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.password !== undefined) {
      // Validate password strength
      const passwordStrength = validatePasswordStrength(body.password);
      if (!passwordStrength.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Password does not meet security requirements',
            errors: passwordStrength.errors,
          },
          { status: 400 }
        );
      }
      const passwordHash = await hashPassword(body.password);
      updates.push('password_hash = ?');
      values.push(passwordHash);
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
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    updateStmt.run(...values);

    logAuditTrail(
      user.id,
      'USER_UPDATED',
      'user',
      id,
      body,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE user (soft delete - set status to inactive)
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

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to inactive
    const stmt = db.prepare(`
      UPDATE users
      SET status = 'inactive', updated_at = ?
      WHERE id = ?
    `);

    stmt.run(getCurrentTimestamp(), id);

    logAuditTrail(
      user.id,
      'USER_DELETED',
      'user',
      id,
      {},
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}