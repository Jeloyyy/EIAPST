// app/api/supply-requests/route.ts - Handle supply requests from employees

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { generateId, getCurrentTimestamp } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface RequestItem {
  supplyId: string;
  quantity: number;
}

interface CreateRequestBody {
  userId: string;
  items: RequestItem[];
}

// POST - Create a new supply request
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateRequestBody = await request.json();
    const { userId, items } = body;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = getCurrentTimestamp();

    // Create a pending request record for each item in supply_requests table
    const insertStmt = db.prepare(`
      INSERT INTO supply_requests (id, user_id, supply_id, quantity, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const requestId = generateId();
      insertStmt.run(
        requestId,
        userId,
        item.supplyId,
        item.quantity,
        'pending',
        'Pending approval',
        now,
        now
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supply request submitted successfully',
    });
  } catch (error: any) {
    console.error('Create supply request error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// GET - Get pending requests (for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT sr.id, sr.user_id, sr.supply_id, sr.quantity,
             sr.status, sr.notes, sr.created_at,
             u.first_name, u.last_name, u.email,
             s.name as supply_name, s.category, s.unit, s.unit_cost as price
      FROM supply_requests sr
      JOIN users u ON sr.user_id = u.id
      JOIN supplies s ON sr.supply_id = s.id
      WHERE sr.status = 'pending'
      ORDER BY sr.created_at DESC
    `);

    const pendingRequests = stmt.all();

    return NextResponse.json({ success: true, data: pendingRequests });
  } catch (error: any) {
    console.error('Get pending requests error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}