// app/api/auth/register/route.ts - Secure user registration API

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { generateId, getCurrentTimestamp, logAuditTrail } from '@/lib/database';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, firstName, lastName, department } = body;

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
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
    const checkUserStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = checkUserStmt.get(email);

    if (existingUser) {
      logAuditTrail(
        null,
        'REGISTER_ATTEMPT',
        'user',
        null,
        { email, reason: 'Email already exists' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'failure'
      );
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const now = getCurrentTimestamp();

    // Create user
    const createUserStmt = db.prepare(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, role, department,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    createUserStmt.run(
      userId,
      email,
      passwordHash,
      firstName,
      lastName,
      'employee',
      department || null,
      'active',
      now,
      now
    );

    // Log registration
    logAuditTrail(
      userId,
      'USER_REGISTERED',
      'user',
      userId,
      { email, firstName, lastName },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        userId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    logAuditTrail(
      null,
      'REGISTER_ERROR',
      'user',
      null,
      { error: error.message },
      'unknown',
      'unknown',
      'failure'
    );
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
