import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { ordersAPI, buildImageUrl } from '../api/api';
import EmptyState from '../components/EmptyState';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchPurchases();
    }
  }, [user?.id]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getBoughtOrders(user.id);

      // Backend returns a plain array â€” handle both array and {data:[]} shapes
      const raw = response.data ?? response;
      const list = Array.isArray(raw) ? raw : [];
      setPurchases(list);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Failed to load your purchases. Please try again.');
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

  const getFilteredPurchases = () => {
    if (filter === 'all') return purchases;
    return purchases.filter((p) => p.status === filter);
  };

  const filteredPurchases = getFilteredPurchases();
  const statuses = ['all', ...new Set(purchases.map((p) => p.status).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-3xl font-bold">My Purchases</h1>
          <div className="rounded-lg bg-red-100 p-4 text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchPurchases}
              className="ml-4 text-sm font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold">My Purchases</h1>
          <EmptyState
            icon="ðŸ›ï¸"
            title="No purchases yet"
            description="When you buy items from sellers, they'll appear here."
            actionText="Browse Listings"
            actionLink="/listings"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">My Purchases</h1>

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
              {status === 'all' ? 'All Purchases' : status}
            </button>
          ))}
        </div>

        {/* Purchases Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPurchases.map((purchase) => (
            <div
              key={purchase.orderId ?? purchase.id}
              className="rounded-lg bg-white shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                  src={buildImageUrl(purchase.image_url, PLACEHOLDER_IMAGE)}
                  alt={purchase.title ?? 'Item'}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  {purchase.status ?? 'completed'}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {purchase.title ?? 'Untitled item'}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {purchase.description ?? ''}
                </p>

                <div className="mb-4 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Seller:</span>{' '}
                    {purchase.sellerName ?? 'Unknown seller'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span>{' '}
                    {formatDate(purchase.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-2xl font-bold text-blue-600">
                    R{Number(purchase.amount ?? 0).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Order #{purchase.orderId ?? purchase.id ?? 'â€”'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No purchases found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
