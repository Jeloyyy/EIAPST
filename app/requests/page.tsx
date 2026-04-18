'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ShoppingCart, Send } from 'lucide-react';

interface Supply {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
}

interface RequestItem {
  supplyId: string;
  quantity: number;
}

export default function RequestsPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestCart, setRequestCart] = useState<RequestItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : '';

  useEffect(() => {
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

  const filteredSupplies = supplies.filter(
    (supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      supply.status === 'available'
  );

  const addToCart = (supplyId: string) => {
    setRequestCart([...requestCart, { supplyId, quantity: 1 }]);
  };

  const removeFromCart = (index: number) => {
    setRequestCart(requestCart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newCart = [...requestCart];
    newCart[index].quantity = Math.max(1, quantity);
    setRequestCart(newCart);
  };

  const submitRequest = async () => {
    if (requestCart.length === 0) {
      setMessage('Please add supplies to your request');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      const res = await fetch('/api/supply-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          items: requestCart,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Request submitted successfully! Admin will review your request.');
        setRequestCart([]);
      } else {
        setMessage(data.message || 'Error submitting request');
      }
    } catch (error) {
      setMessage('Error submitting request');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSupplyName = (supplyId: string) => {
    return supplies.find((s) => s.id === supplyId)?.name || 'Unknown Supply';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request Supply</h1>
          <p className="mt-2 text-gray-600">Request supplies from inventory</p>
        </div>

        {message && (
          <div className={`rounded-lg p-4 ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Available Supplies */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="rounded-lg bg-white p-4 shadow-md">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2">
                <ShoppingCart size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search available supplies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-black outline-none"
                />
              </div>
            </div>

            {/* Supplies Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {isLoading ? (
                <p className="text-gray-600">Loading supplies...</p>
              ) : filteredSupplies.length === 0 ? (
                <p className="text-gray-600">No available supplies found</p>
              ) : (
                filteredSupplies.map((supply) => (
                  <div key={supply.id} className="rounded-lg bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{supply.name}</h3>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {supply.status}
                      </span>
                    </div>
                    <div className="mb-3 space-y-1">
                      <p className="text-sm text-gray-600">
                        Category: <span className="font-medium">{supply.category}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Available: <span className="font-medium">{supply.quantity} {supply.unit}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(supply.id)}
                      className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add to Request
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Request Cart */}
          <div className="rounded-lg bg-white p-6 shadow-md h-fit sticky top-4">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Request Cart</h2>
            
            {requestCart.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No items in cart</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {requestCart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{getSupplyName(item.supplyId)}</p>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                          className="mt-1 w-16 border text-black border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={submitRequest}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  <Send size={18} />
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
