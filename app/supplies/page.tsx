'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SupplyEditModal from '@/components/SupplyEditModal';
import { Plus, Package, Edit2 } from 'lucide-react';

interface Supply {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string;
  price?: number;
  status: string;
}

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supplies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSupplies(Array.isArray(data.data) ? data.data : []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching supplies:', error);
      setIsLoading(false);
    }
  };

  const handleEditSupply = (supply: Supply) => {
    setSelectedSupply(supply);
    setIsEditModalOpen(true);
  };

  const handleSaveSupply = async (updatedData: Partial<Supply>) => {
    if (!selectedSupply) return;

    console.log('Saving supply data:', updatedData);

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/supplies/${selectedSupply.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update supply');
      }

      // Refresh supplies list
      await fetchSupplies();
      setIsEditModalOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const filteredSupplies = supplies.filter(
    (supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredSupplies.reduce(
    (sum, s) => sum + (s.price ? s.price * s.quantity : 0),
    0
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Electronics': 'bg-blue-100 text-blue-800',
      'Accessories': 'bg-purple-100 text-purple-800',
      'Peripherals': 'bg-pink-100 text-pink-800',
      'Furniture': 'bg-green-100 text-green-800',
      'Supplies': 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'low-stock-available':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplies Inventory</h1>
            <p className="mt-2 text-gray-600">Manage all supplies and inventory</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            Add Supply
          </button>
        </div>

        {/* Search Bar */}
        <div className="rounded-lg bg-white p-4 shadow-md">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2">
            <Package size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>

        {/* Supplies Table */}
        <div className="rounded-lg bg-white shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                {['admin', 'inventory_staff'].includes(userRole) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={['admin', 'inventory_staff'].includes(userRole) ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
                    Loading supplies...
                  </td>
                </tr>
              ) : filteredSupplies.length === 0 ? (
                <tr>
                  <td colSpan={['admin', 'inventory_staff'].includes(userRole) ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
                    No supplies found
                  </td>
                </tr>
              ) : (
                filteredSupplies.map((supply) => (
                  <tr key={supply.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supply.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {supply.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(supply.category)}`}>
                        {supply.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {supply.quantity} {supply.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ₱{supply.price ? supply.price.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{supply.price ? (supply.price * supply.quantity).toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(supply.status)}`}>
                        {formatStatus(supply.status)}
                      </span>
                    </td>
                    {['admin', 'inventory_staff'].includes(userRole) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditSupply(supply)}
                          className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {/* Grand Total Row */}
            {filteredSupplies.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={['admin', 'inventory_staff'].includes(userRole) ? 6 : 5} className="px-6 py-4 font-semibold text-gray-900">
                    Grand Total:
                  </td>
                  <td className="px-6 py-4 font-bold text-lg text-gray-900">
                    ₱{totalValue.toFixed(2)}
                  </td>
                  {['admin', 'inventory_staff'].includes(userRole) && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{supplies.length}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {supplies.filter((s) => s.status === 'available').length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">
              {supplies.filter((s) => s.status === 'low-stock-available').length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-md">
            <p className="text-sm text-gray-600">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {supplies.filter((s) => s.status === 'out-of-stock').length}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <SupplyEditModal
        supply={selectedSupply}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSupply(null);
        }}
        onSave={handleSaveSupply}
      />
    </DashboardLayout>
  );
}
