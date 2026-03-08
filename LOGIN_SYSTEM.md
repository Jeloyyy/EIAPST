# EIAPSTS Login System Documentation

## Overview
This is a professional login system for the Employee Information and Personal Supplies Tracking System (EIAPSTS) app.

## Features
- ✅ Clean, modern authentication UI with Tailwind CSS
- ✅ Email and password validation
- ✅ Protected dashboard with authentication guard
- ✅ Logout functionality
- ✅ Authentication utilities and constants
- ✅ Responsive design for all devices
- ✅ Loading states and error handling

## Project Structure

```
eiapsts/
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── dashboard/
│   │   └── page.tsx              # Protected dashboard
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Home redirect
│   └── globals.css               # Global styles
├── components/
│   └── LoginForm.tsx             # Reusable login form component
├── lib/
│   ├── auth.ts                   # Authentication utilities
│   └── constants.ts              # App-wide constants
└── public/                       # Static assets
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Login
The demo login accepts any email format and password with 6+ characters:
- **Email**: any@email.com
- **Password**: password123

## Authentication Flow

### Login Flow
1. User visits the app (`/`) → Redirects to `/login` if not authenticated
2. User enters credentials on login page
3. Credentials validated and sent to backend (currently mocked)
4. On success: token and user email stored in localStorage
5. User redirected to `/dashboard`

### Authentication Check
- Dashboard automatically checks for `authToken` in localStorage
- If no token found, user is redirected back to login
- Token persists across page refreshes

### Logout
- User clicks logout button on dashboard
- localStorage data cleared
- User redirected to login page

## Key Files

### `app/login/page.tsx`
The main login page component with:
- Email and password inputs
- Form validation
- Error handling
- Loading state with spinner
- Responsive design

### `app/dashboard/page.tsx`
Protected dashboard showing:
- User welcome message
- Navigation bar with logout button
- Feature cards for Employee Info, Supplies, and Logs
- Authentication guard

### `lib/auth.ts`
Authentication utilities:
- `loginUser()` - Handles user login (currently mocked)
- `isAuthenticated()` - Check if user is authenticated
- `getCurrentUser()` - Get current user data
- `logoutUser()` - Clear authentication data

### `lib/constants.ts`
App-wide constants:
- App name and routes
- User roles (Admin, Manager, Employee, Inventory Staff)
- Supply status types

### `components/LoginForm.tsx`
Reusable login form component that can be used in multiple pages.

## Backend Integration

To connect with your backend:

1. **Update `lib/auth.ts`** - Replace the mock `loginUser()` function:
```typescript
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};
```

2. **Create API Routes** - Add authentication endpoints in `app/api/auth/`:
   - `POST /api/auth/login` - Handle login
   - `POST /api/auth/logout` - Handle logout
   - `GET /api/auth/verify` - Verify token
   - `POST /api/auth/refresh` - Refresh token

3. **Use JWT Tokens** - Replace localStorage with secure HTTP-only cookies for production

## Security Considerations

⚠️ **Current Implementation (Demo)**:
- Uses localStorage (not secure for sensitive data)
- No password encryption
- Mock authentication only

✅ **For Production**:
- Use HTTP-only cookies for token storage
- Implement JWT token authentication
- Add CSRF protection
- Use HTTPS only
- Implement token refresh mechanism
- Add rate limiting on login attempts
- Implement password hashing (bcrypt/argon2)
- Add two-factor authentication (2FA)

## Styling

The UI uses **Tailwind CSS v4** with:
- Gradient backgrounds
- Responsive design with mobile-first approach
- Focus states for accessibility
- Loading spinners and animations
- Hover states for interactive elements

## Next Steps

1. **Create Employee Management** - Add pages to manage employee records
2. **Create Supplies Management** - Add inventory and tracking system
3. **Create Activity Logs** - Implement audit trail system
4. **Add User Roles** - Implement role-based access control (RBAC)
5. **Create API Routes** - Build backend authentication system
6. **Setup Database** - Connect to PostgreSQL/MongoDB for data persistence
7. **Add Tests** - Implement unit and integration tests

## Environment Variables

Create `.env.local` file for environment-specific configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=EIAPSTS
```

## Support

For issues or questions about the login system:
1. Check the authentication flow above
2. Verify localStorage is enabled in your browser
3. Check browser console for error messages
4. Ensure all files are in the correct directories

## License

This project is part of the EIAPSTS system.
