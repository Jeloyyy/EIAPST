'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface IssuedSupply {
  id: string;
  user_id: string;
  supply_id: string;
  quantity: number;
  issued_date: string;
  surrendered_date: string | null;
  issued_by: string;
  received_by: string | null;
  status: string;
  notes: string | null;
  first_name: string;
  last_name: string;
  supply_name: string;
  supply_price?: number;
}

interface IssuedSuppliesTableProps {
  onIssueClick: () => void;
}

export default function IssuedSuppliesTable({ onIssueClick }: IssuedSuppliesTableProps) {
  const [issuedSupplies, setIssuedSupplies] = useState<IssuedSupply[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIssuedSupplies();
  }, []);

  const fetchIssuedSupplies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supply-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIssuedSupplies(Array.isArray(data.data) ? data.data : []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching issued supplies:', error);
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-green-100 text-green-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Issued Supplies</h2>
          <p className="mt-1 text-sm text-gray-600">Track all supplies issued to users</p>
        </div>
        <button
          onClick={onIssueClick}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Issue Supply
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Issued To
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Supply Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Issued By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date Issued
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date Returned
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                  Loading issued supplies...
                </td>
              </tr>
            ) : issuedSupplies.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                  No supplies issued yet
                </td>
              </tr>
            ) : (
              issuedSupplies.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.first_name} {item.last_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.supply_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ₱{item.supply_price?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{((item.supply_price || 0) * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.issued_by || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(item.issued_date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(item.surrendered_date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
