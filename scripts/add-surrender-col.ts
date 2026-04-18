import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'eiapsts.db'));

// Add surrender_reason column if not exists
try {
  db.exec(`ALTER TABLE supply_logs ADD COLUMN surrender_reason TEXT`);
  console.log('✅ Added surrender_reason column');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('✅ surrender_reason column already exists');
  } else {
    console.log('⚠️', e.message);
  }
}

// Update CHECK constraint to include new statuses
try {
  db.exec(`ALTER TABLE supply_logs DROP COLUMN status`);
} catch (e) {
  // Can't drop column in SQLite easily, just continue
}

try {
  db.exec(`ALTER TABLE supply_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'surrendered', 'disposed', 'lost', 'consumed', 'pending-surrender-evaluation'))`);
  console.log('✅ Updated status column with new values');
} catch (e: any) {
  console.log('⚠️ Status column update:', e.message);
}

db.close();
console.log('Done!');