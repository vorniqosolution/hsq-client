import React, { useState, useEffect, memo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
// import HSQ from "../../public/HSQ.png";
import {
  Users,
  Bed,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Crown,
  Star,
  CheckCircle,
  Wrench,
  Key,
  Filter,
  Sparkles,
  Ticket,
  Archive,
  FileText,
  Percent,
  Calendar1,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useRoomContext, ReservedRoomByDate } from "@/contexts/RoomContext";
import { useGuestContext } from "@/contexts/GuestContext";

// Define prop types for components

interface StatCardProps {
  stat: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: React.ElementType;
    gradient: string;
  };
}

interface ReservationTableProps {
  reservedRoomsByDate: ReservedRoomByDate[];
}

// Memoized Stats Card Component with proper types
const StatCard = memo<StatCardProps>(({ stat }) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white relative overflow-hidden group">
    <div
      className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300"
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${
          stat.gradient.split(" ")[1]
        }, ${stat.gradient.split(" ")[3]})`,
      }}
    />
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-light text-slate-600 tracking-wide uppercase">
            {stat.title}
          </p>
          <p className="text-3xl font-light text-slate-900">{stat.value}</p>
          <div className="flex items-center mt-3">
            {stat.trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-1.5" />
            ) : stat.trend === "down" ? (
              <TrendingDown className="w-4 h-4 text-rose-500 mr-1.5" />
            ) : null}
            <span
              className={`text-sm font-light ${
                stat.trend === "up"
                  ? "text-emerald-600"
                  : stat.trend === "down"
                  ? "text-rose-600"
                  : "text-slate-600"
              }`}
            >
              {stat.change}
            </span>
          </div>
        </div>
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
        >
          <stat.icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
));

// Memoized Reservation Table Component with proper types
const ReservationTable = memo<ReservationTableProps>(
  ({ reservedRoomsByDate }) => (
    <div className="h-[300px] overflow-hidden">
      <div className="w-full h-full overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-light">Guest Name</th>
              <th className="px-4 py-3 font-light">Room</th>
              <th className="px-4 py-3 font-light">Status</th>
              <th className="px-4 py-3 font-light">Stay Duration</th>
            </tr>
          </thead>
          <tbody>
            {reservedRoomsByDate && reservedRoomsByDate.length > 0 ? (
              reservedRoomsByDate.map((reservation) => (
                <tr
                  key={reservation._id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {reservation.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {reservation.roomNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {reservation.roomStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {reservation.daysBooked}{" "}
                    {reservation.daysBooked === 1 ? "day" : "days"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-light">
                    No reservations found for this month
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
);

const DashboardPage = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [roomFilter, setRoomFilter] = useState("all");

  // State for reservation month/year selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Use the room context with reservation data
  const {
    rooms,
    loading: roomsLoading,
    fetchRooms,
    reservedRoomsByDate,
    fetchReservedRoomsByDate,
  } = useRoomContext();

  // Use the guest context
  const { guests, loading: guestsLoading, fetchGuests } = useGuestContext();

  // Initial data loading with stable refs
  useEffect(() => {
    // Only fetch on mount
    const loadData = async () => {
      await fetchRooms();

      if (fetchGuests) {
        await fetchGuests();
      }

      if (fetchReservedRoomsByDate) {
        await fetchReservedRoomsByDate(selectedYear, selectedMonth);
      }
    };

    loadData();

    // DO NOT add dependencies here to prevent re-fetching on every render
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for month changes only
  useEffect(() => {
    if (fetchReservedRoomsByDate) {
      fetchReservedRoomsByDate(selectedYear, selectedMonth);
    }
  }, [selectedMonth, selectedYear, fetchReservedRoomsByDate]);

  // Handle month change without re-rendering the entire page
  const handleMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedMonth(parseInt(e.target.value, 10));
    },
    []
  );

  // Memoize computed values to prevent recalculations on every render
  const filteredRooms = React.useMemo(() => {
    // Filter rooms by status
    const availableRooms = rooms.filter((room) => room.status === "available");
    const occupiedRooms = rooms.filter((room) => room.status === "occupied");
    const maintenanceRooms = rooms.filter(
      (room) => room.status === "maintenance"
    );
    const reservedRooms = rooms.filter((room) => room.status === "reserved");

    // Filter rooms based on selected filter
    const filtered =
      roomFilter === "all"
        ? rooms
        : rooms.filter((room) => room.status === roomFilter);

    // Return all computed values to avoid recalculating them later
    return {
      filtered,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      reservedRooms,
      formattedRooms: filtered.map((room) => ({
        id: room._id,
        roomNumber: room.roomNumber,
        type: room.category?.toLowerCase() || "",
        rate: room.rate,
        status: room.status,
        bedType: room.bedType,
        view: room.view,
      })),
    };
  }, [rooms, roomFilter]);

  // Calculate stats once to avoid recalculations
  const stats = React.useMemo(() => {
    const { availableRooms, occupiedRooms, reservedRooms } = filteredRooms;
    const totalRooms = rooms.length;
    const availableRoomCount = availableRooms.length;
    const occupiedRoomCount = occupiedRooms.length;
    const reservedRoomCount = reservedRooms.length;

    // Get today's check-ins
    const today = new Date().toISOString().split("T")[0];
    const todayCheckIns = guests
      ? guests.filter(
          (guest) =>
            new Date(guest.checkInAt).toISOString().split("T")[0] === today
        ).length
      : 0;

    // Calculate total revenue from current guests
    const totalRevenue = guests
      ? guests
          .filter((guest) => guest.status === "checked-in")
          .reduce((sum, guest) => sum + guest.totalRent, 0)
      : 0;

    return [
      {
        title: "Total Rooms",
        value: totalRooms.toString(),
        change: `${availableRoomCount} available`,
        trend: "neutral" as const,
        icon: Bed,
        gradient: "from-blue-500 to-blue-600",
      },
      {
        title: "Occupancy Rate",
        value:
          totalRooms > 0
            ? `${Math.round(
                ((occupiedRoomCount + reservedRoomCount) / totalRooms) * 100
              )}%`
            : "0%",
        change: `${
          occupiedRoomCount + reservedRoomCount
        } of ${totalRooms} occupied/reserved`,
        trend:
          occupiedRoomCount > availableRoomCount
            ? ("up" as const)
            : ("down" as const),
        icon: Users,
        gradient: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Arrivals Today",
        value: todayCheckIns.toString(),
        change: "New guests",
        trend: "up" as const,
        icon: Calendar,
        gradient: "from-purple-500 to-purple-600",
      },
      {
        title: "Daily Revenue",
        value: `${totalRevenue.toLocaleString()}`,
        change: "Active bookings",
        trend: "up" as const,
        icon: DollarSign,
        gradient: "from-amber-500 to-amber-600",
      },
    ];
  }, [filteredRooms, guests, rooms.length]);

  // Room status data for pie chart
  const roomStatusData = React.useMemo(() => {
    const { availableRooms, occupiedRooms, reservedRooms, maintenanceRooms } =
      filteredRooms;
    return [
      { name: "Available", value: availableRooms.length, color: "#10b981" },
      { name: "Occupied", value: occupiedRooms.length, color: "#f59e0b" },
      { name: "Reserved", value: reservedRooms.length, color: "#3b82f6" },
      { name: "Maintenance", value: maintenanceRooms.length, color: "#ef4444" },
    ];
  }, [filteredRooms]);

  // Icons and colors for room statuses
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="w-4 h-4" />;
      case "occupied":
        return <Key className="w-4 h-4" />;
      case "reserved":
        return <Calendar className="w-4 h-4" />;
      case "maintenance":
        return <Wrench className="w-4 h-4" />;
      default:
        return null;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "occupied":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "reserved":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "maintenance":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }, []);

  // Chart configuration
  const chartConfig = {
    occupied: { label: "Occupied", color: "#f59e0b" },
    available: { label: "Available", color: "#e2e8f0" },
    checkIns: { label: "Check-ins", color: "#3b82f6" },
  };

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchRooms();
    if (fetchGuests) fetchGuests();
    if (fetchReservedRoomsByDate) {
      fetchReservedRoomsByDate(selectedYear, selectedMonth);
    }
  }, [
    fetchRooms,
    fetchGuests,
    fetchReservedRoomsByDate,
    selectedMonth,
    selectedYear,
  ]);

  // Show loading state when data is being fetched
  if (roomsLoading || guestsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 font-light">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      {/* ADD SIDE BAR COMPONENT */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      {/* Main content - USING OVERFLOW HIDDEN TO CONTAIN ALL CONTENT */}
      <div className="flex-1 lg:ml-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsOpen(true)}
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

        {/* Dashboard content - USING A FIXED CONTAINER WITH OVERFLOW */}
        <div className="p-8 ">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-light text-slate-900 tracking-wide">
                Executive Dashboard
              </h1>
              <p className="text-slate-600 mt-2 font-light">
                Welcome back. Here's today's overview of your business.
              </p>
            </div>

            {/* Stats Grid - USING MEMOIZED COMPONENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat) => (
                <StatCard key={stat.title} stat={stat} />
              ))}
            </div>

            {/* Room Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Room Status Summary */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-light text-slate-900">
                    Room Status Overview
                  </CardTitle>
                  <CardDescription className="font-light text-slate-500">
                    Current accommodation status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-slate-700">
                          Available
                        </span>
                      </div>
                      <span className="text-xl font-light text-slate-900">
                        {filteredRooms.availableRooms.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-slate-700">
                          Occupied
                        </span>
                      </div>
                      <span className="text-xl font-light text-slate-900">
                        {filteredRooms.occupiedRooms.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-700">
                          Reserved
                        </span>
                      </div>
                      <span className="text-xl font-light text-slate-900">
                        {filteredRooms.reservedRooms.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-3">
                        <Wrench className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-slate-700">
                          Maintenance
                        </span>
                      </div>
                      <span className="text-xl font-light text-slate-900">
                        {filteredRooms.maintenanceRooms.length}
                      </span>
                    </div>
                  </div>

                  {/* Mini Pie Chart */}
                  <div className="mt-6 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
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
                      <CardTitle className="text-xl font-light text-slate-900">
                        Room Quick View
                      </CardTitle>
                      <CardDescription className="font-light text-slate-500">
                        Real-time room status
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <select
                        value={roomFilter}
                        onChange={(e) => setRoomFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="all">All Rooms</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Fixed height container with absolute positioning */}
                  <div className="relative h-[300px] w-full">
                    <div className="absolute inset-0 overflow-y-auto">
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {filteredRooms.formattedRooms.map((room) => (
                          <div
                            key={room.id}
                            className={`
                              relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
                              hover:shadow-md hover:scale-105 ${getStatusColor(
                                room.status
                              )}
                            `}
                            title={`Room ${room.roomNumber} - ${room.type} - ${room.status}`}
                          >
                            <div className="text-center">
                              <p className="font-medium text-sm">
                                {room.roomNumber}
                              </p>
                              <div className="mt-1 flex justify-center">
                                {getStatusIcon(room.status)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredRooms.formattedRooms.length === 0 && (
                          <div className="col-span-full text-center py-8">
                            <Bed className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-light">
                              No rooms matching the selected filter
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-slate-600 font-light">
                      Showing {filteredRooms.formattedRooms.length} of{" "}
                      {rooms.length} rooms
                    </p>
                    <Link to="/rooms">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-light"
                      >
                        View All Rooms
                        <Bed className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Reservations Section - WITH FIXED HEIGHT AND MEMOIZED COMPONENT */}
            <div className="mb-10" style={{ height: "400px" }}>
              {" "}
              {/* Fixed height container */}
              <Card className="border-0 shadow-lg bg-white h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-light text-slate-900">
                        Upcoming Reservations
                      </CardTitle>
                      <CardDescription className="font-light text-slate-500">
                        Reserved rooms for{" "}
                        {new Date(
                          selectedYear,
                          selectedMonth - 1
                        ).toLocaleString("default", { month: "long" })}{" "}
                        {selectedYear}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <select
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (month) => (
                            <option key={month} value={month}>
                              {new Date(2023, month - 1).toLocaleString(
                                "default",
                                { month: "long" }
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-80px)] flex flex-col">
                  {/* Memoized Reservation Table */}
                  <ReservationTable
                    reservedRoomsByDate={reservedRoomsByDate || []}
                  />

                  <div className="mt-4 flex justify-end">
                    <Link to="/reservation">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-light"
                      >
                        View All Reservations
                        <Calendar className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manual Refresh Button */}
            <div className="text-center mt-6 mb-10">
              <Button
                variant="outline"
                size="sm"
                className="font-light"
                onClick={handleRefresh}
              >
                Refresh Dashboard Data
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Data auto-refreshes every 5 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
