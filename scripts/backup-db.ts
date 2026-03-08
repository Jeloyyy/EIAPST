// scripts/backup-db.ts - Database backup utility

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'eiapsts.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

function backupDatabase() {
  try {
    // Create backup directory if not exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `eiapsts-${timestamp}.db`);

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);

    console.log('✅ Database backed up successfully');
    console.log(`   Location: ${backupPath}`);
    console.log(`   Size: ${fs.statSync(backupPath).size} bytes`);

    // Keep only last 10 backups
    const backups = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith('eiapsts-') && file.endsWith('.db'))
      .sort()
      .reverse();

    if (backups.length > 10) {
      for (let i = 10; i < backups.length; i++) {
        const oldBackup = path.join(BACKUP_DIR, backups[i]);
        fs.unlinkSync(oldBackup);
        console.log(`   Removed old backup: ${backups[i]}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

backupDatabase();
