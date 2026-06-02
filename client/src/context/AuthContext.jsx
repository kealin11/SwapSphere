import { useEffect, useMemo, useState } from 'react';
import AuthContext from './AuthContextValue';

const readStoredUser = () => {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem('token'));
      setUser(readStoredUser());
    };

    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth-changed', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('auth-changed', syncAuth);
    };
  }, []);

  const login = ({ token: newToken, user: newUser }) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('user_id', String(newUser.id));
    setToken(newToken);
    setUser(newUser);
    window.dispatchEvent(new Event('auth-changed'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
