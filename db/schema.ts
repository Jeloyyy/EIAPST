// db/schema.ts - SQLite Database Schema

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'eiapsts.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function getDatabase(): DatabaseType {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initializeDatabase() {
  const db = getDatabase();

  try {
    // Users table with secure password storage
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('admin', 'manager', 'employee', 'inventory_staff')),
        department TEXT,
        phone TEXT,
        hire_date TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on-leave')),
        last_login TEXT,
        login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Employees table
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT,
        hire_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on-leave')),
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Supplies/Inventory table
    db.exec(`
      CREATE TABLE IF NOT EXISTS supplies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        reorder_level INTEGER NOT NULL DEFAULT 10,
        reorder_quantity INTEGER NOT NULL DEFAULT 50,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'low-stock', 'out-of-stock')),
        supplier TEXT,
        unit_cost REAL,
        last_restocked TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Supply Issuance/Log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS supply_logs (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        supply_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        issued_date TEXT NOT NULL,
        returned_date TEXT,
        issued_by TEXT NOT NULL,
        received_by TEXT,
        status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'returned', 'damaged', 'lost')),
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE,
        FOREIGN KEY (issued_by) REFERENCES users(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
      );
    `);

    // Audit logs for compliance
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success', 'failure')),
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Session table for token management
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        revoked_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
      CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category);
      CREATE INDEX IF NOT EXISTS idx_supplies_status ON supplies(status);
      CREATE INDEX IF NOT EXISTS idx_supply_logs_employee_id ON supply_logs(employee_id);
      CREATE INDEX IF NOT EXISTS idx_supply_logs_supply_id ON supply_logs(supply_id);
      CREATE INDEX IF NOT EXISTS idx_supply_logs_issued_date ON supply_logs(issued_date);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export default getDatabase;
