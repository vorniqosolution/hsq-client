import React from "react";
import { Link, useLocation } from "react-router-dom";
import HSQ from "../../public/HSQ.png";
import { LayoutDashboard, Users, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "./Footer.tsx";
import SystemAlertBanner from "./SystemAlertBanner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Choose logo link based on role
  const logoLink = user?.role === "receptionist" ? "/guests" : "/dashboard";

  // Determine navigation items based on user role
  const navItems = React.useMemo(() => {
    if (!user) return [];
    if (user.role === "receptionist") {
      return [{ path: "/guests", label: "Guests", icon: Users }];
    }
    if (user.role === "admin") {
      return [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ];
    }
    return [];
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => logout();

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <SystemAlertBanner />
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={logoLink} className="flex items-center gap-2">
                <div className="w-8 h-8  rounded-lg flex items-center justify-center">
                  <img src={HSQ} alt={HSQ} />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  HSQ Towers
                </span>
              </Link>

              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${isActive(item.path)
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-600 print:hidden">
                  <UserIcon className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 print:hidden"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
