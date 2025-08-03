import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  BarChart3, Download, Filter, ChevronDown, CreditCard, ArrowUpRight, ArrowDownRight, 
  FileSpreadsheet, PieChart, TrendingUp, ChevronRight, Printer, BookOpen, FileText, 
  CalendarDays, Ticket, Archive
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip, Legend, BarChart, Bar
} from 'recharts';

// Mock report data interfaces
interface RevenueData {
  month: string;
  rooms: number;
  foodBeverage: number;
  services: number;
  total: number;
  previousYearTotal: number;
}

interface ExpenseData {
  month: string;
  operations: number;
  maintenance: number;
  marketing: number;
  administration: number;
  total: number;
}

interface RevenueBySource {
  source: string;
  amount: number;
  percentage: number;
}

const RevenuePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('year'); // 'year', 'quarter', 'month'
  const location = useLocation();

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

  // Reports section
  // const reportNavItems = [
  //   { name: 'Reports', href: '/reports', icon: BarChart3 },
  // ];
  
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

  // Fetch revenue data
  const { data: revenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ['revenue', dateRange],
    queryFn: async () => {
      // Replace with actual API call
      // This is mock data for a year view
      return [
        { month: 'Jan', rooms: 42000, foodBeverage: 15000, services: 8000, total: 65000, previousYearTotal: 58000 },
        { month: 'Feb', rooms: 45000, foodBeverage: 16500, services: 8500, total: 70000, previousYearTotal: 63000 },
        { month: 'Mar', rooms: 50000, foodBeverage: 18000, services: 9500, total: 77500, previousYearTotal: 71000 },
        { month: 'Apr', rooms: 55000, foodBeverage: 20000, services: 10000, total: 85000, previousYearTotal: 76000 },
        { month: 'May', rooms: 62000, foodBeverage: 22500, services: 11500, total: 96000, previousYearTotal: 85000 },
        { month: 'Jun', rooms: 68000, foodBeverage: 25000, services: 12500, total: 105500, previousYearTotal: 92000 },
        { month: 'Jul', rooms: 72000, foodBeverage: 27000, services: 13500, total: 112500, previousYearTotal: 98000 },
        { month: 'Aug', rooms: 75000, foodBeverage: 28000, services: 14000, total: 117000, previousYearTotal: 103000 },
        { month: 'Sep', rooms: 65000, foodBeverage: 24000, services: 12000, total: 101000, previousYearTotal: 91000 },
        { month: 'Oct', rooms: 58000, foodBeverage: 21000, services: 10500, total: 89500, previousYearTotal: 80000 },
        { month: 'Nov', rooms: 52000, foodBeverage: 19000, services: 9500, total: 80500, previousYearTotal: 73000 },
        { month: 'Dec', rooms: 60000, foodBeverage: 22000, services: 11000, total: 93000, previousYearTotal: 85000 },
      ];
    },
  });

  // Fetch expense data
  const { data: expenseData = [] } = useQuery<ExpenseData[]>({
    queryKey: ['expenses', dateRange],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { month: 'Jan', operations: 18000, maintenance: 7500, marketing: 5000, administration: 12000, total: 42500 },
        { month: 'Feb', operations: 19500, maintenance: 6800, marketing: 5500, administration: 12500, total: 44300 },
        { month: 'Mar', operations: 21000, maintenance: 8200, marketing: 6000, administration: 13000, total: 48200 },
        { month: 'Apr', operations: 22500, maintenance: 9000, marketing: 6500, administration: 13500, total: 51500 },
        { month: 'May', operations: 25000, maintenance: 10500, marketing: 7000, administration: 14000, total: 56500 },
        { month: 'Jun', operations: 27500, maintenance: 12000, marketing: 7500, administration: 14500, total: 61500 },
        { month: 'Jul', operations: 29000, maintenance: 13500, marketing: 8000, administration: 15000, total: 65500 },
        { month: 'Aug', operations: 30000, maintenance: 14000, marketing: 8500, administration: 15500, total: 68000 },
        { month: 'Sep', operations: 26500, maintenance: 11000, marketing: 7000, administration: 14000, total: 58500 },
        { month: 'Oct', operations: 24000, maintenance: 9500, marketing: 6000, administration: 13500, total: 53000 },
        { month: 'Nov', operations: 22000, maintenance: 8000, marketing: 5500, administration: 13000, total: 48500 },
        { month: 'Dec', operations: 25000, maintenance: 10000, marketing: 6500, administration: 14000, total: 55500 },
      ];
    },
  });

  // Revenue by source data
  const revenueBySource: RevenueBySource[] = [
    { source: 'Room Bookings', amount: 703000, percentage: 69.7 },
    { source: 'Food & Beverage', amount: 258000, percentage: 25.6 },
    { source: 'Spa & Wellness', amount: 75000, percentage: 7.4 },
    { source: 'Tours & Activities', amount: 48000, percentage: 4.8 },
    { source: 'Other Services', amount: 25000, percentage: 2.5 },
  ];

  // Calculate totals for the year
  const yearlyTotalRevenue = revenueData.reduce((sum, month) => sum + month.total, 0);
  const yearlyTotalExpenses = expenseData.reduce((sum, month) => sum + month.total, 0);
  const yearlyProfit = yearlyTotalRevenue - yearlyTotalExpenses;
  const profitMargin = (yearlyProfit / yearlyTotalRevenue) * 100;

  // Calculate year-over-year growth
  const previousYearTotal = revenueData.reduce((sum, month) => sum + month.previousYearTotal, 0);
  const yoyGrowth = ((yearlyTotalRevenue - previousYearTotal) / previousYearTotal) * 100;

  // Format as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
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
            
            {/* Reports Section */}
            {/* <div className="mt-6">
                <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis</p>
                <div className="space-y-1">
                    {renderNavLinks(reportNavItems)}
                </div>
            </div> */}
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

        {/* Reports content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Financial Reports</h1>
                <p className="text-slate-600 mt-2 font-light">Revenue, expense, and profit analysis</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="year">Year to Date (2025)</option>
                    <option value="quarter">Current Quarter (Q3 2025)</option>
                    <option value="month">Current Month (July 2025)</option>
                  </select>
                </div>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{formatCurrency(yearlyTotalRevenue)}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <div className={`flex items-center ${yoyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {yoyGrowth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">{Math.abs(yoyGrowth).toFixed(1)}%</span>
                    </div>
                    <span className="text-sm text-slate-500 ml-2">vs last year</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{formatCurrency(yearlyTotalExpenses)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{((yearlyTotalExpenses / yearlyTotalRevenue) * 100).toFixed(1)}% of revenue</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Net Profit</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{formatCurrency(yearlyProfit)}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{profitMargin.toFixed(1)}% profit margin</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">YOY Growth</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{yoyGrowth.toFixed(1)}%</p>
                    </div>
                    <div className={`p-3 ${yoyGrowth >= 0 ? 'bg-emerald-100' : 'bg-red-100'} rounded-lg`}>
                      {yoyGrowth >= 0 ? (
                        <ArrowUpRight className={`h-6 w-6 ${yoyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                      ) : (
                        <ArrowDownRight className={`h-6 w-6 ${yoyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    Compared to {formatCurrency(previousYearTotal)} last year
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Report Tabs */}
            <Tabs defaultValue="revenue" className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                    Revenue Report
                  </TabsTrigger>
                  <TabsTrigger value="ledger" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                    Ledger Report
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <span>Fiscal Year 2025</span>
                  <ChevronRight className="h-4 w-4" />
                  <span>YTD</span>
                </div>
              </div>

              {/* Revenue Report Tab */}
              <TabsContent value="revenue" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-light text-slate-900">Revenue by Month</CardTitle>
                          <CardDescription className="font-light text-slate-500">Monthly revenue breakdown by category</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
                            <YAxis tick={{ fill: '#64748b' }} />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                            <Legend />
                            <Bar dataKey="rooms" name="Room Revenue" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="foodBeverage" name="F&B Revenue" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="services" name="Services Revenue" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-light text-slate-900">Revenue Sources</CardTitle>
                      <CardDescription className="font-light text-slate-500">Breakdown by revenue stream</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {revenueBySource.map((item, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-800">{item.source}</span>
                              <span className="text-sm font-medium text-slate-800">{formatCurrency(item.amount)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500 rounded-full" 
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{item.percentage}% of total</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-lg bg-white overflow-hidden mb-8">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-light text-slate-900">Monthly Revenue Details</CardTitle>
                        <CardDescription className="font-light text-slate-500">Comprehensive revenue breakdown</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Month</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Room Revenue</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">F&B Revenue</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Services</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Total</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Previous Year</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">YOY Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.map((month, index) => {
                          const yoyChange = ((month.total - month.previousYearTotal) / month.previousYearTotal) * 100;
                          return (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800">{month.month}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(month.rooms)}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(month.foodBeverage)}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(month.services)}</td>
                              <td className="py-4 px-6 text-right font-medium text-slate-800">{formatCurrency(month.total)}</td>
                              <td className="py-4 px-6 text-right text-slate-600">{formatCurrency(month.previousYearTotal)}</td>
                              <td className="py-4 px-6 text-right">
                                <span className={`font-medium ${yoyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td className="py-4 px-6 font-medium text-slate-800">Total</td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(revenueData.reduce((sum, month) => sum + month.rooms, 0))}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(revenueData.reduce((sum, month) => sum + month.foodBeverage, 0))}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(revenueData.reduce((sum, month) => sum + month.services, 0))}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(yearlyTotalRevenue)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-600">
                            {formatCurrency(previousYearTotal)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-emerald-600">
                            {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* Ledger Report Tab */}
              <TabsContent value="ledger" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-light text-slate-900">Profit & Loss</CardTitle>
                          <CardDescription className="font-light text-slate-500">Revenue vs Expenses by Month</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fill: '#64748b' }}
                              allowDuplicatedCategory={false}
                            />
                            <YAxis tick={{ fill: '#64748b' }} />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                            <Legend />
                            <Line 
                              name="Revenue" 
                              data={revenueData} 
                              dataKey="total" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ fill: '#10b981', r: 6 }}
                              activeDot={{ r: 8 }}
                            />
                            <Line 
                              name="Expenses" 
                              data={expenseData} 
                              dataKey="total" 
                              stroke="#ef4444" 
                              strokeWidth={3}
                              dot={{ fill: '#ef4444', r: 6 }}
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-light text-slate-900">Expense Breakdown</CardTitle>
                      <CardDescription className="font-light text-slate-500">Major expense categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-800">Operations</span>
                            <span className="text-sm font-medium text-slate-800">
                              {formatCurrency(expenseData.reduce((sum, month) => sum + month.operations, 0))}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: '48%' }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">48% of expenses</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-800">Maintenance</span>
                            <span className="text-sm font-medium text-slate-800">
                              {formatCurrency(expenseData.reduce((sum, month) => sum + month.maintenance, 0))}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: '21%' }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">21% of expenses</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-800">Marketing</span>
                            <span className="text-sm font-medium text-slate-800">
                              {formatCurrency(expenseData.reduce((sum, month) => sum + month.marketing, 0))}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full" 
                              style={{ width: '12%' }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">12% of expenses</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-800">Administration</span>
                            <span className="text-sm font-medium text-slate-800">
                              {formatCurrency(expenseData.reduce((sum, month) => sum + month.administration, 0))}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full" 
                              style={{ width: '19%' }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">19% of expenses</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-lg bg-white overflow-hidden mb-8">
                  <CardHeader className="border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-light text-slate-900">General Ledger Summary</CardTitle>
                        <CardDescription className="font-light text-slate-500">Monthly profit and loss statement</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Full Ledger
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Export to PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Month</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Revenue</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Expenses</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Profit</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Profit Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.map((month, index) => {
                          const monthExpense = expenseData[index]?.total || 0;
                          const profit = month.total - monthExpense;
                          const margin = (profit / month.total) * 100;
                          
                          return (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800">{month.month}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(month.total)}</td>
                              <td className="py-4 px-6 text-right text-slate-800">{formatCurrency(monthExpense)}</td>
                              <td className="py-4 px-6 text-right font-medium text-slate-800">{formatCurrency(profit)}</td>
                              <td className="py-4 px-6 text-right">
                                <span className={`font-medium ${margin >= 25 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {margin.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td className="py-4 px-6 font-medium text-slate-800">Total / Average</td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(yearlyTotalRevenue)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(yearlyTotalExpenses)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-800">
                            {formatCurrency(yearlyProfit)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-emerald-600">
                            {profitMargin.toFixed(1)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
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