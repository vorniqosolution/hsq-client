import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { parseISO, differenceInCalendarDays } from "date-fns";
import Sidebar from "@/components/Sidebar";
import { Search, Eye, Trash2, UserPlus, X, Menu, Crown } from "lucide-react";

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

// Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import {
  useGuestContext,
  Guest,
  Room,
  CreateGuestInput,
} from "@/contexts/GuestContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReservationContext } from "../contexts/ReservationContext";

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
  // reservationId is optional and only added when we come from a reservation
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

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);

  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getReservationById } = useReservationContext();

  const roomsLoaded = rooms.length > 0;
  const [pendingOpen, setPendingOpen] = useState(false);

  const [prefill, setPrefill] = useState<Partial<CreateGuestInput> | null>(
    null
  );

  // const [ReservationFormData, setReservationFormData] =
  //   useState<ReservationFormData>({
  //     fullName: "",
  //     address: "",
  //     email: "",
  //     phoneNo: "",
  //     cnic: "",
  //     roomNumber: "",
  //     checkInDate: "",
  //     checkOutDate: "",
  //   });

  type MaybeRoom = string | { _id: string; roomNumber: string };

  interface ReservationLite {
    _id: string;
    fullName: string;
    address: string;
    email?: string;
    phone: string;
    cnic: string;
    room: MaybeRoom;
    roomNumber: string;
    startAt: string; // ISO
    endAt: string; // ISO
  }

  const buildPrefillFromReservation = (
    r: ReservationLite
  ): Partial<CreateGuestInput> => {
    const start = parseISO(r.startAt);
    const end = parseISO(r.endAt);
    const days = Math.max(1, differenceInCalendarDays(end, start));

    const roomNum =
      typeof r.room === "object" && r.room !== null && "roomNumber" in r.room
        ? r.room.roomNumber
        : r.roomNumber;

    return {
      fullName: r.fullName || "",
      address: r.address || "",
      phone: r.phone || "",
      cnic: r.cnic || "",
      email: r.email || "",
      roomNumber: roomNum || "",
      stayDuration: days,
      paymentMethod: "cash",
      applyDiscount: false,
      additionaldiscount: 0,
      reservationId: r._id, // <-- carry reservationId
    };
  };

  useEffect(() => {
    const statePrefill = (location as any)?.state?.prefill as
      | Partial<CreateGuestInput>
      | undefined;
    const qpId = searchParams.get("reservation");

    if (statePrefill) {
      setPrefill(statePrefill);
      if (!roomsLoaded) setPendingOpen(true);
      else setIsCheckInDialogOpen(true);
      return;
    }

    if (qpId) {
      (async () => {
        try {
          const r = (await getReservationById(qpId)) as any;
          if (r) {
            setPrefill(buildPrefillFromReservation(r));
            if (!roomsLoaded) setPendingOpen(true);
            else setIsCheckInDialogOpen(true);
          }
        } catch {}
      })();
    }
  }, [location, searchParams, getReservationById, roomsLoaded]);

  // open the dialog as soon as rooms finish loading (prevents shaking)
  useEffect(() => {
    if (pendingOpen && roomsLoaded) {
      setIsCheckInDialogOpen(true);
      setPendingOpen(false);
    }
  }, [pendingOpen, roomsLoaded]);

  // --- Data Fetching ---
  useEffect(() => {
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

  // --- Event Handlers ---
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

  const handleOpenCheckInDialog = useCallback(() => {
    setIsCheckInDialogOpen(true);
  }, []);

  const handleGuestDelete = useCallback((guest: Guest) => {
    setGuestToDelete(guest);
  }, []);

  const ContentContainer: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <div className="relative min-h-[400px]">{children}</div>;

  // RENDER CONTENT SHOW LOADING SKALETON CARDS EVERYTHING
  const renderContent = () => {
    if (loading) return <GuestListSkeleton />;

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
      {/* Add sidebar */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
        {isAdmin && (
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
        )}

        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Guests</h1>

            <div className="flex gap-2 ml-auto">
              <Button
                onClick={handleOpenCheckInDialog}
                className="bg-amber-500 hover:bg-amber-600"
              >
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

          {/* Content Area */}
          <ContentContainer>{renderContent()}</ContentContainer>

          {/* Check-in Dialog */}
          <CheckInFormDialog
            isOpen={isCheckInDialogOpen}
            setIsOpen={setIsCheckInDialogOpen}
            rooms={rooms}
            createGuest={createGuest}
            prefill={prefill}
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
    </div>
  );
};

// --- Sub-components with React.memo for performance ---

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
  prefill?: Partial<CreateGuestInput> | null;
}
// interface ReservationFormData {
//   fullName: string;
//   address: string;
//   email: string;
//   phoneNo: string;
//   cnic: string;
//   roomNumber: string;
//   checkInDate: string;
//   checkOutDate: string;
// }

const CheckInFormDialog: React.FC<CheckInFormDialogProps> = ({
  isOpen,
  setIsOpen,
  rooms,
  createGuest,
  prefill,
}) => {
  const [formData, setFormData] =
    useState<CreateGuestInput>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => {
        setFormData(INITIAL_FORM_STATE);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timeout);
    } else if (prefill) {
      setFormData((prev) => ({ ...prev, ...prefill }));
    }
  }, [isOpen, prefill]);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const { name, type, value } = input; // Add value here

      if (name === "stayDuration") {
        const n = input.valueAsNumber;
        setFormData((prev) => ({
          ...prev,
          stayDuration: Number.isNaN(n) ? 1 : Math.max(1, Math.floor(n)),
        }));
        return;
      }

      if (name === "additionaldiscount") {
        const n = input.valueAsNumber; // NaN when cleared
        setFormData((prev) => ({
          ...prev,
          // store 0 when empty; UI renders "" so zero is removable
          additionaldiscount: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
        }));
        return;
      }

      if (name === "applyDiscount") {
        setFormData((prev) => ({
          ...prev,
          applyDiscount: (input as any).checked,
        }));
        return;
      }

      setFormData(
        (prev) =>
          ({
            ...prev,
            [name]: value, // Now value is defined
          } as unknown as CreateGuestInput)
      );
    },
    []
  );

  const handleSelectChange = useCallback(
    (name: "roomNumber" | "paymentMethod", value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Find the prefilled room (if any)
  const prefilledRoom = useMemo(() => {
    if (!formData.roomNumber) return null;
    return rooms.find((r) => r.roomNumber === formData.roomNumber) || null;
  }, [rooms, formData.roomNumber]);

  // If rooms not loaded yet but we have a prefilled roomNumber, create a temporary option
  const pseudoPrefillRoom = useMemo(() => {
    if (rooms.length > 0 || !formData.roomNumber) return null;
    return {
      _id: "prefill",
      roomNumber: formData.roomNumber,
      bedType: "—",
      rate: 0,
      category: "—",
      status: "reserved",
    } as unknown as Room;
  }, [rooms.length, formData.roomNumber]);

  // Build the list:
  // include "available" and "reserved" rooms; keep prefilled item if needed
  const selectableRooms = useMemo(() => {
    const availOrReserved = rooms.filter((r) =>
      ["available", "reserved"].includes(r.status as string)
    );

    if (
      prefilledRoom &&
      !availOrReserved.some((r) => r.roomNumber === prefilledRoom.roomNumber)
    ) {
      return [prefilledRoom, ...availOrReserved];
    }
    if (!prefilledRoom && pseudoPrefillRoom) {
      return [pseudoPrefillRoom];
    }
    return availOrReserved;
  }, [rooms, prefilledRoom, pseudoPrefillRoom]);

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

    // Prevent checking into a reserved room without a reservationId
    const selected = rooms.find((r) => r.roomNumber === formData.roomNumber);
    if (
      selected?.status === "reserved" &&
      !("reservationId" in formData && (formData as any).reservationId)
    ) {
      toast({
        title: "Reserved room",
        description:
          "This room is reserved. Open the check-in from its Reservation to proceed.",
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[80vh] h-auto">
        <DialogHeader>
          <DialogTitle>New Guest Check-In</DialogTitle>
        </DialogHeader>

        {prefilledRoom && prefilledRoom.status !== "available" && (
          <div className="text-sm mb-2 rounded border border-amber-300 bg-amber-50 p-2 text-amber-700">
            Room {prefilledRoom.roomNumber} is currently{" "}
            <b>{prefilledRoom.status}</b>. Proceed only if this room is reserved
            for this guest; otherwise pick another available room.
          </div>
        )}

        {/* CREATE GUEST FORM  */}
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
            <Label>Available or Reserved Room</Label>
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
                {selectableRooms.length === 0 ? (
                  rooms.length === 0 ? (
                    <div className="px-2 py-4">
                      <div className="h-6 w-full rounded bg-gray-100 animate-pulse" />
                    </div>
                  ) : (
                    <div className="px-2 py-4 text-center text-gray-500">
                      No rooms available
                    </div>
                  )
                ) : (
                  selectableRooms.map((r) => {
                    const isReserved = r.status === "reserved";
                    const disableReserved =
                      isReserved && !(formData as any).reservationId;

                    return (
                      <SelectItem
                        key={r._id}
                        value={r.roomNumber}
                        disabled={disableReserved}
                        className={
                          isReserved
                            ? "text-blue-700 data-[highlighted]:bg-blue-50 data-[state=checked]:bg-blue-100"
                            : undefined
                        }
                      >
                        <span className="flex items-center gap-2">
                          <span>
                            Room {r.roomNumber} — {r.bedType} — (Rs{r.rate}
                            /night) — {r.category}
                          </span>
                          {isReserved ? (
                            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Reserved
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Available
                            </span>
                          )}
                          {disableReserved && (
                            <span className="text-xs text-blue-700/70">
                              (open from Reservation to check in)
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })
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
              step="1"
              value={
                formData.additionaldiscount === 0
                  ? ""
                  : String(formData.additionaldiscount)
              }
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
