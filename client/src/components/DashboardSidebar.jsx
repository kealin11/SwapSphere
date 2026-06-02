import { Link, useLocation } from 'react-router-dom';

export default function DashboardSidebar({ user, isOpen, onToggle, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '□' },
    { label: 'Create Listing', path: '/create-listing', icon: '+' },
    { label: 'Messages', path: '/inbox', icon: 'M' },
    { label: 'Offers', path: '/offers', icon: 'R' },
    { label: 'Sales', path: '/sales', icon: 'S' },
    { label: 'Purchases', path: '/purchases', icon: 'P' },
    { label: 'Wallet', path: '/wallet', icon: 'W' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-blue-900 text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={onToggle}
          className="absolute right-4 top-4 md:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo / Title */}
        <div className="border-b border-blue-800 p-6">
          <h1 className="text-2xl font-bold">SwapSphere</h1>
          <p className="mt-2 text-sm text-blue-100">Dashboard</p>
        </div>

        {/* User Info */}
        <div className="border-b border-blue-800 p-6">
          <p className="text-sm text-blue-100">Logged in as</p>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-blue-200">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="p-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onToggle}
                  className={`flex items-center gap-3 rounded px-4 py-3 transition ${
                    isActive(item.path)
                      ? 'bg-blue-700 font-semibold'
                      : 'hover:bg-blue-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-blue-800 p-6">
          <button
            onClick={() => {
              onLogout();
              onToggle();
            }}
            className="w-full rounded bg-red-600 px-4 py-3 font-semibold transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
