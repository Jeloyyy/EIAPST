// hooks/useAuth.ts - Custom hook for authentication

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    const authToken = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');

    if (authToken && userEmail) {
      setUser({
        id: localStorage.getItem('userId') || '',
        email: userEmail,
        name: userEmail.split('@')[0],
        role: 'employee',
      });
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}

/**
 * Hook to require authentication on a page
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return { isLoading, user };
}
