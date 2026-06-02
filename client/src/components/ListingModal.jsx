import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import usePayFast from '../hooks/usePayFast';
import { conversationsAPI, offersAPI } from '../api/api';
import Toast from './Toast';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

export default function ListingModal({ listing, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: paymentLoading, initiatePayment, clearError } = usePayFast();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [offerAmount, setOfferAmount] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const isOwner = user?.id === listing.user_id;
  const imageUrl = (() => {
    if (!listing.image_url) return PLACEHOLDER_IMAGE;
    if (listing.image_url.startsWith('http')) return listing.image_url;
    return `http://localhost:5000${listing.image_url}`;
  })();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently added';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const showNotice = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleBuyNow = async () => {
    try {
      if (!user) {
        showNotice('Please log in to make a purchase', 'error');
        return;
      }

      clearError();

      const amountInCents = Math.round(Number(listing.price) * 100);

      await initiatePayment(amountInCents, listing.title, {
        listing_id: listing.id,
        user_id: user.id,
      });
    } catch (err) {
      showNotice(err.message || 'Failed to initiate payment', 'error');
    }
  };

  const handleMessageSeller = async () => {
    if (!user) {
      showNotice('Please log in to message the seller', 'error');
      return;
    }

    if (isOwner) {
      showNotice('This is your listing', 'error');
      return;
    }

    try {
      setMessageLoading(true);
      const response = await conversationsAPI.create({ listing_id: listing.id });
      onClose();
      navigate(`/inbox/${response.data.id}`);
    } catch (err) {
      showNotice(err.response?.data?.message || 'Could not start conversation', 'error');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleMakeOffer = async (event) => {
    event.preventDefault();

    if (!user) {
      showNotice('Please log in to make an offer', 'error');
      return;
    }

    if (isOwner) {
      showNotice('You cannot make an offer on your own listing', 'error');
      return;
    }

    const offeredPrice = Number(offerAmount);
    if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
      showNotice('Enter a valid offer amount', 'error');
      return;
    }

    try {
      setOfferLoading(true);
      await offersAPI.create({
        listing_id: listing.id,
        offered_price: offeredPrice,
      });
      setOfferAmount('');
      showNotice('Offer sent to the seller');
    } catch (err) {
      showNotice(err.response?.data?.message || 'Could not send offer', 'error');
    } finally {
      setOfferLoading(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4 py-6 backdrop-blur-sm sm:px-6"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-600">Listing details</p>
            <h2 id="listing-modal-title" className="mt-1 truncate text-2xl font-bold text-gray-950">
              {listing.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close listing details"
            type="button"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="bg-gray-100 p-4 sm:p-6">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <img
                  src={imageUrl}
                  alt={listing.title}
                  className="aspect-[4/3] h-full max-h-[560px] w-full object-contain"
                  onError={(event) => {
                    event.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="mt-1 text-4xl font-bold tracking-normal text-blue-600">
                  R{Number(listing.price).toFixed(2)}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {listing.category && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium uppercase text-gray-500">Category</p>
                      <p className="mt-1 font-semibold text-gray-950">{listing.category}</p>
                    </div>
                  )}
                  {listing.condition && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium uppercase text-gray-500">Condition</p>
                      <p className="mt-1 font-semibold text-gray-950">{listing.condition}</p>
                    </div>
                  )}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">Posted</p>
                    <p className="mt-1 font-semibold text-gray-950">{formatDate(listing.created_at)}</p>
                  </div>
                </div>
              </section>

              <section className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-950">Description</h3>
                <p className="mt-3 whitespace-pre-line leading-7 text-gray-700">
                  {listing.description || 'No description provided.'}
                </p>
              </section>

              {listing.seller_name && (
                <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <h3 className="text-lg font-semibold text-gray-950">Seller Information</h3>
                  <div className="mt-3 space-y-2 text-gray-700">
                    <p>
                      <span className="font-semibold text-gray-950">Name:</span> {listing.seller_name}
                    </p>
                    {listing.seller_email && (
                      <p className="break-all">
                        <span className="font-semibold text-gray-950">Email:</span> {listing.seller_email}
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <button
                  onClick={handleMessageSeller}
                  disabled={messageLoading || isOwner}
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  {messageLoading ? 'Opening...' : 'Message Seller'}
                </button>

                <form onSubmit={handleMakeOffer}>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={offerAmount}
                      onChange={(event) => setOfferAmount(event.target.value)}
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Offer amount"
                      disabled={isOwner}
                      className="min-w-0 rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                    />
                    <button
                      type="submit"
                      disabled={offerLoading || isOwner}
                      className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {offerLoading ? 'Sending...' : 'Make Offer'}
                    </button>
                  </div>
                </form>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    type="button"
                  >
                    Back to Listings
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={paymentLoading || isOwner}
                    className={`rounded-lg px-4 py-3 font-semibold text-white shadow-sm transition ${
                      paymentLoading || isOwner
                        ? 'cursor-not-allowed bg-green-300'
                        : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
                    }`}
                    type="button"
                  >
                    {paymentLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Buy Now'
                    )}
                  </button>
                </div>
              </section>

              {showToast && (
                <Toast
                  message={toastMessage}
                  type={toastType}
                  onClose={() => setShowToast(false)}
                  duration={4000}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
