import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeRedirect() {
  const { user } = useAuth();

  // not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // logged in → go to dashboard
  return <Navigate to="/dashboard" replace />;
}