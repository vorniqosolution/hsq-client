import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTax } from '@/contexts/TaxContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Bed,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Crown,
  Star,
  Plus,
  Search,
  MoreVertical,
  Tag,
  
  Calendar,
  Edit2,
  Trash2,

  XCircle,
  Filter,
  Download,
  Sparkles,
  Ticket,
  Archive,
  FileText,
  BarChart3,
  Link as LinkIcon,
  Percent, 
  Save, 
  CheckCircle
} from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const TaxSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, loading, error, fetchSettings, updateSettings } = useTax();
  const location = useLocation();
  
  const [taxRate, setTaxRate] = useState<number>(0);
  const [currencySymbol, setCurrencySymbol] = useState<string>("Rs");
  const [hotelName, setHotelName] = useState<string>("HSQ Towers");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    if (settings) {
      setTaxRate(settings.taxRate);
      setCurrencySymbol(settings.currencySymbol);
      setHotelName(settings.hotelName);
    }
  }, [settings]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings({
        taxRate,
        currencySymbol,
        hotelName
      });
      
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };
  
  const isAdmin = user?.role === 'admin';

  const systemNavItems = [
      { name: "Settings", href: "/settings", icon: Settings },
    ];
  
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Guests", href: "/guests", icon: Users },
    { name: "Reservation", href: "/reservation", icon: Calendar },
    { name: "Rooms", href: "/rooms", icon: Bed },
    { name: "Discounts", href: "/Discount", icon: Ticket },
    { name: "GST & Tax", href: "/Gst", icon: Percent },
    { name: "Inventory", href: "/Inventory", icon: Archive },
    { name: "Invoices", href: "/Invoices", icon: FileText },
    { name: "Revenue", href: "/Revenue", icon: FileText },
  ];

  const renderNavLinks = (items: typeof mainNavItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => setSidebarOpen(false)}
          className={`
              group flex items-center px-4 py-3 text-sm rounded-lg
              transition-all duration-200 relative overflow-hidden
              ${
                active
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
              ${
                active
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for admin users only */}
      {isAdmin && (
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
            shadow-2xl transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          >
            {/* Logo Section */}
            <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Crown className="h-9 w-9 text-amber-400" />
                  <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-xl font-light tracking-wider text-white">
                    HSQ ADMIN
                  </h1>
                  <p className="text-xs text-amber-400/80 tracking-widest uppercase">
                    Management Panel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-8 px-4 flex flex-col h-[calc(100%-80px)]">
              <div className="flex-grow">
                <div className="space-y-1">{renderNavLinks(mainNavItems)}</div>
              </div>

              {/* Bottom Section */}
              <div className="flex-shrink-0">
                <div className="my-4 px-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                </div>
                <div className="space-y-1">
                  {renderNavLinks(systemNavItems)}
                  <button className="group flex items-center px-4 py-3 text-sm text-slate-300 rounded-lg hover:text-white hover:bg-slate-800/50 w-full transition-all duration-200">
                    <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300" />
                    <span className="font-light tracking-wide">Sign Out</span>
                  </button>
                </div>
              </div>
            </nav>

            {/* User Profile */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800/50 bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-medium text-slate-900">AM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-white truncate">
                    Admin Manager
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || "admin@hsqtowers.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
        {/* Mobile header - only for admin */}
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              <div className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <span className="font-light tracking-wider text-slate-900">
                  HSQ ADMIN
                </span>
              </div>
              <div className="w-9" />
            </div>
          </div>
        )}
      
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-light text-slate-900 tracking-wide flex items-center">
                <Percent className="h-7 w-7 text-amber-500 mr-3" />
                Tax Configuration
              </h1>
              <p className="text-slate-600 mt-1 font-light">
                Manage tax rates and currency settings for your hotel
              </p>
            </div>
            
            <Card className="border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-48 bg-gradient-to-bl from-amber-100/40 to-transparent -z-0" />
              
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-light text-slate-900">
                  System Tax Settings
                </CardTitle>
                <CardDescription className="font-light text-slate-500">
                  Configure tax rates applied to all invoices
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading && !settings ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="hotelName" className="text-slate-700">Hotel Name</Label>
                        <Input
                          id="hotelName"
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                          disabled={!isEditing}
                          className="border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currencySymbol" className="text-slate-700">
                          Currency Symbol
                        </Label>
                        <Input
                          id="currencySymbol"
                          value={currencySymbol}
                          onChange={(e) => setCurrencySymbol(e.target.value)}
                          disabled={!isEditing}
                          className="border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                          required
                          maxLength={5}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxRate" className="text-slate-700">
                        Tax Rate (%)
                      </Label>
                      <div className="relative">
                        <Input
                          id="taxRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                          disabled={!isEditing}
                          className="border-slate-200 focus:border-amber-500 focus:ring-amber-500 pr-12"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-slate-500">%</span>
                        </div>
                      </div>
                      {!isEditing && (
                        <p className="text-sm text-slate-500 mt-1">
                          Current tax rate: <span className="font-medium text-amber-600">{settings?.taxRate}%</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                      {isAdmin && !isEditing && (
                        <Button 
                          type="button" 
                          onClick={() => setIsEditing(true)}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          Update GST
                        </Button>
                      )}
                      
                      {isEditing && (
                        <>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsEditing(false);
                              if (settings) {
                                setTaxRate(settings.taxRate);
                                setCurrencySymbol(settings.currencySymbol);
                                setHotelName(settings.hotelName);
                              }
                            }}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </Button>
                          
                          <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {saveSuccess && (
                      <div className="flex items-center p-3 mt-4 rounded-lg bg-emerald-50 text-emerald-700">
                        <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
                        <span>Settings updated successfully!</span>
                      </div>
                    )}
                    
                    {!isAdmin && (
                      <div className="p-3 mt-4 rounded-lg bg-slate-50 text-slate-700 text-sm">
                        Only administrators can modify these settings.
                      </div>
                    )}
                    
                    <div className="mt-6 text-sm text-slate-500 font-light flex items-center justify-between">
                      <p>Last updated: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}</p>
                      
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                        <span>Current settings active</span>
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSettingsPage;