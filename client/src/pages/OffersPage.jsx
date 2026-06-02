import { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { offersAPI } from '../api/api';
import EmptyState from '../components/EmptyState';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function OffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await offersAPI.getAll();
      setOffers(response.data || []);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOffers();
  }, []);

  const handleDecision = async (offerId, action) => {
    try {
      if (action === 'accept') {
        await offersAPI.accept(offerId);
      } else {
        await offersAPI.reject(offerId);
      }
      await fetchOffers();
    } catch (err) {
      console.error('Error updating offer:', err);
      setError(err.response?.data?.message || 'Failed to update offer');
    }
  };

  const filteredOffers = useMemo(() => {
    if (filter === 'all') return offers;
    if (filter === 'received') return offers.filter((offer) => offer.seller_id === user?.id);
    if (filter === 'sent') return offers.filter((offer) => offer.buyer_id === user?.id);
    return offers.filter((offer) => offer.status === filter);
  }, [filter, offers, user?.id]);

  const pendingReceived = offers.filter((offer) => offer.seller_id === user?.id && offer.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
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

        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'received', 'sent', 'pending', 'accepted', 'rejected'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === item ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-500'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchOffers} className="mt-2 text-sm font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredOffers.length === 0 && (
          <EmptyState
            title="No offers found"
            description="Make an offer from a listing, or wait for buyers to negotiate on your items."
            actionText="Browse Listings"
            actionLink="/listings"
          />
        )}

        {!loading && filteredOffers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOffers.map((offer) => {
              const isSeller = offer.seller_id === user?.id;
              return (
                <div key={offer.id} className="rounded-lg bg-white p-5 shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{offer.listing_title}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {isSeller ? `Buyer: ${offer.buyer_name}` : `Seller: ${offer.seller_name}`}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[offer.status]}`}>
                      {offer.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Listed</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">R{Number(offer.listing_price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Offered</p>
                      <p className="mt-1 text-lg font-bold text-blue-600">R{Number(offer.offered_price).toFixed(2)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-500">
                    Created {new Date(offer.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>

                  {isSeller && offer.status === 'pending' && (
                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleDecision(offer.id, 'accept')}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecision(offer.id, 'reject')}
                        className="flex-1 rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-200"
                      >
                        Reject
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
