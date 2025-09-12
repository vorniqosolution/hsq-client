import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  Users,
  Bed,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Menu,
  Crown,
  CheckCircle,
  Wrench,
  Key,
  LogOut,
  Briefcase,
  ArrowRight,
  Sun,
  Moon,
  RefreshCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRoomContext } from "@/contexts/RoomContext";
import { useGuestContext } from "@/contexts/GuestContext";
import { useReservationContext } from "@/contexts/ReservationContext";
import { isToday, isFuture, parseISO, addDays, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

// --- Sub-Components (Memoized for Performance) ---

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

// NEW: This is the "brain" that determines the real-time state of a room.
// NEW: This is the upgraded "brain" that finds ALL future reservations.
const getRoomState = (room, guests, reservations) => {
  const today = new Date();

  if (room.status === "maintenance") {
    return { state: "Maintenance", details: "Out of service" };
  }

  const guestCheckedInNow = guests.find(
    (g) => g.room._id === room._id && g.status === "checked-in"
  );
  const guestCheckingOutToday = guests.find(
    (g) =>
      g.room._id === room._id && g.checkOutAt && isToday(parseISO(g.checkOutAt))
  );
  const reservationForToday = reservations.find(
    (r) =>
      (typeof r.room === "object" ? r.room._id : r.room) === room._id &&
      ["reserved", "confirmed"].includes(r.status) &&
      isToday(parseISO(r.startAt))
  );

  if (guestCheckingOutToday && reservationForToday) {
    return {
      state: "Back-to-Back",
      details: `Checkout: ${guestCheckingOutToday.fullName} | Arrival: ${reservationForToday.fullName}`,
    };
  }
  if (guestCheckingOutToday) {
    return {
      state: "Departure Due",
      details: `Checkout: ${guestCheckingOutToday.fullName}`,
    };
  }
  if (guestCheckedInNow) {
    return {
      state: "Occupied",
      details: `Guest: ${guestCheckedInNow.fullName}`,
    };
  }
  if (reservationForToday) {
    return {
      state: "Arrival Due",
      details: `Arrival: ${reservationForToday.fullName}`,
    };
  }

  // CHANGED: Use .filter() to find ALL future reservations, not just the first one.
  const futureReservations = reservations
    .filter(
      (r) =>
        (typeof r.room === "object" ? r.room._id : r.room) === room._id &&
        ["reserved", "confirmed"].includes(r.status) &&
        isFuture(parseISO(r.startAt))
    )
    .sort(
      (a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
    ); // Sort them by date

  if (futureReservations.length > 0) {
    // Return the entire array of reservations as the details.
    return { state: "Reserved", details: futureReservations };
  }

  return { state: "Available", details: "Ready for booking" };
};

// NEW: This function provides styling and icons for each state.
const getStateStyling = (state) => {
  switch (state) {
    case "Occupied":
      return {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Key,
        label: "Occupied",
      };
    case "Available":
      return {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
        label: "Available",
      };
    case "Arrival Due":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Sun,
        label: "Arrival Today",
      };
    case "Departure Due":
      return {
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: Moon,
        label: "Departure Today",
      };
    case "Back-to-Back":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: RefreshCcw,
        label: "Back-to-Back",
      };
    case "Reserved":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Calendar,
        label: "Reserved (Future)",
      };
    case "Maintenance":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: Wrench,
        label: "Maintenance",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Bed,
        label: "Unknown",
      };
  }
};

