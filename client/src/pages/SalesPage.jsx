import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { ordersAPI, buildImageUrl } from '../api/api';
import EmptyState from '../components/EmptyState';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchSales();
    }
  }, [user?.id]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getSoldOrders(user.id);

      // Backend returns a plain array — handle both array and {data:[]} shapes
      const raw = response.data ?? response;
      const list = Array.isArray(raw) ? raw : [];
      setSales(list);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load your sales. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getFilteredSales = () => {
    if (filter === 'all') return sales;
    return sales.filter((s) => s.status === filter);
  };

  const filteredSales = getFilteredSales();
  const statuses = ['all', ...new Set(sales.map((s) => s.status).filter(Boolean))];
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const completedSales = sales.filter((s) => s.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-3xl font-bold">My Sales</h1>
          <div className="rounded-lg bg-red-100 p-4 text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchSales}
              className="ml-4 text-sm font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold">My Sales</h1>
          <EmptyState
            icon="📦"
            title="No sales yet"
            description="When buyers purchase your items, they'll appear here."
            actionText="Create Listing"
            actionLink="/create-listing"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">My Sales</h1>
          <p className="text-gray-600">Track your sold items and earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <p className="text-3xl font-bold text-blue-600">{sales.length}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600 mb-1">Completed Sales</p>
            <p className="text-3xl font-bold text-green-600">{completedSales}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-600">R{totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded font-medium transition capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
              }`}
            >
              {status === 'all' ? 'All Sales' : status}
            </button>
          ))}
        </div>

        {/* Sales Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSales.map((sale) => (
            <div
              key={sale.orderId ?? sale.id}
              className="rounded-lg bg-white shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                  src={buildImageUrl(sale.image_url, PLACEHOLDER_IMAGE)}
                  alt={sale.title ?? 'Item'}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
                <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  {sale.status ?? 'completed'}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {sale.title ?? 'Untitled item'}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {sale.description ?? ''}
                </p>

                <div className="mb-4 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Buyer:</span>{' '}
                    {sale.buyerName ?? 'Unknown buyer'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span>{' '}
                    {formatDate(sale.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-2xl font-bold text-green-600">
                    +R{Number(sale.amount ?? 0).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Order #{sale.orderId ?? sale.id ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No sales found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}