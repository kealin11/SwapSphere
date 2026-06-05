import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  // Not logged in at all
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin
  if (user.is_admin !== 1) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin confirmed
  return children;
}