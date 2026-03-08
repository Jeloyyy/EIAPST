# Quick Start Guide - EIAPSTS with Database

## 🚀 30-Second Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run db:init
```

### 3. Start Server
```bash
npm run dev
```

### 4. Login
- URL: http://localhost:3000
- Email: `admin@email.com`
- Password: `admin123`

## 📊 Default Accounts

After initialization, you'll have these test accounts:

### Admin Account
```
Email: admin@email.com
Password: admin123
**⚠️ Change password after first login!
```

### Sample Accounts (All with password: Test@12345)
- `john.doe@company.com` - Manager
- `jane.smith@company.com` - Employee
- `inventory@company.com` - Inventory Staff

## 🗄️ Database Files

The database is stored in:
```
./data/eiapsts.db
```

This directory is automatically created during setup.

## 📝 Sample Data

The initialization script creates:
- ✅ 1 Admin user
- ✅ 3 Sample users (different roles)
- ✅ 7 Sample supplies (Electronics, Furniture, Supplies)
- ✅ Complete database schema with indexes

## 🔐 Security Features Enabled

- ✅ Password hashing (bcrypt)
- ✅ Account lockout (5 attempts / 15 min)
- ✅ Session management (24 hour expiry)
- ✅ Audit logging (all actions tracked)
- ✅ Role-based access control
- ✅ SQL injection prevention

## 🎯 Next Steps

1. **Test Login**: Try logging in with admin credentials
2. **Create Employees**: Add employees through the system
3. **Manage Supplies**: Create and track supplies
4. **Issue Supplies**: Track supply distribution to employees
5. **View Logs**: Check activity logs and audit trail

## 📖 Documentation

- [DATABASE_SECURITY.md](DATABASE_SECURITY.md) - Full security and database docs
- [LOGIN_SYSTEM.md](LOGIN_SYSTEM.md) - Login system docs
- [API Documentation](API.md) - Complete API reference (coming soon)

## ⚙️ Configuration

See `.env.local.example` for all available configuration options:

```bash
cp .env.local.example .env.local
```

## 🐛 Troubleshooting

### Port already in use?
```bash
npm run dev -- -p 3001
```

### Database issues?
```bash
# Reinitialize
npm run db:init
```

### Clear all data?
```bash
rm -r data/
npm run db:init
```

## 📱 Features

### Already Implemented
- ✅ Secure login/registration
- ✅ Database persistence
- ✅ Password hashing
- ✅ User roles and permissions
- ✅ Supply inventory tracking
- ✅ Audit logging
- ✅ Employee management API
- ✅ Supply management API

### Coming Soon
- 📋 Employee dashboard
- 📊 Supply analytics
- 🔔 Notifications
- 📞 Contact management
- 📂 Document attachment
- 🔄 Supply request workflow

## 🆘 Need Help?

1. Check database is initialized: `ls -la data/eiapsts.db`
2. Check logs: Look in console for error messages
3. Reset everything:
   ```bash
   rm -r data/
   npm run db:init
   npm run dev
   ```

## 🎓 Learning Path

1. Start with login - understand authentication
2. Explore employee management - CRUD operations
3. Try supply tracking - relationships and queries
4. Review audit logs - security and compliance
5. Check API endpoints - integrate with frontend

## 🔒 Important Security Notes

- Never commit `.env.local` to git
- Change default passwords before production
- Use HTTPS in production
- Regularly backup the database
- Monitor audit logs
- Keep dependencies updated

## 📞 Support

For detailed information, see:
- `DATABASE_SECURITY.md` - Database architecture and security
- `LOGIN_SYSTEM.md` - Authentication system docs
- API routes in `app/api/` - Implementation details
