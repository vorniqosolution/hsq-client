import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, 
  Plus, Search, MoreVertical, Tag, Percent, Calendar, Edit2, Trash2, 
  CheckCircle, XCircle, Filter, Download, Sparkles, Ticket, Archive, FileText, BarChart3
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

// Mock discount data interface
interface Discount {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'scheduled';
  usageCount: number;
  restrictions?: string[];
}

const DiscountsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all');
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

  // Fetch discounts data
  const { data: discounts = [] } = useQuery<Discount[]>({
    queryKey: ['discounts'],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { 
          id: '1', 
          code: 'SUMMER25', 
          description: 'Summer Special Discount', 
          discountType: 'percentage', 
          value: 25, 
          startDate: '2025-06-01', 
          endDate: '2025-08-31', 
          status: 'active',
          usageCount: 132,
          restrictions: ['Minimum stay 2 nights']
        },
        { 
          id: '2', 
          code: 'WELCOME10', 
          description: 'New Guest Welcome Offer', 
          discountType: 'percentage', 
          value: 10, 
          startDate: '2025-01-01', 
          endDate: '2025-12-31', 
          status: 'active',
          usageCount: 257,
        },
        { 
          id: '3', 
          code: 'HOLIDAY50', 
          description: 'Holiday Season Special', 
          discountType: 'fixed', 
          value: 50, 
          startDate: '2025-12-15', 
          endDate: '2026-01-10', 
          status: 'scheduled',
          usageCount: 0,
        },
        { 
          id: '4', 
          code: 'SPRING20', 
          description: 'Spring Getaway Offer', 
          discountType: 'percentage', 
          value: 20, 
          startDate: '2025-03-01', 
          endDate: '2025-05-31', 
          status: 'expired',
          usageCount: 89,
        },
        { 
          id: '5', 
          code: 'LOYALTY15', 
          description: 'Loyal Customer Appreciation', 
          discountType: 'percentage', 
          value: 15, 
          startDate: '2025-01-01', 
          endDate: '2025-12-31', 
          status: 'active',
          usageCount: 175,
          restrictions: ['For returning guests only']
        },
      ];
    },
  });

  // Filter discounts based on search query and status filter
  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = 
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      discount.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      discount.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get counts by status
  const activeCount = discounts.filter(d => d.status === 'active').length;
  const scheduledCount = discounts.filter(d => d.status === 'scheduled').length;
  const expiredCount = discounts.filter(d => d.status === 'expired').length;

  // Format date in readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Scheduled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">Expired</Badge>;
      default:
        return null;
    }
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

        {/* Discounts content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Discounts</h1>
                <p className="text-slate-600 mt-2 font-light">Manage promotional offers and discount codes</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Discount
                </Button>
              </div>
            </div>

            {/* Stats and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="md:col-span-3 border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-grow max-w-md">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search discounts..." 
                        className="pl-9 bg-slate-50 border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-slate-500" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="expired">Expired</option>
                      </select>
                      <Button variant="outline" size="sm" className="ml-2">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Active:</span>
                      <span className="font-medium text-emerald-600">{activeCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Scheduled:</span>
                      <span className="font-medium text-blue-600">{scheduledCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Expired:</span>
                      <span className="font-medium text-slate-600">{expiredCount}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-slate-800">Total:</span>
                      <span className="font-medium text-slate-800">{discounts.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Discounts Table */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b bg-slate-50">
                <CardTitle className="text-xl font-light text-slate-900">Discount Codes</CardTitle>
                <CardDescription className="font-light text-slate-500">All promotional offers and their status</CardDescription>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Code</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Description</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Value</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Validity</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Status</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-slate-500">Usage</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiscounts.map((discount) => (
                      <tr key={discount.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Tag className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="font-medium text-slate-800">{discount.code}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">{discount.description}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {discount.discountType === 'percentage' ? (
                              <Percent className="h-4 w-4 text-slate-500" />
                            ) : (
                              <span className="text-slate-500">$</span>
                            )}
                            <span className="text-slate-800 font-medium">
                              {discount.value}{discount.discountType === 'percentage' && '%'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(discount.status)}
                        </td>
                        <td className="py-4 px-6 text-center text-sm">
                          <span className={`font-medium ${
                            discount.usageCount > 0 ? 'text-blue-600' : 'text-slate-500'
                          }`}>
                            {discount.usageCount}
                          </span>
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
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {discount.status === 'active' && (
                                <DropdownMenuItem className="cursor-pointer text-amber-600">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              {discount.status !== 'active' && (
                                <DropdownMenuItem className="cursor-pointer text-emerald-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="cursor-pointer text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDiscounts.length === 0 && (
                <div className="py-12 text-center">
                  <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-light">No discounts found</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Discount
                  </Button>
                </div>
              )}

              <CardContent className="p-6 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">
                    Showing {filteredDiscounts.length} of {discounts.length} discounts
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

export default DiscountsPage;