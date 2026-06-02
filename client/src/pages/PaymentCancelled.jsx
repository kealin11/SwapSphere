import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PaymentCancelled() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate brief processing delay
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRetryPayment = () => navigate('/listings');
  const handleReturnHome = () => navigate('/');
  const handleViewDashboard = () => navigate('/dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-red-200 border-t-red-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Cancelled Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
            <div className="relative bg-red-100 rounded-full p-6 w-24 h-24 flex items-center justify-center">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          Your payment has been cancelled.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          No charges were made to your account. You can try again anytime.
        </p>

        {/* Status Badge */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 font-semibold">Payment Not Completed</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            Retry Payment
          </button>
          <button
            onClick={handleViewDashboard}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
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

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Having issues? <a href="/dashboard" className="text-blue-600 hover:underline">Contact support</a> for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
