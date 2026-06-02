import { useState, useEffect } from 'react';
import { listingsAPI } from '../api/api';

export default function AdminDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await listingsAPI.getAll();
      setListings(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch listings');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await listingsAPI.delete(id);
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      alert('Failed to delete listing');
      console.error('Error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {loading && <p className="text-center text-gray-600">Loading...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && listings.length === 0 && (
        <p className="text-center text-gray-600">No listings found.</p>
      )}

      {!loading && listings.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{listing.id}</td>
                  <td className="px-6 py-3 text-sm font-medium">{listing.title}</td>
                  <td className="px-6 py-3 text-sm text-blue-600 font-semibold">${listing.price}</td>
                  <td className="px-6 py-3 text-sm">{listing.user_id}</td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
