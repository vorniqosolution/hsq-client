// ReservationDetailsPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Bed,
  CheckCircle,
  Menu,
  X,
  Crown,
  Sparkles,
  Star,
  Settings,
  LogOut,
  Home,
  Users,
  Ticket,
  Percent,
  Archive,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useReservationContext } from "@/contexts/ReservationContext";
import { useGuestContext } from "@/contexts/GuestContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomContext } from "@/contexts/RoomContext";

// Define PopulatedRoom interface for room data
interface PopulatedRoom {
  _id: string;
  roomNumber: string;
  category?: string;
  type?: string;
  roomType?: string;
  rate?: number;
  price?: number;
  status: string;
  bedType?: string;
  view?: string;
  capacity?: number;
  amenities?: string[] | string;
  description?: string;
}

// Interface for reservation with potentially populated room
interface Reservation {
  _id: string;
  fullName: string;
  address: string;
  email?: string;
  phone: string;
  cnic: string;
  room: string | PopulatedRoom; // Can be either string ID or populated object
  roomNumber: string;
  startAt: string;
  endAt: string;
  status:
    | "pending"
    | "reserved"
    | "cancelled"
    | "confirmed"
    | "checked-in"
    | "checked-out";
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  createdBy?: any;
}

// Helper function to check if room is populated
const isPopulatedRoom = (room: any): room is PopulatedRoom => {
  return (
    typeof room === "object" && room !== null && room.roomNumber !== undefined
  );
};

const ReservationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    getReservationById,
    // updateReservationStatus, // ensure your context exports this; otherwise remove handleStatusUpdate entirely
    loading,
    error,
  } = useReservationContext();

  const { rooms } = useRoomContext();
  const { allRooms } = useGuestContext();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateStatusDialogOpen] = useState(false); // not used here, left for future
  const [newStatus] = useState<string>("");

  // Fetch reservation data
  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await getReservationById(id);
        setReservation(data);
      } catch (err) {
        console.error("Failed to fetch reservation details:", err);
        toast({
          title: "Error",
          description: "Failed to load reservation details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservationDetails();
  }, [id, getReservationById, toast]);

  // Get room details using multiple strategies
  const roomDetails = useMemo(() => {
    if (!reservation) return null;

    // First check if the room property is already populated
    if (isPopulatedRoom(reservation.room)) {
      return reservation.room;
    }

    // Try to find room in allRooms from GuestContext
    if (allRooms && allRooms.length) {
      const guestContextRoom = allRooms.find(
        (room) => room.roomNumber === reservation.roomNumber
      );
      if (guestContextRoom) return guestContextRoom;
    }

    // Fallback to RoomContext if not found
    if (rooms && rooms.length) {
      return (
        rooms.find((room) => room.roomNumber === reservation.roomNumber) || null
      );
    }

    return null;
  }, [reservation, allRooms, rooms]);

  // Calculate duration and total price
  const reservationDetails = useMemo(() => {
    if (!reservation) return null;

    const startDate = parseISO(reservation.startAt);
    const endDate = parseISO(reservation.endAt);
    const days = Math.max(1, differenceInCalendarDays(endDate, startDate));

    let totalPrice = 0;
    let roomRate = 0;

    if (roomDetails) {
      roomRate = roomDetails.rate || roomDetails.price || 0;
      totalPrice = roomRate * days;
    }

    return {
      days,
      roomRate,
      totalPrice,
      formattedStartDate: format(startDate, "PPP"),
      formattedEndDate: format(endDate, "PPP"),
    };
  }, [reservation, roomDetails]);

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Confirmed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case "checked-in":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Checked In
          </Badge>
        );
      case "checked-out":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Checked Out
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // Navigation items
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Guests", href: "/guests", icon: Users },
    { name: "Reservation", href: "/reservation", icon: Calendar },
    { name: "Rooms", href: "/rooms", icon: Bed },
    { name: "Discounts", href: "/Discount", icon: Ticket },
    { name: "GST & Tax", href: "/Gst", icon: Percent },
    { name: "Inventory", href: "/Inventory", icon: Archive },
    { name: "Invoices", href: "/Invoices", icon: FileText },
    { name: "Revenue", href: "/Revenue", icon: FileText },
  ];

  const systemNavItems = [
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const renderNavLinks = (items: typeof mainNavItems) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => setSidebarOpen(false)}
          className={`group flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 relative overflow-hidden ${
            active
              ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
          )}
          <Icon
            className={`mr-3 h-5 w-5 ${
              active
                ? "text-amber-400"
                : "text-slate-400 group-hover:text-slate-300"
            }`}
          />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && <Star className="ml-auto h-3 w-3 text-amber-400/60" />}
        </Link>
      );
    });

  const getRoomCategory = () => {
    if (!roomDetails) return "—";
    return (
      roomDetails.category || roomDetails.type || roomDetails.roomType || "—"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      {isAdmin && (
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Crown className="h-9 w-9 text-amber-400" />
                  <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-xl font-light tracking-wider text-white">
                    HSQ ADMIN
                  </h1>
                  <p className="text-xs text-amber-400/80 tracking-widest uppercase">
                    Management Panel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <nav className="mt-8 px-4 flex flex-col h-[calc(100%-80px)]">
              <div className="flex-grow">
                <div className="space-y-1">{renderNavLinks(mainNavItems)}</div>
              </div>
              <div className="flex-shrink-0">
                <div className="my-4 px-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                </div>
                <div className="space-y-1">
                  {renderNavLinks(systemNavItems)}
                  <button className="group flex items-center px-4 py-3 text-sm text-slate-300 rounded-lg hover:text-white hover:bg-slate-800/50 w-full transition-all duration-200">
                    <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300" />
                    <span className="font-light tracking-wide">Sign Out</span>
                  </button>
                </div>
              </div>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800/50 bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-medium text-slate-900">AM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-white truncate">
                    Admin Manager
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || "admin@hsqtowers.com"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 w-full h-screen overflow-y-auto flex flex-col">
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
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
        )}

        <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => navigate("/reservation")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reservations
            </Button>
            <h1 className="text-2xl font-bold">Reservation Details</h1>
          </div>

          {isLoading ? (
            <ReservationDetailsSkeleton />
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load reservation details. Please try again.
              </AlertDescription>
            </Alert>
          ) : !reservation ? (
            <Alert>
              <AlertDescription>
                Reservation not found. It may have been deleted.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-md border-0">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <CardTitle className="text-xl">
                        Reservation - {reservation.fullName} -{" "}
                        {isPopulatedRoom(reservation.room)
                          ? reservation.room.roomNumber
                          : reservation.roomNumber}
                      </CardTitle>
                      <CardDescription>
                        Created on{" "}
                        {format(new Date(reservation.createdAt), "PPP")}
                      </CardDescription>
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(reservation.status)}
                    </div>

                    {/* HYBRID navigate: URL param + state prefill */}
                    {/* <Button
                      variant="outline"
                      onClick={() => {
                        const roomNum =
                          typeof reservation.room === "object"
                            ? reservation.room.roomNumber
                            : reservation.roomNumber;
                        const days = Math.max(
                          1,
                          differenceInCalendarDays(
                            parseISO(reservation.endAt),
                            parseISO(reservation.startAt)
                          )
                        );

                        navigate(`/guests?reservation=${reservation._id}`, {
                          state: {
                            prefill: {
                              fullName: reservation.fullName,
                              address: reservation.address,
                              email: reservation.email || "",
                              phone: reservation.phone,
                              cnic: reservation.cnic,
                              roomNumber: roomNum, // <-- critical
                              stayDuration: Math.max(
                                1,
                                differenceInCalendarDays(
                                  parseISO(reservation.endAt),
                                  parseISO(reservation.startAt)
                                )
                              ),
                              paymentMethod: "cash",
                              applyDiscount: false,
                              additionaldiscount: 0,
                            },
                          },
                        });
                      }}
                      disabled={
                        reservation.status === "checked-in" ||
                        reservation.status === "checked-out"
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In Guest
                    </Button> */}

                    <Button
  className="bg-[#0b3b91] hover:bg-[#0a357f] text-white" // navy blue
  onClick={() => {
    const roomNum =
      typeof reservation.room === "object"
        ? reservation.room.roomNumber
        : reservation.roomNumber;

    navigate(`/guests?reservation=${reservation._id}`, {
      state: {
        prefill: {
          fullName: reservation.fullName,
          address: reservation.address,
          email: reservation.email || "",
          phone: reservation.phone,
          cnic: reservation.cnic,
          roomNumber: roomNum,
          stayDuration: Math.max(
            1,
            differenceInCalendarDays(
              parseISO(reservation.endAt),
              parseISO(reservation.startAt)
            )
          ),
          paymentMethod: "cash",
          applyDiscount: false,
          additionaldiscount: 0,
          reservationId: reservation._id, // <-- IMPORTANT
        },
      },
    });
  }}
  disabled={reservation.status === "checked-in" || reservation.status === "checked-out"}
>
  <CheckCircle className="mr-2 h-4 w-4" />
  Check In Guest
</Button>

                    {/* <Button
                      // variant="outline"  // remove this
                      variant="default"
                      className="bg-amber-500 hover:bg-amber-600 text-white disabled:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed"
                      onClick={() => {
                        const roomNum =
                          typeof reservation.room === "object"
                            ? reservation.room.roomNumber
                            : reservation.roomNumber;

                        const days = Math.max(
                          1,
                          differenceInCalendarDays(
                            parseISO(reservation.endAt),
                            parseISO(reservation.startAt)
                          )
                        );

                        navigate(`/guests?reservation=${reservation._id}`, {
                          state: {
                            prefill: {
                              fullName: reservation.fullName,
                              address: reservation.address,
                              email: reservation.email || "",
                              phone: reservation.phone,
                              cnic: reservation.cnic,
                              roomNumber: roomNum,
                              stayDuration: days,
                              paymentMethod: "cash",
                              applyDiscount: false,
                              additionaldiscount: 0,
                            },
                          },
                        });
                      }}
                      disabled={
                        reservation.status === "checked-in" ||
                        reservation.status === "checked-out"
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In Guest
                    </Button> */}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Guest Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <User className="mr-2 h-5 w-5 text-amber-500" />
                      Guest Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{reservation.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{reservation.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {reservation.email || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">CNIC</p>
                        <p className="font-medium">{reservation.cnic}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{reservation.address}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stay Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-amber-500" />
                      Stay Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Room Number</p>
                        <p className="font-medium">
                          Room{" "}
                          {isPopulatedRoom(reservation.room)
                            ? reservation.room.roomNumber
                            : reservation.roomNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Room Type</p>
                        <p className="font-medium">{getRoomCategory()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-in Date</p>
                        <p className="font-medium">
                          {reservationDetails?.formattedStartDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-out Date</p>
                        <p className="font-medium">
                          {reservationDetails?.formattedEndDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">
                          {reservationDetails?.days} nights
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Daily Rate</p>
                        <p className="font-medium">
                          {reservationDetails?.roomRate
                            ? `Rs. ${reservationDetails.roomRate.toLocaleString()}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReservationDetailsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2 shadow-md border-0">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-36 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ReservationDetailsPage;
