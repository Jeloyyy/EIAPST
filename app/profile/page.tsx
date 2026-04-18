'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Lock, Package, Eye, EyeOff, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  extension_name?: string;
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
  status: string;
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [issuedSupplies, setIssuedSupplies] = useState<IssuedSupply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [surrenderingSupplyId, setSurrenderingSupplyId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    extension_name: '',
    phone: '',
    department: '',
    role: 'employee',
    status: 'active',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Added state for user profile

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
    fetchCurrentUser();
    if (userRole === 'admin') {
      fetchAllUsers();
    }
    
    // Check for edit query parameter (admin clicking from employees page)
    const params = new URLSearchParams(window.location.search);
    const editUserId = params.get('edit');
    if (editUserId && userRole === 'admin') {
      // Will be handled after allUsers is fetched
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams(window.location.search);
      const editUserId = params.get('edit');

      // Prioritize the `edit` parameter if the user is an admin
      const userId = isAdmin && editUserId ? editUserId : localStorage.getItem('userId');

      if (!userId) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentUser(data.data);
        setSelectedUser(data.data);
        setFormData({
          first_name: data.data.first_name || '',
          middle_name: data.data.middle_name || '',
          last_name: data.data.last_name || '',
          extension_name: data.data.extension_name || '',
          phone: data.data.phone || '',
          department: data.data.department || '',
          role: data.data.role || 'employee',
          status: data.data.status || 'active',
        });
        fetchIssuedSupplies(data.data.id);
        setUserProfile(data.data);
      } else {
        console.error('Failed to fetch user profile:', data.message);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.data);
        
        // Check for edit query parameter after users are fetched
        const params = new URLSearchParams(window.location.search);
        const editUserId = params.get('edit');
        if (editUserId) {
          const userToEdit = data.data.find((u: UserProfile) => u.id === editUserId);
          if (userToEdit) {
            setSelectedUser(userToEdit);
            setFormData({
              first_name: userToEdit.first_name || '',
              middle_name: userToEdit.middle_name || '',
              last_name: userToEdit.last_name || '',
              extension_name: userToEdit.extension_name || '',
              phone: userToEdit.phone || '',
              department: userToEdit.department || '',
              role: userToEdit.role || 'employee',
              status: userToEdit.status || 'active',
            });
            fetchIssuedSupplies(userToEdit.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchIssuedSupplies = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/supply-logs?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIssuedSupplies(data.data);
      }
    } catch (error) {
      console.error('Error fetching supplies:', error);
    }
  };

  const handleUserSelect = async (userId: string) => {
    if (userId === 'self') {
      setSelectedUser(currentUser);
      if (currentUser) {
        setFormData({
          first_name: currentUser.first_name || '',
          middle_name: currentUser.middle_name || '',
          last_name: currentUser.last_name || '',
          extension_name: currentUser.extension_name || '',
          phone: currentUser.phone || '',
          department: currentUser.department || '',
          role: currentUser.role || 'employee',
          status: currentUser.status || 'active',
        });
        fetchIssuedSupplies(currentUser.id);
      }
    } else {
      const user = allUsers.find((u) => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setFormData({
          first_name: user.first_name || '',
          middle_name: user.middle_name || '',
          last_name: user.last_name || '',
          extension_name: user.extension_name || '',
          phone: user.phone || '',
          department: user.department || '',
          role: user.role || 'employee',
          status: user.status || 'active',
        });
        fetchIssuedSupplies(user.id);
      }
    }
    setIsEditing(false);
    setIsChangingPassword(false);
    setMessage('');
  };

  const handleUpdateProfile = async () => {
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

  const handleReturnSupply = async (supplyId: string) => {
    try {
      setSurrenderingSupplyId(supplyId);

      const token = localStorage.getItem('authToken');
      const reason = window.prompt('Optional: provide a reason for surrender', '') || '';

      const res = await fetch('/api/supply-logs/surrender-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          logId: supplyId,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.message || 'Failed to submit surrender request');
        setMessageType('error');
        return;
      }

      setMessage(data.message || 'Surrender request submitted. Admin will evaluate.');
      setMessageType('success');

      if (selectedUser?.id) {
        fetchIssuedSupplies(selectedUser.id);
      } else if (currentUser?.id) {
        fetchIssuedSupplies(currentUser.id);
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error submitting surrender request');
      setMessageType('error');
    } finally {
      setSurrenderingSupplyId(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayUser = selectedUser || currentUser;
  const isEditingSelf = selectedUser?.id === currentUser?.id;

  // Ensure displayUser?.status is safely accessed
  const displayStatus = displayUser?.status
    ? displayUser.status.charAt(0).toUpperCase() + displayUser.status.slice(1)
    : 'Unknown';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin ? 'Manage user profiles and account settings' : 'Manage your account settings and profile information'}
          </p>
        </div>

        {/* Admin User Selector - Only admins can see other users */}
        {isAdmin && (
          <div className="rounded-lg bg-white p-4 shadow-md">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users size={20} />
                View/Edit Profile:
              </label>
              <select
                value={selectedUser?.id || 'self'}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="flex-1 max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="self">My Profile (Self)</option>
                {allUsers
                  .filter((u) => u.id !== currentUser?.id)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

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
                      <p className="mt-1 font-medium text-gray-900">{displayUser?.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Middle Name</p>
                      <p className="mt-1 font-medium text-gray-900">{displayUser?.middle_name || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Last Name</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {displayUser?.last_name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Name</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {displayUser?.last_name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Extension Name</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {displayUser?.extension_name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="mt-1 font-medium text-gray-900">{displayUser?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="mt-1 font-medium text-gray-900">{displayUser?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="mt-1 font-medium text-gray-900">{displayUser?.department || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="mt-1 font-medium text-gray-900 capitalize">{displayUser?.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          displayStatus === 'active' ? 'bg-green-100 text-green-800' :
                          displayStatus === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {displayStatus}
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
                      <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                      <input
                        type="text"
                        value={formData.middle_name}
                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Extension Name</label>
                      <input
                        type="text"
                        value={formData.extension_name}
                        onChange={(e) => setFormData({ ...formData, extension_name: e.target.value })}
                        placeholder="Jr., Sr., III"
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
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  
                  {/* Admin-only fields - only show when editing other users */}
                  {isAdmin && !isEditingSelf && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="on-leave">On Leave</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateProfile}
                    className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Change Password Section - Only show when editing own profile */}
            {(isEditingSelf || !isAdmin) && (
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
            )}

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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {issuedSupplies.map((supply) => (
                        <tr key={supply.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{supply.supply_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{supply.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(supply.issued_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              supply.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                              supply.status === 'surrendered' ? 'bg-green-100 text-green-800' :
                              supply.status === 'pending-surrender-evaluation' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {supply.status === 'pending-surrender-evaluation' ? 'pending surrender evaluation' : supply.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(!isAdmin || isEditingSelf) && supply.status === 'issued' ? (
                              <button
                                onClick={() => handleReturnSupply(supply.id)}
                                disabled={surrenderingSupplyId === supply.id}
                                className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {surrenderingSupplyId === supply.id ? 'Submitting...' : 'Request Surrender'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
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
                  <p className="font-semibold text-gray-900 capitalize">{displayUser?.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full mt-1 ${
                    displayStatus === 'active' ? 'bg-green-100 text-green-800' :
                    displayStatus === 'inactive' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {displayStatus}
                  </span>
                </div>
                {isAdmin && !isEditingSelf && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600 uppercase">Editing</p>
                    <p className="text-sm font-medium text-blue-600">Other User Profile</p>
                  </div>
                )}
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
