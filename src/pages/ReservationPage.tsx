import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { format, isAfter, isBefore, parseISO } from "date-fns";

// Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomContext } from "@/contexts/RoomContext";
import { useGuestContext } from "@/contexts/GuestContext"; // Added GuestContext import
import {
  useReservationContext,
  CreateReservationInput,
} from "@/contexts/ReservationContext";

// --- Type definitions ---
// Define PopulatedRoom interface for room data
interface PopulatedRoom {
  _id: string;
  roomNumber: string;
  category: string;
  rate: number;
  status: string;
  bedType?: string;
  view?: string;
}

// Updated Reservation interface to handle populated room data
interface Reservation {
  _id: string;
  fullName: string;
  address: string;
  email: string;
  phone: string;
  cnic: string;
  room: string | PopulatedRoom; // Can be either string ID or populated object
  roomNumber: string;
  startAt: string;
  endAt: string;
  status: "reserved" | "cancelled" | "confirmed" | "checked-in" | "checked-out";
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  createdBy: string | {
    _id: string;
    name: string;
    email: string;
  };
}

// Helper function to check if room is populated
const isPopulatedRoom = (room: any): room is PopulatedRoom => {
  return typeof room === 'object' && room !== null && room.roomNumber !== undefined;
};

// --- Constants and Types ---
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

// --- Main Page Component ---
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

  const { rooms, fetchRooms } = useRoomContext();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateReservationInput>(INITIAL_FORM_STATE);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Refs for stabilizing renders and API calls
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching with stability improvements ---
  useEffect(() => {
    // Prevent duplicate API calls during renders
    if (hasLoadedRef.current && !loading) return;
    
    // Cancel any in-progress fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const loadData = async () => {
      try {
        setIsInitialLoad(true);
        // Use Promise.all to load data concurrently
        await Promise.all([
          fetchReservations(),
          fetchRooms()
        ]);
        hasLoadedRef.current = true;
      } catch (error) {
        // Only handle non-abort errors
        if (error.name !== 'AbortError') {
          console.error('Failed to load data:', error);
        }
      } finally {
        setIsInitialLoad(false);
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReservations, fetchRooms, loading]);

  // Manual refresh function - force refetch
  const handleManualRefresh = useCallback(() => {
    hasLoadedRef.current = false;
    setIsInitialLoad(true);
    fetchReservations();
  }, [fetchReservations]);

  // --- Status helpers ---
  const getReservationStatus = useCallback((reservation: Reservation) => {
    const now = new Date();
    const startDate = parseISO(reservation.startAt);
    const endDate = parseISO(reservation.endAt);

    if (reservation.status === "cancelled") return "cancelled";
    if (reservation.status === "confirmed") return "confirmed";
    if (reservation.status === "checked-in") return "active";
    if (isAfter(startDate, now)) return "upcoming";
    if (isBefore(endDate, now)) return "expired";
    return "reserved";
  }, []);

  // --- Memoized Filtering ---
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      // Apply search filter
      const matchesSearch =
        !searchTerm ||
        reservation.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.phone.includes(searchTerm) ||
        reservation.roomNumber.includes(searchTerm);

      // Apply status filter
      const status = getReservationStatus(reservation);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter, getReservationStatus]);

  // --- Event Handlers ---
  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
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

  const convertToCheckIn = useCallback((reservation: Reservation) => {
    // Navigate to the Guest Check-In page with query params
    navigate(`/guests?reservation=${reservation._id}`);
  }, [navigate]);
  
  const viewReservationDetails = useCallback((reservation: Reservation) => {
    // Navigate to the reservation details page
    navigate(`/reservation/${reservation._id}`);
  }, [navigate]);

  // --- Navigation Items ---
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

  // Helper function to render navigation links
  const renderNavLinks = (items: typeof mainNavItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => setSidebarOpen(false)}
          className={`
            group flex items-center px-4 py-3 text-sm rounded-lg
            transition-all duration-200 relative overflow-hidden
            ${
              active
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }
          `}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
          )}
          <Icon
            className={`
            mr-3 h-5 w-5 transition-all duration-200
            ${
              active
                ? "text-amber-400"
                : "text-slate-400 group-hover:text-slate-300"
            }
          `}
          />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && <Star className="ml-auto h-3 w-3 text-amber-400/60" />}
        </Link>
      );
    });
  };

  // --- Status Badge Helper ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Confirmed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case "active":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Active</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Expired</Badge>;
      default:
        return null;
    }
  };

  // --- Content container with fixed height ---
  const ContentContainer = useCallback(({ children }: { children: React.ReactNode }) => (
    <div 
      ref={contentRef}
      className="relative h-[600px] overflow-y-auto overflow-x-hidden"
      style={{ willChange: 'transform' }} // Optimize for GPU acceleration
    >
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  ), []);

  // --- Memoized content to prevent re-renders ---
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

    return (
      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <ReservationCard
            key={reservation._id}
            reservation={reservation}
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
    getStatusBadge
  ]);

  // Memoized sidebar to prevent re-renders
  const Sidebar = useMemo(() => {
    if (!isAdmin) return null;
    
    return (
      <>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
            shadow-2xl transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Logo Section */}
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

          {/* Navigation */}
          <nav className="mt-8 px-4 flex flex-col h-[calc(100%-80px)]">
            <div className="flex-grow">
              <div className="space-y-1">{renderNavLinks(mainNavItems)}</div>
            </div>

            {/* Bottom Section */}
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

          {/* User Profile */}
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
    );
  }, [isAdmin, sidebarOpen, user?.email, renderNavLinks, mainNavItems, systemNavItems]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      {Sidebar}

      {/* Main content */}
      <div className="flex-1 w-full h-screen overflow-y-auto flex flex-col">
        {/* Mobile header - only for admin */}
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

        {/* Main content area */}
        <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
          {/* Page Header - fixed height */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 h-[60px]">
            <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>

            <div className="flex gap-2 ml-auto">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                <Calendar className="mr-2 h-4 w-4" />
                New Reservation
              </Button>
            </div>
          </div>

          {/* Toolbar - fixed height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 h-[80px]">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search by name, phone, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:col-span-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:col-span-1">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setStatusFilter("all")}
                variant="outline"
                className="w-full sm:col-span-1"
                disabled={statusFilter === "all"}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="w-full sm:col-span-1"
              >
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Content Area - stable container */}
          <ContentContainer>{renderedContent}</ContentContainer>

          {/* Create Reservation Dialog */}
          <Dialog 
            open={isCreateDialogOpen} 
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>New Reservation</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateReservation} className="space-y-4 pt-4">
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
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter(r => r.status === "available").map((r) => (
                          <SelectItem key={r._id} value={r.roomNumber}>
                            Room {r.roomNumber} — {r.category}
                          </SelectItem>
                        ))}
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
                      min={formData.checkin || new Date().toISOString().split("T")[0]}
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

