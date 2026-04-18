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
  pendingSurrenders: number;
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
    pendingSurrenders: 0,
    userRole: '',
    suppliesByCategory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequestsList, setPendingRequestsList] = useState<any[]>([]);
  const [pendingSurrendersList, setPendingSurrendersList] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const handleApproveRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/supply-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Request approved successfully');
        setRefreshKey((prev) => prev + 1);
      } else {
        alert(data.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to deny this request?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/supply-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'deny' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Request denied');
        setRefreshKey((prev) => prev + 1);
      } else {
        alert(data.message || 'Failed to deny request');
      }
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Error denying request');
    }
  };

  const handleEvaluateSurrender = async (logId: string, action: string) => {
    const confirmMsg = action === 'surrendered' 
      ? 'Confirm surrender? Supply will be returned to inventory.' 
      : action === 'disposed' 
      ? 'Mark as For-Disposal?' 
      : action === 'lost' 
      ? 'Mark as Lost?' 
      : action === 'consumed' 
      ? 'Mark as Consumed?' 
      : 'Deny surrender request?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supply-logs/evaluate-surrender', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logId, action }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRefreshKey((prev) => prev + 1);
      } else {
        alert(data.message || 'Failed to evaluate');
      }
    } catch (error) {
      console.error('Error evaluating surrender:', error);
      alert('Error evaluating surrender');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      // Fetch users
      const usersRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      // Fetch supplies
      const suppliesRes = await fetch('/api/supplies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const suppliesData = await suppliesRes.json();

      // Fetch pending requests and surrenders (for admin)
      let pendingRequests = 0;
      let pendingSurrenders = 0;
      let pendingRequestsData: any[] = [];
      let pendingSurrendersData: any[] = [];
      
      if (userRole === 'admin') {
        // Fetch pending supply requests from supply_requests table
        const requestsRes = await fetch('/api/supply-requests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const requestsData = await requestsRes.json();
        if (requestsData.success && Array.isArray(requestsData.data)) {
          pendingRequests = requestsData.data.length;
          pendingRequestsData = requestsData.data;
        }

        // Fetch pending surrender evaluations
        const surrendersRes = await fetch('/api/supply-logs/evaluate-surrender', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const surrendersData = await surrendersRes.json();
        if (surrendersData.success && Array.isArray(surrendersData.data)) {
          pendingSurrenders = surrendersData.data.length;
          pendingSurrendersData = surrendersData.data;
        }
      }

      // Calculate stats
      const users = Array.isArray(usersData.data) ? usersData.data : [];
      const supplies = Array.isArray(suppliesData.data) ? suppliesData.data : [];

      const activeUsers = users.filter((u: any) => u.status === 'active').length;
      const inactiveUsers = users.filter((u: any) => u.status === 'inactive').length;

      const availableSupplies = supplies.filter((s: any) => s.status === 'available').length;
      const lowStockSupplies = supplies.filter((s: any) => s.status === 'low-stock-available').length;

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
        pendingRequests,
        pendingSurrenders,
        userRole: userRole || 'employee',
        suppliesByCategory,
      });

      setPendingRequestsList(pendingRequestsData);
      setPendingSurrendersList(pendingSurrendersData);

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
          {userStats.filter(stat => stat.value > 0).map((stat, index) => {
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
                    {pendingRequestsList.length === 0 ? (
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">No pending requests</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ) : (
                      pendingRequestsList.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {request.first_name} {request.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{request.supply_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{request.quantity}</td>
                          <td className="px-4 py-3 text-sm space-x-2">
                            <button 
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleDenyRequest(request.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Deny
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Surrender Evaluation Table */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Surrender Evaluation</h2>
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
                    {pendingSurrendersList.length === 0 ? (
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">No surrender requests</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ) : (
                      pendingSurrendersList.map((surrender) => (
                        <tr key={surrender.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {surrender.first_name} {surrender.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{surrender.supply_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{surrender.quantity}</td>
                          <td className="px-4 py-3 text-sm space-x-1">
                            <button 
                              onClick={() => handleEvaluateSurrender(surrender.id, 'surrendered')}
                              className="text-green-600 hover:text-green-800 font-medium text-xs"
                              title="Return to inventory"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => handleEvaluateSurrender(surrender.id, 'disposed')}
                              className="text-orange-600 hover:text-orange-800 font-medium text-xs"
                              title="For disposal"
                            >
                              Dispose
                            </button>
                            <button 
                              onClick={() => handleEvaluateSurrender(surrender.id, 'lost')}
                              className="text-red-600 hover:text-red-800 font-medium text-xs"
                              title="Mark as lost"
                            >
                              Lost
                            </button>
                            <button 
                              onClick={() => handleEvaluateSurrender(surrender.id, 'consumed')}
                              className="text-purple-600 hover:text-purple-800 font-medium text-xs"
                              title="Mark as consumed"
                            >
                              Consumed
                            </button>
                            <button 
                              onClick={() => handleEvaluateSurrender(surrender.id, 'deny')}
                              className="text-gray-600 hover:text-gray-800 font-medium text-xs"
                              title="Deny request"
                            >
                              Deny
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
