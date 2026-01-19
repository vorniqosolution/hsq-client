import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Bed,
  Home,
  Ticket,
  Settings,
  Archive,
  FileText,
  Percent,
  Calendar1,
  BedSingle,
  ArrowLeftRight,
  Tag,
  X,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Wallet,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const HSQ = "/HSQ.png";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navGroups = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          roles: ["admin", "receptionist"],
        },
      ],
    },
    {
      title: "Hotel Management",
      items: [
        {
          name: "Guests",
          href: "/guests",
          icon: Users,
          roles: ["admin", "receptionist"],
        },
        {
          name: "Reservations",
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
          name: "Decor Packages",
          href: "/decor",
          icon: BedSingle,
          roles: ["admin", "receptionist"],
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          name: "Inventory",
          href: "/Inventory",
          icon: Archive,
          roles: ["admin", "accountant"],
        },
        {
          name: "Discounts",
          href: "/Discount",
          icon: Ticket,
          roles: ["admin", "receptionist"],
        },
        {
          name: "Promo Codes",
          href: "/promocodes",
          icon: Tag,
          roles: ["admin", "receptionist"],
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          name: "Invoices",
          href: "/Invoices",
          icon: FileText,
          roles: ["admin", "accountant"],
        },
        {
          name: "Transactions",
          href: "/transactions",
          icon: ArrowLeftRight,
          roles: ["admin", "accountant", "receptionist"],
        },
        {
          name: "Revenue",
          href: "/Revenue",
          icon: Wallet,
          roles: ["admin", "accountant"],
        },
        {
          name: "GST & Tax",
          href: "/Gst",
          icon: Percent,
          roles: ["admin"],
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          name: "Owners",
          href: "/owners",
          icon: Briefcase,
          roles: ["admin"],
        },
        {
          name: "Owner Access",
          href: "/owners-reception",
          icon: ShieldCheck,
          roles: ["admin"],
        },
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
          roles: ["admin"],
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  // Helper to determine if a group should be shown based on user roles
  const shouldShowGroup = (groupItems: typeof navGroups[0]["items"]) => {
    return groupItems.some(
      (item) =>
        !item.roles ||
        (user?.role && item.roles.includes(user.role.toLowerCase()))
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950
          shadow-2xl transform transition-transform duration-300 ease-in-out
          flex flex-col h-full border-r border-slate-800
          lg:translate-x-0 lg:static
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3">
            {/* <div className="bg-white/5 p-1.5 rounded-lg border border-white/10"> */}
            <img src={HSQ} alt="HSQ Logo" className="w-8 h-8 rounded-lg" />
            {/* </div> */}
            <span className="text-xl font-light tracking-wider text-white">HSQ ADMIN</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden ml-auto hover:bg-white/10 text-slate-400"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Navigation */}
        <ScrollArea className="flex-1 py-6">
          <div className="px-4 space-y-8">
            {navGroups.map((group, groupIndex) => {
              if (!shouldShowGroup(group.items)) return null;

              return (
                <div key={groupIndex}>
                  <h3 className="mb-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      if (
                        item.roles &&
                        user?.role &&
                        !item.roles.includes(user.role.toLowerCase())
                      ) {
                        return null;
                      }

                      const active = isActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => onClose?.()}
                          className={`
                            group flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-200 relative overflow-hidden
                            ${active
                              ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                            }
                          `}
                        >
                          {active && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
                          )}
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 transition-colors ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                            <span className="font-light tracking-wide">{item.name}</span>
                          </div>
                          {active && (
                            <ChevronRight className="h-3 w-3 opacity-50" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 mt-auto shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-default group border border-transparent hover:border-slate-800">
            <Avatar className="h-10 w-10 border border-slate-700">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} />
              <AvatarFallback className="bg-slate-800 text-slate-300">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate capitalize">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {user?.role || "Role"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
