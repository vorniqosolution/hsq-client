import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatePicker from "react-datepicker"; // <-- ADD THIS LINE
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Trash2,
  Menu,
  Bed,
  Calendar,
  Crown,
  CheckCircle2,
  CalendarDays,
  Phone,
  User,
  MessageSquare,
  CheckCircle,
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
import { toZonedTime } from "date-fns-tz";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomContext, Room } from "@/contexts/RoomContext";
import {
  useReservationContext,
  CreateReservationInput,
} from "@/contexts/ReservationContext";
import Sidebar from "@/components/Sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
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

  financials?: {
    nights: number;
    roomRate: number;
    estimatedTotal: number;
    totalAdvance: number;
    estimatedBalance: number;
  };

  // ✅ ADD THESE NEW FIELDS:
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
  adults: 1,
  infants: 0,
  arrivalTime: "",
  specialRequest: "",
  paymentMethod: undefined,
  promoCode: "",
  advanceAmount: 0,
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
    hardDeleteReservation,
    dailyActivityReport,
    fetchDailyActivityReport,
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
  const [formErrors, setFormErrors] = useState({ phone: "", cnic: "" });
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);
  const [reservationToHardDelete, setReservationToHardDelete] =
    useState<Reservation | null>(null); // <-- Add
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "report">("list");
  const [reportDate, setReportDate] = useState(new Date());
  const hasLoadedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const formatDateToYYYYMMDD = (date: Date) =>
        format(date, "yyyy-MM-dd");

      setIsInitialLoad(true);
      if (viewMode === "report") {
        const dateString = formatDateToYYYYMMDD(reportDate);
        await fetchDailyActivityReport(dateString);
      } else {
        if (!hasLoadedRef.current) {
          await fetchReservations();
          hasLoadedRef.current = true;
        }
      }
      setIsInitialLoad(false);
    };

    loadData();
  }, [viewMode, reportDate, fetchDailyActivityReport, fetchReservations]);

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

  // ================ searchTerm =======================
  const filteredReservations = useMemo(() => {
    setCurrentPage(1);

    return reservations.filter((reservation) => {
      // Search Filter Logic
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        reservation.fullName?.toLowerCase().includes(searchLower) ||
        reservation.phone?.includes(searchTerm) ||
        reservation.roomNumber?.toLowerCase().includes(searchLower);

      // Status Filter Logic
      const status = getReservationStatus(reservation);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      // The date filtering logic has been correctly removed.
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter, getReservationStatus]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredReservations.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredReservations]);

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      // Create a copy of the current errors
      const newErrors = { ...formErrors };

      // Validate CNIC field as the user types
      if (name === "cnic") {
        if (value && !/^\d{13}$/.test(value)) {
          newErrors.cnic = "CNIC must be exactly 13 digits.";
        } else {
          newErrors.cnic = ""; // Clear error if valid
        }
      }

      // Validate Phone field as the user types
      if (name === "phone") {
        if (value && !/^\d{11}$/.test(value)) {
          newErrors.phone = "Phone must be exactly 11 digits.";
        } else {
          newErrors.phone = ""; // Clear error if valid
        }
      }

      setFormErrors(newErrors); // Update the error state

      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      // Your existing logic for fetching available rooms remains the same
      if (name === "checkin" || name === "checkout") {
        setFormData((prev) => ({ ...prev, [name]: value, roomNumber: "" }));
        const { checkin, checkout } = newFormData;
        if (checkin && checkout && new Date(checkout) > new Date(checkin)) {
          fetchAvailableRooms(checkin, checkout);
        }
      }
    },
    [formData, formErrors, fetchAvailableRooms]
  );

  // Add after line 344 in handleFormChange or create a new validation function
  const validateRoomCapacity = (room: Room) => {
    if (room.adults && formData.adults > room.adults) {
      toast({
        title: "Capacity Exceeded",
        description: `This room allows maximum ${room.adults} adults.`,
        variant: "destructive",
      });
      return false;
    }

    if (room.infants !== undefined && formData.infants > room.infants) {
      toast({
        title: "Capacity Exceeded",
        description: `This room allows maximum ${room.infants} infants.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

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
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Unknown error";

      if (errorMessage.toLowerCase().includes("capacity exceeded")) {
        toast({
          title: "⚠️ Room Capacity Exceeded",
          description: errorMessage,
          variant: "destructive",
          duration: 6000,
        });
      } else if (
        errorMessage.toLowerCase().includes("already has a reservation")
      ) {
        toast({
          title: "🚫 Room Already Booked",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      } else if (errorMessage.toLowerCase().includes("maintenance")) {
        toast({
          title: "🔧 Room Under Maintenance",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description:
            errorMessage || "Failed to create reservation. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleCreateReservation = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  //   try {
  //     await createReservation(formData);
  //     toast({
  //       title: "Success",
  //       description: "Reservation created successfully",
  //     });
  //     setIsCreateDialogOpen(false);
  //     setFormData(INITIAL_FORM_STATE);
  //   } catch (err) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to create reservation. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

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

  const handleHardDelete = async () => {
    if (!reservationToHardDelete) return;

    try {
      await hardDeleteReservation(reservationToHardDelete._id);
      toast({
        title: "Success",
        description: `Reservation for ${reservationToHardDelete.fullName} has been permanently deleted.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReservationToHardDelete(null); // Close the dialog
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
      <div ref={contentRef} style={{ willChange: "transform" }}>
        <div className="">{children}</div>
      </div>
    ),
    []
  );

  // This is the helper component that needs to be robust
  const ReportList = ({ data, type }: { data: any[]; type: string }) => {
    // THIS IS THE CORRECT, DEFENSIVE VERSION OF THE HELPER FUNCTION
    const getRelevantInfo = (item: any, reportType: string): string => {
      // We will check for the existence of each date field before using it
      switch (reportType) {
        case "arrivals":
          if (!item.startAt) return "No schedule info";
          return `Scheduled for ${format(new Date(item.startAt), "MMM d")}`;

        case "checkIns":
          // This is the critical fix. We check if item.checkInAt exists.
          if (!item.checkInAt) return "No check-in time";
          return `Checked in at ${format(new Date(item.checkInAt), "p")}`;

        case "checkOuts":
          if (!item.checkOutAt) return "No check-out time";
          return `Checked out at ${format(new Date(item.checkOutAt), "p")}`;

        case "newBookings":
          if (!item.createdAt) return "No creation time";
          return `Booked at ${format(new Date(item.createdAt), "p")}`;

        case "cancellations":
          if (!item.updatedAt) return "No cancellation time";
          return `Cancelled at ${format(new Date(item.updatedAt), "p")}`;

        default:
          return "";
      }
    };

    if (data.length === 0) {
      return (
        <p className="text-sm text-muted-foreground p-4 text-center">
          No activity in this category.
        </p>
      );
    }

    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {data.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
            >
              {/* Left side: Icon, Name, and Room */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    Room {item.room?.roomNumber || "N/A"}
                  </p>
                </div>
              </div>

              {/* Right side: Relevant Time and Optional View Button */}
              <div className="flex items-center gap-4">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {getRelevantInfo(item, type)}
                </p>
                {item.type === "reservation" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/reservation/${item._id}`)}
                    title="View reservation details"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

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

    if (viewMode === "report") {
      if (loading) return <ReservationListSkeleton />; // Reuse your nice skeleton loader
      if (!dailyActivityReport) {
        return (
          <div className="text-center text-gray-500 p-6">
            <p>Select a date to generate the report.</p>
          </div>
        );
      }

      return (
        <Tabs defaultValue="arrivals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <TabsTrigger value="arrivals">
              Arrivals ({dailyActivityReport.summary.arrivals})
            </TabsTrigger>
            <TabsTrigger value="checkIns">
              Check-Ins ({dailyActivityReport.summary.checkIns})
            </TabsTrigger>
            <TabsTrigger value="checkOuts">
              Check-Outs ({dailyActivityReport.summary.checkOuts})
            </TabsTrigger>
            <TabsTrigger value="newBookings">
              New Bookings ({dailyActivityReport.summary.newBookings})
            </TabsTrigger>
            <TabsTrigger value="cancellations">
              Cancellations ({dailyActivityReport.summary.cancellations})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrivals" className="mt-4">
            <ReportList
              data={dailyActivityReport.data.arrivals}
              type="arrivals"
            />
          </TabsContent>
          <TabsContent value="checkIns" className="mt-4">
            <ReportList
              data={dailyActivityReport.data.checkIns}
              type="checkIns"
            />
          </TabsContent>
          <TabsContent value="checkOuts" className="mt-4">
            <ReportList
              data={dailyActivityReport.data.checkOuts}
              type="checkOuts"
            />
          </TabsContent>
          <TabsContent value="newBookings" className="mt-4">
            <ReportList
              data={dailyActivityReport.data.newBookings}
              type="newBookings"
            />
          </TabsContent>
          <TabsContent value="cancellations" className="mt-4">
            <ReportList
              data={dailyActivityReport.data.cancellations}
              type="cancellations"
            />
          </TabsContent>
        </Tabs>
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

    return (
      <div className="space-y-2 ">
        {paginatedData.map((reservation) => (
          <ReservationCard
            key={reservation._id}
            reservation={reservation}
            allRooms={allRooms} // <-- NEW: Pass the master room list as a prop
            onDelete={() => setReservationToDelete(reservation)}
            onHardDelete={() => setReservationToHardDelete(reservation)}
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
    viewMode,
    dailyActivityReport, // New dependencies
    filteredReservations,
    paginatedData,
    allRooms, // Existing dependencies
    getReservationStatus,
    getStatusBadge,
    convertToCheckIn,
    viewReservationDetails,
  ]);

  const getPageNumbers = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

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
            {/* Column 1: View Mode Selector - Always visible */}
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="view-mode-select">
                Check reservation or calender
              </Label>
              <Select
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "list" | "report")}
              >
                <SelectTrigger id="view-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">All Reservations List</SelectItem>
                  <SelectItem value="report">Daily Reservations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === "list" ? (
              <>
                {/* Filter 2: Search (for 'list' mode) */}
                <div className="md:col-span-1 space-y-1.5">
                  <Label htmlFor="search-input">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search-input"
                      placeholder="Search by name, phone...."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Filter 3: Status (for 'list' mode) */}
                <div className="md:col-span-1 space-y-1.5">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue />
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
              </>
            ) : (
              // Date Picker (for 'report' mode)
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="report-date-picker">Report Date</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <DatePicker
                    id="report-date-picker"
                    selected={reportDate}
                    onChange={(date: Date) => setReportDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background"
                  />
                </div>
              </div>
            )}
          </div>

          <ContentContainer>{renderedContent}</ContentContainer>

          {/* {totalPages > 1 && (
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
          )} */}

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

                    {/* --- CHANGED SECTION START --- */}
                    {getPageNumbers(currentPage, totalPages).map(
                      (page, index) => (
                        <PaginationItem key={index}>
                          {page === "..." ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page as number);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      )
                    )}
                    {/* --- CHANGED SECTION END --- */}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                      id="cnic"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleFormChange}
                      placeholder="1234567890123"
                      disabled={isSubmitting}
                      required
                      maxLength={13} // Helps guide the user
                    />
                    {formErrors.cnic && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.cnic}
                      </p>
                    )}
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

                <div className="space-y-2">
                  <Label>Select Room</Label>
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
                      maxLength={11} // Helps guide the user
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.phone}
                      </p>
                    )}
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">Adults</Label>
                    <Input
                      id="adults"
                      name="adults"
                      type="number"
                      min="1"
                      value={formData.adults || 1}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="infants">Infants</Label>
                    <Input
                      id="infants"
                      name="infants"
                      type="number"
                      min="0"
                      value={formData.infants || 0}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Row 7: Arrival Time and Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrivalTime">Expected Arrival Time</Label>
                    <Input
                      id="arrivalTime"
                      name="arrivalTime"
                      type="time"
                      value={formData.arrivalTime || ""}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod || ""}
                      onValueChange={(v) =>
                        handleSelectChange("paymentMethod", v)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="PayAtHotel">Pay at Hotel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 8: Special Request */}
                <div className="space-y-2">
                  <Label htmlFor="specialRequest">
                    Special Requests (Optional)
                  </Label>
                  <textarea
                    id="specialRequest"
                    name="specialRequest"
                    value={formData.specialRequest || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialRequest: e.target.value,
                      }))
                    }
                    placeholder="Any special requests or notes..."
                    disabled={isSubmitting}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Row 9: Promo Code */}
                <div className="space-y-2">
                  <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                  <Input
                    id="promoCode"
                    name="promoCode"
                    value={formData.promoCode || ""}
                    onChange={handleFormChange}
                    placeholder="Enter promo code"
                    disabled={isSubmitting}
                  />
                </div>

                {/* 👇 NEW SECTION: ADVANCE PAYMENT 👇 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4 mb-4">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <Crown className="h-4 w-4 mr-2" />
                    Advance Payment (Optional)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="advanceAmount" className="text-blue-900">
                        Amount (Rs)
                      </Label>
                      <Input
                        id="advanceAmount"
                        name="advanceAmount"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.advanceAmount || ""}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="advancePaymentMethod"
                        className="text-blue-900"
                      >
                        Method
                      </Label>
                      <Select
                        value={formData.advancePaymentMethod || "Cash"}
                        onValueChange={(v) =>
                          handleSelectChange("advancePaymentMethod", v)
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* 👆 ---------------------------- 👆 */}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting ||
                    !formData.roomNumber ||
                    formErrors.phone !== "" ||
                    formErrors.cnic !== ""
                  }
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
          <AlertDialog
            open={!!reservationToHardDelete} // This dialog is controlled by our new state variable
            onOpenChange={(open) => !open && setReservationToHardDelete(null)} // Allows closing the dialog
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. It will{" "}
                  <span className="font-bold text-red-600">
                    PERMANENTLY DELETE
                  </span>{" "}
                  the reservation record for{" "}
                  <span className="font-semibold">
                    {reservationToHardDelete?.fullName}
                  </span>
                  . All associated data will be lost forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>{" "}
                {/* The safe "no" option */}
                <AlertDialogAction
                  onClick={handleHardDelete} // Calls the new handler function when the user confirms
                  className="bg-red-600 hover:bg-red-700" // Styled to look dangerous
                >
                  Confirm Permanent Deletion
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
  onHardDelete: () => void; // Prop for the new permanent delete action
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
    onHardDelete,
    getStatus,
    getStatusBadge,
  }: ReservationCardProps) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

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
                      {/* new line  */}
                      <CardDescription className="flex items-center gap-2 pt-1">
                        Reservation created on{" "}
                        {format(
                          toZonedTime(reservation.createdAt, "Asia/Karachi"),
                          "dd MMM yyyy, hh:mm a"
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {getStatusBadge(status)}
                      {reservation.financials && reservation.financials.totalAdvance > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Adv: Rs {reservation.financials.totalAdvance.toLocaleString()}
                          </Badge>
                      )}
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
                    {reservation.specialRequest && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-purple-100 rounded-full flex-shrink-0">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 mb-1">
                              Special Request
                            </p>
                            <p className="text-sm text-gray-600 bg-purple-50 rounded-lg p-3 border border-purple-100">
                              {reservation.specialRequest}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

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

                {/* This is the main container for all action buttons */}
                <div className="flex md:flex-col gap-2 w-full">
                  {/* CHECK IN BUTTON (No Change) */}
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

                  {/* VIEW BUTTON (No Change) */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewDetails}
                    className="w-full bg-white"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {(status === "reserved" || status === "upcoming") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDelete}
                      className="w-full hover:bg-red-50 text-gray-500 hover:text-red-600 justify-start md:justify-center"
                      title="Cancel this reservation"
                    >
                      <Trash2 className="h-4 w-4 md:mr-0" />
                      <span className="md:hidden ml-2">Cancel</span>
                    </Button>
                  )}
                  {isAdmin && status === "cancelled" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onHardDelete}
                      className="w-full"
                      title="Permanently delete this reservation"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </CardContent>
      </Card>
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
