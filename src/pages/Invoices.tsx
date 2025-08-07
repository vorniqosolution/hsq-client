import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  FileText, Search, MoreVertical, Download, Filter, CreditCard, Clock, CheckCircle, 
  XCircle, Eye, Ticket, Archive, Mail, Trash2
} from 'lucide-react';

// Import the context hook and types
import { useInvoiceContext, Invoice } from '@/contexts/InvoiceContext';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Note: The Sidebar component has been extracted for brevity, but the logic is the same as your original file.
// You can keep it inline or move it to its own component file.

const Sidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) => {
  const location = useLocation();
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Guests", href: "/guests", icon: Users },
    { name: "Rooms", href: "/rooms", icon: Bed },
    { name: "Discounts", href: "/Discount", icon: Ticket },
    { name: "Inventory", href: "/Inventory", icon: Archive },
    { name: "Invoices", href: "/Invoices", icon: FileText },
    { name: "Revenue", href: "/Revenue", icon: DollarSign },
  ];
  const systemNavItems = [
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  const isActive = (href: string) => location.pathname.startsWith(href) && (href !== '/' || location.pathname === '/');
  const renderNavLinks = (items: typeof mainNavItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
          className={`group flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 relative overflow-hidden ${active ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}>
          {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />}
          <Icon className={`mr-3 h-5 w-5 transition-all duration-200 ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && <Star className="ml-auto h-3 w-3 text-amber-400/60" />}
        </Link>
      );
    });
  }
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative"><Crown className="h-9 w-9 text-amber-400" /><Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" /></div>
            <div><h1 className="text-xl font-light tracking-wider text-white">HSQ ADMIN</h1><p className="text-xs text-amber-400/80 tracking-widest uppercase">Management Panel</p></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <nav className="mt-8 px-4 flex flex-col h-[calc(100%-80px)]">
          <div className="flex-grow">
            <div className="space-y-1">{renderNavLinks(mainNavItems)}</div>
          </div>
          <div className="flex-shrink-0">
            <div className="my-4 px-4"><div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" /></div>
            <div className="space-y-1">
              {renderNavLinks(systemNavItems)}
              <button className="group flex items-center px-4 py-3 text-sm text-slate-300 rounded-lg hover:text-white hover:bg-slate-800/50 w-full transition-all duration-200">
                <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300" /><span className="font-light tracking-wide">Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800/50 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg"><span className="text-sm font-medium text-slate-900">AM</span></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-light text-white truncate">Admin Manager</p><p className="text-xs text-slate-400 truncate">admin@hsqtowers.com</p></div>
          </div>
        </div>
      </div>
    </>
  );
};

const InvoicesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');

  // --- Connect to InvoiceContext ---
  const {
    paginatedInvoices,
    invoices: searchResults, // Use a different name for search results
    loading,
    error,
    fetchAllInvoices,
    searchInvoices,
    updateInvoiceStatus,
    deleteInvoice,
    sendInvoiceByEmail,
    downloadInvoicePdf
  } = useInvoiceContext();

  // --- Search and Filter Logic ---
  useEffect(() => {
    // Debounce search to avoid excessive API calls
    const handler = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        searchInvoices({ guestName: searchQuery, invoiceNumber: searchQuery });
      } else if (searchQuery === '' && searchResults.length > 0) {
        // When search is cleared, fetch all invoices to restore paginated view
        fetchAllInvoices();
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, searchInvoices, fetchAllInvoices, searchResults.length]);

  // Determine which list of invoices to display
  const allInvoices = useMemo(() => {
    const source = searchQuery.trim() !== '' ? searchResults : paginatedInvoices?.data || [];
    if (statusFilter === 'all') {
      return source;
    }
    return source.filter(inv => inv.status === statusFilter);
  }, [searchQuery, searchResults, paginatedInvoices, statusFilter]);
  
  // --- Data for Stats Cards ---
  // Calculates stats based on the full paginated list, not just the current view
  const totalInvoices = paginatedInvoices?.data || [];
  const paidCount = totalInvoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = totalInvoices.filter(inv => inv.status === 'pending').length;
  const cancelledCount = totalInvoices.filter(inv => inv.status === 'cancelled').length;

  const paidAmount = totalInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const pendingAmount = totalInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.grandTotal, 0);

  // --- Helper Functions ---
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(amount);

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
      cancelled: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
    };
    return <Badge className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  // --- Action Handlers ---
  const handleSendEmail = async (id: string) => {
    try {
      const result = await sendInvoiceByEmail(id);
      toast({
        title: "Success",
        description: result.message,
        className: "bg-emerald-500 text-white",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to send email.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      deleteInvoice(id);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-0">
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Menu className="h-5 w-5 text-slate-700" /></button>
            <div className="flex items-center space-x-2"><Crown className="h-6 w-6 text-amber-500" /><span className="font-light tracking-wider text-slate-900">HSQ ADMIN</span></div>
            <div className="w-9" />
          </div>
        </div>

        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Invoices</h1>
                <p className="text-slate-600 mt-2 font-light">Manage billing and payment records</p>
              </div>

            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white"><CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div><p className="text-sm font-medium text-slate-500">Total Invoices</p><p className="text-3xl font-light mt-2 text-slate-900">{totalInvoices.length}</p></div>
                    <div className="p-3 bg-blue-100 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{allInvoices.length} invoices in current view</p>
              </CardContent></Card>
              <Card className="border-0 shadow-lg bg-white"><CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div><p className="text-sm font-medium text-slate-500">Paid</p><p className="text-3xl font-light mt-2 text-emerald-600">{paidCount}</p></div>
                    <div className="p-3 bg-emerald-100 rounded-lg"><CheckCircle className="h-6 w-6 text-emerald-600" /></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{formatCurrency(paidAmount)}</p>
              </CardContent></Card>
              <Card className="border-0 shadow-lg bg-white"><CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div><p className="text-sm font-medium text-slate-500">Pending</p><p className="text-3xl font-light mt-2 text-amber-600">{pendingCount}</p></div>
                    <div className="p-3 bg-amber-100 rounded-lg"><Clock className="h-6 w-6 text-amber-600" /></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">{formatCurrency(pendingAmount)}</p>
              </CardContent></Card>
              <Card className="border-0 shadow-lg bg-white"><CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div><p className="text-sm font-medium text-slate-500">Cancelled</p><p className="text-3xl font-light mt-2 text-red-600">{cancelledCount}</p></div>
                    <div className="p-3 bg-red-100 rounded-lg"><XCircle className="h-6 w-6 text-red-600" /></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">Total cancelled invoices</p>
              </CardContent></Card>
            </div>
            
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b bg-slate-50 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <CardTitle className="text-xl font-light text-slate-900">Invoice Records</CardTitle>
                  <CardDescription className="font-light text-slate-500">Manage and track all invoices</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search name or invoice #" className="pl-9 bg-white border-slate-200 w-full sm:w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div> */}
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="all">All Status</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Invoice #</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Guest</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Issue Date</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Amount</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Status</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                  </tr></thead>
                  <tbody>
                    {loading && <tr><td colSpan={6} className="text-center p-8">Loading invoices...</td></tr>}
                    {!loading && error && <tr><td colSpan={6} className="text-center p-8 text-red-500">Error: {error}</td></tr>}
                    {!loading && allInvoices.length > 0 && allInvoices.map((invoice) => (
                      <tr key={invoice._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6"><div className="flex items-center space-x-3"><div className="p-2 bg-slate-100 rounded-lg"><FileText className="h-4 w-4 text-slate-600" /></div><span className="font-medium text-slate-800">{invoice.invoiceNumber}</span></div></td>
                        <td className="py-4 px-6"><p className="font-medium text-slate-800">{invoice.guest?.fullName}</p><p className="text-xs text-slate-500">Room: {invoice.guest?.room?.roomNumber}</p></td>
                        <td className="py-4 px-6 text-sm text-slate-600">{formatDate(invoice.issueDate)}</td>
                        <td className="py-4 px-6 text-right font-medium text-slate-800">{formatCurrency(invoice.grandTotal)}</td>
                        <td className="py-4 px-6">{getStatusBadge(invoice.status)}</td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => navigate(`/invoices/${invoice._id}`)} className="cursor-pointer"><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                              {invoice.status === 'pending' && <DropdownMenuItem onSelect={() => updateInvoiceStatus(invoice._id, 'paid')} className="cursor-pointer text-emerald-600"><CreditCard className="h-4 w-4 mr-2" />Mark as Paid</DropdownMenuItem>}
                              {/* <DropdownMenuItem onSelect={() => downloadInvoicePdf(invoice._id)} className="cursor-pointer"><Download className="h-4 w-4 mr-2" />Download PDF</DropdownMenuItem> */}
                              <DropdownMenuItem onSelect={() => handleSendEmail(invoice._id)} className="cursor-pointer"><Mail className="h-4 w-4 mr-2" />Send via Email</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleDelete(invoice._id)} className="cursor-pointer text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete Invoice</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && allInvoices.length === 0 && (
                <div className="py-12 text-center"><FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-light">No invoices found for the current filter.</p></div>
              )}
              {searchQuery.trim() === '' && (
                <CardContent className="p-6 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">Page {paginatedInvoices?.currentPage} of {paginatedInvoices?.totalPages}</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => fetchAllInvoices(paginatedInvoices.currentPage - 1)} disabled={loading || paginatedInvoices?.currentPage === 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => fetchAllInvoices(paginatedInvoices.currentPage + 1)} disabled={loading || paginatedInvoices?.currentPage === paginatedInvoices?.totalPages}>Next</Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvoicesPage;