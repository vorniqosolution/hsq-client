import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Eye,
  Trash2,
  UserPlus,
  X,
  Menu,
  Users,
  Bed,
  DollarSign,
  Settings,
  LogOut,
  Home,
  Crown,
  Star,
  Sparkles,
  Archive,
  FileText,
  Ticket,
  BarChart3,
  Percent,
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
  DialogTrigger,
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
import { format } from "date-fns";

// Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import {
  useGuestContext,
  Guest,
  Room,
  CreateGuestInput,
} from "@/contexts/GuestContext";
import { useAuth } from "@/contexts/AuthContext"; // Import auth context
import { useReservationContext } from "../contexts/ReservationContext";
// import { format } from "path";

// --- Constants and Types ---
const ROOM_CATEGORIES = ["Standard", "Deluxe", "Executive", "Presidential"];

const INITIAL_FORM_STATE: CreateGuestInput = {
  fullName: "",
  address: "",
  phone: "",
  cnic: "",
  email: "",
  roomNumber: "",
  stayDuration: 1,
  paymentMethod: "cash",
  applyDiscount: false,
  additionaldiscount: 0,
};

// --- Main Page Component ---
const GuestsPage: React.FC = () => {
  const {
    guests,
    rooms,
    loading,
    error,
    fetchGuests,
    fetchGuestsByCategory,
    createGuest,
    deleteGuest,
  } = useGuestContext();

  const { user } = useAuth(); // Access the authenticated user
  const isAdmin = user?.role === "admin"; // Check if user is admin

  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [IsOpenReservationDialog, setIsOpenReservationDialog] =
    useState<boolean>(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const [ReservationFormData, setReservationFormData] =
    useState<ReservationFormData>({
      fullName: "",
      address: "",
      email: "",
      phoneNo: "",
      cnic: "",
      roomNumber: "",
      checkInDate: "",
      checkOutDate: "",
    });

  console.log("Reversation data", ReservationFormData);
  // console.log("Reservation date", ReservationFormData.checkInDate);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setReservationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", ReservationFormData);
    setIsOpenReservationDialog(false);
  };
  // --- Data Fetching ---
  useEffect(() => {
    // Initial data fetch
    fetchGuests();
  }, [fetchGuests]);

  // --- Memoized Filtering ---
  const filteredGuests = useMemo(() => {
    if (!searchTerm) return guests;

    const searchLower = searchTerm.toLowerCase();
    return guests.filter(
      (g) =>
        g.fullName.toLowerCase().includes(searchLower) ||
        g.phone.includes(searchTerm) ||
        g.room.roomNumber.includes(searchTerm)
    );
  }, [guests, searchTerm]);

  // --- Event Handlers (with useCallback) ---
  const handleApplyCategoryFilter = useCallback(() => {
    if (categoryFilter) {
      fetchGuestsByCategory(categoryFilter);
    }
  }, [categoryFilter, fetchGuestsByCategory]);

  const handleClearFilters = useCallback(() => {
    setCategoryFilter("");
    setSearchTerm("");
    fetchGuests();
  }, [fetchGuests]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!guestToDelete) return;

    // Check user role before allowing delete
    if (user.role === "receptionist") {
      toast({
        title: "Error",
        description: "Only Admin can delete a guest.",
        variant: "destructive",
      });
      return; // Prevent deletion
    }

    try {
      await deleteGuest(guestToDelete._id);
      toast({
        title: "Success",
        description: `Guest "${guestToDelete.fullName}" has been deleted.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGuestToDelete(null);
    }
  }, [guestToDelete, deleteGuest, toast, user.role]);

  const handleOpenCheckInDialog = useCallback(() => {
    setIsCheckInDialogOpen(true);
  }, []);
  // Handle open dialog
  // const OpenReservationDialog = () => {
  //   setIsOpenReservationDialog(true);
  // };

  const handleGuestDelete = useCallback((guest: Guest) => {
    setGuestToDelete(guest);
  }, []);

  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Guests", href: "/guests", icon: Users },
    { name: "Rooms", href: "/rooms", icon: Bed },
    { name: "Discounts", href: "/Discount", icon: Ticket },
    { name: "GST & Tax", href: "/Gst", icon: Percent },
    { name: "Inventory", href: "/Inventory", icon: Archive },
    { name: "Invoices", href: "/Invoices", icon: FileText },
    { name: "Revenue", href: "/Revenue", icon: FileText },
  ];

  // const reportNavItems = [{ name: 'Reports', href: '/reports', icon: BarChart3 }];
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

  // --- Render Logic ---
  // This ContentContainer ensures stable layout height
  const ContentContainer: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <div className="relative min-h-[400px]">{children}</div>;

  // Content renderer with stable height
  const renderContent = () => {
    if (loading) {
      return <GuestListSkeleton />;
    }

    if (error) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center text-red-500 p-6 rounded-lg">
            <p className="text-xl mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (filteredGuests.length === 0) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center text-gray-500 p-6 rounded-lg">
            <p className="text-xl mb-2">No guests found</p>
            <p>Try adjusting your search or filters</p>
            {categoryFilter && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleClearFilters}
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
        {filteredGuests.map((guest) => (
          <GuestCard
            key={guest._id}
            guest={guest}
            onDelete={() => handleGuestDelete(guest)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for admin users only */}
      {isAdmin && (
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
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

                {/* Reports Section */}
                {/* <div className="mt-6">
                    <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis</p>
                    <div className="space-y-1">
                        {renderNavLinks(reportNavItems)}
                    </div>
                </div> */}
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
          </div>
        </>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
        {/* Mobile header - only for admin */}
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4">
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

        {/* Main content - Your existing guest page */}
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Guests</h1>

            <div className="flex gap-2 ml-auto">
              <Button
                onClick={() => setIsOpenReservationDialog(true)}
                className="bg-blue-800"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Reservation Guest
              </Button>

              <Button onClick={handleOpenCheckInDialog}>
                <UserPlus className="mr-2 h-4 w-4" />
                Check In Guest
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:col-span-1">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleApplyCategoryFilter}
                className="w-full sm:col-span-1"
                disabled={!categoryFilter}
              >
                Filter
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full sm:col-span-1"
                disabled={!categoryFilter && !searchTerm}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Content Area - Fixed height container prevents layout jumps */}
          <ContentContainer>{renderContent()}</ContentContainer>

          {/* Check-in Dialog */}
          <CheckInFormDialog
            isOpen={isCheckInDialogOpen}
            setIsOpen={setIsCheckInDialogOpen}
            rooms={rooms}
            createGuest={createGuest}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!guestToDelete}
            onOpenChange={(open) => !open && setGuestToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  guest record for{" "}
                  <span className="font-semibold">
                    {guestToDelete?.fullName}
                  </span>
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {/* dialog of reservation */}
      {IsOpenReservationDialog && (
        <Dialog>
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
              <button
                type="button"
                onClick={() => setIsOpenReservationDialog(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black"
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4">Reservation Guest</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={ReservationFormData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={ReservationFormData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={ReservationFormData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNo">Phone Number</Label>
                  <Input
                    id="phoneNo"
                    name="phoneNo"
                    value={ReservationFormData.phoneNo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input
                    id="cnic"
                    name="cnic"
                    value={ReservationFormData.cnic}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    name="roomNumber"
                    value={ReservationFormData.roomNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Check-In Date</Label>
                  <Input
                    id="checkInDate"
                    name="checkInDate"
                    type="date"
                    value={ReservationFormData.checkInDate}
                    onChange={handleChange}
                    required
                  />

                  {ReservationFormData.checkInDate && (
                    <p className="text-sm text-gray-500">
                      {format(ReservationFormData.checkInDate, "PPP")}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Check-Out Date</Label>
                  <Input
                    id="checkOutDate"
                    name="checkOutDate"
                    type="date"
                    value={ReservationFormData.checkOutDate}
                    onChange={handleChange}
                    required
                  />

                  {ReservationFormData.checkOutDate && (
                    <p className="text-sm text-gray-500">
                      {format(ReservationFormData.checkOutDate, "PPP")}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Submit Reservation
                </Button>
              </form>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

// --- Sub-components with React.memo for performance ---
// (No changes needed to these components)

interface GuestCardProps {
  guest: Guest;
  onDelete: () => void;
}

const GuestCard = React.memo<GuestCardProps>(({ guest, onDelete }) => {
  const getStatusColor = (status: string) =>
    status === "checked-in"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";

  return (
    <Card className="hover:shadow transition-shadow duration-300">
      <CardContent className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4">
        <div className="md:col-span-2 flex flex-col">
          <p className="font-bold text-lg">{guest.fullName}</p>
          <p className="text-sm text-gray-500">{guest.phone}</p>
          {guest.email && (
            <p className="text-sm text-gray-500">{guest.email}</p>
          )}
        </div>
        <div className="flex justify-start md:justify-center">
          <Badge className={getStatusColor(guest.status)}>{guest.status}</Badge>
        </div>
        <div className="flex justify-start md:justify-end items-center gap-2">
          <Link to={`/guests/${guest._id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" /> Details
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Make the skeleton match the actual card layout
const GuestListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4">
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex justify-start md:justify-center">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex justify-start md:justify-end items-center gap-2">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

interface CheckInFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  rooms: Room[];
  createGuest: (data: CreateGuestInput) => Promise<void>;
}
// create object for Reservation
interface ReservationFormData {
  fullName: string;
  address: string;
  email: string;
  phoneNo: string;
  cnic: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
}

const CheckInFormDialog: React.FC<CheckInFormDialogProps> = ({
  isOpen,
  setIsOpen,
  rooms,
  createGuest,
}) => {
  const [formData, setFormData] =
    useState<CreateGuestInput>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to make sure the animation completes before resetting
      const timeout = setTimeout(() => {
        setFormData(INITIAL_FORM_STATE);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    []
  );

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomNumber) {
      toast({
        title: "Validation Error",
        description: "Please select a room.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createGuest(formData);
      toast({
        title: "Guest Checked In",
        description: "The new guest has been added successfully.",
      });
      setIsOpen(false);
    } catch (err) {
      toast({
        title: "Check-in Failed",
        description: "Could not create the guest record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter only available rooms for selection
  const availableRooms = useMemo(
    () => rooms.filter((r) => r.status === "available"),
    [rooms]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[80vh] h-auto">
        <DialogHeader>
          <DialogTitle>New Guest Check-In</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 ">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
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
                value={formData.email}
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
              <Label htmlFor="stayDuration">Stay (days)</Label>
              <Input
                id="stayDuration"
                name="stayDuration"
                type="number"
                min={1}
                value={formData.stayDuration}
                onChange={handleFormChange}
                disabled={isSubmitting}
                required
              />
            </div>
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
                <SelectValue placeholder="Select an available room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 ? (
                  <div className="px-2 py-4 text-center text-gray-500">
                    No rooms available
                  </div>
                ) : (
                  availableRooms.map((r) => (
                    <SelectItem key={r._id} value={r.roomNumber}>
                      Room {r.roomNumber} — {r.bedType} — (Rs{r.rate}/night) —{" "}
                      {r.category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionaldiscount">
              Additional Discount Amount (Rs)
            </Label>
            <Input
              id="additionaldiscount"
              name="additionaldiscount"
              type="number"
              min={0}
              step="0.01"
              value={formData.additionaldiscount}
              onChange={handleFormChange}
              placeholder="1000, 2000"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                onValueChange={(v) => handleSelectChange("paymentMethod", v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center pt-6 space-x-2">
              <input
                type="checkbox"
                name="applyDiscount"
                checked={formData.applyDiscount}
                onChange={handleFormChange}
                id="applyDiscount"
                disabled={isSubmitting}
                className="h-4 w-4"
              />
              <Label htmlFor="applyDiscount" className="cursor-pointer">
                Apply Discount
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formData.roomNumber}
          >
            {isSubmitting ? "Processing..." : "Submit Check-In"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestsPage;
