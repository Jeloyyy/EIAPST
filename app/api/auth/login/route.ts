// app/api/auth/login/route.ts - Secure login API endpoint

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { verifyPassword, generateToken } from '@/lib/password';
import { generateId, getCurrentTimestamp, logAuditTrail } from '@/lib/database';

interface LoginRequest {
  email: string;
  password: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logAuditTrail(
        null,
        'LOGIN_ATTEMPT',
        'user',
        null,
        { email, reason: 'Invalid email format' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'failure'
      );
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get user from database
    const getUserStmt = db.prepare(`
      SELECT id, email, password_hash, role, first_name, last_name,
             login_attempts, locked_until, status, last_login
      FROM users
      WHERE email = ?
    `);

    const user = getUserStmt.get(email) as any;

    // Check if user exists
    if (!user) {
      logAuditTrail(
        null,
        'LOGIN_ATTEMPT',
        'user',
        null,
        { email, reason: 'User not found' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'failure'
      );
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user account is locked
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        logAuditTrail(
          user.id,
          'LOGIN_ATTEMPT',
          'user',
          user.id,
          { reason: 'Account locked' },
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown',
          'failure'
        );
        return NextResponse.json(
          { success: false, message: 'Account is temporarily locked. Try again later.' },
          { status: 401 }
        );
      }
    }

    // Check if user is active
    if (user.status !== 'active') {
      logAuditTrail(
        user.id,
        'LOGIN_ATTEMPT',
        'user',
        user.id,
        { reason: `Account is ${user.status}` },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'failure'
      );
      return NextResponse.json(
        { success: false, message: 'Your account is not active' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      // Increment login attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      let lockedUntil = null;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
      }

      const updateStmt = db.prepare(`
        UPDATE users
        SET login_attempts = ?, locked_until = ?
        WHERE id = ?
      `);

      updateStmt.run(newAttempts, lockedUntil, user.id);

      logAuditTrail(
        user.id,
        'LOGIN_ATTEMPT',
        'user',
        user.id,
        { reason: 'Invalid password', attempts: newAttempts },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'failure'
      );

      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create session
    const createSessionStmt = db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    createSessionStmt.run(
      generateId(),
      user.id,
      token,
      expiresAt,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      getCurrentTimestamp()
    );

    // Update user last login and reset attempts
    const updateUserStmt = db.prepare(`
      UPDATE users
      SET last_login = ?, login_attempts = 0, locked_until = NULL
      WHERE id = ?
    `);

    updateUserStmt.run(getCurrentTimestamp(), user.id);

    // Log successful login
    logAuditTrail(
      user.id,
      'LOGIN_SUCCESS',
      'user',
      user.id,
      { email: user.email },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    // Return response with secure token
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          department: user.department,
        },
      },
      { status: 200 }
    );

    // Set http-only cookie for additional security
    response.cookies.set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    logAuditTrail(
      null,
      'LOGIN_ERROR',
      'user',
      null,
      { error: error.message },
      'unknown',
      'unknown',
      'failure'
    );
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
