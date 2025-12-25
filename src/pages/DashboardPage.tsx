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
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { isToday, isFuture, parseISO, addDays, format, differenceInDays } from "date-fns";
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

  const guestCheckedInNow = guests.find(
    (g) => g.room && g.room._id === room._id && g.status === "checked-in" // ✅ Check room exists
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
      if (!r.room) return false;
      const roomId = typeof r.room === "object" ? r.room._id : r.room;

      return (
        roomId === room._id &&
        r.status !== "cancelled" &&
        r.status !== "checked-out" &&
        isFuture(parseISO(r.startAt))
      );
    })
    .sort(
      (a: { startAt: string }, b: { startAt: string }) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
    );

  if (guestCheckedInNow) {
    return {
      state: "Occupied",
      details: {
        currentActivity: `Guest: ${guestCheckedInNow.fullName}`,
        currentGuestCheckout: guestCheckedInNow.checkOutAt,
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
        color: "bg-purple-200 text-purple-800 border-purple-100",
        icon: Sun,
        label: "Arrival Today",
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
    deleteReservation,
  } = useReservationContext();
  const { toast } = useToast();
  const [reservationToDelete, setReservationToDelete] = useState<any>(null);

  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      await deleteReservation(reservationToDelete._id);
      toast({
        title: "Success",
        description: `Reservation for ${reservationToDelete.fullName} has been deleted.`,
      });

      // Update the selected room details to reflect the removal if it was in the list
      if (selectedRoomDetails && selectedRoomDetails.details && selectedRoomDetails.details.futureBookings) {
        const updatedBookings = selectedRoomDetails.details.futureBookings.filter(
          (r: any) => r._id !== reservationToDelete._id
        );
        setSelectedRoomDetails(prev => ({
          ...prev,
          details: {
            ...prev.details,
            futureBookings: updatedBookings
          }
        }));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReservationToDelete(null);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchGuests();
    fetchReservations();
  }, [fetchRooms, fetchGuests, fetchReservations]);

  const hotelStats = useMemo(() => {
    const totalRooms = rooms.length;
    if (totalRooms === 0) {
      return {
        totalRooms: 0,
        occupancyRate: 0,
        totalRevenue: 0,
        upcomingReservations: [],
        Available: 0,
        Occupied: 0,
        Arrival: 0,
        Reserved: 0,
        Maintenance: 0,
      };
    }

    // This logic now only counts the remaining 5 statuses
    const detailedRoomCounts = rooms.reduce(
      (counts, room) => {
        const { state } = getRoomState(room, guests, reservations);
        counts[state] = (counts[state] || 0) + 1;
        return counts;
      },
      {
        // Initialize only the states we are using
        Available: 0,
        Occupied: 0,
        Arrival: 0,
        Reserved: 0,
        Maintenance: 0,
      }
    );

    // Other calculations remain the same
    const totalRevenue = guests
      .filter((g) => g.status === "checked-in" && g.totalRent)
      .reduce((sum, guest) => sum + (guest.totalRent || 0), 0);

    const currentlyOccupiedCount = detailedRoomCounts.Occupied; // Simplified calculation
    const occupancyRate =
      totalRooms > 0
        ? Math.round((currentlyOccupiedCount / totalRooms) * 100)
        : 0;

    const sevenDaysFromNow = addDays(new Date(), 7);
    const upcomingReservations = reservations
      .filter((r) => {
        const startDate = parseISO(r.startAt);
        return (
          ["reserved", "confirmed"].includes(r.status) &&
          isFuture(startDate) &&
          startDate <= sevenDaysFromNow
        );
      })
      .sort(
        (a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
      );

    return {
      totalRooms,
      occupancyRate,
      totalRevenue,
      upcomingReservations,
      ...detailedRoomCounts,
    };
  }, [rooms, guests, reservations]);

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
                  <div className="space-y-4">
                    {/* Item 1: Available */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                      <span className="flex items-center">
                        <CheckCircle className="inline w-5 h-5 mr-2 text-emerald-600" />
                        Available
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.Available}
                      </span>
                    </div>

                    {/* Item 2: Occupied */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                      <span className="flex items-center">
                        <Key className="inline w-5 h-5 mr-2 text-amber-600" />
                        Occupied
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.Occupied}
                      </span>
                    </div>

                    {/* Item 3: Arrival Today */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-100">
                      <span className="flex items-center">
                        <Sun className="inline w-5 h-5 mr-2 text-blue-600" />
                        Arrival Today
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.Arrival}
                      </span>
                    </div>

                    {/* Item 6: Reserved (Future) */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sky-100 text-sky-800 border-sky-200">
                      <span className="flex items-center">
                        <Calendar className="inline w-5 h-5 mr-2 text-slate-600" />
                        Reserved (Future)
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.Reserved}
                      </span>
                    </div>

                    {/* Item 7: Maintenance */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <span className="flex items-center">
                        <Wrench className="inline w-5 h-5 mr-2 text-red-600" />
                        Maintenance
                      </span>
                      <span className="text-xl font-light">
                        {hotelStats.Maintenance}
                      </span>
                    </div>
                  </div>
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
                              </p>
                              <p className="font-semibold text-slate-900">
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

                          {/* Reservations & Free Slots list */}
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {(() => {
                              // 1. Calculate Timeline
                              const bookings = details.futureBookings;
                              const timeline: any[] = [];
                              // Sort bookings by start time
                              const sorted = [...bookings].sort(
                                (a, b) =>
                                  parseISO(a.startAt).getTime() -
                                  parseISO(b.startAt).getTime()
                              );

                              let lastEnd = details.currentGuestCheckout
                                ? parseISO(details.currentGuestCheckout)
                                : new Date(); // Start from guest checkout or "Now"

                              sorted.forEach((res) => {
                                const start = parseISO(res.startAt);
                                // Check if the gap is significant (>= 1 day)
                                const gap = differenceInDays(start, lastEnd);

                                // Only show 'Free' if the gap is at least 1 day
                                // and the start date is strictly after lastEnd
                                if (gap > 0 && start > lastEnd) {
                                  timeline.push({
                                    type: "free",
                                    start: lastEnd,
                                    end: start,
                                    days: gap,
                                  });
                                }

                                timeline.push({ type: "booking", data: res });
                                // Update lastEnd to be the end of this booking
                                const resEnd = parseISO(res.endAt);
                                if (resEnd > lastEnd) {
                                  lastEnd = resEnd;
                                }
                              });

                              // 2. Render Timeline
                              return timeline.map((item, index) => {
                                if (item.type === "free") {
                                  return (
                                    <div
                                      key={`free-${index}`}
                                      className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-emerald-800">
                                            Available
                                          </p>
                                          <p className="text-xs text-emerald-600 font-medium">
                                            {format(item.start, "MMM d")} -{" "}
                                            {format(item.end, "MMM d")}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-bold text-emerald-700 block">
                                          {item.days} {item.days === 1 ? "Night" : "Nights"}
                                        </span>
                                        <span className="text-[10px] text-emerald-600 uppercase tracking-wider">
                                          Free
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }

                                // Render Booking Card (Original Logic)
                                const res = item.data;
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
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-500" />

                                    <div className="p-4 pl-5">
                                      <div className="flex items-start justify-between gap-4">
                                        {/* Guest info */}
                                        <div className="flex items-start gap-3 flex-1">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold text-blue-700">
                                              {res.fullName
                                                .split(" ")
                                                .map((n: string) => n[0])
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
                                                  ? `Arrives in ${daysUntilArrival} ${daysUntilArrival === 1
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
                                          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                                            {nights}{" "}
                                            {nights === 1 ? "night" : "nights"}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setReservationToDelete(res);
                                            }}
                                            title="Cancel Reservation"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Date range */}
                                      <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                              <ArrowRightCircle className="h-3.5 w-3.5 text-blue-500" />
                                              <span className="text-slate-600 font-medium">
                                                {format(startDate, "MMM d")}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <ArrowLeftCircle className="h-3.5 w-3.5 text-slate-400" />
                                              <span className="text-slate-600 font-medium">
                                                {format(endDate, "MMM d")}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
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

      <AlertDialog open={!!reservationToDelete} onOpenChange={(open) => !open && setReservationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will delete the reservation for{" "}
              <span className="font-semibold">{reservationToDelete?.fullName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReservation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DashboardPage;
