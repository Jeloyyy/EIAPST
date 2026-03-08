// lib/auth.ts - Authentication utilities

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  token?: string;
}

/**
 * Login user with email and password
 * Calls the backend API endpoint
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Call the actual backend API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during login',
    };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('authToken');
};

/**
 * Get current user from storage
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  return userEmail ? { email: userEmail, id: userId } : null;
};

/**
 * Logout user
 */
export const logoutUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
};
