

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  BarChart3, Download, Filter, ChevronDown, CreditCard, ArrowUpRight, ArrowDownRight, 
  FileSpreadsheet, PieChart, TrendingUp, ChevronRight, Printer, BookOpen, FileText, 
  CalendarDays, Ticket, Archive, Percent, Layers
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip, Legend, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Import the RevenueContext
import { useRevenueContext, RevenueFilterParams } from '@/contexts/revenueContext';

const RevenuePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  // Current year for default filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Filter state
  const [filters, setFilters] = useState<RevenueFilterParams>({
    period: 'monthly',
    year: currentYear,
    category: 'all'
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('revenue');
  
  // Get data from context
  const { 
    revenueByCategory,
    compareRevenue,
    dailyRevenue,
    occupancyAnalytics,
    paymentMethodsRevenue,
    loading,
    error,
    fetchRevenueByCategory,
    fetchCompareRevenue,
    fetchDailyRevenue,
    fetchOccupancyAnalytics,
    fetchPaymentMethodsRevenue,
    fetchAllRevenueData,
    clearRevenueData
  } = useRevenueContext();

  // Handle filter changes
  const handleFilterChange = (key: keyof RevenueFilterParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Fetch data when filters change
  useEffect(() => {
    clearRevenueData();
    
    // Define date range for some reports
    let startDate, endDate;
    if (filters.period === 'daily' || filters.period === 'weekly') {
      // Last 30 days for daily view
      endDate = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 30);
      startDate = start.toISOString().split('T')[0];
    }
    
    // Extended filter object with date range when needed
    const extendedFilters = {
      ...filters,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    };
    
    // Fetch all data
    fetchAllRevenueData(extendedFilters);
    
    // Fetch category-specific data if a category is selected
    if (filters.category && filters.category !== 'all') {
      fetchRevenueByCategory(extendedFilters);
    }
  }, [filters, fetchAllRevenueData, fetchRevenueByCategory, clearRevenueData]);

  // Sidebar navigation items
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Guests", href: "/guests", icon: Users },
    { name: "Rooms", href: "/rooms", icon: Bed },
    { name: "Discounts", href: "/Discount", icon: Ticket },
    { name: "Inventory", href: "/Inventory", icon: Archive },
    { name: "Invoices", href: "/Invoices", icon: FileText },
    { name: "Revenue", href: "/Revenue", icon: FileText },
  ];
  
  // System section
  const systemNavItems = [
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    // Exact match for dashboard, startsWith for others to keep parent active
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  }

  // Helper function to render navigation links
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
            ${active
              ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
          )}
          <Icon className={`
            mr-3 h-5 w-5 transition-all duration-200
            ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}
          `} />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && (
            <Star className="ml-auto h-3 w-3 text-amber-400/60" />
          )}
        </Link>
      );
    });
  }

  // Format as currency
  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(amount).replace('PKR', 'Rs');
  };

  // Handle export functions
  const handleExport = (type: string) => {
    toast({
      title: "Export initiated",
      description: `Your ${type} export is being prepared.`,
    });
  };

  // Handle print function
  const handlePrint = () => {
    window.print();
  };

  // Generate timeframe text based on filters
  const getTimeframeText = () => {
    switch(filters.period) {
      case 'daily':
        return 'Last 30 Days';
      case 'weekly':
        return `Weekly (${filters.year})`;
      case 'monthly':
        return `Monthly (${filters.year})`;
      case 'yearly':
        return `Yearly (${filters.year - 4} - ${filters.year})`;
      default:
        return `${filters.year}`;
    }
  };

  // Loading component for charts
  const ChartSkeleton = () => (
    <div className="flex flex-col w-full h-[350px] items-center justify-center space-y-4 bg-slate-50/50 rounded-lg p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[280px] w-full" />
    </div>
  );

  // Error component for charts
  const ChartError = ({ message }: { message: string }) => (
    <div className="w-full h-[350px] flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Error loading data</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
  
  // Prepare data for revenue by category chart
  const prepareRevenueChartData = () => {
    if (!revenueByCategory?.data) return [];
    
    return revenueByCategory.data.map(item => ({
      period: item.period,
      revenue: item.totalRevenue,
      guests: item.guestCount,
    }));
  };
  
  // Prepare data for revenue comparison chart
  const prepareCategoryComparisonData = () => {
    if (!compareRevenue?.data) return [];
    
    return compareRevenue.data.map(item => ({
      name: item.category,
      value: item.totalRevenue,
      formatted: item.totalRevenueFormatted,
      color: getCategoryColor(item.category),
    }));
  };
  
  // Get a color for each category
  const getCategoryColor = (category: string) => {
    const colors = {
      'Deluxe': '#10b981',
      'Standard': '#3b82f6',
      'Suite': '#f59e0b',
      'Executive': '#8b5cf6',
      'Presidential': '#ec4899'
    };
    
    return (colors as any)[category] || '#64748b';
  };

  // Prepare occupancy rate data
  const prepareOccupancyData = () => {
    if (!occupancyAnalytics?.data) return [];
    
    return occupancyAnalytics.data.map(item => ({
      period: item.period,
      occupancyRate: item.occupancyRate,
      revPAR: item.revPAR,
    }));
  };
  
  // Prepare payment methods data
  const preparePaymentMethodsData = () => {
    if (!paymentMethodsRevenue?.paymentBreakdown) return [];
    
    const methodColors = {
      'cash': '#10b981',
      'card': '#3b82f6',
      'online': '#f59e0b'
    };
    
    return paymentMethodsRevenue.paymentBreakdown.map(item => ({
      name: item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1),
      value: item.totalRevenue,
      percentage: item.percentage,
      color: (methodColors as any)[item.paymentMethod] || '#64748b'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
        shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Crown className="h-9 w-9 text-amber-400" />
              <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-xl font-light tracking-wider text-white">HSQ ADMIN</h1>
              <p className="text-xs text-amber-400/80 tracking-widest uppercase">Management Panel</p>
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
            <div className="space-y-1">
              {renderNavLinks(mainNavItems)}
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="flex-shrink-0">
            <div className="my-4 px-4"><div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" /></div>
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
              <p className="text-sm font-light text-white truncate">Admin Manager</p>
              <p className="text-xs text-slate-400 truncate">admin@hsqtowers.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
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
              <span className="font-light tracking-wider text-slate-900">HSQ ADMIN</span>
            </div>
            <div className="w-9" />
          </div>
        </div>

        {/* Revenue content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Revenue Analytics</h1>
                <p className="text-slate-600 mt-2 font-light">Comprehensive financial insights for HSQ Towers</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                {/* Time period selector */}
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <Select 
                    value={filters.period}
                    onValueChange={(value) => handleFilterChange('period', value)}
                  >
                    <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 w-[200px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (Last 30 days)</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Year selector */}
                <div className="flex items-center space-x-2">
                  <Select 
                    value={filters.year?.toString()}
                    onValueChange={(value) => handleFilterChange('year', parseInt(value))}
                  >
                    <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(5)].map((_, i) => (
                        <SelectItem key={i} value={String(currentYear - i)}>
                          {currentYear - i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Room category selector */}
                <div className="flex items-center space-x-2">
                  <Bed className="h-4 w-4 text-slate-500" />
                  <Select 
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 w-[150px]">
                      <SelectValue placeholder="Room Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Deluxe">Deluxe</SelectItem>
                      <SelectItem value="Duluxe-Plus">Duluxe-Plus</SelectItem>
                    
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Presidential">Presidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
                <Button variant="outline" onClick={() => handleExport('CSV')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Display error message if any */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue Card */}
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                      {loading ? (
                        <Skeleton className="h-8 w-32 mt-2" />
                      ) : (
                        <p className="text-3xl font-light mt-2 text-slate-900">
                          {/* FIX: Use optional chaining */}
                          {compareRevenue?.summary?.totalRevenueFormatted ?? 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <p className="text-sm text-slate-500">
                      {getTimeframeText()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Occupancy Rate Card */}
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Occupancy Rate</p>
                      {loading ? (
                        <Skeleton className="h-8 w-32 mt-2" />
                      ) : (
                        <p className="text-3xl font-light mt-2 text-slate-900">
                          {/* FIX: Use optional chaining */}
                          {occupancyAnalytics?.summary?.averageOccupancyRateFormatted ?? 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Percent className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    {/* FIX: Use optional chaining */}
                    {occupancyAnalytics?.summary?.totalGuests ? `${occupancyAnalytics.summary.totalGuests} total guests` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
              
              {/* RevPAR Card */}
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">RevPAR</p>
                      {loading ? (
                        <Skeleton className="h-8 w-32 mt-2" />
                      ) : (
                        <p className="text-3xl font-light mt-2 text-slate-900">
                          {/* FIX: Use optional chaining */}
                          {occupancyAnalytics?.summary?.averageRevPARFormatted ?? 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">Revenue per Available Room</p>
                </CardContent>
              </Card>
              
              {/* Payment Methods Card */}
              
            </div>

            {/* Report Tabs */}
            <Tabs defaultValue="revenue" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                    Revenue Report
                  </TabsTrigger>
                  <TabsTrigger value="occupancy" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                    Occupancy Report
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                    Payment Methods
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <span>HSQ Towers Analytics</span>
                  <ChevronRight className="h-4 w-4" />
                  <span>{getTimeframeText()}</span>
                </div>
              </div>

              {/* Revenue Report Tab */}
              <TabsContent value="revenue" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Revenue by Period Chart */}
                  <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-light text-slate-900">
                            {filters.category !== 'all' ? `${filters.category} Revenue by Period` : 'Revenue by Category'}
                          </CardTitle>
                          <CardDescription className="font-light text-slate-500">
                            {filters.category !== 'all' ? 
                              `Monthly revenue for ${filters.category} rooms` :
                              'Revenue comparison across all room categories'
                            }
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <ChartSkeleton />
                      ) : error ? (
                        <ChartError message="Failed to load revenue data" />
                      ) : (
                        <div className="h-[350px]">
                          {filters.category !== 'all' && revenueByCategory ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={prepareRevenueChartData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="period" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} />
                                <Tooltip formatter={(value: any) => [`${formatCurrency(value)}`, '']} />
                                <Legend />
                                <Bar 
                                  dataKey="revenue" 
                                  name="Revenue" 
                                  fill="#f59e0b" 
                                  radius={[4, 4, 0, 0]} 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : compareRevenue ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={compareRevenue.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="category" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} />
                                <Tooltip formatter={(value: any) => [`${formatCurrency(value)}`, '']} />
                                <Legend />
                                <Bar 
                                  dataKey="totalRevenue" 
                                  name="Total Revenue" 
                                  fill="#3b82f6" 
                                  radius={[4, 4, 0, 0]} 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p>No revenue data available</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue Distribution */}
                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-light text-slate-900">Revenue Distribution</CardTitle>
                      <CardDescription className="font-light text-slate-500">Breakdown by room category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-4 mt-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i}>
                              <div className="flex justify-between mb-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                              </div>
                              <Skeleton className="h-2 w-full" />
                            </div>
                          ))}
                        </div>
                      ) : compareRevenue?.data ? (
                        <div className="space-y-5 mt-4">
                          {/* FIX: Check for summary existence before mapping */}
                          {compareRevenue.data.map((item, index) => {
                            const total = compareRevenue?.summary?.totalRevenue || 1;
                            const percentage = (item.totalRevenue / total) * 100;
                            return (
                            <div key={index}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-800">{item.category}</span>
                                <span className="text-sm font-medium text-slate-800">{item.totalRevenueFormatted}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full" 
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: getCategoryColor(item.category)
                                  }}
                                />
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          )})}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px]">
                          <p>No category data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Revenue Details Table */}
                <Card className="border-0 shadow-lg bg-white overflow-hidden mb-8">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-light text-slate-900">Revenue Details</CardTitle>
                        <CardDescription className="font-light text-slate-500">
                          {filters.category !== 'all' ? 
                            `Detailed revenue data for ${filters.category} rooms` : 
                            'Revenue breakdown across all categories'
                          }
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-8 space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : filters.category !== 'all' && revenueByCategory ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Period</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Total Revenue</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Guest Count</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Average Revenue</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Min Revenue</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Max Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueByCategory.data.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800">{item.period}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.totalRevenueFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.guestCount}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.averageRentFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(item.minRent)}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(item.maxRent)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td className="py-4 px-6 font-medium text-slate-800">Total / Average</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {/* FIX: Use optional chaining */}
                              {revenueByCategory?.summary?.totalRevenueFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {revenueByCategory?.summary?.totalGuests ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {revenueByCategory?.summary?.averageRevenuePerGuestFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">-</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : compareRevenue ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Room Category</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Total Revenue</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Guest Count</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Room Count</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Average Per Guest</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compareRevenue.data.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800">{item.category}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.totalRevenueFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.guestCount}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.roomCount}</td>
                              <td className="py-4 px-6 text-right text-slate-800">
                                {item.guestCount ? formatCurrency(item.totalRevenue / item.guestCount) : 'N/A'}
                              </td>
                              <td className="py-4 px-6 text-right font-medium text-slate-800">
                                {/* FIX: Check for summary before dividing */}
                                {compareRevenue?.summary?.totalRevenue ? ((item.totalRevenue / compareRevenue.summary.totalRevenue) * 100).toFixed(1) + '%' : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td className="py-4 px-6 font-medium text-slate-800">Total</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {/* FIX: Use optional chaining */}
                              {compareRevenue?.summary?.totalRevenueFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {compareRevenue?.summary?.totalGuests ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {compareRevenue?.summary?.totalRooms ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {/* FIX: Use optional chaining and check for zero guests */}
                              {compareRevenue?.summary?.totalGuests ? 
                                formatCurrency(compareRevenue.summary.totalRevenue / compareRevenue.summary.totalGuests) : 
                                'N/A'
                              }
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="p-8 text-center">
                        <p>No revenue data available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Occupancy Report Tab */}
              <TabsContent value="occupancy" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Occupancy Rate Chart */}
                  <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-light text-slate-900">Occupancy Rate</CardTitle>
                          <CardDescription className="font-light text-slate-500">Room occupancy over time</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <ChartSkeleton />
                      ) : error ? (
                        <ChartError message="Failed to load occupancy data" />
                      ) : occupancyAnalytics ? (
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={prepareOccupancyData()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="period" tick={{ fill: '#64748b' }} />
                              <YAxis yAxisId="left" tick={{ fill: '#64748b' }} domain={[0, 100]} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b' }} />
                              <Tooltip />
                              <Legend />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="occupancyRate" 
                                name="Occupancy Rate (%)" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', r: 6 }}
                                unit="%"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="revPAR" 
                                name="RevPAR (Rs)" 
                                stroke="#f59e0b" 
                                strokeWidth={3}
                                dot={{ fill: '#f59e0b', r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>No occupancy data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Occupancy Summary */}
                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-light text-slate-900">Occupancy Summary</CardTitle>
                      <CardDescription className="font-light text-slate-500">Key performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-6">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-8 w-full" />
                            </div>
                          ))}
                        </div>
                      ) : occupancyAnalytics ? (
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Average Occupancy Rate</p>
                            <div className="flex items-center">
                              <div className="w-full bg-slate-100 h-8 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 text-white font-medium"
                                  style={{ width: `${Math.min(occupancyAnalytics?.summary?.averageOccupancyRate ?? 0, 100)}%` }}
                                >
                                  {/* FIX: Safely access rate */}
                                  {(occupancyAnalytics?.summary?.averageOccupancyRate ?? 0) > 15 ? 
                                    occupancyAnalytics.summary.averageOccupancyRateFormatted : ''}
                                </div>
                              </div>
                              {(occupancyAnalytics?.summary?.averageOccupancyRate ?? 0) <= 15 && (
                                <span className="ml-2 text-sm font-medium">
                                  {occupancyAnalytics?.summary?.averageOccupancyRateFormatted ?? 'N/A'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Total Rooms</p>
                              <p className="text-2xl font-light text-slate-900">{occupancyAnalytics?.summary?.totalRooms ?? 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Total Guests</p>
                              <p className="text-2xl font-light text-slate-900">{occupancyAnalytics?.summary?.totalGuests ?? 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Average RevPAR</p>
                            <p className="text-2xl font-light text-slate-900">{occupancyAnalytics?.summary?.averageRevPARFormatted ?? 'N/A'}</p>
                            <p className="text-xs text-slate-500 mt-1">Revenue per Available Room</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                            <p className="text-2xl font-light text-slate-900">{occupancyAnalytics?.summary?.totalRevenueFormatted ?? 'N/A'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center">
                          <p>No occupancy data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Occupancy Table */}
                <Card className="border-0 shadow-lg bg-white overflow-hidden mb-8">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-light text-slate-900">Detailed Occupancy Data</CardTitle>
                        <CardDescription className="font-light text-slate-500">Period-by-period occupancy metrics</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-8 space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : occupancyAnalytics && occupancyAnalytics.data.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Period</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Occupancy Rate</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Room Days</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Unique Rooms</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Total Guests</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Revenue</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">RevPAR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {occupancyAnalytics.data.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800">{item.period}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.occupancyRateFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">
                                {item.occupiedRoomDays} / {item.totalRoomDays}
                              </td>
                              <td className="py-4 px-6 text-right text-slate-800">
                                {item.uniqueRoomsOccupied} / {item.totalRooms}
                              </td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.totalGuests}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.totalRevenueFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.revPARFormatted}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td className="py-4 px-6 font-medium text-slate-800">Average</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {/* FIX: Use optional chaining */}
                              {occupancyAnalytics?.summary?.averageOccupancyRateFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">-</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {occupancyAnalytics?.summary?.totalRooms ?? 'N/A'} rooms
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {occupancyAnalytics?.summary?.totalGuests ?? 'N/A'} total
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {occupancyAnalytics?.summary?.totalRevenueFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {occupancyAnalytics?.summary?.averageRevPARFormatted ?? 'N/A'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="p-8 text-center">
                        <p>No occupancy data available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Payment Methods Tab */}
              <TabsContent value="payment" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Payment Methods Chart */}
                  <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-light text-slate-900">Payment Methods</CardTitle>
                          <CardDescription className="font-light text-slate-500">Revenue by payment method</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <ChartSkeleton />
                      ) : error ? (
                        <ChartError message="Failed to load payment data" />
                      ) : paymentMethodsRevenue ? (
                        <div className="h-[350px] flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={preparePaymentMethodsData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={130}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              >
                                {preparePaymentMethodsData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>No payment method data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Summary Card */}
                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-light text-slate-900">Payment Summary</CardTitle>
                      <CardDescription className="font-light text-slate-500">Transaction metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-6">
                          {[...Array(4)].map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-4 w-40 mb-2" />
                              <Skeleton className="h-8 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : paymentMethodsRevenue ? (
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                            <p className="text-2xl font-light text-slate-900">
                              {paymentMethodsRevenue?.summary?.totalRevenueFormatted ?? 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Total Guests</p>
                            <p className="text-2xl font-light text-slate-900">
                              {paymentMethodsRevenue?.summary?.totalGuests ?? 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Average Transaction</p>
                            <p className="text-2xl font-light text-slate-900">
                              {paymentMethodsRevenue?.summary?.averageTransactionAmountFormatted ?? 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Payment Methods Used</p>
                            <p className="text-2xl font-light text-slate-900">
                              {paymentMethodsRevenue?.summary?.paymentMethodsUsed ?? 'N/A'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center">
                          <p>No payment data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Methods Table */}
                <Card className="border-0 shadow-lg bg-white overflow-hidden mb-8">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-light text-slate-900">Payment Method Details</CardTitle>
                        <CardDescription className="font-light text-slate-500">Detailed breakdown by payment type</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-8 space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : paymentMethodsRevenue && paymentMethodsRevenue.paymentBreakdown.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Payment Method</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Revenue</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Percentage</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Guest Count</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Average Amount</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Min Amount</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Max Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentMethodsRevenue.paymentBreakdown.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800">
                                {item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)}
                              </td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.totalRevenueFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.percentageFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.guestCount}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{item.averageAmountFormatted}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(item.minAmount)}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(item.maxAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td className="py-4 px-6 font-medium text-slate-800">Total</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {/* FIX: Use optional chaining */}
                              {paymentMethodsRevenue?.summary?.totalRevenueFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">100%</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {paymentMethodsRevenue?.summary?.totalGuests ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              {paymentMethodsRevenue?.summary?.averageTransactionAmountFormatted ?? 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">-</td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="p-8 text-center">
                        <p>No payment method data available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;