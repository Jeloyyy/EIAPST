'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
  employeeId?: string;
  employeeName?: string;
}

export default function IssueSupplyModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName,
}: IssueSupplyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoadingSupplies, setIsLoadingSupplies] = useState(true);
  const [formData, setFormData] = useState({
    employeeId: employeeId || '',
    supplyId: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchSupplies();
    }
  }, [isOpen]);

  const fetchSupplies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/supplies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSupplies(Array.isArray(data.data) ? data.data : []);
      setIsLoadingSupplies(false);
    } catch (err) {
      console.error('Error fetching supplies:', err);
      setIsLoadingSupplies(false);
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
      if (!formData.employeeId || !formData.supplyId || formData.quantity <= 0) {
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
        employeeId: employeeId || '',
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
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
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

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee *
              </label>
              {employeeName ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {employeeName}
                </div>
              ) : (
                <input
                  type="text"
                  value={
                    formData.employeeId
                      ? `Employee ID: ${formData.employeeId}`
                      : ''
                  }
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  placeholder="Select from list"
                />
              )}
            </div>

            {/* Supply */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply *
              </label>
              {isLoadingSupplies ? (
                <div className="px-3 py-2 text-gray-500">Loading supplies...</div>
              ) : (
                <select
                  name="supplyId"
                  value={formData.supplyId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <span className="font-medium">${selectedSupply.unit_cost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Total:</span>
                  <span className="font-bold text-blue-600">
                    ${((selectedSupply.unit_cost || 0) * formData.quantity).toFixed(2)}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this issue..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isInsufficientStock}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Issuing Supply...' : 'Issue Supply'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
