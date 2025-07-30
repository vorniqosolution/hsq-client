import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  Box, Package, Search, MoreVertical, Plus, Filter, AlertTriangle, 
  ArrowDown, Download, RefreshCw, FileText, Ticket, Archive, BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Mock inventory data interface
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  location: string;
  lastRestocked: string;
}

const InventoryPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const location = useLocation();

  // Sidebar navigation items
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Discounts', href: '/discounts', icon: Ticket },
    { name: 'Inventory', href: '/inventory', icon: Archive },
    { name: 'Invoices', href: '/invoices', icon: FileText },
  ];

  // Reports section
  const reportNavItems = [
    { name: 'Reports', href: '/reports', icon: BarChart3 },
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

  // Fetch inventory data
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { id: '1', name: 'Bath Towels (Large)', category: 'linens', sku: 'LIN-001', currentStock: 125, minStock: 50, unitPrice: 18.99, location: 'Main Storage A1', lastRestocked: '2025-07-15' },
        { id: '2', name: 'Hand Towels', category: 'linens', sku: 'LIN-002', currentStock: 210, minStock: 75, unitPrice: 8.50, location: 'Main Storage A2', lastRestocked: '2025-07-10' },
        { id: '3', name: 'Queen Bed Sheets', category: 'linens', sku: 'LIN-003', currentStock: 85, minStock: 40, unitPrice: 45.00, location: 'Main Storage A3', lastRestocked: '2025-07-05' },
        { id: '4', name: 'King Bed Sheets', category: 'linens', sku: 'LIN-004', currentStock: 32, minStock: 30, unitPrice: 55.00, location: 'Main Storage A3', lastRestocked: '2025-06-28' },
        { id: '5', name: 'Toilet Paper', category: 'supplies', sku: 'SUP-001', currentStock: 350, minStock: 100, unitPrice: 0.75, location: 'Supply Room B1', lastRestocked: '2025-07-20' },
        { id: '6', name: 'Shampoo (2oz)', category: 'toiletries', sku: 'TOI-001', currentStock: 180, minStock: 75, unitPrice: 1.25, location: 'Supply Room B2', lastRestocked: '2025-07-18' },
        { id: '7', name: 'Conditioner (2oz)', category: 'toiletries', sku: 'TOI-002', currentStock: 165, minStock: 75, unitPrice: 1.25, location: 'Supply Room B2', lastRestocked: '2025-07-18' },
        { id: '8', name: 'Body Lotion (2oz)', category: 'toiletries', sku: 'TOI-003', currentStock: 145, minStock: 75, unitPrice: 1.50, location: 'Supply Room B2', lastRestocked: '2025-07-18' },
        { id: '9', name: 'Shower Caps', category: 'toiletries', sku: 'TOI-004', currentStock: 250, minStock: 100, unitPrice: 0.30, location: 'Supply Room B3', lastRestocked: '2025-07-12' },
        { id: '10', name: 'Coffee Pods', category: 'food', sku: 'FOD-001', currentStock: 15, minStock: 50, unitPrice: 0.60, location: 'Kitchen Storage C1', lastRestocked: '2025-07-08' },
        { id: '11', name: 'Tea Bags', category: 'food', sku: 'FOD-002', currentStock: 220, minStock: 100, unitPrice: 0.20, location: 'Kitchen Storage C1', lastRestocked: '2025-07-08' },
        { id: '12', name: 'Light Bulbs', category: 'maintenance', sku: 'MNT-001', currentStock: 95, minStock: 40, unitPrice: 3.25, location: 'Maintenance Room D1', lastRestocked: '2025-06-25' },
      ];
    },
  });

  // Get categories for filter
  const categories = ['all', ...new Set(inventory.map(item => item.category))];

  // Filter inventory based on search query and category
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get low stock items
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);

  // Calculate total inventory value
  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.currentStock * item.unitPrice), 
    0
  );

  // Generate stock level chart data
  const stockChartData = [
    { month: 'Jan', level: 650 },
    { month: 'Feb', level: 720 },
    { month: 'Mar', level: 690 },
    { month: 'Apr', level: 750 },
    { month: 'May', level: 810 },
    { month: 'Jun', level: 880 },
    { month: 'Jul', level: 810 },
  ];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            <div className="mt-6">
                <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis</p>
                <div className="space-y-1">
                    {renderNavLinks(reportNavItems)}
                </div>
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

        {/* Inventory content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Inventory Management</h1>
                <p className="text-slate-600 mt-2 font-light">Track and manage property supplies and stock levels</p>
              </div>
              <div className="mt-4 md:mt-0 space-x-3">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restock
                </Button>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Items</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{inventory.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{filteredInventory.length} items in view</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Low Stock</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{lowStockItems.length}</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{lowStockItems.length > 0 ? 'Requires attention' : 'All stock levels OK'}</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Categories</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{categories.length - 1}</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Box className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">Across all inventory</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Value</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">Current inventory value</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart and Low Stock Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-light text-slate-900">Stock Level Trends</CardTitle>
                  <CardDescription className="font-light text-slate-500">Inventory levels over the past 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="level" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-light text-slate-900">Low Stock Alert</CardTitle>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">{lowStockItems.length}</Badge>
                  </div>
                  <CardDescription className="font-light text-slate-500">Items requiring restock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[275px] overflow-y-auto">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-800">{item.name}</p>
                            <div className="flex items-center mt-1">
                              <p className="text-xs text-red-600 font-medium">{item.currentStock} left</p>
                              <ArrowDown className="h-3 w-3 text-red-600 ml-1" />
                              <p className="text-xs text-slate-500 ml-2">Min: {item.minStock}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-8">Restock</Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-slate-500">All stock levels are healthy</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Table */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b bg-slate-50 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <CardTitle className="text-xl font-light text-slate-900">Inventory Items</CardTitle>
                  <CardDescription className="font-light text-slate-500">Complete list of supplies and stock</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search items..." 
                      className="pl-9 bg-white border-slate-200 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : 
                           category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" className="ml-2 whitespace-nowrap">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Item Name</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">SKU</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Category</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Stock</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Unit Price</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Location</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-slate-500">Last Restocked</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-800">{item.name}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">{item.sku}</td>
                        <td className="py-4 px-6">
                          <Badge className="capitalize bg-slate-100 text-slate-800 hover:bg-slate-200">{item.category}</Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-medium ${
                            item.currentStock <= item.minStock ? 'text-red-600' : 
                            item.currentStock <= item.minStock * 1.5 ? 'text-amber-600' : 
                            'text-emerald-600'
                          }`}>
                            {item.currentStock}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">/ {item.minStock} min</span>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-800">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">{item.location}</td>
                        <td className="py-4 px-6 text-center text-sm text-slate-600">
                          {formatDate(item.lastRestocked)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Restock
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredInventory.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-light">No inventory items found</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Item
                  </Button>
                </div>
              )}

              <CardContent className="p-6 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">
                    Showing {filteredInventory.length} of {inventory.length} items
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;