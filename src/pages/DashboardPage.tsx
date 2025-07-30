import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Users, Bed, Calendar, DollarSign, TrendingUp, TrendingDown, Settings, 
    LogOut, Menu, X, Home, Crown, Star, CheckCircle, Wrench, Key, 
    Filter, Sparkles, Ticket, Archive, FileText, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// Interfaces
interface Room { 
  id: string; 
  roomNumber: string; 
  type: string; 
  rate: number; 
  status: 'available' | 'occupied' | 'maintenance'; 
  floor?: number; 
  guestName?: string; 
}

interface Guest { 
  id: string; 
  fullName: string; 
  checkInDate: string; 
  checkOutDate?: string; 
  room: Room; 
}

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();

  // Main navigation items
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Discounts', href: '/Discounts', icon: Ticket },
    { name: 'Inventory', href: '/Inventory', icon: Archive },
    { name: 'Invoices', href: '/Invoices', icon: FileText },
    { name: 'Revenue', href: '/Revenue', icon: FileText },
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
            onClick={onClose}
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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
        shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
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
            onClick={onClose}
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
    </>
  );
};

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roomFilter, setRoomFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');

  // Fetch rooms data
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      // Mock data for demonstration - replace with actual API call
      return [
        { id: '101', roomNumber: '101', type: 'deluxe', rate: 250, status: 'occupied' },
        { id: '102', roomNumber: '102', type: 'deluxe', rate: 250, status: 'available' },
        { id: '103', roomNumber: '103', type: 'deluxe', rate: 250, status: 'maintenance' },
        { id: '201', roomNumber: '201', type: 'suite', rate: 450, status: 'occupied' },
        { id: '202', roomNumber: '202', type: 'suite', rate: 450, status: 'available' },
        { id: '301', roomNumber: '301', type: 'penthouse', rate: 1200, status: 'available' },
      ];
    },
  });

  // Fetch guests data
  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      // Mock data for demonstration - replace with actual API call
      return [
        { id: 'g1', fullName: 'John Doe', checkInDate: new Date().toISOString(), room: rooms.find(r => r.id === '101')! },
        { id: 'g2', fullName: 'Jane Smith', checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), room: rooms.find(r => r.id === '201')! },
        { id: 'g3', fullName: 'Peter Jones', checkInDate: new Date().toISOString(), room: {id: 'preview', roomNumber: '302', type: 'suite', rate: 450, status: 'occupied' } },
      ];
    },
    enabled: !!rooms.length, // Only run this query when rooms data is available
  });

  // Calculate metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const availableRooms = rooms.filter(room => room.status === 'available').length;
  const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;

  // Get today's check-ins
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = guests.filter(guest => guest.checkInDate.startsWith(today)).length;

  // Calculate total revenue from current guests
  const totalRevenue = guests
    .filter(guest => !guest.checkOutDate)
    .reduce((sum, guest) => sum + (guest.room?.rate || 0), 0);

  // Prepare room status data for pie chart
  const roomStatusData = [
    { name: 'Available', value: availableRooms, color: '#10b981' },
    { name: 'Occupied', value: occupiedRooms, color: '#f59e0b' },
    { name: 'Maintenance', value: maintenanceRooms, color: '#ef4444' },
  ];

  // Filter rooms based on selected filter
  const filteredRooms = roomFilter === 'all' ? rooms : rooms.filter(room => room.status === roomFilter);

  // Prepare occupancy by type data for bar chart
  const roomTypes = [...new Set(rooms.map(room => room.type))];
  const occupancyByType = roomTypes.map(type => {
    const roomsOfType = rooms.filter(room => room.type === type);
    const occupiedOfType = roomsOfType.filter(room => room.status === 'occupied').length;
    const totalOfType = roomsOfType.length;
    return {
      type: type.charAt(0).toUpperCase() + type.slice(1),
      occupied: occupiedOfType,
      total: totalOfType,
      available: totalOfType - occupiedOfType,
    };
  });

  // Prepare daily check-ins data for line chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const dailyCheckIns = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const checkIns = guests.filter(guest => guest.checkInDate.startsWith(dateStr)).length;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      checkIns,
    };
  });

  const stats = [
    { title: 'Total Rooms', value: totalRooms.toString(), change: `${availableRooms} available`, trend: 'neutral' as const, icon: Bed, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Occupancy Rate', value: totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : '0%', change: `${occupiedRooms} of ${totalRooms} occupied`, trend: occupiedRooms > availableRooms ? 'up' as const : 'down' as const, icon: Users, gradient: 'from-emerald-500 to-emerald-600' },
    { title: 'Arrivals Today', value: todayCheckIns.toString(), change: 'New guests', trend: 'up' as const, icon: Calendar, gradient: 'from-purple-500 to-purple-600' },
    { title: 'Daily Revenue', value: `$${totalRevenue.toLocaleString()}`, change: 'Active bookings', trend: 'up' as const, icon: DollarSign, gradient: 'from-amber-500 to-amber-600' },
  ];

  const chartConfig = {
    occupied: { label: 'Occupied', color: '#f59e0b' },
    available: { label: 'Available', color: '#e2e8f0' },
    checkIns: { label: 'Check-ins', color: '#3b82f6' },
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'occupied': return <Key className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'occupied': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'maintenance': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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

        {/* Dashboard content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-light text-slate-900 tracking-wide">Executive Dashboard</h1>
              <p className="text-slate-600 mt-2 font-light">Welcome back. Here's today's overview of your business.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat) => (
                <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300" 
                       style={{ backgroundImage: `linear-gradient(to bottom right, ${stat.gradient.split(' ')[1]}, ${stat.gradient.split(' ')[3]})` }} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-light text-slate-600 tracking-wide uppercase">{stat.title}</p>
                        <p className="text-3xl font-light text-slate-900">{stat.value}</p>
                        <div className="flex items-center mt-3">
                          {stat.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1.5" />
                          ) : stat.trend === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-rose-500 mr-1.5" />
                          ) : null}
                          <span className={`text-sm font-light ${
                            stat.trend === 'up' ? 'text-emerald-600' : 
                            stat.trend === 'down' ? 'text-rose-600' : 
                            'text-slate-600'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Room Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Room Status Summary */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-light text-slate-900">Room Status Overview</CardTitle>
                  <CardDescription className="font-light text-slate-500">Current accommodation status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-slate-700">Available</span>
                      </div>
                      <span className="text-xl font-light text-slate-900">{availableRooms}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-slate-700">Occupied</span>
                      </div>
                      <span className="text-xl font-light text-slate-900">{occupiedRooms}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-3">
                        <Wrench className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-slate-700">Maintenance</span>
                      </div>
                      <span className="text-xl font-light text-slate-900">{maintenanceRooms}</span>
                    </div>
                  </div>
                  
                  {/* Mini Pie Chart */}
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={roomStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {roomStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Room Quick View */}
              <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-light text-slate-900">Room Quick View</CardTitle>
                      <CardDescription className="font-light text-slate-500">Real-time room status</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <select 
                        value={roomFilter}
                        onChange={(e) => setRoomFilter(e.target.value as any)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="all">All Rooms</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[300px] overflow-y-auto">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`
                          relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
                          hover:shadow-md hover:scale-105 ${getStatusColor(room.status)}
                        `}
                        title={`Room ${room.roomNumber} - ${room.type} - ${room.status}`}
                      >
                        <div className="text-center">
                          <p className="font-medium text-sm">{room.roomNumber}</p>
                          <div className="mt-1 flex justify-center">
                            {getStatusIcon(room.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-slate-600 font-light">
                      Showing {filteredRooms.length} of {totalRooms} rooms
                    </p>
                    <Link to="/rooms">
                      <Button variant="outline" size="sm" className="font-light">
                        View All Rooms
                        <Bed className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Occupancy by Type Chart */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-light text-slate-900">Occupancy by Category</CardTitle>
                  <CardDescription className="font-light text-slate-500">Current availability across accommodation types</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={occupancyByType}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="type" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="occupied" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="available" fill="#e2e8f0" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Daily Check-ins Chart */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-light text-slate-900">Guest Arrivals Trend</CardTitle>
                  <CardDescription className="font-light text-slate-500">Check-in patterns over the past week</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyCheckIns}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="checkIns" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-light text-slate-900">Recent Guest Arrivals</CardTitle>
                    <CardDescription className="font-light text-slate-500">Latest check-ins at the property</CardDescription>
                  </div>
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {guests
                    .filter(guest => !guest.checkOutDate)
                    .slice(0, 5)
                    .map((guest) => (
                      <div key={guest.id} className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{guest.fullName}</p>
                            <p className="text-sm text-slate-500 font-light">
                              {guest.room?.type ? `${guest.room.type.charAt(0).toUpperCase() + guest.room.type.slice(1)} Suite` : 'Suite'} • Room {guest.room?.roomNumber || 'Pending'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-light text-slate-700">
                            {new Date(guest.checkInDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-slate-400 font-light mt-0.5">
                            {new Date(guest.checkInDate).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  {guests.filter(guest => !guest.checkOutDate).length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-light">No recent arrivals</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;