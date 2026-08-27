'use client';

import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, X } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateSecurePassword(length = 16): string {
  const characterSets = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%^&*()_+-=[]{}',
  ];
  const allCharacters = characterSets.join('');
  const passwordCharacters = characterSets.map((characterSet) =>
    characterSet[crypto.getRandomValues(new Uint32Array(1))[0] % characterSet.length]
  );

  while (passwordCharacters.length < length) {
    passwordCharacters.push(
      allCharacters[crypto.getRandomValues(new Uint32Array(1))[0] % allCharacters.length]
    );
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [passwordCharacters[index], passwordCharacters[randomIndex]] = [
      passwordCharacters[randomIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join('');
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

  const handleGeneratePassword = () => {
    const password = generateSecurePassword();
    setFormData((prev) => ({ ...prev, password, confirmPassword: password }));
    setError('');
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
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.first_name,
          middleName: formData.middle_name,
          lastName: formData.last_name,
          extensionName: formData.extension_name,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to add user');
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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed opacity-100 inset-0 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add User</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
              />
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Joseph"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
              />
            </div>

            {/* Extension Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extension Name (Jr., Sr., III, etc.)
              </label>
              <input
                type="text"
                name="extension_name"
                value={formData.extension_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jr., Sr., III"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 234 567 8900"
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw size={14} />
                  Generate secure password
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="relative float-right -mt-8 mr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                className="relative float-right -mt-8 mr-3 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Adding User...' : 'Add User'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
