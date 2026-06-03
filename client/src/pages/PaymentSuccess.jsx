import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/api';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const listing_id = searchParams.get('listing_id');
        const buyer_id = searchParams.get('buyer_id');
        const amount = searchParams.get('amount');

        console.log('ðŸ’³ [PaymentSuccess] Confirming payment:', { listing_id, buyer_id, amount });

        if (!listing_id || !buyer_id || !amount) {
          console.warn('âš ï¸ [PaymentSuccess] Missing payment parameters');
          setError('Missing payment information. Please contact support.');
          setLoading(false);
          return;
        }

        const response = await api.post('/payfast/confirm-payment', {
          listing_id: parseInt(listing_id),
          buyer_id: parseInt(buyer_id),
          amount: parseFloat(amount),
        });

        console.log('âœ… [PaymentSuccess] Payment confirmed:', response.data);
        setConfirmationData(response.data);
        setError(null);
      } catch (err) {
        console.error('âš ï¸ [PaymentSuccess] Confirmation error:', err);
        // Still show success â€” ITN may have already processed it
        setError(err.response?.data?.message || 'Payment may still be processing.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-orange-100 rounded-full p-6 w-24 h-24 flex items-center justify-center">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-8">
            Your payment may still be processing. Check your purchases or contact support if the issue persists.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/purchases')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              View My Purchases
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
            <div className="relative bg-green-100 rounded-full p-6 w-24 h-24 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-2">Your payment has been processed successfully.</p>
        <p className="text-sm text-gray-500 mb-6">
          Thank you for your purchase! Your item will appear in My Purchases.
        </p>

        {/* Status Badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd" />
            </svg>
            <span className="text-green-700 font-semibold">Payment Confirmed</span>
          </div>
        </div>

        {/* Payment Details */}
        {confirmationData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-1">
            {confirmationData.amount && (
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> R{parseFloat(confirmationData.amount).toFixed(2)}
              </p>
            )}
            {confirmationData.orderId && (
              <p className="text-sm text-gray-600">
                <strong>Order ID:</strong> #{confirmationData.orderId}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary: go straight to purchases so user sees their new order */}
          <button
            onClick={() => navigate('/purchases')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95 shadow-md"
          >
            ðŸ›ï¸ View My Purchases
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95 shadow-md"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/listings')}
            className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition"
          >
            Browse More Listings
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
