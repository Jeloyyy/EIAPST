// app/api/users/route.ts - User management API for admins

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { generateId, getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface CreateUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  extensionName?: string;
  role?: string;
  department?: string;
  phone?: string;
}

// GET all users (for admin to view all users)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, email, first_name, middle_name, last_name, extension_name, role, department, phone, status, created_at
      FROM users
      ORDER BY last_name, first_name ASC
    `);

    const users = stmt.all();

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST create new user (admin function)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body: CreateUserRequest = await request.json();
    const { email, password, confirmPassword, firstName, middleName, lastName, extensionName, role, department, phone } = body;

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !['admin', 'employee'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role selected' },
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

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
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

    const db = getDatabase();

    // Check if email already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    if (checkStmt.get(email)) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 }
      );
    }

    const userId = generateId();
    const now = getCurrentTimestamp();
    const passwordHash = await hashPassword(password);

    const stmt = db.prepare(`
      INSERT INTO users (
        id, email, password_hash, first_name, middle_name, last_name, extension_name, role, department, phone,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      email,
      passwordHash,
      firstName,
      middleName || null,
      lastName,
      extensionName || null,
      role || 'employee',
      department || null,
      phone || null,
      'active',
      now,
      now
    );

    logAuditTrail(
      user.id,
      'USER_CREATED',
      'user',
      userId,
      { firstName, lastName, email, role: role || 'employee', department },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json(
      { success: true, message: 'User created', userId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}