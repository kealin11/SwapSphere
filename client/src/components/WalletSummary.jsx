import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../api/api';

export default function WalletSummary({ userId }) {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWalletData();
    }
  }, [userId]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getWalletInfo(userId);
      setWalletData(response.data);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Wallet Summary</h3>
        <button
          onClick={() => navigate('/wallet')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
        >
          View Details →
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Wallet Balance */}
        <div className="rounded-lg bg-white p-4">
          <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold text-blue-600">R{walletData?.walletBalance?.toFixed(2) || '0.00'}</p>
        </div>

        {/* Total Sales */}
        <div className="rounded-lg bg-white p-4">
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-3xl font-bold text-green-600">R{walletData?.totalSales?.toFixed(2) || '0.00'}</p>
        </div>

        {/* Sold Items */}
        <div className="rounded-lg bg-white p-4">
          <p className="text-sm text-gray-600 mb-1">Sold Items</p>
          <p className="text-3xl font-bold text-purple-600">{walletData?.soldListingsCount || 0}</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => navigate('/purchases')}
          className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          View Purchases
        </button>
        <button
          onClick={() => navigate('/sales')}
          className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          View Sales
        </button>
      </div>
    </div>
  );
}
