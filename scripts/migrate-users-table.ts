// scripts/migrate-users-table.ts - Run this once to add missing columns

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'eiapsts.db');

const db = new Database(DB_PATH);

console.log('Migrating users table...');

try {
  // Check current columns
  const columns = db.prepare(`PRAGMA table_info(users)`).all() as any[];
  const columnNames = columns.map(col => col.name);
  
  console.log('Current columns:', columnNames);

  // Add middle_name if not exists
  if (!columnNames.includes('middle_name')) {
    db.exec('ALTER TABLE users ADD COLUMN middle_name TEXT');
    console.log('✓ Added middle_name column');
  }

  // Add extension_name if not exists
  if (!columnNames.includes('extension_name')) {
    db.exec('ALTER TABLE users ADD COLUMN extension_name TEXT');
    console.log('✓ Added extension_name column');
  }

  // Update invalid roles
  const invalidRoles = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role NOT IN ('admin', 'employee')`).get() as any;
  if (invalidRoles.count > 0) {
    db.exec(`UPDATE users SET role = 'employee' WHERE role NOT IN ('admin', 'employee')`);
    console.log(`✓ Updated ${invalidRoles.count} users with invalid roles to 'employee'`);
  }

  console.log('\n✅ Migration complete!');
} catch (e: any) {
  console.error('Migration failed:', e.message);
} finally {
  db.close();
}