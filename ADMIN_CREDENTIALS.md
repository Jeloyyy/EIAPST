# Default Admin Account - Quick Reference

## 🔑 Auto-Seeded Admin Credentials

**These credentials are automatically created when you run `npm run db:init`**

```
📧 Email:    admin@email.com
🔐 Password: admin123
```

## 🚀 First-Time Setup Workflow

### 1. Initialize Database
```bash
npm run db:init
```
Output will show:
```
✅ Admin user created successfully
   📧 Email: admin@email.com
   🔑 Password: admin123
   ⚠️  Please change password after first login!
```

### 2. Start Application
```bash
npm run dev
```

### 3. Login
- Visit: http://localhost:3000
- Enter: `admin@email.com` / `admin123`

### 4. Change Password (IMPORTANT!)
After logging in, immediately change the password to a stronger one:
- Go to user settings/profile
- Change password to something secure
- Example: `SecureAdminPass@2024`

## 📋 Why This Approach?

✓ **Simple deployment** - No manual credential setup needed  
✓ **Works out of the box** - Just run npm run db:init  
✓ **Company-ready** - Admin can login and setup immediately  
✓ **Security reminder** - System warns to change password  

## 🔐 Security Notes

- ⚠️ `admin123` does NOT meet standard password requirements
- It's only meant for initial deployment/setup
- **Must change** before production use
- Once changed, admin can setup other users with proper policies

## 📊 Other Default Accounts

After initialization, other sample accounts are:
- `john.doe@company.com` (Manager) - Password: `Test@12345`
- `jane.smith@company.com` (Employee) - Password: `Test@12345`
- `inventory@company.com` (Inventory Staff) - Password: `Test@12345`

## 📝 All Credentials Location

Auto-seeded credentials in:
- `scripts/init-db.ts` - Initialization script
- Shown during `npm run db:init` output
- Stored in `./data/eiapsts.db` (SQLite database)

## ✅ After Successful Login

1. ✓ Admin dashboard accessible
2. ✓ Can create new employees
3. ✓ Can manage supplies
4. ✓ Can manage other users
5. ✓ Can configure system settings

---

**First Run Setup**: 3 commands, 2 minutes ⚡
```bash
npm install
npm run db:init  
npm run dev
```

Then login with `admin@email.com` / `admin123` 🎯
