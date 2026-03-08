// app/api/employees/route.ts - Employee management API

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { generateId, getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  phone?: string;
  hireDate: string;
}

// GET all employees
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, first_name, last_name, email, department, position,
             phone, hire_date, status, created_at
      FROM employees
      ORDER BY last_name, first_name ASC
    `);

    const employees = stmt.all();

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST create new employee
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body: CreateEmployeeRequest = await request.json();
    const { firstName, lastName, email, department, position, phone, hireDate } = body;

    // Validate inputs
    if (!firstName || !lastName || !email || !department || !position) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if email already exists
    const checkStmt = db.prepare('SELECT id FROM employees WHERE email = ?');
    if (checkStmt.get(email)) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 }
      );
    }

    const employeeId = generateId();
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO employees (
        id, first_name, last_name, email, department, position,
        phone, hire_date, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      employeeId,
      firstName,
      lastName,
      email,
      department,
      position,
      phone || null,
      hireDate,
      'active',
      user.id,
      now,
      now
    );

    logAuditTrail(
      user.id,
      'EMPLOYEE_CREATED',
      'employee',
      employeeId,
      { firstName, lastName, email, department },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json(
      { success: true, message: 'Employee created', employeeId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
