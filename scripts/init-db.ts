// scripts/init-db.ts - Initialize database with admin user

import { initializeDatabase, getDatabase } from '../db/schema';
import { hashPassword } from '../lib/password';
import { generateId, getCurrentTimestamp } from '../lib/database';

async function setupDatabase() {
  console.log('🔧 Initializing EIAPSTS database...\n');

  try {
    // Initialize schema
    initializeDatabase();

    const db = getDatabase();

    // Create admin user
    console.log('👤 Creating default admin user...');
    const adminId = generateId();
    const adminPasswordHash = await hashPassword('admin123');
    const now = getCurrentTimestamp();

    const adminStmt = db.prepare(`
      INSERT OR IGNORE INTO users (
        id, email, password_hash, first_name, last_name, role,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    adminStmt.run(
      adminId,
      'admin@email.com',
      adminPasswordHash,
      'Admin',
      'User',
      'admin',
      'active',
      now,
      now
    );

    console.log('✅ Admin user created successfully');
    console.log('   📧 Email: admin@email.com');
    console.log('   🔑 Password: admin123');
    console.log('   ⚠️  Please change password after first login!\n');

    // Create sample users
    console.log('👥 Creating sample users...');

    const sampleUsers = [
      {
        email: 'mgr.operations@emvillanueva.com',
        name: 'Maria Santos',
        role: 'manager',
        department: 'Operations',
      },
      {
        email: 'receptionist@emvillanueva.com',
        name: 'Angela Cruz',
        role: 'employee',
        department: 'Front Desk',
      },
      {
        email: 'security@emvillanueva.com',
        name: 'Tony Reyes',
        role: 'inventory_staff',
        department: 'Security',
      },
    ];

    const userStmt = db.prepare(`
      INSERT OR IGNORE INTO users (
        id, email, password_hash, first_name, last_name, role, department,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const sampleUser of sampleUsers) {
      const [firstName, lastName] = sampleUser.name.split(' ');
      const passwordHash = await hashPassword('Test@12345');

      userStmt.run(
        generateId(),
        sampleUser.email,
        passwordHash,
        firstName,
        lastName,
        sampleUser.role,
        sampleUser.department,
        'active',
        now,
        now
      );
    }

    console.log(`✅ Created ${sampleUsers.length} sample users\n`);

    console.log('📋 Sample users:');
    sampleUsers.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('   Password for all: Test@12345\n');

    // Create sample supplies
    console.log('📦 Creating sample supplies...');

    const supplies = [
      { name: 'Employee Uniform - Size M', category: 'Uniforms', quantity: 25, unit: 'pcs', reorderLevel: 10 },
      { name: 'Employee Uniform - Size L', category: 'Uniforms', quantity: 18, unit: 'pcs', reorderLevel: 8 },
      { name: 'Employee Uniform - Size S', category: 'Uniforms', quantity: 15, unit: 'pcs', reorderLevel: 7 },
      { name: 'Two-way Radio', category: 'Equipment', quantity: 30, unit: 'pcs', reorderLevel: 10 },
      { name: 'Employee ID Card', category: 'Identification', quantity: 200, unit: 'pcs', reorderLevel: 50 },
      { name: 'ID Lace/Lanyard', category: 'Accessories', quantity: 150, unit: 'pcs', reorderLevel: 40 },
      { name: 'Life Vest', category: 'Safety Equipment', quantity: 40, unit: 'pcs', reorderLevel: 15 },
      { name: 'Whistle', category: 'Equipment', quantity: 50, unit: 'pcs', reorderLevel: 20 },
      { name: 'Locker Key Set', category: 'Keys', quantity: 45, unit: 'set', reorderLevel: 10 },
      { name: 'Door Key Master', category: 'Keys', quantity: 8, unit: 'pcs', reorderLevel: 2 },
      { name: 'Name Badge', category: 'Identification', quantity: 100, unit: 'pcs', reorderLevel: 30 },
      { name: 'Work Shoes - Black', category: 'Uniforms', quantity: 35, unit: 'pcs', reorderLevel: 12 },
      { name: 'First Aid Kit', category: 'Safety Equipment', quantity: 12, unit: 'kit', reorderLevel: 3 },
      { name: 'Flashlight', category: 'Equipment', quantity: 20, unit: 'pcs', reorderLevel: 8 },
      { name: 'Staff Cap', category: 'Uniforms', quantity: 60, unit: 'pcs', reorderLevel: 20 },
    ];

    const supplyStmt = db.prepare(`
      INSERT OR IGNORE INTO supplies (
        id, name, description, category, quantity, unit, reorder_level,
        reorder_quantity, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const supply of supplies) {
      let status = 'available';
      if (supply.quantity === 0) status = 'out-of-stock';
      else if (supply.quantity <= 5) status = 'low-stock-available';

      supplyStmt.run(
        generateId(),
        supply.name,
        null,
        supply.category,
        supply.quantity,
        supply.unit,
        supply.reorderLevel,
        supply.quantity * 2,
        status,
        adminId,
        now,
        now
      );
    }

    console.log(`✅ Created ${supplies.length} sample supplies\n`);

    console.log('✨ Database initialization complete!\n');
    console.log('🚀 You can now run: npm run dev\n');
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
