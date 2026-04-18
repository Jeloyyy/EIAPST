import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/db/schema';
import { generateId, getCurrentTimestamp } from '@/lib/database';

// GET: List all pending supply requests
// POST: Create a new supply request
export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const requests = db.prepare(`
      SELECT sr.*, u.first_name, u.last_name, u.email, s.name as supply_name, s.category
      FROM supply_requests sr
      JOIN users u ON sr.user_id = u.id
      JOIN supplies s ON sr.supply_id = s.id
      WHERE sr.status = 'pending'
      ORDER BY sr.created_at DESC
    `).all();
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch requests', error: error?.toString() }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDatabase();
    const body = await req.json();
    const { userId, items, notes } = body;
    
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const createdAt = getCurrentTimestamp();
    const createdRequests = [];

    for (const item of items) {
      const { supplyId, quantity } = item;
      if (!supplyId || !quantity) continue;

      const id = generateId();
      db.prepare(`
        INSERT INTO supply_requests (id, user_id, supply_id, quantity, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(id, userId, supplyId, quantity, notes || '', createdAt, createdAt);
      
      const newRequest = db.prepare('SELECT * FROM supply_requests WHERE id = ?').get(id);
      createdRequests.push(newRequest);
    }

    return NextResponse.json({ success: true, data: createdRequests });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create request', error: error?.toString() }, { status: 500 });
  }
}
