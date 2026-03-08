# EIAPSTS - Employee Information & Personal Supplies Tracking System

A comprehensive, secure inventory and employee management system built with Next.js, React, TypeScript, SQLite, and enterprise-grade security.

## 🎯 Features

### Core Functionality
- ✅ **Secure Authentication** - Bcrypt password hashing, session management
- ✅ **Employee Management** - Create, update, and track employee information
- ✅ **Supply Inventory** - Manage supplies with auto-reorder alerts
- ✅ **Supply Tracking** - Track supply issuance to employees
- ✅ **Activity Logs** - Complete audit trail for compliance
- ✅ **Role-Based Access** - Admin, Manager, Inventory Staff, Employee roles

### Security Features
- 🔒 **Bcrypt Hashing** - Secure password storage
- 🔐 **Session Management** - Token-based with 24-hour expiry
- 🛡️ **Account Lockout** - Protection against brute force (5 attempts)
- 📋 **Audit Logging** - Complete compliance trail
- ⚠️ **SQL Injection Prevention** - Parameterized queries only
- 🔑 **RBAC** - Fine-grained role-based access control

### Database
- 💾 **SQLite** - Lightweight, serverless database
- 🚀 **Better-SQLite3** - Synchronous driver for reliability
- 📊 **Optimized Schema** - Proper indexes and foreign keys
- ⚡ **Auto Backup** - Backup script included

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite3 (included with better-sqlite3)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run db:init
```

This creates:
- SQLite database (`./data/eiapsts.db`)
- Complete schema with indexes
- Admin user: `admin@eiapsts.local` / `Admin@12345`
- Sample users and supplies

### 3. Start Development Server
```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - 30-second setup guide
- [DATABASE_SECURITY.md](DATABASE_SECURITY.md) - Full database and security documentation
- [LOGIN_SYSTEM.md](LOGIN_SYSTEM.md) - Authentication system details
- [API.md](API.md) - Complete API reference

## 🗂️ Project Structure

```
eiapsts/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── employees/         # Employee management
│   │   ├── supplies/          # Supply management
│   │   ├── supply-logs/       # Supply tracking
│   │   └── audit-logs/        # Audit trails
│   ├── login/                 # Login page
│   ├── dashboard/             # Main dashboard
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home redirect
│   └── globals.css            # Global styles
├── db/
│   └── schema.ts              # Database schema and initialization
├── lib/
│   ├── auth.ts                # Client authentication
│   ├── auth-server.ts         # Server-side auth utilities
│   ├── password.ts            # Password hashing utilities
│   ├── database.ts            # DB utility functions
│   └── constants.ts           # App constants
├── components/
│   ├── LoginForm.tsx          # Reusable login form
│   └── ProtectedRoute.tsx     # Route protection
├── hooks/
│   └── useAuth.ts             # Authentication hooks
├── types/
│   └── auth.ts                # TypeScript types
├── scripts/
│   ├── init-db.ts             # Database initialization
│   └── backup-db.ts           # Database backup utility
├── data/                      # SQLite database (created on init)
├── middleware.ts              # Request middleware
├── .env.local.example         # Environment template
└── public/                    # Static assets
```

## 🔐 Security Features

### Password Security
- Minimum 8 characters
- Uppercase, lowercase, numbers, special characters
- Bcrypt hashing with 12 salt rounds

### Account Protection
- Failed login attempt tracking
- Account lockout after 5 attempts (15 minutes)
- Login timestamp tracking

### Data Security
- Parameterized SQL queries (prevents injection)
- Request validation and sanitization
- HTTP-only cookies for tokens
- CORS headers configured

### Audit Trail
- All user actions logged
- IP address and user agent tracking
- Compliance-ready audit logs
- Admin-only audit log access

## 👥 User Roles

### Admin
- Full system access
- User management
- Audit log access
- System configuration

### Manager
- Employee management
- Supply issuance
- Department statistics

### Inventory Staff
- Supply inventory management
- Supply history tracking
- Reorder management

### Employee
- View own information
- Track issued supplies

## 📊 Sample Data

After `npm run db:init`, you'll have:

**Users:**
- `admin@eiapsts.local` (Admin)
- `john.doe@company.com` (Manager)
- `jane.smith@company.com` (Employee)
- `inventory@company.com` (Inventory Staff)

**Supplies:**
- Electronics (Laptops, Monitors)
- Peripherals (Keyboards, Mice)
- Accessories (USB Cables)
- Furniture (Office Chairs)
- Supplies (Printer Paper)

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login         - Login
POST   /api/auth/register      - Register
POST   /api/auth/logout        - Logout
GET    /api/auth/verify        - Verify token
```

### Employees
```
GET    /api/employees          - List employees
POST   /api/employees          - Create employee
GET    /api/employees/[id]     - Get employee
PUT    /api/employees/[id]     - Update employee
DELETE /api/employees/[id]     - Delete employee
```

### Supplies
```
GET    /api/supplies           - List supplies
POST   /api/supplies           - Create supply
GET    /api/supplies/[id]      - Get supply
PUT    /api/supplies/[id]      - Update supply
DELETE /api/supplies/[id]      - Delete supply
```

### Supply Logs
```
GET    /api/supply-logs        - Get logs
POST   /api/supply-logs/issue  - Issue supply
POST   /api/supply-logs/return - Return supply
```

### Audit
```
GET    /api/audit-logs         - Get audit logs (admin)
```

## ⚙️ Configuration

Create `.env.local` from template:
```bash
cp .env.local.example .env.local
```

Key variables:
```
DATABASE_URL=./data/eiapsts.db
NODE_ENV=development
SESSION_TIMEOUT=24
SECURE_COOKIES=false  # Set true in production
```

## 🧪 Testing

### Test Admin Login
```bash
Email: admin@email.com
Password: admin123
# ⚠️ Change password after first login
```

### Test API
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eiapsts.local","password":"Admin@12345"}'

# Get employees
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚢 Deployment

### Production Checklist
- [ ] Change all default passwords
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Set `SECURE_COOKIES=true`
- [ ] Generate strong `JWT_SECRET`
- [ ] Configure database backups
- [ ] Set up monitoring
- [ ] Review security headers
- [ ] Enable rate limiting
- [ ] Regular security audits

### Build for Production
```bash
npm run build
npm start
```

## 📦 Dependencies

### Core
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety

### Database
- `better-sqlite3` - SQLite driver
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables

### Styling
- `tailwindcss` - Utility CSS framework

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Part of the EIAPSTS system.

## 🆘 Support

For issues:
1. Check documentation files
2. Review error logs
3. Verify database initialization
4. Check `.env.local` configuration

## 📞 Contact

For questions about the system, refer to:
- Complete API documentation in [API.md](API.md)
- Security details in [DATABASE_SECURITY.md](DATABASE_SECURITY.md)
- Quick setup in [QUICKSTART.md](QUICKSTART.md)

---

**Last Updated:** March 2024
**Version:** 0.1.0
