'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Package, ShoppingCart, RotateCw } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalSupplies: number;
  availableSupplies: number;
  lowStockSupplies: number;
  issuedSupplies: number;
  pendingRequests: number;
  pendingReturns: number;
  userRole: string;
  suppliesByCategory: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalSupplies: 0,
    availableSupplies: 0,
    lowStockSupplies: 0,
    issuedSupplies: 0,
    pendingRequests: 0,
    pendingReturns: 0,
    userRole: '',
    suppliesByCategory: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      // Fetch users
      const usersRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      // Fetch supplies
      const suppliesRes = await fetch('/api/supplies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const suppliesData = await suppliesRes.json();

      // Calculate stats
      const users = Array.isArray(usersData.data) ? usersData.data : [];
      const supplies = Array.isArray(suppliesData.data) ? suppliesData.data : [];

      const activeUsers = users.filter((u: any) => u.status === 'active').length;
      const inactiveUsers = users.filter((u: any) => u.status === 'inactive').length;

      const availableSupplies = supplies.filter((s: any) => s.status === 'available').length;
      const lowStockSupplies = supplies.filter((s: any) => s.status === 'low-stock').length;

      // Group supplies by category for chart
      const categoryMap = new Map();
      supplies.forEach((supply: any) => {
        const category = supply.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + supply.quantity);
      });

      const suppliesByCategory = Array.from(categoryMap).map(([category, quantity]) => ({
        name: category,
        value: quantity,
      }));

      setStats({
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalSupplies: supplies.length,
        availableSupplies,
        lowStockSupplies,
        issuedSupplies: supplies.reduce((sum: number, s: any) => sum + (s.issued_qty || 0), 0),
        pendingRequests: 0,
        pendingReturns: 0,
        userRole: userRole || 'employee',
        suppliesByCategory,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  const userStats = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      subtext: `${stats.activeUsers} active, ${stats.inactiveUsers} inactive`,
    },
    {
      title: 'Total Supplies',
      value: stats.totalSupplies,
      icon: Package,
      color: 'bg-green-500',
      subtext: `${stats.availableSupplies} available`,
    },
    {
      title: 'Issued Supplies',
      value: stats.issuedSupplies,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      subtext: 'Distributed to users',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: RotateCw,
      color: 'bg-orange-500',
      subtext: 'Awaiting approval',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to E.M. Villanueva Resort - Employee & Personal Supplies Tracking</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {userStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="mt-2 text-xs text-gray-600">{stat.subtext}</p>
                  </div>
                  <div className={`rounded-lg ${stat.color} p-3 text-white`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Status Chart */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold text-gray-900">User Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats.activeUsers },
                    { name: 'Inactive', value: stats.inactiveUsers },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Supplies by Category Chart */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Supplies by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.suppliesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supplies Status Chart */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Supplies Status Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Supplies',
                  Available: stats.availableSupplies,
                  'Low Stock': stats.lowStockSupplies,
                  Issued: stats.issuedSupplies,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Available" fill="#10B981" />
              <Bar dataKey="Low Stock" fill="#F59E0B" />
              <Bar dataKey="Issued" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Admin Section */}
        {stats.userRole === 'admin' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Request Supplies Table */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Pending Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Supply</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">No pending requests</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Return Requests Table */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Return Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Supply</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">No return requests</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
