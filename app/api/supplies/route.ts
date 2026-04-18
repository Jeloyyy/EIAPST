// app/api/supplies/route.ts - Supply management API

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { generateId, getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface CreateSupplyRequest {
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  reorderQuantity?: number;
  supplier?: string;
  unitCost?: number;
}

// GET all supplies
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, description, category, quantity, unit, reorder_level,
             reorder_quantity, status, supplier, unit_cost as price, last_restocked, created_at
      FROM supplies
      ORDER BY name ASC
    `);

    const supplies = stmt.all();

    return NextResponse.json({ success: true, data: supplies });
  } catch (error: any) {
    console.error('Get supplies error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST create new supply
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !['admin', 'inventory_staff'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body: CreateSupplyRequest = await request.json();
    const {
      name,
      description,
      category,
      quantity,
      unit,
      reorderLevel,
      reorderQuantity = 50,
      supplier,
      unitCost,
    } = body;

    // Validate inputs
    if (!name || !category || quantity < 0 || !unit || reorderLevel < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid input parameters' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const supplyId = generateId();
    const now = getCurrentTimestamp();

    // Determine status based on quantity
    // quantity <= 5: low-stock-available
    // quantity = 0: out-of-stock
    // quantity > 5: available
    let status = 'available';
    if (quantity === 0) status = 'out-of-stock';
    else if (quantity <= 5) status = 'low-stock-available';

    const stmt = db.prepare(`
      INSERT INTO supplies (
        id, name, description, category, quantity, unit, reorder_level,
        reorder_quantity, status, supplier, unit_cost, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      supplyId,
      name,
      description || null,
      category,
      quantity,
      unit,
      reorderLevel,
      reorderQuantity,
      status,
      supplier || null,
      unitCost || null,
      user.id,
      now,
      now
    );

    logAuditTrail(
      user.id,
      'SUPPLY_CREATED',
      'supply',
      supplyId,
      { name, category, quantity },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json(
      { success: true, message: 'Supply created', supplyId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create supply error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
