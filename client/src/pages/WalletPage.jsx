import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { walletAPI, ordersAPI, buildImageUrl } from '../api/api';
import Toast from '../components/Toast';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatMoney = (value) => safeNumber(value).toFixed(2);

const normalizeWalletData = (data = {}) => ({
  ...data,
  walletBalance: safeNumber(data.walletBalance),
  totalSales: safeNumber(data.totalSales),
  activeListingsCount: safeNumber(data.activeListingsCount),
  soldListingsCount: safeNumber(data.soldListingsCount),
});

export default function WalletPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(() => normalizeWalletData());
  const [transactions, setTransactions] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    }
  }, [user?.id]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch wallet info
      const walletRes = await walletAPI.getWalletInfo(user.id);
      setWalletData(normalizeWalletData(walletRes.data));

      // Fetch recent transactions
      const transRes = await ordersAPI.getTransactionHistory(user.id, 10, 0);
      setTransactions(Array.isArray(transRes.data?.transactions) ? transRes.data.transactions : []);

      // Fetch recent sales
      const salesRes = await ordersAPI.getSoldOrders(user.id);
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      setRecentSales(sales.slice(0, 5));
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet information');
      setWalletData(normalizeWalletData());
      setTransactions([]);
      setRecentSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setToast({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (parseFloat(withdrawAmount) > walletData.walletBalance) {
      setToast({ type: 'error', message: 'Insufficient wallet balance' });
      return;
    }

    try {
      setIsWithdrawing(true);
      const response = await walletAPI.withdraw(user.id, parseFloat(withdrawAmount));

      if (response.data.success) {
        setToast({ type: 'success', message: 'Withdrawal processed successfully' });
        setWithdrawAmount('');
        fetchWalletData();
      }
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Withdrawal failed' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {error && <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">{error}</div>}

        {/* Wallet Balance Card */}
        <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white shadow-lg">
          <h2 className="mb-2 text-lg font-semibold opacity-90">Total Wallet Balance</h2>
          <div className="mb-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold">R{formatMoney(walletData.walletBalance)}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-75">Total Sales</p>
              <p className="text-2xl font-semibold">R{formatMoney(walletData.totalSales)}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Active Listings</p>
              <p className="text-2xl font-semibold">{walletData.activeListingsCount || 0}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Sold Items</p>
              <p className="text-2xl font-semibold">{walletData.soldListingsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Withdraw Section */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold">Withdraw Funds</h3>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Amount (ZAR)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={isWithdrawing}
                  className="w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Available: R{formatMoney(walletData.walletBalance)}
              </p>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount}
                className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
              </button>
              <p className="mt-3 text-xs text-gray-500">
                💡 This is a simulated withdrawal. Funds are deducted from your wallet balance.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <button
                onClick={() => navigate('/purchases')}
                className="block w-full rounded bg-green-50 px-4 py-2 text-left font-medium text-green-700 transition hover:bg-green-100 mb-2"
              >
                View Purchases
              </button>
              <button
                onClick={() => navigate('/sales')}
                className="block w-full rounded bg-purple-50 px-4 py-2 text-left font-medium text-purple-700 transition hover:bg-purple-100"
              >
                View Sales
              </button>
            </div>
          </div>

          {/* Transaction & Sales History */}
          <div className="lg:col-span-2">
            {/* Recent Sales */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold">Recent Sales</h3>
              {recentSales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No sales yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.orderId} className="flex gap-4 rounded border border-gray-200 p-4">
                      <img
                        src={buildImageUrl(sale.image_url, PLACEHOLDER_IMAGE)}
                        alt={sale.title}
                        className="h-16 w-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{sale.title}</p>
                        <p className="text-sm text-gray-600">Sold to {sale.buyerName}</p>
                        <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+R{formatMoney(sale.amount)}</p>
                        <p className="text-xs text-gray-500 capitalize">{sale.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b border-gray-200 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(tx.created_at)} at {formatTime(tx.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}R{formatMoney(tx.amount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
