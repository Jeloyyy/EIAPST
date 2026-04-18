// app/api/supplies/[id]/route.ts - Individual supply operations

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { getCurrentTimestamp, logAuditTrail } from '@/lib/database';
import { verifyToken } from '@/lib/auth-server';

interface UpdateSupplyRequest {
  name?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  reorderLevel?: number;
  supplier?: string;
  unitCost?: number;
  price?: number;
}

// GET single supply
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

    const stmt = db.prepare('SELECT * FROM supplies WHERE id = ?');
    const supply = stmt.get(id);

    if (!supply) {
      return NextResponse.json(
        { success: false, message: 'Supply not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: supply });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT update supply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user || !['admin', 'inventory_staff'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body: UpdateSupplyRequest = await request.json();

    console.log('Update supply request body:', body);

    const db = getDatabase();

    // Check if supply exists
    const getStmt = db.prepare('SELECT * FROM supplies WHERE id = ?');
    const supply = getStmt.get(id) as any;

    if (!supply) {
      return NextResponse.json(
        { success: false, message: 'Supply not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updates = [];
    const values = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category);
    }
    if (body.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(body.quantity);

      // Update status based on quantity
      // quantity <= 5: low-stock-available
      // quantity = 0: out-of-stock
      // quantity > 5: available
      let status = 'available';
      if (body.quantity === 0) status = 'out-of-stock';
      else if (body.quantity <= 5) status = 'low-stock-available';
      updates.push('status = ?');
      values.push(status);
    }
    if (body.reorderLevel !== undefined) {
      updates.push('reorder_level = ?');
      values.push(body.reorderLevel);
    }
    if (body.unit !== undefined) {
      updates.push('unit = ?');
      values.push(body.unit);
    }
    if (body.supplier !== undefined) {
      updates.push('supplier = ?');
      values.push(body.supplier);
    }
    // Handle price field from modal (map to unit_cost)
    if (body.price !== undefined && body.price !== null) {
      console.log('Price field found:', body.price);
      updates.push('unit_cost = ?');
      values.push(body.price);
    } else if (body.unitCost !== undefined) {
      updates.push('unit_cost = ?');
      values.push(body.unitCost);
    }

    updates.push('updated_at = ?');
    values.push(getCurrentTimestamp());
    values.push(id);

    const updateStmt = db.prepare(`
      UPDATE supplies
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    updateStmt.run(...values);

    logAuditTrail(
      user.id,
      'SUPPLY_UPDATED',
      'supply',
      id,
      body,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'Supply updated' });
  } catch (error: any) {
    console.error('Update supply error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE supply
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

    const stmt = db.prepare('DELETE FROM supplies WHERE id = ?');
    stmt.run(id);

    logAuditTrail(
      user.id,
      'SUPPLY_DELETED',
      'supply',
      id,
      {},
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'success'
    );

    return NextResponse.json({ success: true, message: 'Supply deleted' });
  } catch (error: any) {
    console.error('Delete supply error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
