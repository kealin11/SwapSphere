import { useEffect, useState, useMemo } from 'react';
import { listingsAPI } from '../api/api';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { PRICE_RANGES } from '../components/FilterBar';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('All Prices');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listingsAPI.getAll();
      setListings(response.data);
    } catch (err) {
      setError('Failed to load listings. Please try again later.');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let filtered = listings.filter((listing) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Category filter
      if (category && listing.category !== category) return false;

      // Price range filter
      const priceRangeObj = PRICE_RANGES.find((r) => r.label === priceRange);
      if (priceRangeObj && (listing.price < priceRangeObj.min || listing.price > priceRangeObj.max)) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }, [listings, searchTerm, category, sortBy, priceRange]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Browse Listings
          </h1>
          <p className="text-gray-600 text-lg">
            {!loading && listings.length > 0 ? (
              <>
                {filteredListings.length} of {listings.length} listing{listings.length !== 1 ? 's' : ''} available
              </>
            ) : loading ? (
              'Loading listings...'
            ) : (
              'No listings available'
            )}
          </p>
        </div>

        {/* Search and Filters - Only show if there are listings */}
        {!loading && listings.length > 0 && (
          <div className="mb-8 space-y-4 animate-fade-in">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <FilterBar
              sortBy={sortBy}
              onSortChange={setSortBy}
              category={category}
              onCategoryChange={setCategory}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
            />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 text-red-800 px-6 py-5 rounded-xl shadow-sm animate-fade-in">
            <div className="flex items-start gap-4">
              <svg className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-lg">Unable to load listings</p>
                <p className="text-sm mt-1 text-red-700">{error}</p>
                <button
                  onClick={fetchListings}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State - Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredListings.length === 0 && listings.length > 0 && (
          <EmptyState
            title="No listings match your criteria"
            description="Try adjusting your search filters or browse all listings"
          />
        )}

        {/* Empty State - No Listings at all */}
        {!loading && listings.length === 0 && !error && (
          <EmptyState
            title="No listings yet"
            description="Be the first to create a listing and start trading!"
          />
        )}

        {/* Listings Grid - Main Content */}
        {!loading && filteredListings.length > 0 && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="transform transition-all duration-300 hover:scale-105"
                >
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>

            {/* Results Summary */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Showing {filteredListings.length} of {listings.length} listings
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

