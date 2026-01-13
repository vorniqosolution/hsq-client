// SessionPopup.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export default function SessionPopup() {
  const { sessionExpired, logout } = useAuth();
  const location = useLocation();

  if (!sessionExpired || location.pathname === "/login") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Session expired</h2>
        <p className="text-sm text-gray-600 mb-5">Please log in again to continue.</p>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg border border-black/10 shadow"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
