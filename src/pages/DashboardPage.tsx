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
  Hotel,
  Luggage,
  Mountain,
  UserCheck,
  ArrowLeftCircle,
  ArrowRightCircle,
  Clock,
  ExternalLink,
  Hash,
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
import { Room, useRoomContext } from "@/contexts/RoomContext";
import { useGuestContext } from "@/contexts/GuestContext";
import { useReservationContext } from "@/contexts/ReservationContext";
import { isToday, isFuture, parseISO, addDays, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getRoomState = (room: Room, guests: any[], reservations: any[]) => {
  const today = new Date();

  if (room.status === "maintenance") {
    return { state: "Maintenance", details: "Out of service" };
  }

  // --- First, find ALL relevant bookings for this room ---
  const guestCheckedInNow = guests.find(
    (g) => g.room && g.room._id === room._id && g.status === "checked-in" // ✅ Check room exists
  );
  const guestCheckingOutToday = guests.find(
    (g) =>
      g.room && // ✅ Add null check
      g.room._id === room._id &&
      g.checkOutAt &&
      isToday(parseISO(g.checkOutAt))
  );
  const reservationForToday = reservations.find((r) => {
    if (!r.room) return false; // ✅ Add null check
    const roomId = typeof r.room === "object" ? r.room._id : r.room;
    return (
      roomId === room._id &&
      ["reserved", "confirmed"].includes(r.status) &&
      isToday(parseISO(r.startAt))
    );
  });

  const futureReservations = reservations
    .filter((r) => {
      if (!r.room) return false; // ✅ Add null check
      const roomId = typeof r.room === "object" ? r.room._id : r.room;
      return (
        roomId === room._id &&
        ["reserved", "confirmed"].includes(r.status) &&
        isFuture(parseISO(r.startAt)) &&
        r._id !== reservationForToday?._id
      );
    })
    .sort(
      (a: { startAt: string }, b: { startAt: string }) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
    );

  if (guestCheckingOutToday && reservationForToday) {
    return {
      state: "Back-to-Back",
      details: {
        currentActivity: `Checkout: ${guestCheckingOutToday.fullName} | Arrival: ${reservationForToday.fullName}`,
        futureBookings: futureReservations,
      },
    };
  }
  if (guestCheckingOutToday) {
    return {
      state: "Departure",
      details: {
        currentActivity: `Checkout: ${guestCheckingOutToday.fullName}`,
        futureBookings: futureReservations,
      },
    };
  }
  if (guestCheckedInNow) {
    return {
      state: "Occupied",
      details: {
        currentActivity: `Guest: ${guestCheckedInNow.fullName}`,
        futureBookings: futureReservations,
      },
    };
  }
  if (reservationForToday) {
    return {
      state: "Arrival",
      details: {
        currentActivity: `Arrival: ${reservationForToday.fullName}`,
        futureBookings: futureReservations,
      },
    };
  }
  if (futureReservations.length > 0) {
    return {
      state: "Reserved",
      details: {
        currentActivity: "Free today", // No current activity, but future bookings exist
        futureBookings: futureReservations,
      },
    };
  }

  return { state: "Available", details: "Ready for booking" };
};

const getStateStyling = (state: string) => {
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
    case "Arrival":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Sun,
        label: "Arrival Today",
      };
    case "Departure":
      return {
        color: "bg-sky-600 text-sky-100 border-indigo-200",
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
        color: "bg-sky-100 text-sky-800 border-sky-200",
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
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
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
      guests
        .filter((g) => g.status === "checked-in" && g.room && g.room._id)
        .map((g) => g.room._id)
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
          if (!r.room) return false;
          const roomId = typeof r.room === "object" ? r.room._id : r.room;
          return (
            isRelevant &&
            startsBeforeOrToday &&
            endsAfterToday &&
            roomId &&
            !occupiedNowIds.has(roomId)
          );
        })
        .map((r) => {
          if (!r.room) return null; // ✅ Safety check
          return typeof r.room === "object" ? r.room._id : r.room;
        })
        .filter(Boolean) // ✅ Remove any null values
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
      .filter((g) => g.status === "checked-in" && g.totalRent) // ✅ Ensure totalRent exists
      .reduce((sum, guest) => sum + (guest.totalRent || 0), 0); // ✅ Default to 0

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
    <>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <div className="flex-1 lg:ml-0 overflow-hidden">
          {/* full Screen */}
          <div className="p-8 overflow-y-auto h-max">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <Card className="border-0 shadow-lg bg-white">
                  {/* TOP HEADER */}
                  <CardHeader>
                    <CardTitle className="text-xl font-light">
                      Room Status Overview
                    </CardTitle>
                    <CardDescription className="font-light">
                      Current state of all rooms
                    </CardDescription>
                  </CardHeader>

                  {/* LEFT_SIDE_ROOMS_STATUS */}
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
                          Reserved
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

                {/* Room_Quick_View_RIGHT_SIDE_ROOMS_OVERVIEW */}
                <Card className="border-0 shadow-lg bg-white lg:col-span-2 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-light">
                      Room Quick View
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      <svg
                        className="w-4 h-4 text-amber-500 animate-bounce"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 15l-2 5L9 9l11 4-5 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        Click on a room to view complete details
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="relative h-[450px] w-full">
                      <div className="absolute inset-0 overflow-y-auto pr-2 space-y-4">
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {rooms.map((room) => {
                            // We still use the "brain" to get the state and details
                            const { state, details } = getRoomState(
                              room,
                              guests,
                              reservations
                            );
                            const { color, icon: Icon } =
                              getStateStyling(state);

                            return (
                              <div
                                key={room._id}
                                className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-105 ${color}`}
                                // The onClick handler saves all the room's info for the dialog
                                onClick={() =>
                                  setSelectedRoomDetails({
                                    ...room,
                                    state,
                                    details,
                                  })
                                }
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
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end border-t pt-4">
                      <Link to="/rooms">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-light"
                        >
                          Manage All Rooms{" "}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedRoomDetails}
        onOpenChange={() => setSelectedRoomDetails(null)}
      >
        <DialogContent className="max-w-lg p-0">
          {selectedRoomDetails &&
            (() => {
              // Get the styling once and reuse it
              const {
                icon: StatusIcon,
                color,
                label,
              } = getStateStyling(selectedRoomDetails.state);
              const details = selectedRoomDetails.details;

              return (
                <>
                  <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center justify-between">
                      <span className="text-2xl font-light">
                        Room {selectedRoomDetails.roomNumber}
                      </span>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${color}`}
                      >
                        {label}
                      </div>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="px-6 pb-6 space-y-6">
                    {/* // === CURRENT ACTIVITY SECTION */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3">
                        Current Status
                      </h4>
                      <div className="flex items-start gap-4">
                        {typeof details === "string" ? (
                          // Case 1: Simple status like "Available" or "Maintenance"
                          <>
                            <div className={`p-2 rounded-full ${color}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <p className="font-medium text-slate-700 mt-1">
                              {details}
                            </p>
                          </>
                        ) : (
                          // Case 2: Complex status with guest/reservation details
                          <>
                            <div className={`p-2 rounded-full ${color}`}>
                              {selectedRoomDetails.state === "Occupied" ? (
                                <UserCheck className="h-5 w-5" />
                              ) : (
                                <Luggage className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {details.currentActivity}
                              </p><p className="font-semibold text-slate-900">
                                {details.checkInAt}
                              </p>
                              {/* <p className="text-xs text-slate-500 uppercase tracking-wider">
                                {selectedRoomDetails.state}
                              </p> */}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* {typeof details === "object" &&
                      details.futureBookings &&
                      details.futureBookings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 mb-2">
                            Upcoming Reservations
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {details.futureBookings.map((res) => (
                              <div
                                key={res._id}
                                className="flex justify-between items-center p-2 bg-green-300/50 rounded-md border"
                              >
                                <p className="text-sm font-medium text-slate-700">
                                  {res.fullName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {format(parseISO(res.startAt), "MMM d")} -{" "}
                                  {format(parseISO(res.endAt), "MMM d")}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )} */}
                      
                       {/* === UPCOMING RESERVATIONS SECTION === */}
                    {typeof details === "object" &&
                      details.futureBookings &&
                      details.futureBookings.length > 0 && (
                        <div className="space-y-3">
                          {/* Header with count */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <h4 className="text-sm font-semibold text-slate-800">
                                Upcoming Reservations
                              </h4>
                            </div>
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                              {details.futureBookings.length}{" "}
                              {details.futureBookings.length === 1
                                ? "booking"
                                : "bookings"}
                            </span>
                          </div>

                          {/* Reservations list */}
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {details.futureBookings.map((res, index) => {
                              const startDate = parseISO(res.startAt);
                              const endDate = parseISO(res.endAt);
                              const nights = Math.ceil(
                                (endDate.getTime() - startDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              const daysUntilArrival = Math.ceil(
                                (startDate.getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );

                              return (
                                <div
                                  key={res._id}
                                  className="group relative bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                  {/* Timeline indicator */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-500" />

                                  <div className="p-4 pl-5">
                                    <div className="flex items-start justify-between gap-4">
                                      {/* Guest info */}
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0">
                                          <span className="text-sm font-semibold text-emerald-700">
                                            {res.fullName
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .toUpperCase()
                                              .slice(0, 2)}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-slate-900 truncate">
                                            {res.fullName}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <p className="text-xs text-slate-500">
                                              {daysUntilArrival > 0
                                                ? `Arrives in ${daysUntilArrival} ${
                                                    daysUntilArrival === 1
                                                      ? "day"
                                                      : "days"
                                                  }`
                                                : daysUntilArrival === 0
                                                ? "Arriving today"
                                                : "In progress"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Stay duration badge */}
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                                          {nights}{" "}
                                          {nights === 1 ? "night" : "nights"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Date range */}
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-1.5">
                                            <ArrowRightCircle className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-slate-600 font-medium">
                                              {format(startDate, "MMM d, yyyy")}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <ArrowLeftCircle className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-slate-600 font-medium">
                                              {format(endDate, "MMM d, yyyy")}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Optional: Booking reference */}
                                    {res.bookingRef && (
                                      <div className="mt-2 flex items-center gap-1">
                                        <Hash className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs text-slate-500">
                                          Ref: {res.bookingRef}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Hover action (optional) */}
                                  
                                </div>
                              );
                            })}
                          </div>

                          {/* Show more indicator if many bookings */}
                          {details.futureBookings.length > 3 && (
                            <div className="text-center pt-2">
                              <p className="text-xs text-slate-500">
                                Scroll to see all reservations
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    {/* //=== ROOM DETAILS SECTION === */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-2 pt-4 border-t">
                        Room Details
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Hotel className="h-4 w-4 text-slate-400" />
                          <span>{selectedRoomDetails.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Bed className="h-4 w-4 text-slate-400" />
                          <span>{selectedRoomDetails.bedType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mountain className="h-4 w-4 text-slate-400" />
                          <span>{selectedRoomDetails.view}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="font-medium">
                            Rs {selectedRoomDetails.rate.toLocaleString()} /
                            night
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="bg-slate-50 p-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRoomDetails(null)}
                      className="bg-white"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
