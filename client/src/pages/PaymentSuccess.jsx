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
        // Extract payment details from URL parameters
        const listing_id = searchParams.get('listing_id');
        const buyer_id = searchParams.get('buyer_id');
        const amount = searchParams.get('amount');

        console.log('💳 [PaymentSuccess] Confirming payment with params:', {
          listing_id,
          buyer_id,
          amount,
          timestamp: new Date().toISOString(),
        });

        if (!listing_id || !buyer_id || !amount) {
          console.warn('⚠️ [PaymentSuccess] Missing payment parameters');
          setError('Missing payment information. Please contact support.');
          setLoading(false);
          return;
        }

        // Call the fallback confirmation endpoint
        try {
          const response = await api.post('/payfast/confirm-payment', {
            listing_id: parseInt(listing_id),
            buyer_id: parseInt(buyer_id),
            amount: parseFloat(amount),
          });

          console.log('✅ [PaymentSuccess] Payment confirmed:', response.data);
          setConfirmationData(response.data);
          setError(null);
        } catch (err) {
          // If confirmation fails, log but still show success (payment may have gone through)
          console.error('⚠️ [PaymentSuccess] Confirmation error:', err);
          setError(err.response?.data?.message || 'Could not confirm payment, but it may still be processing.');
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ [PaymentSuccess] Unexpected error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  const handleReturnHome = () => navigate('/');
  const handleViewListings = () => navigate('/listings');
  const handleViewDashboard = () => navigate('/dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  // Show error if payment confirmation failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 rounded-full p-6 w-24 h-24 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Processing</h1>

          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-8">
            Your payment may still be processing. Please check your orders or contact support if the issue persists.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleViewDashboard}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            >
              View Dashboard
            </button>
            <button
              onClick={handleReturnHome}
              className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
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
              <svg
                className="w-12 h-12 text-green-600 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          Your payment has been processed successfully.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Thank you for your purchase! Your transaction is complete.
        </p>

        {/* Status Badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-700 font-semibold">Payment Confirmed</span>
          </div>
        </div>

        {/* Payment Details */}
        {confirmationData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Amount:</strong> R{parseFloat(confirmationData.amount || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Order ID:</strong> {confirmationData.orderId || 'Processing...'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleViewDashboard}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            View Dashboard
          </button>
          <button
            onClick={handleViewListings}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            Browse More Listings
          </button>
          <button
            onClick={handleReturnHome}
            className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Return to Home
          </button>
        </div>

        {/* Footer Message */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Transaction Time:</p>
          <p className="text-sm font-mono text-gray-700 bg-gray-50 p-3 rounded break-all">
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
