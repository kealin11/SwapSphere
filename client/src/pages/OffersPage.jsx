import { useEffect, useMemo, useState, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { offersAPI } from '../api/api';
import EmptyState from '../components/EmptyState';

const statusStyles = {
  pending:  'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function OffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // offerId being acted on

  const fetchOffers = useCallback(async () => {
    if (!user?.id) {
      setOffers([]);
      setLoading(false);
      setError('Please log in to view offers');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await offersAPI.getAll();

      // Backend returns a plain array — handle both array and {data:[]} shapes
      const raw = response.data ?? response;
      setOffers(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Error loading offers:', err);
      setOffers([]);
      setError(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleDecision = async (offerId, action) => {
    try {
      setActionLoading(offerId);
      setError('');
      if (action === 'accept') {
        await offersAPI.accept(offerId);
      } else {
        await offersAPI.reject(offerId);
      }
      await fetchOffers();
    } catch (err) {
      console.error('Error updating offer:', err);
      setError(err.response?.data?.message || 'Failed to update offer. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOffers = useMemo(() => {
    if (filter === 'all')      return offers;
    if (filter === 'received') return offers.filter((o) => o.seller_id === user?.id);
    if (filter === 'sent')     return offers.filter((o) => o.buyer_id  === user?.id);
    return offers.filter((o) => o.status === filter);
  }, [filter, offers, user?.id]);

  const pendingReceived = offers.filter(
    (o) => o.seller_id === user?.id && o.status === 'pending'
  ).length;

  const formatDate = (dateString) => {
    if (!dateString) return 'recently';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
            <p className="mt-1 text-gray-600">Review offers you have sent and received.</p>
          </div>
          {pendingReceived > 0 && (
            <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              {pendingReceived} pending response{pendingReceived === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchOffers} className="ml-4 text-sm font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'received', 'sent', 'pending', 'accepted', 'rejected'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === item
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-500'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredOffers.length === 0 && !error && (
          <EmptyState
            title="No offers found"
            description="Make an offer from a listing, or wait for buyers to negotiate on your items."
            actionText="Browse Listings"
            actionLink="/listings"
          />
        )}

        {/* Offers grid */}
        {!loading && filteredOffers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOffers.map((offer) => {
              const isSeller = offer.seller_id === user?.id;
              const isActing = actionLoading === offer.id;

              return (
                <div key={offer.id} className="rounded-lg bg-white p-5 shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 truncate">
                        {offer.listing_title ?? 'Untitled listing'}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {isSeller
                          ? `Buyer: ${offer.buyer_name ?? 'Unknown'}`
                          : `Seller: ${offer.seller_name ?? 'Unknown'}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        statusStyles[offer.status] ?? statusStyles.pending
                      }`}
                    >
                      {offer.status ?? 'pending'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Listed</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        R{safeNumber(offer.listing_price).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Offered</p>
                      <p className="mt-1 text-lg font-bold text-blue-600">
                        R{safeNumber(offer.offered_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-500">
                    Created {formatDate(offer.created_at)}
                  </p>

                  {isSeller && offer.status === 'pending' && (
                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleDecision(offer.id, 'accept')}
                        disabled={isActing}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActing ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecision(offer.id, 'reject')}
                        disabled={isActing}
                        className="flex-1 rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActing ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}