const DashboardPage = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState(null);

  const { rooms, loading: roomsLoading, fetchRooms } = useRoomContext();
  const { guests, loading: guestsLoading, fetchGuests } = useGuestContext();
  const {
    reservations,
    loading: reservationsLoading,
    fetchReservations,
  } = useReservationContext();

  useEffect(() => {
    fetchRooms();
    fetchGuests();
    fetchReservations();
  }, [fetchRooms, fetchGuests, fetchReservations]);

  const hotelStats = useMemo(() => {
    const today = new Date();
    const totalRooms = rooms.length;

    if (totalRooms === 0) {
      return {
        totalRooms: 0,
        occupiedNow: 0,
        reservedForToday: 0,
        maintenanceNow: 0,
        availableNow: 0,
        arrivalsToday: 0,
        departuresToday: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        upcomingReservations: [],
      };
    }

    const occupiedNowIds = new Set(
      guests.filter((g) => g.status === "checked-in").map((g) => g.room._id)
    );
    const maintenanceNowIds = new Set(
      rooms.filter((r) => r.status === "maintenance").map((r) => r._id)
    );

    const reservedForTodayIds = new Set(
      reservations
        .filter((r) => {
          const isRelevant = ["reserved", "confirmed"].includes(r.status);
          const startsBeforeOrToday = parseISO(r.startAt) <= today;
          const endsAfterToday = parseISO(r.endAt) > today;
          const roomId = typeof r.room === "object" ? r.room._id : r.room;
          return (
            isRelevant &&
            startsBeforeOrToday &&
            endsAfterToday &&
            !occupiedNowIds.has(roomId)
          );
        })
        .map((r) => (typeof r.room === "object" ? r.room._id : r.room))
    );

    const occupiedNowCount = occupiedNowIds.size;
    const reservedForTodayCount = reservedForTodayIds.size;
    const maintenanceNowCount = maintenanceNowIds.size;
    const busyRoomsCount =
      occupiedNowCount + reservedForTodayCount + maintenanceNowCount;
    const availableNowCount = Math.max(0, totalRooms - busyRoomsCount);

    const arrivalsToday = guests.filter((g) =>
      isToday(parseISO(g.checkInAt))
    ).length;
    const departuresToday = guests.filter(
      (g) => g.checkOutAt && isToday(parseISO(g.checkOutAt))
    ).length;

    const totalRevenue = guests
      .filter((g) => g.status === "checked-in")
      .reduce((sum, guest) => sum + guest.totalRent, 0);

    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedNowCount / totalRooms) * 100) : 0;

    const sevenDaysFromNow = addDays(today, 7);
    const upcomingReservations = reservations
      .filter((r) => {
        const startDate = parseISO(r.startAt);
        return (
          ["reserved", "confirmed"].includes(r.status) &&
          startDate >= today &&
          startDate <= sevenDaysFromNow
        );
      })
      .sort(
        (a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
      );

    return {
      totalRooms,
      occupiedNow: occupiedNowCount,
      reservedForToday: reservedForTodayCount,
      maintenanceNow: maintenanceNowCount,
      availableNow: availableNowCount,
      arrivalsToday,
      departuresToday,
      totalRevenue,
      occupancyRate,
      upcomingReservations,
    };
  }, [rooms, guests, reservations]);

  // ADD THIS BLOCK AFTER `hotelStats`
  // NEW: Group rooms by their real-time state for display
  const groupedRooms = useMemo(() => {
    return rooms.reduce((acc, room) => {
      const { state, details } = getRoomState(room, guests, reservations);
      if (!acc[state]) {
        acc[state] = [];
      }
      acc[state].push({ ...room, state, details });
      return acc;
    }, {});
  }, [rooms, guests, reservations]);

  // ADD THIS BLOCK AFTER `groupedRooms`
  // NEW: Define the order in which to display the room groups for importance
  const groupDisplayOrder = [
    "Back-to-Back",
    "Departure Due",
    "Arrival Due",
    "Occupied",
    "Available",
    "Reserved",
    "Maintenance",
  ];

  const statsCardsData = [
    {
      title: "Occupancy Now",
      value: `${hotelStats.occupancyRate}%`,
      change: `${hotelStats.occupiedNow} of ${hotelStats.totalRooms} rooms`,
      trend: "up" as const,
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Available Rooms",
      value: hotelStats.availableNow.toString(),
      change: "Ready for guests",
      trend: "neutral" as const,
      icon: Bed,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Arrivals Today",
      value: hotelStats.arrivalsToday.toString(),
      change: "New check-ins",
      trend: "up" as const,
      icon: Calendar,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Departures Today",
      value: hotelStats.departuresToday.toString(),
      change: "Guests checking out",
      trend: "down" as const,
      icon: LogOut,
      gradient: "from-rose-500 to-rose-600",
    },
  ];

  const roomStatusDataForChart = [
    { name: "Available", value: hotelStats.availableNow, color: "#10b981" },
    { name: "Occupied", value: hotelStats.occupiedNow, color: "#f59e0b" },
    {
      name: "Reserved for Today",
      value: hotelStats.reservedForToday,
      color: "#3b82f6",
    },
    { name: "Maintenance", value: hotelStats.maintenanceNow, color: "#ef4444" },
  ];

  const isLoading = roomsLoading || guestsLoading || reservationsLoading;

  if (isLoading && !rooms.length && !guests.length && !reservations.length) {
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
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div className="flex-1 lg:ml-0 overflow-hidden">
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
        <div className="p-8 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-light text-slate-900 tracking-wide">
                Executive Dashboard
              </h1>
              <p className="text-slate-600 mt-2 font-light">
                Real-time overview of your hotel's operations for{" "}
                {format(new Date(), "PPP")}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statsCardsData.map((stat) => (
                <StatCard key={stat.title} stat={stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-light">
                    Room Status Overview
                  </CardTitle>
                  <CardDescription className="font-light">
                    Current state of all rooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                      <span className="flex items-center">
                        <CheckCircle className="inline w-5 h-5 mr-2 text-emerald-600" />
                        Available
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.availableNow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                      <span className="flex items-center">
                        <Key className="inline w-5 h-5 mr-2 text-amber-600" />
                        Occupied
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.occupiedNow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <span className="flex items-center">
                        <Calendar className="inline w-5 h-5 mr-2 text-blue-600" />
                        Reserved for Today
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.reservedForToday}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <span className="flex items-center">
                        <Wrench className="inline w-5 h-5 mr-2 text-red-600" />
                        Maintenance
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.maintenanceNow}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roomStatusDataForChart}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {roomStatusDataForChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "0.5rem",
                            boxShadow:
                              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-light">
                    Room Quick View
                  </CardTitle>
                  <CardDescription className="font-light">
                    Real-time room state overview
                  </CardDescription>
                </CardHeader>
                {/* NEW: This <CardContent> renders the grouped rooms */}
                <CardContent>
                  <div className="relative h-[450px] w-full">
                    <div className="absolute inset-0 overflow-y-auto pr-2 space-y-4">
                      <TooltipProvider>
                        {groupDisplayOrder.map((groupName) => {
                          const roomsInGroup = groupedRooms[groupName];
                          if (!roomsInGroup || roomsInGroup.length === 0) {
                            return null; // Don't render empty groups
                          }
                          const groupStyling = getStateStyling(groupName);
                          return (
                            <div key={groupName}>
                              <h3 className="font-semibold text-slate-600 text-sm mb-2 border-b pb-1 flex items-center">
                                <groupStyling.icon className="w-4 h-4 mr-2" />
                                {groupStyling.label} ({roomsInGroup.length})
                              </h3>
                              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {roomsInGroup.map((room) => {
                                  const { color, icon: Icon } = getStateStyling(
                                    room.state
                                  );
                                  return (
                                    <ShadTooltip key={room._id}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-105 ${color}`}
                                        >
                                          <div className="text-center">
                                            <p className="font-medium text-sm truncate">
                                              {room.roomNumber}
                                            </p>
                                            <div className="mt-1 flex justify-center">
                                              <Icon className="w-4 h-4" />
                                            </div>
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="font-semibold">
                                          {room.state}
                                        </p>
                                        {Array.isArray(room.details) ? (
                                          <ul className="mt-1 space-y-1 text-xs list-disc pl-4">
                                            {room.details.map((res) => (
                                              <li key={res._id}>
                                                <span className="font-medium">
                                                  {res.fullName}:
                                                </span>{" "}
                                                {format(
                                                  parseISO(res.startAt),
                                                  "MMM d"
                                                )}{" "}
                                                -{" "}
                                                {format(
                                                  parseISO(res.endAt),
                                                  "MMM d"
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-gray-600">
                                            {room.details}
                                          </p>
                                        )}
                                      </TooltipContent>
                                    </ShadTooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end border-t pt-4">
                    <Link to="/rooms">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-light"
                      >
                        Manage All Rooms <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-xl font-light">
                    Upcoming Arrivals (Next 7 Days)
                  </CardTitle>
                  <CardDescription className="font-light">
                    A look at confirmed future bookings for planning.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 h-[300px] overflow-y-auto pr-2">
                    {hotelStats.upcomingReservations.length > 0 ? (
                      hotelStats.upcomingReservations.map((res) => (
                        <div
                          key={res._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border transition-colors"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {res.fullName}
                            </p>
                            <p className="text-sm text-slate-500">
                              Room{" "}
                              {typeof res.room === "object"
                                ? res.room.roomNumber
                                : res.roomNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-800">
                              {format(parseISO(res.startAt), "EEE, MMM d")}
                            </p>
                            <p className="text-xs text-slate-500">Arriving</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Briefcase className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="font-light">
                          No new reservations in the next 7 days.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
