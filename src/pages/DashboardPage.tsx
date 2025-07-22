import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Bed, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  CreditCard,
  UserCheck,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  rate: number;
  status: 'available' | 'occupied' | 'maintenance';
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

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Reservations', href: '/reservations', icon: Calendar },
    { name: 'Check-in/out', href: '/checkin', icon: UserCheck },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">HSQ TOWERS</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 transition-colors duration-200
                    ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* <div className="mt-8 pt-6 border-t border-gray-200">
            <button className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-100 w-full transition-colors duration-200">
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              Sign out
            </button>
          </div> */}
        </nav>

        {/* User profile section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@hsqtowers.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch rooms data
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return response.json();
    },
  });

  // Fetch guests data
  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const response = await fetch('/api/guests');
      if (!response.ok) throw new Error('Failed to fetch guests');
      return response.json();
    },
  });

  // Calculate metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const availableRooms = rooms.filter(room => room.status === 'available').length;
  
  // Get today's check-ins
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = guests.filter(guest => 
    guest.checkInDate.startsWith(today)
  ).length;

  // Calculate total revenue from current guests
  const totalRevenue = guests
    .filter(guest => !guest.checkOutDate)
    .reduce((sum, guest) => sum + (guest.room?.rate || 0), 0);

  // Prepare occupancy by type data for bar chart
  const roomTypes = [...new Set(rooms.map(room => room.type))];
  const occupancyByType = roomTypes.map(type => {
    const roomsOfType = rooms.filter(room => room.type === type);
    const occupiedOfType = roomsOfType.filter(room => room.status === 'occupied').length;
    const totalOfType = roomsOfType.length;
    
    return {
      type,
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
    const checkIns = guests.filter(guest => 
      guest.checkInDate.startsWith(dateStr)
    ).length;
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      checkIns,
    };
  });

  const stats = [
    {
      title: 'Total Rooms',
      value: totalRooms.toString(),
      change: `${availableRooms} available`,
      trend: 'neutral' as const,
      icon: Bed,
    },
    {
      title: 'Occupancy Rate',
      value: totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : '0%',
      change: `${occupiedRooms}/${totalRooms} rooms`,
      trend: occupiedRooms > availableRooms ? 'up' as const : 'down' as const,
      icon: Users,
    },
    {
      title: 'Today\'s Check-ins',
      value: todayCheckIns.toString(),
      change: 'New arrivals',
      trend: 'up' as const,
      icon: Calendar,
    },
    {
      title: 'Current Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: 'Active bookings',
      trend: 'up' as const,
      icon: DollarSign,
    },
  ];

  const chartConfig = {
    occupied: {
      label: 'Occupied',
      color: 'hsl(var(--chart-1))',
    },
    available: {
      label: 'Available',
      color: 'hsl(var(--chart-2))',
    },
    checkIns: {
      label: 'Check-ins',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">HSQ TOWERS</span>
            </div>
            <div className="w-9" /> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's what's happening at your hotel today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          {stat.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : stat.trend === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          ) : null}
                          <span className={`text-sm ${
                            stat.trend === 'up' ? 'text-green-600' : 
                            stat.trend === 'down' ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <stat.icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Occupancy by Type Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Occupancy by Type</CardTitle>
                  <CardDescription>Current room status across different room types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={occupancyByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="occupied" fill="var(--color-occupied)" name="Occupied" />
                        <Bar dataKey="available" fill="var(--color-available)" name="Available" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Daily Check-ins Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Check-ins</CardTitle>
                  <CardDescription>Guest check-ins over the past 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyCheckIns}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="checkIns" 
                          stroke="var(--color-checkIns)" 
                          strokeWidth={3}
                          name="Check-ins"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>Latest guest arrivals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {guests
                    .filter(guest => !guest.checkOutDate)
                    .slice(0, 4)
                    .map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <div>
                            <p className="font-medium text-gray-900">Check-in - {guest.fullName}</p>
                            <p className="text-sm text-gray-600">Room {guest.room?.roomNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(guest.checkInDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  {guests.filter(guest => !guest.checkOutDate).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No recent check-ins</p>
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
// import React from 'react';
// import { Users, Bed, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
// import { useQuery } from '@tanstack/react-query';

// interface Room {
//   id: string;
//   roomNumber: string;
//   type: string;
//   rate: number;
//   status: 'available' | 'occupied' | 'maintenance';
// }

// interface Guest {
//   id: string;
//   fullName: string;
//   checkInDate: string;
//   checkOutDate?: string;
//   room: Room;
// }

// const DashboardPage = () => {
//   // Fetch rooms data
//   const { data: rooms = [] } = useQuery<Room[]>({
//     queryKey: ['rooms'],
//     queryFn: async () => {
//       const response = await fetch('/api/rooms');
//       if (!response.ok) throw new Error('Failed to fetch rooms');
//       return response.json();
//     },
//   });

//   // Fetch guests data
//   const { data: guests = [] } = useQuery<Guest[]>({
//     queryKey: ['guests'],
//     queryFn: async () => {
//       const response = await fetch('/api/guests');
//       if (!response.ok) throw new Error('Failed to fetch guests');
//       return response.json();
//     },
//   });

//   // Calculate metrics
//   const totalRooms = rooms.length;
//   const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
//   const availableRooms = rooms.filter(room => room.status === 'available').length;
  
//   // Get today's check-ins
//   const today = new Date().toISOString().split('T')[0];
//   const todayCheckIns = guests.filter(guest => 
//     guest.checkInDate.startsWith(today)
//   ).length;

//   // Calculate total revenue from current guests
//   const totalRevenue = guests
//     .filter(guest => !guest.checkOutDate)
//     .reduce((sum, guest) => sum + (guest.room?.rate || 0), 0);

//   // Prepare occupancy by type data for bar chart
//   const roomTypes = [...new Set(rooms.map(room => room.type))];
//   const occupancyByType = roomTypes.map(type => {
//     const roomsOfType = rooms.filter(room => room.type === type);
//     const occupiedOfType = roomsOfType.filter(room => room.status === 'occupied').length;
//     const totalOfType = roomsOfType.length;
    
//     return {
//       type,
//       occupied: occupiedOfType,
//       total: totalOfType,
//       available: totalOfType - occupiedOfType,
//     };
//   });

//   // Prepare daily check-ins data for line chart (last 7 days)
//   const last7Days = Array.from({ length: 7 }, (_, i) => {
//     const date = new Date();
//     date.setDate(date.getDate() - (6 - i));
//     return date;
//   });

//   const dailyCheckIns = last7Days.map(date => {
//     const dateStr = date.toISOString().split('T')[0];
//     const checkIns = guests.filter(guest => 
//       guest.checkInDate.startsWith(dateStr)
//     ).length;
    
//     return {
//       date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//       checkIns,
//     };
//   });

//   const stats = [
//     {
//       title: 'Total Rooms',
//       value: totalRooms.toString(),
//       change: `${availableRooms} available`,
//       trend: 'neutral' as const,
//       icon: Bed,
//     },
//     {
//       title: 'Occupancy Rate',
//       value: totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : '0%',
//       change: `${occupiedRooms}/${totalRooms} rooms`,
//       trend: occupiedRooms > availableRooms ? 'up' as const : 'down' as const,
//       icon: Users,
//     },
//     {
//       title: 'Today\'s Check-ins',
//       value: todayCheckIns.toString(),
//       change: 'New arrivals',
//       trend: 'up' as const,
//       icon: Calendar,
//     },
//     {
//       title: 'Current Revenue',
//       value: `$${totalRevenue.toLocaleString()}`,
//       change: 'Active bookings',
//       trend: 'up' as const,
//       icon: DollarSign,
//     },
//   ];

//   const chartConfig = {
//     occupied: {
//       label: 'Occupied',
//       color: 'hsl(var(--chart-1))',
//     },
//     available: {
//       label: 'Available',
//       color: 'hsl(var(--chart-2))',
//     },
//     checkIns: {
//       label: 'Check-ins',
//       color: 'hsl(var(--chart-3))',
//     },
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
//           <p className="text-gray-600 mt-2">Welcome back! Here's what's happening at your hotel today.</p>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {stats.map((stat) => (
//             <Card key={stat.title} className="hover:shadow-lg transition-shadow">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">{stat.title}</p>
//                     <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
//                     <div className="flex items-center mt-2">
//                       {stat.trend === 'up' ? (
//                         <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
//                       ) : stat.trend === 'down' ? (
//                         <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
//                       ) : null}
//                       <span className={`text-sm ${
//                         stat.trend === 'up' ? 'text-green-600' : 
//                         stat.trend === 'down' ? 'text-red-600' : 
//                         'text-gray-600'
//                       }`}>
//                         {stat.change}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="p-3 bg-blue-100 rounded-full">
//                     <stat.icon className="w-6 h-6 text-blue-600" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Charts Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           {/* Occupancy by Type Chart */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Room Occupancy by Type</CardTitle>
//               <CardDescription>Current room status across different room types</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer config={chartConfig}>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={occupancyByType}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="type" />
//                     <YAxis />
//                     <ChartTooltip content={<ChartTooltipContent />} />
//                     <Bar dataKey="occupied" fill="var(--color-occupied)" name="Occupied" />
//                     <Bar dataKey="available" fill="var(--color-available)" name="Available" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </ChartContainer>
//             </CardContent>
//           </Card>

//           {/* Daily Check-ins Chart */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Daily Check-ins</CardTitle>
//               <CardDescription>Guest check-ins over the past 7 days</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer config={chartConfig}>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart data={dailyCheckIns}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis />
//                     <ChartTooltip content={<ChartTooltipContent />} />
//                     <Line 
//                       type="monotone" 
//                       dataKey="checkIns" 
//                       stroke="var(--color-checkIns)" 
//                       strokeWidth={3}
//                       name="Check-ins"
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </ChartContainer>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Recent Activity */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Check-ins</CardTitle>
//             <CardDescription>Latest guest arrivals</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {guests
//                 .filter(guest => !guest.checkOutDate)
//                 .slice(0, 4)
//                 .map((guest) => (
//                   <div key={guest.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//                     <div className="flex items-center space-x-4">
//                       <div className="w-3 h-3 rounded-full bg-green-500" />
//                       <div>
//                         <p className="font-medium text-gray-900">Check-in - {guest.fullName}</p>
//                         <p className="text-sm text-gray-600">Room {guest.room?.roomNumber || 'N/A'}</p>
//                       </div>
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {new Date(guest.checkInDate).toLocaleDateString()}
//                     </p>
//                   </div>
//                 ))}
//               {guests.filter(guest => !guest.checkOutDate).length === 0 && (
//                 <p className="text-gray-500 text-center py-8">No recent check-ins</p>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default DashboardPage;
