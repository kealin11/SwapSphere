import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" onClick={closeMenu} className="text-2xl font-bold text-blue-600">
            SwapSphere
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link to="/listings" className="text-gray-700 transition hover:text-blue-600">
              Listings
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/create-listing" className="text-gray-700 transition hover:text-blue-600">
                  Sell
                </Link>
                <div className="relative group">
                  <button className="text-gray-700 transition hover:text-blue-600">
                    Menu ▼
                  </button>
                  <div className="hidden group-hover:block absolute left-0 mt-0 w-40 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <Link to="/wallet" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Wallet
                    </Link>
                    <Link to="/inbox" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Messages
                    </Link>
                    <Link to="/offers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Offers
                    </Link>
                    <Link to="/purchases" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      My Purchases
                    </Link>
                    <Link to="/sales" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      My Sales
                    </Link>
                  </div>
                </div>
                <span className="max-w-40 truncate text-sm text-gray-500">{user?.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 transition hover:text-blue-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded p-2 text-gray-700 transition hover:bg-gray-100 md:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t pb-4 md:hidden">
            <Link to="/listings" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
              Listings
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/create-listing" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  Sell
                </Link>
                <Link to="/dashboard" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link to="/wallet" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  Wallet
                </Link>
                <Link to="/inbox" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  Messages
                </Link>
                <Link to="/offers" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  Offers
                </Link>
                <Link to="/purchases" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  My Purchases
                </Link>
                <Link to="/sales" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  My Sales
                </Link>
                <div className="py-2 text-sm text-gray-500">{user?.name}</div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full py-2 text-left font-semibold text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" onClick={closeMenu} className="block py-2 font-semibold text-blue-600 hover:text-blue-700">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
