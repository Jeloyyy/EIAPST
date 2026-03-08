# EIAPSTS Database and Security Documentation

## Overview

The EIAPSTS system now includes SQLite database integration with enterprise-grade security features including:
- ✅ Secure password hashing with bcrypt
- ✅ Session management with token expiration
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for compliance
- ✅ Account lockout protection
- ✅ Parameterized queries to prevent SQL injection
- ✅ Request validation and sanitization

## Architecture

### Database Schema

#### Users Table
Stores user accounts with secure password hashing:
```sql
- id: Unique user identifier
- email: User email (unique)
- password_hash: Salted bcrypt hash (NEVER plain text)
- first_name, last_name: User names
- role: User role (admin, manager, employee, inventory_staff)
- department: User department
- status: Account status (active, inactive, on-leave)
- login_attempts: Failed login counter
- locked_until: Account lockout timestamp
- last_login: Last successful login
- created_at, updated_at: Timestamps
```

#### Employees Table
Employee information linked to user accounts:
```sql
- id: Unique identifier
- user_id: Foreign key to users table
- email, first_name, last_name: Employee info
- department, position: Job details
- hire_date, status: Employment info
- created_by: Admin who created record
```

#### Supplies Table
Inventory/supplies management:
```sql
- id: Unique identifier
- name, description, category: Supply info
- quantity: Current stock level
- unit, unit_cost: Unit information
- reorder_level, reorder_quantity: Auto-reorder thresholds
- status: Stock status (available, low-stock, out-of-stock)
- supplier, created_by: Source tracking
```

#### Supply_Logs Table
Complete audit trail of supply issuance:
```sql
- id: Log entry identifier
- employee_id, supply_id: What was issued to whom
- quantity, issued_date, returned_date: Transaction details
- issued_by, received_by: User accountability
- status: issue status (issued, returned, damaged, lost)
- notes: Additional information
```

#### Audit_Logs Table
Complete system audit trail (admin eyes only):
```sql
- id: Log identifier
- user_id: Who performed action
- action: Action type (LOGIN, SUPPLY_ISSUED, USER_CREATED, etc.)
- resource_type, resource_id: What was affected
- details: JSON with action details
- ip_address, user_agent: Request info
- status: success/failure
- created_at: When it happened
```

#### Sessions Table
Active user sessions:
```sql
- id: Session identifier
- user_id, token: User and token
- expires_at: Token expiration
- ip_address, user_agent: Device fingerprint
- revoked_at: Token revocation timestamp
```

## Security Features

### 1. Password Security

**Implementation:**
- Bcrypt hashing with 12 salt rounds
- Passwords are NEVER stored in plain text
- Password strength validation enforced

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Example:**
```typescript
// Good password: MySecure@Pass123
// Bad password: password123 (no uppercase, no special)
```

### 2. Session Management

**Token Generation:**
- Secure random tokens using crypto API
- 24-hour expiration (configurable)
- Stored in database for revocation

**Token Verification:**
- Every API request verifies token
- Checks if token is revoked
- Validates expiration
- Returns 401 if invalid

### 3. Account Lockout Protection

**Failed Login Handling:**
- Count failed login attempts
- Lock account after 5 failed attempts
- 15-minute lockout period
- Automatic unlock after timeout

### 4. Audit Logging

**All Actions Logged:**
- User login/logout
- Supply issuance/return
- User creation/modification
- Database changes
- Failed security events

**Logged Information:**
- User ID who performed action
- IP address and user agent
- Action type and target
- Success/failure status
- Detailed action parameters

### 5. SQL Injection Prevention

**Implementation:**
- All queries use prepared statements
- NO string concatenation in SQL
- Parameter binding prevents injection

**Example:**
```typescript
// SAFE - Parameterized query
db.prepare('SELECT * FROM users WHERE email = ?').get(email);

// UNSAFE - String concatenation (NEVER use)
db.prepare(`SELECT * FROM users WHERE email = '${email}'`);
```

### 6. Input Validation

**Validation Applied:**
- Email format validation
- Password strength checks
- Required field validation
- Length/type validation
- SQL injection prevention

### 7. Role-Based Access Control (RBAC)

**User Roles:**

1. **Admin** - Full system access
   - Manage all users
   - Manage all supplies
   - View audit logs
   - System configuration

2. **Manager** - Department-level control
   - Create/modify employees
   - Issue/return supplies
   - View department statistics

3. **Inventory Staff** - Inventory control
   - Manage supplies inventory
   - Record supply issuance
   - View supply history

4. **Employee** - Limited access
   - View own information
   - View issued supplies
   - Submit supply requests

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

**Auto-Seeded Default Admin Account:**
- Email: `admin@email.com`
- Password: `admin123`
- ⚠️ **IMPORTANT**: Change this password immediately after first login!

