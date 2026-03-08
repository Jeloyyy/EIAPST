// app/api/supply-logs/route.ts - Get supply logs and history

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/db/schema';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const supplyId = searchParams.get('supplyId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT sl.id, sl.employee_id, sl.supply_id, sl.quantity, sl.issued_date,
             sl.returned_date, sl.issued_by, sl.received_by, sl.status, sl.notes,
             e.first_name, e.last_name, s.name as supply_name, s.category, s.unit_cost as supply_price
      FROM supply_logs sl
      JOIN employees e ON sl.employee_id = e.id
      JOIN supplies s ON sl.supply_id = s.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' AND sl.employee_id = ?';
      params.push(employeeId);
    }

    if (supplyId) {
      query += ' AND sl.supply_id = ?';
      params.push(supplyId);
    }

    if (status) {
      query += ' AND sl.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sl.issued_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const logs = stmt.all(...params);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Get supply logs error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
