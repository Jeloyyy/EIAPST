'use client';

import { useState } from 'react';
import { Eye, EyeOff, RotateCw, X } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    extension_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phone: '',
    role: 'employee',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const characterSets = [
      'ABCDEFGHJKLMNPQRSTUVWXYZ',
      'abcdefghijkmnopqrstuvwxyz',
      '23456789',
      '!@#$%^&*()_+-=[]{}',
    ];
    const allCharacters = characterSets.join('');
    const randomValues = new Uint32Array(12);
    crypto.getRandomValues(randomValues);
    const passwordCharacters = characterSets.map((characters, index) =>
      characters[randomValues[index] % characters.length]
    );

    for (let index = passwordCharacters.length; index < randomValues.length; index += 1) {
      passwordCharacters.push(allCharacters[randomValues[index] % allCharacters.length]);
    }

    for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
      const swapIndex = randomValues[index] % (index + 1);
      [passwordCharacters[index], passwordCharacters[swapIndex]] = [
        passwordCharacters[swapIndex],
        passwordCharacters[index],
      ];
    }

    const password = passwordCharacters.join('');
    setFormData((prev) => ({ ...prev, password, confirmPassword: password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const userPayload = {
        ...formData,
        firstName: formData.first_name,
        middleName: formData.middle_name,
        lastName: formData.last_name,
        extensionName: formData.extension_name,
      };
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to add employee');
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        extension_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        phone: '',
        role: 'employee',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-slate-50 shadow-2xl">
        <div className="border-b border-slate-200 bg-white px-6 pb-5 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Employee directory</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Add Employee</h2>
              <p className="mt-1 text-sm text-slate-500">Create an employee profile and login.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close add employee form"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                <h3 className="text-sm font-semibold text-slate-800">Personal details</h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="John"
              />
            </div>

            {/* Middle Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Middle Name
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Joseph"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Doe"
              />
            </div>

            {/* Extension Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Extension Name (Jr., Sr., III, etc.)
              </label>
              <input
                type="text"
                name="extension_name"
                value={formData.extension_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Jr., Sr., III"
              />
            </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                <h3 className="text-sm font-semibold text-slate-800">Work details</h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="space-y-4">
            {/* Role */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select Department</option>
                <option value="Operations">Operations</option>
                <option value="Front Desk">Front Desk</option>
                <option value="Security">Security</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Administration">Administration</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="+1 234 567 8900"
              />
            </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                <h3 className="text-sm font-semibold text-slate-800">Account access</h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="john@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-20 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Min 8 characters"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button
                    type="button"
                    onClick={generatePassword}
                    aria-label="Generate secure password"
                    title="Generate secure password"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <RotateCw size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((isVisible) => !isVisible)}
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  title={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Adding Employee...' : 'Add Employee'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
