import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  FileText, Search, MoreVertical, Download, Filter, CreditCard, Clock, CheckCircle, 
  XCircle, BarChart3, CalendarDays, Eye, Ticket, Archive
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
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// Mock invoice data interface
interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    name: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

const InvoicesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
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

  // Fetch invoices data
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      // Replace with actual API call
      return [
        {
          id: '1',
          invoiceNumber: 'INV-2025-001',
          customer: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          },
          issueDate: '2025-07-01',
          dueDate: '2025-07-15',
          amount: 1250.00,
          status: 'paid',
          paymentMethod: 'Credit Card',
          items: [
            { description: 'Deluxe Room - 3 nights', quantity: 1, unitPrice: 750.00 },
            { description: 'Room Service', quantity: 2, unitPrice: 85.00 },
            { description: 'Airport Transfer', quantity: 1, unitPrice: 120.00 },
            { description: 'Minibar', quantity: 1, unitPrice: 210.00 }
          ]
        },
        {
          id: '2',
          invoiceNumber: 'INV-2025-002',
          customer: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com'
          },
          issueDate: '2025-07-05',
          dueDate: '2025-07-20',
          amount: 1870.00,
          status: 'paid',
          paymentMethod: 'Bank Transfer',
          items: [
            { description: 'Suite Room - 4 nights', quantity: 1, unitPrice: 1600.00 },
            { description: 'Spa Services', quantity: 1, unitPrice: 150.00 },
            { description: 'Late Checkout Fee', quantity: 1, unitPrice: 120.00 }
          ]
        },
        {
          id: '3',
          invoiceNumber: 'INV-2025-003',
          customer: {
            name: 'Robert Johnson',
            email: 'robert.j@example.com'
          },
          issueDate: '2025-07-10',
          dueDate: '2025-07-25',
          amount: 950.00,
          status: 'pending',
          items: [
            { description: 'Standard Room - 2 nights', quantity: 1, unitPrice: 450.00 },
            { description: 'Breakfast Package', quantity: 2, unitPrice: 75.00 },
            { description: 'Laundry Service', quantity: 1, unitPrice: 95.00 },
            { description: 'City Tour', quantity: 1, unitPrice: 255.00 }
          ]
        },
        {
          id: '4',
          invoiceNumber: 'INV-2025-004',
          customer: {
            name: 'Sarah Williams',
            email: 'sarah.w@example.com'
          },
          issueDate: '2025-06-25',
          dueDate: '2025-07-10',
          amount: 3450.00,
          status: 'overdue',
          items: [
            { description: 'Presidential Suite - 2 nights', quantity: 1, unitPrice: 2800.00 },
            { description: 'Private Dining', quantity: 1, unitPrice: 450.00 },
            { description: 'Premium Bar Package', quantity: 1, unitPrice: 200.00 }
          ]
        },
        {
          id: '5',
          invoiceNumber: 'INV-2025-005',
          customer: {
            name: 'Michael Brown',
            email: 'michael.b@example.com'
          },
          issueDate: '2025-07-12',
          dueDate: '2025-07-27',
          amount: 1550.00,
          status: 'pending',
          items: [
            { description: 'Deluxe Room - 4 nights', quantity: 1, unitPrice: 1000.00 },
            { description: 'Airport Transfer (Round Trip)', quantity: 1, unitPrice: 240.00 },
            { description: 'Spa Package', quantity: 1, unitPrice: 310.00 }
          ]
        },
        {
          id: '6',
          invoiceNumber: 'INV-2025-006',
          customer: {
            name: 'Emily Davis',
            email: 'emily.d@example.com'
          },
          issueDate: '2025-07-15',
          dueDate: '2025-07-30',
          amount: 1375.00,
          status: 'paid',
          paymentMethod: 'Credit Card',
          items: [
            { description: 'Deluxe Room - 3 nights', quantity: 1, unitPrice: 750.00 },
            { description: 'Breakfast Package', quantity: 3, unitPrice: 75.00 },
            { description: 'Spa Services', quantity: 1, unitPrice: 175.00 },
            { description: 'Late Checkout Fee', quantity: 1, unitPrice: 75.00 }
          ]
        },
      ];
    },
  });

  // Filter invoices based on search query and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get counts by status
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  // Calculate total amounts by status
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalAmount = paidAmount + pendingAmount + overdueAmount;

  // Status chart data
  const statusData = [
    { name: 'Paid', value: paidCount, color: '#10b981' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Overdue', value: overdueCount, color: '#ef4444' },
  ];

  // Monthly revenue chart data
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 8500 },
    { month: 'Feb', revenue: 9200 },
    { month: 'Mar', revenue: 8100 },
    { month: 'Apr', revenue: 10500 },
    { month: 'May', revenue: 12800 },
    { month: 'Jun', revenue: 14100 },
    { month: 'Jul', revenue: 11500 },
  ];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format amount as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">Overdue</Badge>;
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

        {/* Invoices content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Invoices</h1>
                <p className="text-slate-600 mt-2 font-light">Manage billing and payment records</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Invoices</p>
                      <p className="text-3xl font-light mt-2 text-slate-900">{invoices.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{filteredInvoices.length} invoices in view</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Paid</p>
                      <p className="text-3xl font-light mt-2 text-emerald-600">{paidCount}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{formatCurrency(paidAmount)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Pending</p>
                      <p className="text-3xl font-light mt-2 text-amber-600">{pendingCount}</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{formatCurrency(pendingAmount)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Overdue</p>
                      <p className="text-3xl font-light mt-2 text-red-600">{overdueCount}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{formatCurrency(overdueAmount)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-light text-slate-900">Invoice Status</CardTitle>
                  <CardDescription className="font-light text-slate-500">Distribution of invoice statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] flex items-center justify-center">
                    {invoices.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-500">No invoice data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-light text-slate-900">Monthly Revenue</CardTitle>
                  <CardDescription className="font-light text-slate-500">Revenue trends for the current year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} />
                        <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                        <Bar 
                          dataKey="revenue" 
                          fill="#f59e0b" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoices Table */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b bg-slate-50 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <CardTitle className="text-xl font-light text-slate-900">Invoice Records</CardTitle>
                  <CardDescription className="font-light text-slate-500">Manage and track all invoices</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search invoices..." 
                      className="pl-9 bg-white border-slate-200 w-full sm:w-64"
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
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
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
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Invoice #</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Customer</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Issue Date</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Due Date</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Amount</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Payment</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <FileText className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="font-medium text-slate-800">{invoice.invoiceNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-slate-800">{invoice.customer.name}</p>
                          <p className="text-xs text-slate-500">{invoice.customer.email}</p>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-800">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {invoice.paymentMethod || '—'}
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
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {invoice.status === 'pending' && (
                                <DropdownMenuItem className="cursor-pointer text-emerald-600">
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="cursor-pointer">
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredInvoices.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-light">No invoices found</p>
                </div>
              )}

              <CardContent className="p-6 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">
                    Showing {filteredInvoices.length} of {invoices.length} invoices
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

export default InvoicesPage;