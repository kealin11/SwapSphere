import { useState } from 'react';
import ListingModal from './ListingModal';
import { buildImageUrl } from '../api/api';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

export default function ListingCard({ listing }) {
  const [showModal, setShowModal] = useState(false);
  
  // Use buildImageUrl to properly handle Cloudinary URLs
  const imageUrl = buildImageUrl(listing.image_url, PLACEHOLDER_IMAGE);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently added';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
        {/* Image Container */}
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = PLACEHOLDER_IMAGE;
            }}
          />
          {listing.condition && (
            <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              {listing.condition}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{listing.description}</p>

          {/* Category & Date */}
          <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
            {listing.category && <span className="bg-gray-100 px-2 py-1 rounded">{listing.category}</span>}
            <span>{formatDate(listing.created_at)}</span>
          </div>

          {/* Price & Seller */}
          <div className="border-t pt-4 mb-4">
            <p className="text-2xl font-bold text-blue-600 mb-2">R{Number(listing.price).toFixed(2)}</p>
            {listing.seller_name && <p className="text-sm text-gray-600">Seller: {listing.seller_name}</p>}
          </div>

          {/* View Details Button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && <ListingModal listing={listing} onClose={() => setShowModal(false)} />}
    </>
  );
}
