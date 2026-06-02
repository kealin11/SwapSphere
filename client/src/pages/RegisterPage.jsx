import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name || !email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({
        name,
        email,
        password: formData.password,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      console.error('Error registering:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Join the marketplace</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Create your account</h1>
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Your full name"
              className="w-full rounded border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repeat password"
                className="w-full rounded border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
