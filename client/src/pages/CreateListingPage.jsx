import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsAPI } from '../api/api';
import useAuth from '../hooks/useAuth';
import Toast from '../components/Toast';

const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Used'];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Other',
    condition: 'Used',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setToast({ type: 'error', message: 'Only JPG, JPEG, PNG, and WebP files are allowed' });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ type: 'error', message: 'File size must be less than 5MB' });
        return;
      }

      // Store the file
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the errors in the form' });
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart/form-data request
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('price', parseFloat(formData.price));
      data.append('category', formData.category);
      data.append('user_id', user.id);

      // Append image file if selected
      if (imageFile) {
        data.append('image', imageFile);
      }

      // Send request with FormData
      const response = await fetch('http://localhost:5000/api/listings', {
        method: 'POST',
        body: data,
        // Do NOT set Content-Type header - browser will set it automatically with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create listing');
      }

      setToast({ type: 'success', message: 'Listing created successfully!' });
      setTimeout(() => {
        navigate('/listings');
      }, 2000);
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: err.message || 'Failed to create listing. Please try again.' 
      });
      console.error('Error creating listing:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a New Listing</h1>
          <p className="text-gray-600">Fill in the details below to list your item for sale</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">Item Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative cursor-pointer hover:border-blue-400 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="mt-2 text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">JPG, JPEG, PNG, WebP up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-lg font-semibold text-gray-900 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What are you selling?"
                maxLength="100"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="mt-1 text-red-600 text-sm">{errors.title}</p>}
              <p className="mt-1 text-gray-500 text-sm">{formData.title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item in detail..."
                rows="6"
                maxLength="2000"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="mt-1 text-red-600 text-sm">{errors.description}</p>}
              <p className="mt-1 text-gray-500 text-sm">{formData.description.length}/2000</p>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-lg font-semibold text-gray-900 mb-2">
                Price (R)
              </label>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="mt-1 text-red-600 text-sm">{errors.price}</p>}
            </div>

            {/* Category and Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-lg font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-lg font-semibold text-gray-900 mb-2">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Listing...' : 'Create Listing'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/listings')}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