This includes:
- `bcryptjs` - Password hashing
- `better-sqlite3` - SQLite driver
- `dotenv` - Environment variables

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Update values as needed (see environment section below).

### 3. Initialize Database

```bash
npm run db:init
```

This will:
- Create database schema
- Create admin user: `admin@eiapsts.local / Admin@12345`
- Create sample users and supplies
- Set up indexes for performance

### 4. Start Development Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication
```
POST   /api/auth/login        - Login user
POST   /api/auth/register     - Register new user
POST   /api/auth/logout       - Logout user
GET    /api/auth/verify       - Verify token
```

### Employees
```
GET    /api/employees         - List all employees
POST   /api/employees         - Create new employee
GET    /api/employees/[id]    - Get employee details
PUT    /api/employees/[id]    - Update employee
DELETE /api/employees/[id]    - Delete employee
```

### Supplies
```
GET    /api/supplies          - List all supplies
POST   /api/supplies          - Create new supply
GET    /api/supplies/[id]     - Get supply details
PUT    /api/supplies/[id]     - Update supply
DELETE /api/supplies/[id]     - Delete supply
```

### Supply Logs
```
GET    /api/supply-logs       - Get supply logs with filters
POST   /api/supply-logs/issue - Issue supply to employee
POST   /api/supply-logs/return - Return supply from employee
```

### Audit Logs
```
GET    /api/audit-logs        - Get audit logs (admin only)
```

## Usage Examples

### Login (Client-Side)

```typescript
// app/login/page.tsx
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    password: 'SecurePass@123' 
  }),
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('authToken', data.token);
  router.push('/dashboard');
}
```

### Create Employee

```typescript
const response = await fetch('/api/employees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com',
    department: 'IT',
    position: 'Developer',
    hireDate: '2024-01-15',
  }),
});
```

### Issue Supply

```typescript
const response = await fetch('/api/supply-logs/issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    employeeId: 'emp-123',
    supplyId: 'sup-456',
    quantity: 2,
    notes: 'New laptop for employee',
  }),
});
```

## Environment Variables

```env
# Database
DATABASE_URL=./data/eiapsts.db

# Security
NODE_ENV=development
SECURE_COOKIES=false  # Set to true in production with HTTPS
SESSION_TIMEOUT=24    # Hours

# JWT (for future bearer token support)
JWT_SECRET=change-this-in-production

# Rate Limiting
RATE_LIMIT_WINDOW=15        # Minutes
RATE_LIMIT_MAX_REQUESTS=100 # Per window
```

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Generate strong `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Set `SECURE_COOKIES=true`
- [ ] Enable HTTPS/SSL
- [ ] Use HTTP-only cookies for tokens
- [ ] Implement rate limiting
- [ ] Set up CORS properly
- [ ] Regular database backups
- [ ] Monitor audit logs regularly
- [ ] Implement 2FA (optional)
- [ ] Use environment variables for all secrets
- [ ] Restrict database file permissions
- [ ] Enable database encryption (optional)

## Backup & Recovery

### Backup Database

```bash
# Manual backup
cp data/eiapsts.db data/eiapsts.db.backup.$(date +%Y%m%d)

# Archive
tar -czf eiapsts-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore Database

```bash
# From backup
cp data/eiapsts.db.backup.YYYYMMDD data/eiapsts.db
npm run dev
```

## Troubleshooting

### Database Lock Error
```
Error: database is locked
```
Solution: Stop all running instances and delete `*.db-wal` files

### Password Validation Failed
Check password meets all requirements:
- 8+ characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

### Token Expired
Tokens expire after 24 hours. User must log in again.

### Account Locked
Wait 15 minutes or contact admin to manually unlock.

## Monitoring

### View Audit Logs (Admin)

```typescript
const response = await fetch('/api/audit-logs?action=LOGIN_SUCCESS', {
  headers: { 'Authorization': `Bearer ${adminToken}` },
});
const logs = await response.json();
console.log(logs.data);
```

### Query Supply History

```typescript
const response = await fetch('/api/supply-logs?employeeId=emp-123', {
  headers: { 'Authorization': `Bearer ${token}` },
});
const history = await response.json();
console.log(history.data);
```

## Performance Optimization

The database includes the following indexes for performance:
- Users email lookup
- Users by role
- Employees by department
- Supplies by category and status
- Supply logs by employee, supply, and date
- Audit logs by user and action
- Sessions by user and token

This ensures fast queries even with large datasets.

## Support

For issues or questions:
1. Check browser console for error messages
2. Review `/data/eiapsts.db` logs
3. Verify database initialization with `npm run db:init`
4. Check environment variables in `.env.local`

## License

Part of the EIAPSTS system
