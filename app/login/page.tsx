'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call the actual login API
      const response = await loginUser({ email, password });

      if (!response.success) {
        setError(response.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Store auth token and user email
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userEmail', email);
        if (response.user) {
          localStorage.setItem('userId', response.user.id);
          localStorage.setItem('userRole', response.user.role || '');
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[24px] border-blue-500/20" />
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-lg shadow-blue-950/30">
              <Image src="/images/resort-logo-icon.png" alt="E.M. Villanueva Resort logo" width={96} height={96} className="h-full w-full object-contain" priority />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">E.M. Villanueva Resort</p>
            <h1 className="mt-3 max-w-xs text-3xl font-bold leading-tight tracking-tight">Employee operations, in one place.</h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
              Access employee records and supplies tracking securely.
            </p>
          </div>
          <p className="relative text-xs text-slate-400">Employee Information & Personal Supplies Tracking System</p>
        </div>

        <div className="bg-white px-6 py-8 sm:px-10 sm:py-12">
          <div className="mb-8 md:hidden">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-sm">
              <Image src="/images/resort-logo-icon.png" alt="E.M. Villanueva Resort logo" width={64} height={64} className="h-full w-full object-contain" priority />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">E.M. Villanueva Resort</p>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to continue to your workspace.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-600"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-600"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="mb-7 flex items-center justify-between gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="h-5 w-5 animate-spin mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-200 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Need help?{' '}
              <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                Contact IT Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
