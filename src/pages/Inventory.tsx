import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { InventoryCategory, InventoryItem, useInventory } from '@/contexts/InventoryContext';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  Box, Package, Search, MoreVertical, Plus, Filter, AlertTriangle, ArrowDown, Download, 
  RefreshCw, FileText, Ticket, Archive, BarChart3, Trash2, Edit, Tag, Layers, CornerDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const InventoryPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // === MODAL STATES ===
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  
  // === FORM STATES ===
  // Category Form
  const [categoryForm, setCategoryForm] = useState({
    _id: '',
    name: '',
    description: ''
  });
  
  // Item Form
  const [itemForm, setItemForm] = useState({
    _id: '',
    name: '',
    category: '',
    unitPrice: 0,
    quantityOnHand: 0,
    reorderLevel: 0,
    location: '',
    defaultCheckInQty: 0
  });
  
  // Transaction Form
  const [transactionForm, setTransactionForm] = useState<{
    item: string;
    transactionType: 'adjustment' | 'issue' | 'return' | 'usage';
    quantity: number;
    reason: string;
  }>({
    item: '',
    transactionType: 'adjustment',
    quantity: 1,
    reason: ''
  });
  
  // Delete confirmation state
  const [deleteItemInfo, setDeleteItemInfo] = useState({
    type: '', // 'category' or 'item'
    id: '',
    name: ''
  });
  
  // Use the inventory context
  const {
    categories,
    items,
    transactions,
    lowStockItems,
    totalInventoryValue,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    getFilteredItems,
    refreshData,
    // Category functions
    createCategory,
    updateCategory,
    deleteCategory,
    // Item functions
    createItem,
    updateItem,
    deleteItem,
    setDefaultCheckInQuantity,
    // Transaction functions
    createTransaction
  } = useInventory();
  
  // Get filtered items
  const filteredInventory = getFilteredItems();
  
  // Category options for filter dropdown
  const categoryOptions = useMemo(() => {
    return ['all', ...categories.map(cat => cat.name)];
  }, [categories]);
  
  // === SIDEBAR NAVIGATION ===
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Discounts', href: '/discounts', icon: Ticket },
    { name: 'Inventory', href: '/inventory', icon: Archive },
    { name: 'Invoices', href: '/invoices', icon: FileText },
  ];

  const reportNavItems = [{ name: 'Reports', href: '/reports', icon: BarChart3 }];
  const systemNavItems = [{ name: 'Settings', href: '/settings', icon: Settings }];

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
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

  // Stock level chart data
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

  // === HANDLER FUNCTIONS ===
  
  // Handle restock item
  const handleRestockItem = async (itemId: string, currentQty: number, additionalQty: number = 10) => {
    try {
      await createTransaction({
        item: itemId,
        transactionType: 'adjustment',
        quantity: additionalQty,
        reason: 'Restock'
      });
      await refreshData();
    } catch (error) {
      console.error('Error restocking item:', error);
    }
  };
  
  // Open the category modal for creating a new category
  const handleAddCategory = () => {
    setCategoryForm({
      _id: '',
      name: '',
      description: ''
    });
    setCategoryModalOpen(true);
  };
  
  // Open the category modal for editing an existing category
  const handleEditCategory = (category: InventoryCategory) => {
    setCategoryForm({
      _id: category._id,
      name: category.name,
      description: category.description || ''
    });
    setCategoryModalOpen(true);
  };
  
  // Save a category (create or update)
  const handleSaveCategory = async () => {
    try {
      if (categoryForm._id) {
        // Update existing category
        await updateCategory(categoryForm._id, {
          name: categoryForm.name,
          description: categoryForm.description
        });
      } else {
        // Create new category
        await createCategory({
          name: categoryForm.name,
          description: categoryForm.description
        });
      }
      setCategoryModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };
  
  // Open delete confirmation for a category
  const handleDeleteCategoryConfirm = (category: InventoryCategory) => {
    setDeleteItemInfo({
      type: 'category',
      id: category._id,
      name: category.name
    });
    setDeleteDialogOpen(true);
  };
  
  // Open the item modal for creating a new item
  const handleAddItem = () => {
    setItemForm({
      _id: '',
      name: '',
      category: categories.length > 0 ? categories[0]._id : '',
      unitPrice: 0,
      quantityOnHand: 0,
      reorderLevel: 0,
      location: '',
      defaultCheckInQty: 0
    });
    setItemModalOpen(true);
  };
  
  // Open the item modal for editing an existing item
  const handleEditItem = (item: InventoryItem) => {
    setItemForm({
      _id: item._id,
      name: item.name,
      category: typeof item.category === 'object' ? item.category._id : item.category,
      unitPrice: item.unitPrice,
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
      location: item.location || '',
      defaultCheckInQty: item.defaultCheckInQty
    });
    setItemModalOpen(true);
  };
  
  // Save an item (create or update)
  const handleSaveItem = async () => {
    try {
      if (itemForm._id) {
        // Update existing item
        await updateItem(itemForm._id, {
          name: itemForm.name,
          category: itemForm.category,
          unitPrice: itemForm.unitPrice,
          quantityOnHand: itemForm.quantityOnHand,
          reorderLevel: itemForm.reorderLevel,
          location: itemForm.location,
          defaultCheckInQty: itemForm.defaultCheckInQty
        });
      } else {
        // Create new item
        await createItem({
          name: itemForm.name,
          category: itemForm.category,
          unitPrice: itemForm.unitPrice,
          quantityOnHand: itemForm.quantityOnHand,
          reorderLevel: itemForm.reorderLevel,
          location: itemForm.location,
          defaultCheckInQty: itemForm.defaultCheckInQty
        });
      }
      setItemModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };
  
  // Open delete confirmation for an item
  const handleDeleteItemConfirm = (item: InventoryItem) => {
    setDeleteItemInfo({
      type: 'item',
      id: item._id,
      name: item.name
    });
    setDeleteDialogOpen(true);
  };
  
  // Set default check-in quantity
  const handleSetDefaultQuantity = async (itemId: string, quantity: number) => {
    try {
      await setDefaultCheckInQuantity(itemId, quantity);
      await refreshData();
    } catch (error) {
      console.error('Error setting default quantity:', error);
    }
  };
  
  // Open the transaction modal
  const handleAddTransaction = (itemId?: string) => {
    setTransactionForm({
      item: itemId || (items.length > 0 ? items[0]._id : ''),
      transactionType: 'adjustment',
      quantity: 1,
      reason: ''
    });
    setTransactionModalOpen(true);
  };
  
  // Create a transaction
  const handleCreateTransaction = async () => {
    try {
      await createTransaction({
        item: transactionForm.item,
        transactionType: transactionForm.transactionType,
        quantity: transactionForm.quantity,
        reason: transactionForm.reason
      });
      setTransactionModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };
  
  // Handle final deletion
  const handleDeleteConfirmed = async () => {
    try {
      if (deleteItemInfo.type === 'category') {
        await deleteCategory(deleteItemInfo.id);
      } else if (deleteItemInfo.type === 'item') {
        await deleteItem(deleteItemInfo.id);
      }
      setDeleteDialogOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };
  
  // Loading state - show a loading indicator if no items have loaded yet
  if (loading && items.length === 0 && categories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && items.length === 0 && categories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-slate-900 mb-2">Error Loading Inventory</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={refreshData}>Try Again</Button>
        </div>
      </div>
    );
  }

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Inventory Management</h1>
                <p className="text-slate-600 mt-2 font-light">Track and manage property supplies and stock levels</p>
              </div>
              <div className="mt-4 md:mt-0 space-x-3">
                <Button variant="outline" onClick={refreshData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Tabs for Inventory, Categories, Transactions */}
            <Tabs defaultValue="items" className="mb-6" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="items" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                  <Package className="h-4 w-4 mr-2" />
                  Items
                </TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                  <Tag className="h-4 w-4 mr-2" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                  <Layers className="h-4 w-4 mr-2" />
                  Transactions
                </TabsTrigger>
              </TabsList>

              {/* Stats Cards - Only show on Items tab */}
              <TabsContent value="items">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Total Items</p>
                          <p className="text-3xl font-light mt-2 text-slate-900">{items.length}</p>
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
                          <p className="text-3xl font-light mt-2 text-slate-900">{categories.length}</p>
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
                          <p className="text-3xl font-light mt-2 text-slate-900">Rs:{totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                            <div key={item._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div>
                                <p className="font-medium text-slate-800">{item.name}</p>
                                <div className="flex items-center mt-1">
                                  <p className="text-xs text-red-600 font-medium">{item.quantityOnHand} left</p>
                                  <ArrowDown className="h-3 w-3 text-red-600 ml-1" />
                                  <p className="text-xs text-slate-500 ml-2">Min: {item.reorderLevel}</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8"
                                onClick={() => handleAddTransaction(item._id)}
                              >
                                Restock
                              </Button>
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
                          {categoryOptions.map(category => (
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
                          <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">SKU/ID</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Category</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Stock</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Unit Price</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Location</th>
                          <th className="text-center py-4 px-6 text-sm font-medium text-slate-500">Default Qty</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory.map((item) => (
                          <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-medium text-slate-800">{item.name}</span>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600">{item._id.substring(0, 8)}</td>
                            <td className="py-4 px-6">
                              <Badge className="capitalize bg-slate-100 text-slate-800 hover:bg-slate-200">
                                {typeof item.category === 'object' ? item.category.name : String(item.category)}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className={`font-medium ${
                                item.quantityOnHand <= item.reorderLevel ? 'text-red-600' : 
                                item.quantityOnHand <= item.reorderLevel * 1.5 ? 'text-amber-600' : 
                                'text-emerald-600'
                              }`}>
                                {item.quantityOnHand}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">/ {item.reorderLevel} min</span>
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-800">
                              Rs:{" "}{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600">{item.location || 'N/A'}</td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <input 
                                  type="number" 
                                  min="0" 
                                  className="w-14 h-8 text-center border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  value={item.defaultCheckInQty}
                                  onChange={(e) => handleSetDefaultQuantity(item._id, parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onClick={() => handleAddTransaction(item._id)}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Restock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Item
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="cursor-pointer text-red-600"
                                    onClick={() => handleDeleteItemConfirm(item)}
                                  >
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

                  {filteredInventory.length === 0 && (
                    <div className="py-12 text-center">
                      <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-light">No inventory items found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={handleAddItem}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Item
                      </Button>
                    </div>
                  )}

                  <CardContent className="p-6 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-500">
                        Showing {filteredInventory.length} of {items.length} items
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm" disabled>Next</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories">
                <div className="mb-6 flex justify-between">
                  <h3 className="text-xl font-light text-slate-900">Categories</h3>
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleAddCategory}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map(category => (
                    <Card key={category._id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">{category.name}</CardTitle>
                        <CardDescription>
                          {category.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm">
                          <Package className="h-4 w-4 mr-1 text-slate-500" />
                          <span className="text-slate-600">
                            {items.filter(item => 
                              typeof item.category === 'object' 
                                ? item.category._id === category._id
                                : item.category === category._id
                            ).length} items
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCategoryConfirm(category)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {categories.length === 0 && (
                  <div className="py-12 text-center">
                    <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-light">No categories found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={handleAddCategory}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Category
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <div className="mb-6 flex justify-between">
                  <h3 className="text-xl font-light text-slate-900">Inventory Transactions</h3>
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleAddTransaction()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                  </Button>
                </div>
                
                <div className="overflow-hidden bg-white shadow-lg rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 30).map(transaction => (
                        <TableRow key={transaction._id}>
                          <TableCell className="font-medium">
                            {typeof transaction.item === 'object' 
                              ? transaction.item.name 
                              : items.find(i => i._id === transaction.item)?.name || 'Unknown Item'}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              transaction.transactionType === 'issue' ? 'bg-red-100 text-red-800' :
                              transaction.transactionType === 'return' ? 'bg-green-100 text-green-800' :
                              transaction.transactionType === 'adjustment' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.quantity}
                          </TableCell>
                          <TableCell>
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            {transaction.reason || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {transactions.length === 0 && (
                    <div className="py-12 text-center">
                      <Layers className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-light">No transactions found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => handleAddTransaction()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Transaction
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* === MODALS === */}
      
      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{categoryForm._id ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              Create or update inventory categories to organize your items.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={!categoryForm.name}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Modal */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{itemForm._id ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              Add or update items in your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemName" className="text-right">
                Name
              </Label>
              <Input
                id="itemName"
                value={itemForm.name}
                onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemCategory" className="text-right">
                Category
              </Label>
              <Select 
                value={itemForm.category} 
                onValueChange={(value) => setItemForm({...itemForm, category: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemPrice" className="text-right">
                Unit Price
              </Label>
              <Input
                id="itemPrice"
                type="number"
                min="0"
                step="0.01"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm({...itemForm, unitPrice: parseFloat(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemQuantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="itemQuantity"
                type="number"
                min="0"
                value={itemForm.quantityOnHand}
                onChange={(e) => setItemForm({...itemForm, quantityOnHand: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemReorderLevel" className="text-right">
                Reorder Level
              </Label>
              <Input
                id="itemReorderLevel"
                type="number"
                min="0"
                value={itemForm.reorderLevel}
                onChange={(e) => setItemForm({...itemForm, reorderLevel: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemLocation" className="text-right">
                Location
              </Label>
              <Input
                id="itemLocation"
                value={itemForm.location}
                onChange={(e) => setItemForm({...itemForm, location: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemDefaultQty" className="text-right">
                Default Check-In
              </Label>
              <Input
                id="itemDefaultQty"
                type="number"
                min="0"
                value={itemForm.defaultCheckInQty}
                onChange={(e) => setItemForm({...itemForm, defaultCheckInQty: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
              <div className="col-span-4 -mt-2 ml-auto max-w-[75%]">
                <p className="text-xs text-slate-500 italic">
                  Items automatically assigned to guests during check-in
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveItem}
              disabled={!itemForm.name || !itemForm.category}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Modal */}
      <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
            <DialogDescription>
              Record inventory movements, restocking, or adjustments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionItem" className="text-right">
                Item
              </Label>
              <Select 
                value={transactionForm.item} 
                onValueChange={(value) => setTransactionForm({...transactionForm, item: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionType" className="text-right">
                Type
              </Label>
              <Select 
                value={transactionForm.transactionType} 
                onValueChange={(value: any) => setTransactionForm({...transactionForm, transactionType: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Adjustment (Add)</SelectItem>
                  <SelectItem value="issue">Issue (Remove)</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionQuantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="transactionQuantity"
                type="number"
                min="1"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({...transactionForm, quantity: parseInt(e.target.value) || 1})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionReason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="transactionReason"
                value={transactionForm.reason}
                onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                className="col-span-3"
                placeholder="Optional"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTransaction}
              disabled={!transactionForm.item || transactionForm.quantity < 1}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{deleteItemInfo.name}</span>. 
              {deleteItemInfo.type === 'category' && ' All items in this category will need to be reassigned.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirmed}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryPage;