'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { RotateCw, X } from 'lucide-react';

interface IssuedSupply {
  id: string;
  supply_id: string;
  quantity: number;
  issued_date: string;
  status: string;
  supply_name: string;
  category: string;
  unit: string;
}

export default function MyIssuedSuppliesPage() {
  const [issuedSupplies, setIssuedSupplies] = useState<IssuedSupply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupply, setSelectedSupply] = useState<IssuedSupply | null>(null);
  const [surrenderReason, setSurrenderReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchMyIssuedSupplies();
  }, [refreshTrigger]);

  const fetchMyIssuedSupplies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supply-logs/surrender-request', {
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

  const handleRequestSurrender = async () => {
    if (!selectedSupply) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supply-logs/surrender-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          logId: selectedSupply.id,
          reason: surrenderReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedSupply(null);
        setSurrenderReason('');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        alert(data.message || 'Failed to request surrender');
      }
    } catch (error) {
      console.error('Error requesting surrender:', error);
      alert('Error requesting surrender');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Issued Supplies</h1>
          <p className="mt-2 text-gray-600">View and request surrender for your issued supplies</p>
        </div>

        {/* Supplies Table */}
        <div className="rounded-lg bg-white shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supply</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Issued Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : issuedSupplies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No issued supplies
                  </td>
                </tr>
              ) : (
                issuedSupplies.map((supply) => (
                  <tr key={supply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{supply.supply_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{supply.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{supply.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{supply.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(supply.issued_date)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {supply.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedSupply(supply)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        <RotateCw size={16} />
                        Request Surrender
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Surrender Request Modal */}
        {selectedSupply && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedSupply(null)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Request Surrender</h2>
                <button onClick={() => setSelectedSupply(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700"><strong>Supply:</strong> {selectedSupply.supply_name}</p>
                <p className="text-sm text-gray-700"><strong>Quantity:</strong> {selectedSupply.quantity} {selectedSupply.unit}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for surrender (optional)
                </label>
                <textarea
                  value={surrenderReason}
                  onChange={(e) => setSurrenderReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Item damaged, no longer needed, etc."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSupply(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestSurrender}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}