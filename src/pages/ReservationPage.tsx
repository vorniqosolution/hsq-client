import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import DatePicker from "react-datepicker"; // <-- ADD THIS LINE
import "react-datepicker/dist/react-datepicker.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Trash2,
  UserPlus,
  X,
  Menu,
  Users,
  Bed,
  Calendar,
  Settings,
  LogOut,
  Home,
  Crown,
  Star,
  Sparkles,
  Archive,
  FileText,
  Ticket,
  Percent,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Filter,
  CalendarDays,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  format,
  formatDistanceStrict,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomContext, Room } from "@/contexts/RoomContext";
import { useGuestContext } from "@/contexts/GuestContext";
import {
  useReservationContext,
  CreateReservationInput,
} from "@/contexts/ReservationContext";
import Sidebar from "@/components/Sidebar";
import { isWithinInterval } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";

interface PopulatedRoom {
  _id: string;
  roomNumber: string;
  category: string;
  rate: number;
  status: string;
  bedType?: string;
  view?: string;
}

interface Reservation {
  _id: string;
  fullName: string;
  address: string;
  email: string;
  phone: string;
  cnic: string;
  room: string | PopulatedRoom;
  roomNumber: string;
  startAt: string;
  endAt: string;
  status: "reserved" | "cancelled" | "checked-in" | "checked-out";
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  createdBy:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
}

const isPopulatedRoom = (room: any): room is PopulatedRoom => {
  return (
    typeof room === "object" && room !== null && room.roomNumber !== undefined
  );
};

const INITIAL_FORM_STATE: CreateReservationInput = {
  fullName: "",
  address: "",
  phone: "",
  cnic: "",
  email: "",
  roomNumber: "",
  checkin: "",
  checkout: "",
};

const ReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    reservations,
    loading,
    error,
    fetchReservations,
    createReservation,
    deleteReservation,
  } = useReservationContext();

  const {
    rooms: allRooms,
    availableRooms,
    fetchAvailableRooms,
  } = useRoomContext();

  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] =
    useState<CreateReservationInput>(INITIAL_FORM_STATE);
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasLoadedRef.current && !loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const loadData = async () => {
      try {
        setIsInitialLoad(true);
        await fetchReservations();
        hasLoadedRef.current = true;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load data:", error);
        }
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReservations, loading]);

  // const handleManualRefresh = useCallback(() => {
  //   hasLoadedRef.current = false;
  //   setIsInitialLoad(true);
  //   fetchReservations();
  // }, [fetchReservations]);

  const getReservationStatus = useCallback((reservation: Reservation) => {
    if (reservation.status === "checked-out") return "checked-out";
    if (reservation.status === "cancelled") return "cancelled";

    if (reservation.status === "checked-in") return "active";

    const now = new Date();
    const startDate = parseISO(reservation.startAt);
    const endDate = parseISO(reservation.endAt);

    if (isBefore(endDate, now)) {
      return "expired";
    }

    if (isAfter(startDate, now)) {
      return "upcoming";
    }
    return "reserved";
  }, []);

  const filteredReservations = useMemo(() => {
    setCurrentPage(1); // Reset to page 1 on any filter change

    return reservations.filter((reservation) => {
      // --- Search Filter Logic (no change) ---
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        reservation.fullName?.toLowerCase().includes(searchLower) ||
        reservation.phone?.includes(searchTerm) ||
        reservation.roomNumber?.toLowerCase().includes(searchLower);

      // --- Status Filter Logic (no change) ---
      const status = getReservationStatus(reservation);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      // --- NEW: Date Filter Logic ---
      const matchesDate =
        !dateFilter ||
        (() => {
          // Use UTC dates for consistent filtering across timezones, matching the backend
          const dateStr = dateFilter.toISOString().split("T")[0];
          const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
          const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

          // Parse reservation dates from strings into Date objects
          const startAt = parseISO(reservation.startAt);
          const endAt = parseISO(reservation.endAt);
          const createdAt = parseISO(reservation.createdAt);
          const updatedAt = parseISO(reservation.updatedAt);

          // Check if any of the date conditions are met
          const stayOverlaps = startAt <= dayEnd && endAt >= dayStart;
          const createdOnDate = createdAt >= dayStart && createdAt <= dayEnd;
          const updatedOnDate = updatedAt >= dayStart && updatedAt <= dayEnd;

          return stayOverlaps || createdOnDate || updatedOnDate;
        })();

      // Return true only if all active filters match
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    reservations,
    searchTerm,
    statusFilter,
    dateFilter,
    getReservationStatus,
  ]); // <-- ADD dateFilter to the dependency array

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredReservations.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredReservations]);

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      // If both dates are present and valid, fetch available rooms
      if (name === "checkin" || name === "checkout") {
        // Reset the room selection whenever a date changes
        setFormData((prev) => ({ ...prev, [name]: value, roomNumber: "" }));
        const { checkin, checkout } = newFormData;
        if (checkin && checkout && new Date(checkout) > new Date(checkin)) {
          fetchAvailableRooms(checkin, checkout);
        }
      }
    },
    [formData, fetchAvailableRooms]
  );

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createReservation(formData);
      toast({
        title: "Success",
        description: "Reservation created successfully",
      });
      setIsCreateDialogOpen(false);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      await deleteReservation(reservationToDelete._id);
      toast({
        title: "Success",
        description: `Reservation for ${reservationToDelete.fullName} has been deleted.`,
      });
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

  const convertToCheckIn = useCallback(
    (reservation: Reservation) => {
      navigate(`/guests?reservation=${reservation._id}`);
    },
    [navigate]
  );

  const viewReservationDetails = useCallback(
    (reservation: Reservation) => {
      navigate(`/reservation/${reservation._id}`);
    },
    [navigate]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked-out":
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-200">
            Checked Out
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200">
            Active
          </Badge>
        );
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
      case "reserved":
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200">
            Reserved
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Upcoming
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  const ContentContainer = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <div
        ref={contentRef}
        // className="h "
        style={{ willChange: "transform" }} // Optimize for GPU acceleration
      >
        <div className="">{children}</div>
      </div>
    ),
    []
  );

  const renderedContent = useMemo(() => {
    if (isInitialLoad || loading) {
      return <ReservationListSkeleton />;
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-red-500 p-6 rounded-lg">
            <p className="text-xl mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (filteredReservations.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-gray-500 p-6 rounded-lg">
            <p className="text-xl mb-2">No reservations found</p>
            <p>Try adjusting your search or filters</p>
            {statusFilter !== "all" && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setStatusFilter("all")}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      );
    }
    // CARDS OF RESERVATIONS

    return (
      <div className="space-y-2 ">
        {paginatedData.map((reservation) => (
          <ReservationCard
            key={reservation._id}
            reservation={reservation}
            allRooms={allRooms} // <-- NEW: Pass the master room list as a prop
            onDelete={() => setReservationToDelete(reservation)}
            onCheckIn={() => convertToCheckIn(reservation)}
            onViewDetails={() => viewReservationDetails(reservation)}
            getStatus={getReservationStatus}
            getStatusBadge={getStatusBadge}
          />
        ))}
      </div>
    );
  }, [
    isInitialLoad,
    loading,
    error,
    filteredReservations,
    statusFilter,
    convertToCheckIn,
    viewReservationDetails,
    getReservationStatus,
    getStatusBadge,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex ">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
        {/* Mobile header - only for admin */}
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4 flex-shrink-0">
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
        )}

        {/* Main content area */}
        <div className="container mx-auto p-4 md:p-6 lg:p-8 ">
          {/* Page Header - fixed height */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>

            <div className="flex gap-2 ml-auto">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Calendar className="mr-2 h-4 w-4" />
                New Reservation
              </Button>
            </div>
          </div>

          {/* Toolbar - fixed height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            {/* Filter 1: Search */}
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="search-input">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-input"
                  placeholder="Search by name, phone, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Filter 2: Status */}
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 3: Date Picker */}
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="date-filter">Filter by Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <DatePicker
                  id="date-filter"
                  selected={dateFilter}
                  onChange={(date: Date | null) => setDateFilter(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Any Date" // Shows when no date is selected
                  isClearable // Adds a small 'x' button to clear the date
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>

          <ContentContainer>{renderedContent}</ContentContainer>

          {totalPages > 1 && (
            <Card className="mt-4">
              <CardContent className="p-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {[...Array(totalPages).keys()].map((num) => (
                      <PaginationItem key={num}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(num + 1);
                          }}
                          isActive={currentPage === num + 1}
                        >
                          {num + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          );
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}

          {/* Create Reservation Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>New Reservation</DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleCreateReservation}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Guest Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="123 Main St, Anytown"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+92 300 1234567"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleFormChange}
                      placeholder="guest@example.com"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                      id="cnic"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleFormChange}
                      placeholder="12345-6789012-3"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select
                      name="roomNumber"
                      value={formData.roomNumber}
                      onValueChange={(v) => handleSelectChange("roomNumber", v)}
                      disabled={
                        isSubmitting ||
                        !formData.checkin ||
                        !formData.checkout ||
                        loading
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loading
                              ? "Fetching rooms..."
                              : !formData.checkout
                              ? "Select dates to see rooms"
                              : "Select an available room"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.length > 0 ? (
                          availableRooms.map((r) => (
                            <SelectItem key={r._id} value={r.roomNumber}>
                              Room {r.roomNumber} — {r.category} — (Rs{r.rate}
                              /night)
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-center text-gray-500">
                            {formData.checkout
                              ? "No rooms available"
                              : "Select dates first"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkin">Check-In Date</Label>
                    <Input
                      id="checkin"
                      name="checkin"
                      type="date"
                      value={formData.checkin}
                      onChange={handleFormChange}
                      min={new Date().toISOString().split("T")[0]}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkout">Check-Out Date</Label>
                    <Input
                      id="checkout"
                      name="checkout"
                      type="date"
                      value={formData.checkout}
                      onChange={handleFormChange}
                      min={
                        formData.checkin ||
                        new Date().toISOString().split("T")[0]
                      }
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !formData.roomNumber}
                >
                  {isSubmitting ? "Processing..." : "Create Reservation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!reservationToDelete}
            onOpenChange={(open) => !open && setReservationToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  reservation for{" "}
                  <span className="font-semibold">
                    {reservationToDelete?.fullName}
                  </span>
                  .
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
        </div>
      </div>
    </div>
  );
};

interface ReservationCardProps {
  reservation: Reservation;
  allRooms: Room[];
  onDelete: () => void;
  onCheckIn: () => void;
  onViewDetails: () => void;
  getStatus: (reservation: Reservation) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const ReservationCard = React.memo(
  ({
    reservation,
    allRooms,
    onDelete,
    onCheckIn,
    onViewDetails,
    getStatus,
    getStatusBadge,
  }: ReservationCardProps) => {
    const status = getStatus(reservation);
    const isCheckInEnabled = status === "reserved" || status === "upcoming";

    const roomDetails = useMemo(() => {
      if (isPopulatedRoom(reservation.room)) {
        return reservation.room;
      }
      if (allRooms && allRooms.length) {
        return allRooms.find(
          (room) => room.roomNumber === reservation.roomNumber
        );
      }
      return null;
    }, [reservation.room, reservation.roomNumber, allRooms]);

    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-gray-100">
        <CardContent className="p-0">
          <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Main Content Section (Guest & Booking Details) */}
              <div className="flex-1">
                {/* Card Header with Guest Info */}
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl tracking-tight">
                        {reservation.fullName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 pt-1">
                        <Phone className="h-3.5 w-3.5" />
                        {reservation.phone}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </CardHeader>

                {/* Card Content with Room & Date Details */}
                <CardContent className="pt-0">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Room Info */}
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-amber-100 rounded-full">
                          <Bed className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Room{" "}
                            {isPopulatedRoom(reservation.room)
                              ? reservation.room.roomNumber
                              : reservation.roomNumber}
                          </p>
                          {roomDetails && (
                            <>
                              <p className="text-xs text-gray-500">
                                {roomDetails.category}
                              </p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                Rs. {roomDetails.rate.toLocaleString()}
                                <span className="text-xs font-normal text-gray-500">
                                  {" "}
                                  / night
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-blue-100 rounded-full">
                          <CalendarDays className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Stay Dates
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mt-1">
                            <div>
                              <span className="font-medium text-gray-700 block">
                                {format(
                                  new Date(reservation.startAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
                              <span className="uppercase tracking-wide text-[10px]">
                                Check-in
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 block">
                                {format(
                                  new Date(reservation.endAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
                              <span className="uppercase tracking-wide text-[10px]">
                                Check-out
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Vertical Actions Section for Medium Screens and Up */}
              <div className="flex md:flex-col items-center justify-between p-4 bg-gray-50/70 border-t md:border-t-0 md:border-l border-gray-200">
                <div className="text-center md:mb-4">
                  <Badge variant="outline">
                    {formatDistanceStrict(
                      new Date(reservation.endAt),
                      new Date(reservation.startAt)
                    )}{" "}
                    Stay
                  </Badge>
                </div>
                <div className="flex md:flex-col gap-2">
                  {isCheckInEnabled && (
                    <Button
                      size="sm"
                      onClick={onCheckIn}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Check In
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewDetails}
                    className="w-full bg-white"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="w-full hover:bg-red-50 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </CardContent>
      </Card>
    );
  },

  (prevProps, nextProps) => {
    return (
      prevProps.reservation._id === nextProps.reservation._id &&
      prevProps.getStatus(prevProps.reservation) ===
        nextProps.getStatus(nextProps.reservation)
    );
  }
);

const ReservationListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="min-h-screen">
        <CardContent className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 p-4 h-full">
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex justify-start md:justify-center">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex justify-start md:justify-end items-center gap-2">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default ReservationsPage;
