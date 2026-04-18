import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'eiapsts.db');
const db = new Database(dbPath);

console.log('🔧 Fixing supply_logs table...');

// Drop and recreate without foreign keys
db.exec('DROP TABLE IF EXISTS supply_logs');

db.exec(`
  CREATE TABLE supply_logs (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    supply_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    issued_date TEXT NOT NULL,
    returned_date TEXT,
    issued_by TEXT NOT NULL,
    received_by TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    surrender_reason TEXT,
    status TEXT NOT NULL DEFAULT 'issued'
  )
`);

const foreign = db.prepare('PRAGMA foreign_key_list(supply_logs)').all() as any[];
console.log('✅ supply_logs recreated');
console.log('Foreign keys:', foreign.length);

db.close();
console.log('Done!');