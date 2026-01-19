import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import PaymentModal from "@/components/modals/PaymentModal";

import {
  ArrowLeft,
  Calendar,
  User,
  Menu,
  CheckCircle,
  Users,
  Ticket,
  Archive,
  FileText,
  PlusCircle,
  RefreshCcw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useToast } from "@/hooks/use-toast";
import { useReservationContext } from "@/contexts/ReservationContext";
import { useGuestContext } from "@/contexts/GuestContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomContext } from "@/contexts/RoomContext";

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

interface Reservation {
  _id: string;
  fullName: string;
  address: string;
  email?: string;
  phone: string;
  cnic: string;
  room: string | PopulatedRoom;
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
  // ✅ ADD NEW FIELDS:
  // 👇 ADD THIS NEW BLOCK 👇
  financials?: {
    nights: number;
    roomRate: number;
    estimatedTotal: number;
    totalAdvance: number;
    estimatedBalance: number;
  };
  // 👆 ------------------ 👆

  adults: number;
  infants: number;
  expectedArrivalTime?: string;
  specialRequest?: string;
  paymentMethod?: "Cash" | "Card" | "Online" | "PayAtHotel";
  promoCode?: string;
  source?: "CRM" | "Website" | "API";
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

const formatInTimeZone = (date: string | Date, fmt: string, tz: string = "Asia/Karachi") => {
  return format(toZonedTime(date, tz), fmt);
};

const ReservationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { getReservationById, loading, error } = useReservationContext();
  const { rooms: allRooms } = useRoomContext();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>("");
  const [isChangingRoom, setIsChangingRoom] = useState(false);

