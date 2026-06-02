import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to SwapSphere</h1>
          <p className="text-xl mb-8">Buy, sell, and swap items in your community</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/listings"
              className="bg-white text-blue-600 px-8 py-3 rounded font-semibold hover:bg-gray-100 transition"
            >
              Browse Listings
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded font-semibold hover:bg-blue-800 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SwapSphere?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">Easy Buying</h3>
            <p className="text-gray-600">Browse thousands of listings and find exactly what you need</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Simple Selling</h3>
            <p className="text-gray-600">Post your items in minutes and start reaching buyers</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
            <p className="text-gray-600">Verified users and secure transactions for peace of mind</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
          <Link
            to="/register"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded font-semibold hover:bg-blue-700 transition"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}
