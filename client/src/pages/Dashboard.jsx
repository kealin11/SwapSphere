import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { buildImageUrl, conversationsAPI, listingsAPI, offersAPI, ordersAPI } from '../api/api';
import DashboardSidebar from '../components/DashboardSidebar';
import WalletSummary from '../components/WalletSummary';
import Toast from '../components/Toast';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [marketplaceStats, setMarketplaceStats] = useState({
    messages: 0,
    pendingOffers: 0,
    sales: 0,
    purchases: 0,
  });

  // Wrap in useCallback so we can call it manually too
  const fetchUserListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listingsAPI.getByUserId(user.id);
      setListings(response.data ?? []);
    } catch (err) {
      setError('Failed to load your listings');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchMarketplaceStats = useCallback(async () => {
    try {
      const [conversations, offers, sales, purchases] = await Promise.allSettled([
        conversationsAPI.getAll(),
        offersAPI.getAll(),
        ordersAPI.getSoldOrders(user.id),
        ordersAPI.getBoughtOrders(user.id),
      ]);

      // Helper: safely unwrap settled result into an array
      const toArray = (settled) => {
        if (settled.status !== 'fulfilled') return [];
        const raw = settled.value?.data ?? settled.value;
        return Array.isArray(raw) ? raw : [];
      };

      const convData = toArray(conversations);
      const offersData = toArray(offers);
      const salesData = toArray(sales);
      const purchasesData = toArray(purchases);

      setMarketplaceStats({
        messages: convData.length,
        pendingOffers: offersData.filter(
          (o) => o.seller_id === user.id && o.status === 'pending'
        ).length,
        sales: salesData.length,
        purchases: purchasesData.length,
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
    }
  }, [user?.id]);

  // Fetch everything fresh every time the dashboard mounts.
  // This ensures wallet balance and counts are up to date after a purchase.
  useEffect(() => {
    if (user?.id) {
      fetchUserListings();
      fetchMarketplaceStats();
    }
  }, [user?.id, fetchUserListings, fetchMarketplaceStats]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await listingsAPI.delete(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setToast({ type: 'success', message: 'Listing deleted successfully' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete listing' });
      console.error('Error:', err);
    }
  };

  const handleEdit = (id) => navigate(`/edit-listing/${id}`);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const totalValue = listings.reduce(
    (sum, listing) => sum + (Number(listing.price) || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <main className="flex-1 transition-all">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-4 top-20 z-50 rounded bg-blue-600 p-2 text-white md:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
          </div>

          {/* Account Info */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Account Information</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Wallet Summary â€” key={} forces remount so it refetches on every dashboard visit */}
          <div className="mb-8">
            <WalletSummary key={`wallet-${Date.now()}`} userId={user?.id} />
          </div>

          {/* Marketplace Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Messages',  value: marketplaceStats.messages,      path: '/inbox',     badge: marketplaceStats.messages > 0 },
              { label: 'Offers',    value: marketplaceStats.pendingOffers,  path: '/offers',    badge: marketplaceStats.pendingOffers > 0 },
              { label: 'Sales',     value: marketplaceStats.sales,          path: '/sales',     badge: false },
              { label: 'Purchases', value: marketplaceStats.purchases,      path: '/purchases', badge: false },
              { label: 'Wallet',    value: 'View',                          path: '/wallet',    badge: false },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="relative rounded-lg bg-white p-5 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {item.badge && (
                  <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                )}
                <p className="text-sm font-semibold text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
              </button>
            ))}
          </div>

          {/* Listing Stats */}
          {!loading && listings.length > 0 && (
            <div className="mb-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Listings</p>
                    <p className="text-3xl font-bold text-gray-900">{listings.length}</p>
                  </div>
                  <div className="text-4xl">ðŸ“¦</div>
                </div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Listings</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {listings.filter((l) => l.status !== 'sold').length}
                    </p>
                  </div>
                  <div className="text-4xl">âœ“</div>
                </div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-3xl font-bold text-blue-600">R{totalValue.toFixed(2)}</p>
                  </div>
                  <div className="text-4xl">ðŸ’°</div>
                </div>
              </div>
            </div>
          )}

          {/* Listings Section */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
              <button
                onClick={() => navigate('/create-listing')}
                className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                <span>âž•</span> Create Listing
              </button>
            </div>

            {error && !loading && (
              <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="font-semibold">Error</p>
                <p className="mt-1 text-sm">{error}</p>
                <button onClick={fetchUserListings} className="mt-3 text-sm font-semibold underline">
                  Try Again
                </button>
              </div>
            )}

            {loading && (
              <div className="rounded-lg bg-white p-8 shadow-md">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            )}

            {!loading && listings.length === 0 && !error && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                <div className="text-6xl mb-4">ðŸ“­</div>
                <p className="text-xl text-gray-600 font-semibold">No listings yet</p>
                <p className="mt-2 text-gray-500">Create your first listing to get started!</p>
                <button
                  onClick={() => navigate('/create-listing')}
                  className="mt-6 inline-block rounded bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Create Your First Listing
                </button>
              </div>
            )}

            {!loading && listings.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => {
                  const imageUrl = buildImageUrl(listing.image_url, PLACEHOLDER_IMAGE);
                  return (
                    <div
                      key={listing.id}
                      className="overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative h-56 bg-gray-200 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                        />
                        {listing.status === 'sold' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-600 text-white font-bold px-4 py-1 rounded-full text-sm">SOLD</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{listing.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{listing.description}</p>
                        <p className="text-xl font-bold text-blue-600 mb-5">
                          R{Number(listing.price).toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(listing.id)}
                            className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-200"
                          >
                            âœï¸ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-200"
                          >
                            ðŸ—‘ï¸ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
