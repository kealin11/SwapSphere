import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../api/api';

export default function WalletSummary({ userId }) {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState({
    walletBalance: 0,
    totalSales: 0,
    soldListingsCount: 0,
  });
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

      setWalletData({
        walletBalance: Number(response.data?.walletBalance || 0),
        totalSales: Number(response.data?.totalSales || 0),
        soldListingsCount: Number(response.data?.soldListingsCount || 0),
      });
    } catch (err) {
      console.error('Error fetching wallet data:', err);

      setWalletData({
        walletBalance: 0,
        totalSales: 0,
        soldListingsCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-gray-200"></div>
          <div className="h-8 w-48 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Wallet Summary
        </h3>

        <button
          onClick={() => navigate('/wallet')}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
        >
          View Details →
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4">
          <p className="mb-1 text-sm text-gray-600">
            Wallet Balance
          </p>
          <p className="text-3xl font-bold text-blue-600">
            R{walletData.walletBalance.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4">
          <p className="mb-1 text-sm text-gray-600">
            Total Sales
          </p>
          <p className="text-3xl font-bold text-green-600">
            R{walletData.totalSales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4">
          <p className="mb-1 text-sm text-gray-600">
            Sold Items
          </p>
          <p className="text-3xl font-bold text-purple-600">
            {walletData.soldListingsCount}
          </p>
        </div>
      </div>

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