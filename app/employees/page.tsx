'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  extension_name?: string;
  email: string;
  phone?: string;
  status: string;
  department?: string;
  role?: string;
}

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false); // State for modal visibility
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null); // State for selected employee
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    setCurrentUserRole(role);
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data.data) ? data.data : []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    }
  };

  const handleAddEmployeeSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        alert('User deactivated successfully');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        alert(data.message || 'Error deactivating user');
      }
    } catch (error) {
      alert('Error deactivating user');
    }
  };

  const handleEditEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    setIsEditEmployeeModalOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.middle_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.extension_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Information</h1>
            <p className="mt-2 text-gray-600">View and manage all users in the system</p>
          </div>
          {currentUserRole === 'admin' && (
            <button 
              onClick={() => setIsAddEmployeeModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
              <Plus size={20} />
              Add Employee
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="rounded-lg bg-white p-4 shadow-md">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg bg-white shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contact Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                {currentUserRole === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={currentUserRole === 'admin' ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={currentUserRole === 'admin' ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.first_name}{user.middle_name ? ` ${user.middle_name}` : ''}{user.extension_name ? ` ${user.extension_name}` : ''} {user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.role || 'employee'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    {currentUserRole === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditEmployee(user)}
                            className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === 'active').length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.status === 'inactive').length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">On Leave</p>
            <p className="text-2xl font-bold text-yellow-600">
              {users.filter((u) => u.status === 'on-leave').length}
            </p>
          </div>
        </div>

        {/* Modals */}
        <AddEmployeeModal
          isOpen={isAddEmployeeModalOpen}
          onClose={() => setIsAddEmployeeModalOpen(false)}
          onSuccess={handleAddEmployeeSuccess}
        />
        {isEditEmployeeModalOpen && (
          <EditEmployeeModal
            isOpen={isEditEmployeeModalOpen}
            onClose={() => setIsEditEmployeeModalOpen(false)}
            employee={selectedEmployee}
            onSaveSuccess={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
