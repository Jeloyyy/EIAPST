'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

interface Supply {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
}

interface IssueSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
  userName?: string;
}

export default function IssueSupplyModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userName,
}: IssueSupplyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    userId: userId || '',
    supplyId: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch users
      const usersRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData.data) ? usersData.data : []);

      // Fetch supplies
      const suppliesRes = await fetch('/api/supplies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const suppliesData = await suppliesRes.json();
      setSupplies(Array.isArray(suppliesData.data) ? suppliesData.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.userId || !formData.supplyId || formData.quantity <= 0) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supply-logs/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to issue supply');
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setFormData({
        userId: userId || '',
        supplyId: '',
        quantity: 1,
        notes: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const selectedSupply = supplies.find((s) => s.id === formData.supplyId);
  const isInsufficientStock =
    selectedSupply && selectedSupply.quantity < formData.quantity;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed bg-opacity-100 inset-0 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Issue Supply</h2>
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
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User *
              </label>
              {userName ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {userName}
                </div>
              ) : isLoading ? (
                <div className="px-3 py-2 text-gray-500">Loading users...</div>
              ) : (
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select User</option>
                  {users
                    .filter((u) => u.status === 'active')
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Supply */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply *
              </label>
              {isLoading ? (
                <div className="px-3 py-2 text-gray-500">Loading supplies...</div>
              ) : (
                <select
                  name="supplyId"
                  value={formData.supplyId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supply</option>
                  {supplies.map((supply) => (
                    <option key={supply.id} value={supply.id}>
                      {supply.name} (Available: {supply.quantity})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Stock Status */}
            {selectedSupply && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Available: {selectedSupply.quantity} units
                {isInsufficientStock && (
                  <span className="text-red-600 ml-2">
                    Only {selectedSupply.quantity} available
                  </span>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  isInsufficientStock
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>

            {/* Unit Cost Display */}
            {selectedSupply && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Unit Cost:</span>
                  <span className="font-medium">₱{selectedSupply.unit_cost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Total:</span>
                  <span className="font-bold text-blue-600">
                    ₱{((selectedSupply.unit_cost || 0) * formData.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Issuing Supply...' : 'Issue Supply'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}