  // Auto-open Change Room dialog if action=changeRoom in URL
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'changeRoom' && !isLoading && reservation) {
      setIsChangeRoomOpen(true);
    }
  }, [searchParams, isLoading, reservation]);

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
    if (isPopulatedRoom(reservation.room)) {
      return reservation.room;
    }
    // Simple fallback: find the room in the master list from RoomContext
    if (allRooms && allRooms.length) {
      return (
        allRooms.find((room) => room.roomNumber === reservation.roomNumber) ||
        null
      );
    }
    return null;
  }, [reservation, allRooms]);

  // Calculate duration and total price
  const reservationDetails = useMemo(() => {
    if (!reservation) return null;

    const startDate = parseISO(reservation.startAt);
    const endDate = parseISO(reservation.endAt);
    const days = Math.max(1, differenceInCalendarDays(endDate, startDate));

    let totalPrice = 0;
    let roomRate = 0;

    if (roomDetails) {
      roomRate = roomDetails.rate || 0;
      totalPrice = roomRate * days;
    }

    return {
      days,
      roomRate,
      totalPrice,
      formattedStartDate: formatInTimeZone(reservation.startAt, "PPP"),
      formattedEndDate: formatInTimeZone(reservation.endAt, "PPP"),
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

  const getRoomCategory = () => {
    if (!roomDetails) return "—";
    return roomDetails.category || "—";
  };

  const handlePaymentSuccess = () => {
    if (id) getReservationById(id); // Re-fetch to update the numbers immediately
    toast({
      title: "Success",
      description: "Transaction recorded successfully",
    });
  };

  // Available rooms for change (same dates, different room)
  const availableRoomsForChange = useMemo(() => {
    if (!reservation || !allRooms) return [];
    const currentRoomId = isPopulatedRoom(reservation.room)
      ? reservation.room._id
      : reservation.room;
    return allRooms.filter(room =>
      room._id !== currentRoomId &&
      room.status !== 'maintenance'
    );
  }, [reservation, allRooms]);

  const handleChangeRoom = async () => {
    if (!selectedNewRoomId || !reservation) return;

    setIsChangingRoom(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/reservation/${reservation._id}/change-room`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newRoomId: selectedNewRoomId })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change room');
      }

      toast({
        title: "Room Changed",
        description: data.message || `Successfully moved to new room`,
      });

      // Refresh reservation data
      if (id) {
        const updated = await getReservationById(id);
        setReservation(updated);
      }

      setIsChangeRoomOpen(false);
      setSelectedNewRoomId("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to change room",
        variant: "destructive",
      });
    } finally {
      setIsChangingRoom(false);
    }
  };

  return (
    <div className="h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 w-full h-full overflow-y-auto flex flex-col">

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
                        {formatInTimeZone(reservation.createdAt, "PPP p")}
                      </CardDescription>
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(reservation.status)}
                    </div>
                    <Button
                      className="bg-[#0b3b91] hover:bg-[#0a357f] text-white"
                      onClick={() => {
                        const roomNum =
                          typeof reservation.room === "object"
                            ? reservation.room.roomNumber
                            : reservation.roomNumber;

                        // Correctly format the dates for the guest check-in form
                        const checkInDate = formatInTimeZone(new Date(), "yyyy-MM-dd"); // Today in Hotel Time
                        const checkOutDate = formatInTimeZone(
                          reservation.endAt,
                          "yyyy-MM-dd"
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
                              checkInDate: checkInDate, // <-- SENDS CORRECT DATA
                              checkOutDate: checkOutDate, // <-- SENDS CORRECT DATA
                              reservationId: reservation._id, // Pass the ID for linking
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
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                      onClick={() => setIsChangeRoomOpen(true)}
                      disabled={
                        reservation.status === "checked-in" ||
                        reservation.status === "checked-out" ||
                        reservation.status === "cancelled"
                      }
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Change Room
                    </Button>
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

                  {/* ✅ NEW: Occupancy Details */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Users className="mr-2 h-5 w-5 text-amber-500" />
                      Occupancy Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Adults</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">
                            {reservation.adults || 1}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {reservation.adults === 1 ? "Guest" : "Guests"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Infants</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">
                            {reservation.infants || 0}
                          </p>
                          {reservation.infants > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {reservation.infants === 1 ? "Infant" : "Infants"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {reservation.expectedArrivalTime && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Expected Arrival Time
                          </p>
                          <p className="font-medium">
                            {reservation.expectedArrivalTime}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Booking Source</p>
                        <Badge
                          variant="outline"
                          className={`font-normal ${reservation.source === "Website"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : reservation.source === "API"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                        >
                          {reservation.source || "CRM"}
                        </Badge>
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
                          {reservationDetails?.days}{" "}
                          {reservationDetails?.days === 1 ? "night" : "nights"}
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

                  {/* ✅ NEW: Payment & Special Requests (Conditional) */}
                  {(reservation.paymentMethod ||
                    reservation.promoCode ||
                    reservation.specialRequest) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-medium mb-3 flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-amber-500" />
                            Additional Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reservation.paymentMethod && (
                              <div>
                                <p className="text-sm text-gray-500">
                                  Payment Method
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className={`font-medium ${reservation.paymentMethod === "Cash"
                                      ? "bg-green-100 text-green-800"
                                      : reservation.paymentMethod === "Card"
                                        ? "bg-blue-100 text-blue-800"
                                        : reservation.paymentMethod === "Online"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                  >
                                    {reservation.paymentMethod}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            {reservation.promoCode && (
                              <div>
                                <p className="text-sm text-gray-500">
                                  Promo Code Applied
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className="font-mono bg-emerald-100 text-emerald-800 border-emerald-200"
                                  >
                                    {reservation.promoCode}
                                  </Badge>
                                  <Ticket className="h-4 w-4 text-emerald-600" />
                                </div>
                              </div>
                            )}
                            {reservation.specialRequest && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500 mb-2">
                                  Special Requests
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {reservation.specialRequest}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                </CardContent>
              </Card>
              {/* === 👇 PASTE THIS FINANCIAL CARD HERE 👇 === */}
              <div className="space-y-6">
                {reservation.financials && (
                  <Card className="shadow-md border-0 bg-white">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-center gap-2">
                        {/* Using 'Archive' or 'Receipt' since they are already imported */}
                        <Archive className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg text-blue-900">
                          Financial Summary
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-blue-100 text-blue-700 border-blue-200 h-8 text-xs"
                          onClick={() => setIsPaymentModalOpen(true)}
                          disabled={reservation.status === "cancelled"}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Add / Refund
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* Calculation Row */}
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Rate Calculation</span>
                        <span>
                          {reservation.financials.nights} Night
                          {reservation.financials.nights > 1 ? "s" : ""} × Rs{" "}
                          {reservation.financials.roomRate.toLocaleString()}
                        </span>
                      </div>

                      {/* Total Estimated */}
                      <div className="flex justify-between font-medium text-slate-700">
                        <span>Estimated Total</span>
                        <span>
                          Rs{" "}
                          {reservation.financials.estimatedTotal.toLocaleString()}
                        </span>
                      </div>

                      <Separator />

                      {/* Advance Payment */}
                      <div className="bg-green-50 p-3 rounded-md flex justify-between items-center text-green-700 border border-green-100">
                        <span className="flex items-center text-sm font-medium">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Advance Paid
                        </span>
                        <span className="font-bold">
                          - Rs{" "}
                          {reservation.financials.totalAdvance.toLocaleString()}
                        </span>
                      </div>

                      {/* Balance Due */}
                      <div className="pt-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                            Payable on Arrival
                          </span>
                          <span
                            className={`text-2xl font-bold ${reservation.financials.estimatedBalance > 0
                              ? "text-slate-900"
                              : "text-green-600"
                              }`}
                          >
                            Rs{" "}
                            {reservation.financials.estimatedBalance.toLocaleString()}
                          </span>
                        </div>
                        {reservation.financials.estimatedBalance === 0 && (
                          <p className="text-xs text-green-600 mt-1 text-right font-medium">
                            Fully Paid via Advance ✅
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {reservation && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          context="reservation"
          contextId={reservation._id}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Change Room Dialog */}
      <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Room</DialogTitle>
            <DialogDescription>
              Move this reservation to a different room. The new room will be checked for availability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Room</Label>
              <div className="p-3 bg-slate-100 rounded-md text-sm">
                <span className="font-medium">
                  Room {isPopulatedRoom(reservation?.room)
                    ? reservation?.room.roomNumber
                    : reservation?.roomNumber}
                </span>
                {roomDetails && (
                  <span className="text-slate-500 ml-2">
                    ({roomDetails.category} - Rs {roomDetails.rate?.toLocaleString()}/night)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newRoom">Select New Room</Label>
              <Select
                value={selectedNewRoomId}
                onValueChange={setSelectedNewRoomId}
              >
                <SelectTrigger id="newRoom">
                  <SelectValue placeholder="Choose a room..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoomsForChange.map((room) => (
                    <SelectItem key={room._id} value={room._id}>
                      Room {room.roomNumber} - {room.category} (Rs {room.rate?.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeRoomOpen(false);
                setSelectedNewRoomId("");
              }}
              disabled={isChangingRoom}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRoom}
              disabled={!selectedNewRoomId || isChangingRoom}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isChangingRoom ? "Changing..." : "Change Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
