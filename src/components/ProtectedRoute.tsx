// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** if provided, only users whose role is in this array may proceed */
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → send to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but role not allowed → redirect to guest home
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/guests" replace />;
  }

  // OK!
  return <>{children}</>;
};

export default ProtectedRoute;


// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const { user, isLoading } = useAuth();
//   const location = useLocation();

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return <>{children}</>;
// };

// export default ProtectedRoute;
