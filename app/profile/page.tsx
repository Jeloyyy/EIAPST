'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Lock, Package, Eye, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department?: string;
  role: string;
  status: string;
}

interface IssuedSupply {
  id: string;
  supply_name: string;
  quantity: number;
  issued_date: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [issuedSupplies, setIssuedSupplies] = useState<IssuedSupply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchUserProfile();
    fetchIssuedSupplies();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const email = localStorage.getItem('userEmail');

      // For now, create a profile from localStorage
      setUserProfile({
        id: userId || '',
        email: email || '',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1 234-567-8900',
        department: 'IT',
        role: localStorage.getItem('userRole') || 'employee',
        status: 'active',
      });

      setFormData({
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1 234-567-8900',
        department: 'IT',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchIssuedSupplies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      // Placeholder for issued supplies
      setIssuedSupplies([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching supplies:', error);
      setIsLoading(false);
    }
  };

  const handleEditProfile = async () => {
    setMessage('');
    try {
      // Validate form
      if (!formData.first_name || !formData.last_name) {
        setMessage('First name and last name are required');
        setMessageType('error');
        return;
      }

      // In a real app, send to API
      setUserProfile({
        ...userProfile!,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        department: formData.department,
      });

      setMessage('Profile updated successfully!');
      setMessageType('success');
      setIsEditing(false);

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile');
      setMessageType('error');
    }
  };

  const handleChangePassword = async () => {
    setMessage('');
    try {
      // Validate passwords
      if (!passwordData.current_password) {
        setMessage('Current password is required');
        setMessageType('error');
        return;
      }

      if (!passwordData.new_password) {
        setMessage('New password is required');
        setMessageType('error');
        return;
      }

      if (passwordData.new_password !== passwordData.confirm_password) {
        setMessage('New password and confirmation do not match');
        setMessageType('error');
        return;
      }

      if (passwordData.new_password.length < 6) {
        setMessage('Password must be at least 6 characters');
        setMessageType('error');
        return;
      }

      // In a real app, send to API
      setMessage('Password changed successfully!');
      setMessageType('success');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setIsChangingPassword(false);

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error changing password');
      setMessageType('error');
    }
  };

  const handleReturnSupply = (supplyId: string) => {
    setMessage('Return request submitted! Admin will process your request.');
    setMessageType('success');
    setTimeout(() => setMessage(''), 3000);
  };

  if (isLoading || !userProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and profile information</p>
        </div>

        {message && (
          <div
            className={`rounded-lg p-4 ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Section */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User size={24} className="text-blue-600" />
                  Profile Information
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">First Name</p>
                      <p className="mt-1 font-medium text-gray-900">{userProfile.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Name</p>
                      <p className="mt-1 font-medium text-gray-900">{userProfile.last_name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="mt-1 font-medium text-gray-900">{userProfile.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="mt-1 font-medium text-gray-900">{userProfile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="mt-1 font-medium text-gray-900">{userProfile.department || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="mt-1 font-medium text-gray-900 capitalize">{userProfile.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="mt-1">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {userProfile.status.charAt(0).toUpperCase() + userProfile.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    onClick={handleEditProfile}
                    className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Change Password Section */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lock size={24} className="text-blue-600" />
                  Security
                </h2>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                >
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {isChangingPassword && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, current_password: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                        }
                        className="absolute right-3 top-2 text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, new_password: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                        }
                        className="absolute right-3 top-2 text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirm_password: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                        }
                        className="absolute right-3 top-2 text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>

            {/* Issued Supplies Section */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package size={24} className="text-blue-600" />
                Issued Supplies
              </h2>

              {issuedSupplies.length === 0 ? (
                <p className="text-gray-600">No supplies issued yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Supply</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {issuedSupplies.map((supply) => (
                        <tr key={supply.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{supply.supply_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{supply.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{supply.issued_date}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleReturnSupply(supply.id)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Request Return
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Account Status */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="font-bold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 uppercase">Role</p>
                  <p className="font-semibold text-gray-900 capitalize">{userProfile.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Status</p>
                  <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 mt-1">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-lg bg-blue-50 p-6 shadow-md border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-4">Account Info</h3>
              <p className="text-xs text-gray-600 mb-2">
                For security changes or account issues, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