// --- Sub-components ---
interface ReservationCardProps {
  reservation: Reservation;
  onDelete: () => void;
  onCheckIn: () => void;
  onViewDetails: () => void;
  getStatus: (reservation: Reservation) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

// Enhanced ReservationCard with room details
const ReservationCard = React.memo(({
  reservation,
  onDelete,
  onCheckIn,
  onViewDetails,
  getStatus,
  getStatusBadge,
}: ReservationCardProps) => {
  const status = getStatus(reservation);
  const isCheckInEnabled = status === "upcoming" || status === "active";
  
  // Get room details from GuestContext
  const { rooms } = useGuestContext();
  
  // Find the room details using multiple strategies
  const roomDetails = useMemo(() => {
    // First check if room is already populated
    if (isPopulatedRoom(reservation.room)) {
      return reservation.room;
    }
    
    // Fallback to finding room in allRooms array
    if (rooms && rooms.length) {
      return rooms.find((room) => room.roomNumber === reservation.roomNumber);
    }
    
    return null;
  }, [reservation.room, reservation.roomNumber, rooms]);

  // Get the room number safely
  const getRoomNumber = () => {
    if (isPopulatedRoom(reservation.room)) {
      return reservation.room.roomNumber;
    }
    return reservation.roomNumber;
  };

  return (
    <Card className="hover:shadow transition-shadow duration-300 h-[140px]">
      <CardContent className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 p-4 h-full">
        <div className="md:col-span-2 flex flex-col">
          <p className="font-bold text-lg truncate">{reservation.fullName}</p>
          <p className="text-sm text-gray-500 truncate">{reservation.phone}</p>
          {reservation.email && (
            <p className="text-sm text-gray-500 truncate">{reservation.email}</p>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center">
            <Bed className="h-4 w-4 text-amber-500 mr-1" />
            <p className="text-sm font-medium">Room {getRoomNumber()}</p>
          </div>
          
          {roomDetails && (
            <div className="mt-1">
              <p className="text-xs text-gray-600">
                <span className="font-medium">{roomDetails.category}</span>
                {roomDetails.bedType && (
                  <span className="ml-1">• {roomDetails.bedType}</span>
                )}
              </p>
              <p className="text-xs text-amber-600">
                Rs. {roomDetails.rate.toLocaleString()}/night
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {format(new Date(reservation.startAt), "MMM d, yyyy")} - {format(new Date(reservation.endAt), "MMM d, yyyy")}
          </p>
        </div>
        
        <div className="flex justify-start md:justify-center">
          {getStatusBadge(status)}
        </div>
        
        <div className="flex justify-start md:justify-end items-center gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" /> Details
          </Button>
          {isCheckInEnabled && (
            <Button className="bg-blue-900 hover:bg-blue-900 text-white" variant="outline" size="sm" onClick={onCheckIn}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Check In
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Advanced equality check to prevent unnecessary re-renders
  return (
    prevProps.reservation._id === nextProps.reservation._id &&
    prevProps.getStatus(prevProps.reservation) === nextProps.getStatus(nextProps.reservation)
  );
});

// Skeleton loader with fixed height matching the new card height
const ReservationListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="h-[140px]">
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