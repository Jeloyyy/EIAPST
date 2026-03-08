# EIAPSTS API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication:

```bash
# Method 1: Cookie (Automatic)
# Browser automatically sends cookies

# Method 2: Bearer Token
Authorization: Bearer <token>
```

## Response Format

All responses are JSON:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@eiapsts.local",
  "password": "Admin@12345"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "secure-token-string",
  "user": {
    "id": "user-123",
    "email": "admin@eiapsts.local",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "admin"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "newuser@company.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "userId": "user-456"
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one special character"
  ]
}
```

### GET /auth/verify
Verify current authentication token.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "admin@eiapsts.local",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "admin"
  }
}
```

### POST /auth/logout
Logout and revoke current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Employee Endpoints

### GET /employees
List all employees.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-123",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@company.com",
      "department": "IT",
      "position": "Developer",
      "phone": "+1-555-0123",
      "hire_date": "2024-01-15",
      "status": "active",
      "created_at": "2024-03-01T10:00:00Z"
    }
  ]
}
```

### POST /employees
Create a new employee. Requires `admin` or `manager` role.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@company.com",
  "department": "IT",
  "position": "Developer",
  "phone": "+1-555-0123",
  "hireDate": "2024-01-15"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Employee created",
  "employeeId": "emp-123"
}
```

### GET /employees/[id]
Get specific employee details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "emp-123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "status": "active"
  }
}
```

### PUT /employees/[id]
Update employee details. Requires `admin` or `manager` role.

**Request (partial update):**
```json
{
  "position": "Senior Developer",
  "phone": "+1-555-0999",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee updated"
}
```

### DELETE /employees/[id]
Soft delete employee (sets status to inactive). Requires `admin` role.

**Response:**
```json
{
  "success": true,
  "message": "Employee deleted"
}
```

## Supply Endpoints

### GET /supplies
List all supplies.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sup-123",
      "name": "Laptop Dell XPS",
      "description": "15 inch laptop",
      "category": "Electronics",
      "quantity": 15,
      "unit": "pcs",
      "reorder_level": 5,
      "status": "available",
      "supplier": "Dell Inc",
      "unit_cost": 899.99,
      "created_at": "2024-03-01T10:00:00Z"
    }
  ]
}
```

### POST /supplies
Create new supply. Requires `admin` or `inventory_staff` role.

**Request:**
```json
{
  "name": "Laptop Dell XPS",
  "description": "15 inch laptop",
  "category": "Electronics",
  "quantity": 15,
  "unit": "pcs",
  "reorderLevel": 5,
  "reorderQuantity": 10,
  "supplier": "Dell Inc",
  "unitCost": 899.99
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Supply created",
  "supplyId": "sup-123"
}
```

### GET /supplies/[id]
Get specific supply details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sup-123",
    "name": "Laptop Dell XPS",
    "quantity": 15,
    "status": "available"
  }
}
```

### PUT /supplies/[id]
Update supply details. Requires `admin` or `inventory_staff` role.

**Request:**
```json
{
  "quantity": 12,
  "reorderLevel": 5,
  "unitCost": 849.99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Supply updated"
}
```

### DELETE /supplies/[id]
Delete supply. Requires `admin` role.

**Response:**
```json
{
  "success": true,
  "message": "Supply deleted"
}
```

## Supply Log Endpoints

### GET /supply-logs
Get supply issuance history with filters.

**Query Parameters:**
- `employeeId` (optional): Filter by employee
- `supplyId` (optional): Filter by supply
- `status` (optional): Filter by status (issued, returned, damaged, lost)
- `limit` (optional): Results limit (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-123",
      "employee_id": "emp-123",
      "supply_id": "sup-123",
      "quantity": 1,
      "issued_date": "2024-03-01T10:00:00Z",
      "returned_date": null,
      "issued_by": "user-456",
      "status": "issued",
      "first_name": "John",
      "last_name": "Doe",
      "supply_name": "Laptop Dell XPS"
    }
  ]
}
```

### POST /supply-logs/issue
Issue supply to employee.

**Request:**
```json
{
  "employeeId": "emp-123",
  "supplyId": "sup-456",
  "quantity": 1,
  "notes": "New laptop for employee"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Supply issued successfully",
  "logId": "log-123"
}
```

### POST /supply-logs/return
Return or mark supply as damaged/lost.

**Request:**
```json
{
  "logId": "log-123",
  "status": "returned",
  "notes": "Employee returned laptop in good condition"
}
```

**Status Options:**
- `returned` - Supply returned in good condition (restocks inventory)
- `damaged` - Supply returned but damaged (doesn't restock)
- `lost` - Supply not returned/lost (doesn't restock)

**Response:**
```json
{
  "success": true,
  "message": "Supply status updated"
}
```

## Audit Log Endpoints

### GET /audit-logs
Get audit logs (Admin only).

**Query Parameters:**
- `action` (optional): Filter by action (LOGIN_SUCCESS, SUPPLY_ISSUED, etc.)
- `userId` (optional): Filter by user ID
- `limit` (optional): Results limit (default: 100)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-123",
      "user_id": "user-123",
      "action": "LOGIN_SUCCESS",
      "resource_type": "user",
      "resource_id": "user-123",
      "details": "{}",
      "ip_address": "192.168.1.1",
      "status": "success",
      "created_at": "2024-03-01T10:00:00Z"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred"
}
```

## Rate Limiting

API implements rate limiting:
- Window: 15 minutes
- Max requests: 100 per window
- Header: `X-RateLimit-Remaining`

## CORS

CORS is configured for:
- Credentials: included
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

## Pagination

For list endpoints:
```typescript
// Get second page of 25 items
GET /api/employees?limit=25&offset=25
```

## Timestamps

All timestamps are in ISO 8601 format:
```
2024-03-08T15:30:45.123Z
```

## Best Practices

1. **Always validate input** on client side
2. **Handle errors gracefully** - check `success` field
3. **Use pagination** for large datasets
4. **Cache tokens** in secure storage
5. **Implement retry logic** for failed requests
6. **Log API errors** for debugging
7. **Use appropriate HTTP methods** (GET, POST, PUT, DELETE)
