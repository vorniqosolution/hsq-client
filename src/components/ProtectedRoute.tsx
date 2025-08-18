// components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** if provided, only users whose role is in this array may proceed */
  // roles?: string[];
}
// , roles
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // console.log("roles", roles);
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  // Not authenticated → send to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "accountant") {
    const allowedPaths = ["/Inventory", "/Revenue"];
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/Inventory" replace />;
    }
  }
  if (user.role === "receptionist") {
    const allowedPaths = ["/guests",
      //  "/rooms", 
       "/reservation", 
       "/dashboard"];
    const isAllowed =
      allowedPaths.includes(location.pathname) ||
      location.pathname.startsWith("/guests/") ||
      location.pathname.startsWith("/reservation/");
    if (!isAllowed) {
      return <Navigate to="/guests" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
