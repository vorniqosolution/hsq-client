import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSetting } from "@/contexts/SettingContext";
import Sidebar from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSetting();

  // Helper to get current page title
  const getPageTitle = (pathname: string) => {
    const path = pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Global Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar / Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {getPageTitle(location.pathname)}
              </h1>
              <span className="text-xs text-slate-500 hidden sm:inline-block">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-slate-200">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Profile & Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu >
          </div >
        </header >

        {/* Alert Pill */}
        {
          settings?.systemAlert?.isActive && (
            <div className="flex justify-center pt-4 pb-2 px-4">
              <div
                className={`px-6 py-2 text-sm font-medium flex items-center shadow-sm border rounded-full backdrop-blur-md animate-in slide-in-from-top-2 z-20 ${settings.systemAlert.type === "error"
                  ? "bg-red-50/80 border-red-200 text-red-900"
                  : settings.systemAlert.type === "warning"
                    ? "bg-amber-50/80 border-amber-200 text-amber-900"
                    : "bg-blue-50/80 border-blue-200 text-blue-900"
                  }`}
              >
                <span className="mr-2.5 flex h-2 w-2 rounded-full ring-[3px] ring-opacity-20 flex-shrink-0 animate-pulse bg-current" />
                <span>{settings.systemAlert.message}</span>
              </div>
            </div>
          )
        }

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div >
    </div >
  );
};

export default Layout;
