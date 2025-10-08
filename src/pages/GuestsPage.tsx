import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import { Search, Eye, Trash2, UserPlus, X, Menu, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
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
import { useToast } from "@/hooks/use-toast";
import {
  useGuestContext,
  Guest,
  CreateGuestInput,
} from "@/contexts/GuestContext";
import { useRoomContext, Room } from "@/contexts/RoomContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReservationContext } from "../contexts/ReservationContext";

const INITIAL_FORM_STATE: CreateGuestInput = {
  fullName: "",
  address: "",
  phone: "",
  cnic: "",
  email: "",
  roomNumber: "",
  checkInDate: format(new Date(), "yyyy-MM-dd"),
  checkOutDate: "",
  paymentMethod: "cash",
  applyDiscount: false,
  additionaldiscount: 0,
};

const GuestsPage: React.FC = () => {
  const {
    guests,
    loading: guestsLoading,
    error,
    fetchGuests,
    createGuest,
    deleteGuest,
  } = useGuestContext();

  const { toast } = useToast();
  const { user } = useAuth();
  const { getReservationById } = useReservationContext();
  const isAdmin = user?.role === "admin";
  const ITEMS_PER_PAGE = 15;


  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("name");
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [searchParams] = useSearchParams();
  const [prefill, setPrefill] = useState<Partial<CreateGuestInput> | null>(
    null
  );

  useEffect(() => {
    const qpId = searchParams.get("reservation");
    if (qpId) {
      (async () => {
        try {
          const r = (await getReservationById(qpId)) as any;
          if (r) {
            setPrefill({
              fullName: r.fullName || "",
              address: r.address || "",
              phone: r.phone || "",
              cnic: r.cnic || "",
              email: r.email || "",
              roomNumber:
                typeof r.room === "object" ? r.room.roomNumber : r.roomNumber,
              // Allow the user to set their own check-in date
              checkInDate: format(new Date(r.startAt), "yyyy-MM-dd"),
              checkOutDate: format(new Date(r.endAt), "yyyy-MM-dd"),
              reservationId: r._id,
            });
            setIsCheckInDialogOpen(true);
          }
        } catch (err) {
          console.error("Failed to fetch reservation for prefill:", err);
        }
      })();
    }
  }, [searchParams, getReservationById]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filteredGuests = useMemo(() => {
    setCurrentPage(1);

    if (!searchTerm) return guests;
    const searchLower = searchTerm.toLowerCase();

    return guests.filter((guest) => {
      switch (searchCategory) {
        case "name":
          return guest.fullName.toLowerCase().includes(searchLower);
        case "phone":
          return guest.phone.includes(searchTerm);
        case "roomNumber":
          return guest.room?.roomNumber?.toLowerCase().includes(searchLower);
        case "status":
          return guest.status.toLowerCase().includes(searchLower);
        default:
          return (
            guest.fullName.toLowerCase().includes(searchLower) ||
            guest.phone.includes(searchTerm) ||
            guest.room?.roomNumber?.toLowerCase().includes(searchLower)
          );
      }
    });
  }, [guests, searchTerm, searchCategory]);

  const paginatedGuests = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredGuests.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredGuests]);

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    fetchGuests();
  }, [fetchGuests]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!guestToDelete) return;
    if (user.role === "receptionist") {
      toast({
        title: "Error",
        description: "Only Admin can delete a guest.",
        variant: "destructive",
      });
      return;
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

  const renderContent = () => {
    if (guestsLoading) return <GuestListSkeleton />;
    if (error)
      return <div className="text-center text-red-500 p-6">{error}</div>;
    if (filteredGuests.length === 0) {
      return (
        <div className="text-center text-gray-500 p-6">
          No guests found. Try adjusting your search or filters.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {paginatedGuests.map((guest) => (
          <GuestCard
            key={guest._id}
            guest={guest}
            onDelete={() => setGuestToDelete(guest)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b p-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setIsOpen(true)} className="p-2">
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <span className="font-light tracking-wider">HSQ ADMIN</span>
              </div>
              <div className="w-9" />
            </div>
          </div>
        )}
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
            <Button
              onClick={() => setIsCheckInDialogOpen(true)}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Check In Guest
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
            {/* Search Input and Category Selector */}
            <div className="flex items-center space-x-2 md:col-span-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select
                value={searchCategory}
                onValueChange={(value) => setSearchCategory(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="roomNumber">Room</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center justify-end">
              <Button variant="secondary" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
          <div className="relative min-h-[400px]">{renderContent()}</div>

          {/* --- ADD THIS ENTIRE PAGINATION BLOCK HERE --- */}
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

          <CheckInFormDialog
            isOpen={isCheckInDialogOpen}
            setIsOpen={setIsCheckInDialogOpen}
            createGuest={createGuest}
            prefill={prefill}
          />
          <AlertDialog
            open={!!guestToDelete}
            onOpenChange={(open) => !open && setGuestToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the guest record for{" "}
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
    </div>
  );
};

const GuestCard: React.FC<{ guest: Guest; onDelete: () => void }> = React.memo(
  ({ guest, onDelete }) => {
    const getStatusColor = (status: string) =>
      status === "checked-in"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800 border-red-200";

    // Helper function to safely format dates
    const formatDate = (
      dateValue: string | undefined,
      fallback: string = "N/A"
    ) => {
      if (!dateValue) return fallback;
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return fallback; // Check if date is invalid
        return format(date, "MMM dd, yyyy");
      } catch {
        return fallback;
      }
    };

    // Helper function to calculate duration safely
    const calculateDuration = () => {
      if (!guest.checkInAt || !guest.checkOutAt) return "N/A";
      try {
        const checkIn = new Date(guest.checkInAt);
        const checkOut = new Date(guest.checkOutAt);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return "N/A";

        const nights = Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        );
        return `${nights} nights`;
      } catch {
        return "N/A";
      }
    };

    return (
      <Card className="hover:shadow transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Guest Information Section */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between md:justify-start md:items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {guest.fullName}
                </h3>
                <Badge className={`${getStatusColor(guest.status)} md:hidden`}>
                  {guest.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    Room
                  </span>
                  <span className="font-medium text-gray-900">
                    {guest.room?.roomNumber || "Unassigned"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    Phone
                  </span>
                  <span className="font-medium text-gray-900">
                    {guest?.phone || "N/A"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    Check-in
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatDate(guest.checkInAt)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    Check-out
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatDate(guest.checkOutAt)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    Duration
                  </span>
                  <span className="font-medium text-gray-900">
                    {calculateDuration()}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge - Hidden on mobile, shown in header instead */}
            <div className="hidden md:flex items-center px-4">
              <Badge className={getStatusColor(guest.status)}>
                {guest.status}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6">
              <Link to={`/guests/${guest._id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-gray-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

const GuestListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

interface CheckInFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  createGuest: (data: CreateGuestInput) => Promise<void>;
  prefill?: Partial<CreateGuestInput> | null;
}

const CheckInFormDialog: React.FC<CheckInFormDialogProps> = ({
  isOpen,
  setIsOpen,
  createGuest,
  prefill,
}) => {
  const [formData, setFormData] =
    useState<CreateGuestInput>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    rooms: allRooms,
    availableRooms,
    fetchAvailableRooms,
    loading: roomsLoading,
  } = useRoomContext();

  useEffect(() => {
    if (isOpen) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      let initialData = { ...INITIAL_FORM_STATE, checkInDate: todayStr };

      if (prefill) {
        // Don't force today's date if prefill has a different check-in date
        initialData = { ...initialData, ...prefill };
      }
      setFormData(initialData);

      // If both dates are known, fetch rooms immediately
      if (initialData.checkInDate && initialData.checkOutDate) {
        fetchAvailableRooms(initialData.checkInDate, initialData.checkOutDate);
      }
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [isOpen, prefill, fetchAvailableRooms]);

  const selectableRooms = useMemo(() => {
    const roomsToShow = [...availableRooms];
    if (prefill?.roomNumber) {
      const reservedRoom = allRooms.find(
        (r) => r.roomNumber === prefill.roomNumber
      );
      if (
        reservedRoom &&
        !roomsToShow.some((r) => r._id === reservedRoom._id)
      ) {
        roomsToShow.unshift(reservedRoom);
      }
    }
    return roomsToShow;
  }, [availableRooms, prefill, allRooms]);

  const handleCheckInDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkInDate = e.target.value;
    setFormData((prev) => ({ ...prev, checkInDate, roomNumber: "" }));

    // If checkout date exists and is valid, refetch available rooms
    if (
      formData.checkOutDate &&
      new Date(formData.checkOutDate) > new Date(checkInDate)
    ) {
      fetchAvailableRooms(checkInDate, formData.checkOutDate);
    }
  };

  // Update checkout handler to validate against check-in date
  const handleCheckoutDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkOutDate = e.target.value;
    setFormData((prev) => ({ ...prev, checkOutDate, roomNumber: "" }));

    if (
      checkOutDate &&
      formData.checkInDate &&
      new Date(checkOutDate) > new Date(formData.checkInDate)
    ) {
      fetchAvailableRooms(formData.checkInDate, checkOutDate);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.currentTarget;
    const isCheckbox = type === "checkbox";
    const checked = (e.currentTarget as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleSelectChange = (
    name: "roomNumber" | "paymentMethod",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      toast({
        title: "Validation Error",
        description: "Check-out date must be after check-in date.",
        variant: "destructive",
      });
      return;
    }

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
    } catch (err: any) {
      toast({
        title: "Check-in Failed",
        description:
          err?.response?.data?.message || "Could not create the guest record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Guest Check-In</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Personal Details */}
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleFormChange}
            placeholder="Full Name"
            required
            disabled={isSubmitting}
          />
          <Input
            name="address"
            value={formData.address}
            onChange={handleFormChange}
            placeholder="Address"
            required
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="Phone Number"
              required
              disabled={isSubmitting}
            />
            <Input
              name="cnic"
              value={formData.cnic}
              onChange={handleFormChange}
              placeholder="CNIC"
              required
              disabled={isSubmitting}
            />
          </div>
          <Input
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleFormChange}
            placeholder="Email (Optional)"
            disabled={isSubmitting}
          />

          {/* Booking Details with Dates - UPDATED */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Input
                id="checkInDate"
                name="checkInDate"
                type="date"
                value={formData.checkInDate}
                onChange={handleCheckInDateChange}
                min={format(new Date(), "yyyy-MM-dd")} // Prevent past dates
                className="mt-1"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="checkOutDate">Check-out Date</Label>
              <Input
                id="checkOutDate"
                name="checkOutDate"
                type="date"
                value={formData.checkOutDate}
                onChange={handleCheckoutDateChange}
                min={formData.checkInDate || format(new Date(), "yyyy-MM-dd")} // Must be after check-in
                className="mt-1"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Rest of the form remains the same */}
          <div>
            <Label>Available Room</Label>
            <Select
              name="roomNumber"
              value={formData.roomNumber}
              onValueChange={(v) => handleSelectChange("roomNumber", v)}
              disabled={isSubmitting || !formData.checkOutDate || roomsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    roomsLoading ? "Loading rooms..." : "Select a room"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {selectableRooms.length > 0 ? (
                  selectableRooms.map((r) => {
                    const isTheReservedRoom =
                      r.roomNumber === prefill?.roomNumber;
                    return (
                      <SelectItem key={r._id} value={r.roomNumber}>
                        <span className="flex items-center gap-2">
                          Room {r.roomNumber} — {r.bedType} — (Rs{r.rate}/night)
                          {/* Add a visual badge to clearly mark the reserved room */}
                          {isTheReservedRoom && (
                            <Badge variant="secondary">Reserved</Badge>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="px-2 py-4 text-center text-gray-500">
                    {formData.checkOutDate
                      ? "No rooms available for these dates"
                      : "Select a check-out date to see rooms"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="additionaldiscount"
              type="number"
              value={formData.additionaldiscount || ""}
              onChange={handleFormChange}
              placeholder="Additional Discount (Rs)"
              disabled={isSubmitting}
            />
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="applyDiscount"
              checked={formData.applyDiscount}
              onChange={handleFormChange}
              id="applyDiscount"
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <Label htmlFor="applyDiscount">Apply Standard Discount</Label>
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
