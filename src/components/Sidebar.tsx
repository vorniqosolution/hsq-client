import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import HSQ from "../../public/HSQ.png";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Bed,
  LogOut,
  X,
  Home,
  Star,
  Ticket,
  Settings,
  Archive,
  FileText,
  Percent,
  Calendar1,
  BedSingle,
  ArrowLeftRight,
} from "lucide-react";
interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    console.log("isAdmin", isAdmin);
  }, [isAdmin]);

  const mainNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["admin", "receptionist"],
    },
    {
      name: "Guests",
      href: "/guests",
      icon: Users,
      roles: ["admin", "receptionist"],
    },
    {
      name: "Reservation",
      href: "/reservation",
      icon: Calendar1,
      roles: ["admin", "receptionist"],
    },
    {
      name: "Rooms",
      href: "/rooms",
      icon: Bed,
      roles: ["admin", "receptionist"],
    },
    {
      name: "Discounts",
      href: "/Discount",
      icon: Ticket,
      roles: ["admin", "receptionist"],
    },
    { name: "GST & Tax", href: "/Gst", icon: Percent, roles: ["admin"] },
    {
      name: "Inventory",
      href: "/Inventory",
      icon: Archive,
      roles: ["admin", "accountant"],
    },
    { name: "Invoices", href: "/Invoices", icon: FileText, roles: ["admin", "accountant"] },

    {
      name: "Transactions",
      href: "/transactions",
      icon: ArrowLeftRight,
      roles: ["admin", "accountant", "receptionist"], // who can see it
    },

    {
      name: "Decor",
      href: "/decor",
      icon: BedSingle,
      roles: ["admin", "receptionist"],
    },
    {
      name: "Revenue",
      href: "/Revenue",
      icon: FileText,
      roles: ["admin", "accountant"],
    },
    {
      name: "Setting",
      href: "/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredNavItems = mainNavItems.filter(
    (item) =>
      !item.roles ||
      item.roles.map((r) => r.toLowerCase()).includes(user?.role?.toLowerCase())
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const renderNavLinks = (
    items: Array<{ name: string; href: string; icon: React.ElementType }>
  ) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={onClose}
          className={`
              group flex items-center px-4 py-3 text-sm rounded-lg
              transition-all duration-200 relative overflow-hidden
              ${active
              ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }
            `}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
          )}
          <Icon
            className={`
              mr-3 h-5 w-5 transition-all duration-200
              ${active
                ? "text-amber-400"
                : "text-slate-400 group-hover:text-slate-300"
              }
            `}
          />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && <Star className="ml-auto h-3 w-3 text-amber-400/60" />}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0  min-h-screen max-h-screen left-0 z-50 w-56  bottom-2 bg-gradient-to-b from-slate-900 to-slate-950
        shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo Section */}
        <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <img className="w-8 h-8 rounded-lg" src={HSQ} alt="HSQ" />
            <div>
              <h1 className="text-xl font-light tracking-wider text-white">
                HSQ ADMIN
              </h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 flex flex-col mb-30">
          <div className="flex-grow">
            <div className="space-y-1 mb-20">
              {renderNavLinks(filteredNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};
export default Sidebar;
