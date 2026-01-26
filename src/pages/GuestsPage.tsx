import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import DatePicker from "react-datepicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Eye,
  Trash2,
  UserPlus,
  X,
  Menu,
  Crown,
  CheckCircle2,
  LogOut,
  CalendarDays,
  User,
  CalendarPlus,
  Clock,
  Phone,
  Bed,
} from "lucide-react";
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
  PaginationEllipsis,
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
import { useDecor } from "@/contexts/DecorContext";
import { usePromoCodeContext } from "@/contexts/PromoCodeContext";
import ExtendStayDialog from "@/components/dialogs/ExtendStayDialog";

const INITIAL_FORM_STATE: CreateGuestInput = {
  fullName: "",
  address: "",
  phone: "",
  cnic: "",
  email: "",
  decorPackageid: "",
  roomNumber: "",
  checkInDate: format(new Date(), "yyyy-MM-dd"),
  checkOutDate: "",
  paymentMethod: "cash",
  applyDiscount: false,
  additionaldiscount: 0,
  adults: 1,
  infants: 0,
  extraMattresses: 0,
};

const GuestCard: React.FC<{
  guest: Guest;
  onDelete: () => void;
  onExtend: (guest: Guest) => void;
}> = React.memo(({ guest, onDelete, onExtend }) => {
  // Status Logic
  const isCheckedIn = guest.status === "checked-in";
  const statusColor = isCheckedIn ? "text-emerald-500" : "text-amber-500";
  const statusLabel = isCheckedIn ? "Active" : "Checked Out";

  // Format helpers
  const formatDate = (dateValue: string | undefined) => {
    if (!dateValue) return "N/A";
    try {
      return format(
        toZonedTime(new Date(dateValue), "Asia/Karachi"),
        "dd MMM, EEE",
      );
    } catch {
      return "N/A";
    }
  };

  // Category Badge Color
  const getCategoryColor = (category: string = "") => {
    const lower = category.toLowerCase();
    if (lower.includes("presidential")) return "bg-purple-100 text-purple-700";
    if (lower.includes("executive")) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-none shadow-sm mb-3">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center min-h-[80px]">
          {/* 1. Name Section */}
          <div className="flex-1 p-4 md:pl-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
              {guest.fullName}
            </h3>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`uppercase text-[10px] tracking-wider font-semibold rounded-md px-2 py-0.5 ${getCategoryColor(guest.room?.category)}`}
              >
                {guest.room?.category || "ROOM"}
              </Badge>
            </div>
          </div>

          {/* 2. Time Section */}
          <div className="w-full md:w-[220px] p-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">
                  IN
                </span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatDate(guest.checkInAt)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">
                  OUT
                </span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatDate(guest.checkOutAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Location / Room Section */}
          <div className="w-full md:w-[250px] p-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-200">
              Room {guest.room?.roomNumber || "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {guest.adults || 1} Adult{guest.adults !== 1 ? "s" : ""}
              {guest.infants > 0 &&
                `, ${guest.infants} Infant${guest.infants !== 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {/* Fallback to show status text if needed, or remove completely */}
            </p>
          </div>

          {/* 4. Status & Actions */}
          <div className="w-full md:w-[200px] p-4 flex items-center justify-between md:justify-end gap-4">
            {/* Status Dot */}
            <div className="flex items-center gap-2 mr-auto md:mr-4">
              <div
                className={`h-2 w-2 rounded-full ${isCheckedIn ? "bg-emerald-500" : "bg-amber-400"}`}
              ></div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>

            {/* Actions Menu (simplified) */}
            <div className="flex items-center gap-1">
              <Link to={`/guests/${guest._id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>

              {guest.status === "checked-in" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                  onClick={() => onExtend(guest)}
                >
                  <CalendarPlus className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

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
  const [formErrors, setFormErrors] = useState({ phone: "", cnic: "" });
  const { toast } = useToast();

  const {
    rooms: allRooms,
    availableRooms,
    fetchAvailableRooms,
    loading: roomsLoading,
  } = useRoomContext();
  const { validatePromoCode, promoCodes } = usePromoCodeContext();
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
    discount?: number;
  } | null>(null);

  const { packages } = useDecor();

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
        (r) => r.roomNumber === prefill.roomNumber,
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

  const handlePromoBlur = async () => {
    if (!formData.promoCode) {
      setPromoMessage(null);
      return;
    }

    try {
      const res = await validatePromoCode(formData.promoCode);
      if (res.isValid) {
        setPromoMessage({
          type: "success",
          text: `Promo Applied: ${res.percentage}% Off Room Rent`,
          discount: res.percentage,
        });
      } else {
        setPromoMessage({
          type: "error",
          text: res.message || "Invalid Promo Code",
        });
      }
    } catch (err: any) {
      setPromoMessage({
        type: "error",
        text: err.message || "Error validating promo",
      });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.currentTarget;
    const newErrors = { ...formErrors };

    // Existing validation for CNIC and Phone...
    if (name === "cnic") {
      if (value && !/^\d{13}$/.test(value)) {
        newErrors.cnic = "CNIC must be exactly 13 digits.";
      } else {
        newErrors.cnic = "";
      }
    }

    if (name === "phone") {
      if (value && !/^\d{11}$/.test(value)) {
        newErrors.phone = "Phone must be exactly 11 digits.";
      } else {
        newErrors.phone = "";
      }
    }

    setFormErrors(newErrors);

    // ✅ Handle different input types
    const isCheckbox = type === "checkbox";
    const isNumber = type === "number";

    let finalValue: any = value;
    if (isCheckbox) {
      finalValue = e.currentTarget.checked;
    } else if (isNumber) {
      finalValue = value === "" ? 0 : parseInt(value, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSelectChange = (
    name: "roomNumber" | "paymentMethod",
    value: string,
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
  const handleDecorChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      decorPackageid: value === "none" ? "" : value,
    }));
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
              maxLength={11} // Optional: Helps guide the user
            />
            {formErrors.phone && (
              <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
            )}
            <Input
              name="cnic"
              value={formData.cnic}
              onChange={handleFormChange}
              placeholder="CNIC (e.g., 3520212345678)"
              required
              disabled={isSubmitting}
              maxLength={13} // Optional: Helps guide the user
            />
            {formErrors.cnic && (
              <p className="text-xs text-red-500 mt-1">{formErrors.cnic}</p>
            )}
          </div>

          <Input
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleFormChange}
            placeholder="Email (Optional)"
            disabled={isSubmitting}
          />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adults" className="text-sm text-gray-600">
                  Adults
                </Label>
                <Input
                  id="adults"
                  name="adults"
                  type="number"
                  min="1"
                  value={formData.adults || 1}
                  onChange={handleFormChange}
                  placeholder="Number of adults"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="infants" className="text-sm text-gray-600">
                  Infants
                </Label>
                <Input
                  id="infants"
                  name="infants"
                  type="number"
                  min="0"
                  value={formData.infants || 0}
                  onChange={handleFormChange}
                  placeholder="Number of infants"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label
                  htmlFor="extraMattresses"
                  className="text-sm text-gray-600"
                >
                  Extra Mattresses
                </Label>
                <Input
                  id="extraMattresses"
                  name="extraMattresses"
                  type="number"
                  min="0"
                  max="4"
                  value={formData.extraMattresses || 0}
                  onChange={handleFormChange}
                  placeholder="0-4"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(() => {
                    const selectedRoom = selectableRooms.find(
                      (r) => r.roomNumber === formData.roomNumber,
                    );
                    if (!selectedRoom)
                      return "Select a room to see free mattresses";
                    const isTwoBed = selectedRoom.bedType === "Two Bed";
                    let free = 0;
                    switch (selectedRoom.category) {
                      case "Presidential":
                        free = isTwoBed ? 2 : 1;
                        break;
                      case "Duluxe-Plus":
                        free = isTwoBed ? 2 : 1;
                        break;
                      case "Deluxe":
                      case "Executive":
                        free = 1;
                        break;
                      default:
                        free = 0;
                    }
                    return `${free} free for ${selectedRoom.category}. Extra: Rs 1,500 each`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Input
                id="checkInDate"
                name="checkInDate"
                type="date"
                value={formData.checkInDate}
                onChange={handleCheckInDateChange}
                max={format(new Date(), "yyyy-MM-dd")} // Prevent future dates (use Reservations for future bookings)
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

                    // ✅ Check capacity
                    const adultsExceeded =
                      r.adults && formData.adults > r.adults;
                    const infantsExceeded =
                      r.infants !== undefined && formData.infants > r.infants;
                    const capacityIssue = adultsExceeded || infantsExceeded;

                    return (
                      <SelectItem
                        key={r._id}
                        value={r.roomNumber}
                        disabled={capacityIssue} // ✅ Disable if capacity exceeded
                      >
                        <span className="flex items-center gap-2">
                          Room {r.roomNumber} — {r.bedType} — Rs{r.rate}/night
                          {/* ✅ Show capacity info */}
                          {r.adults && (
                            <span
                              className={`text-xs ${
                                capacityIssue ? "text-red-500" : "text-gray-500"
                              }`}
                            >
                              (Max: {r.adults} adults
                              {r.infants !== undefined
                                ? `, ${r.infants} infants`
                                : ""}
                              )
                            </span>
                          )}
                          {isTheReservedRoom && (
                            <Badge variant="secondary">Reserved</Badge>
                          )}
                          {capacityIssue && (
                            <Badge variant="destructive" className="text-xs">
                              Exceeds Capacity
                            </Badge>
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
          <div>
            <Label>Decor Package (Optional)</Label>
            <Select
              name="decorPackage"
              value={formData.decorPackageid || "none"}
              onValueChange={handleDecorChange}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-16">
                <SelectValue placeholder="Select a decor package" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    None (No decor package)
                  </span>
                </SelectItem>
                {packages && packages.length > 0
                  ? packages.map((decor) => {
                      const isSelected = decor._id === formData.decorPackageid;

                      return (
                        <SelectItem
                          key={decor._id}
                          value={decor._id}
                          className={`${
                            isSelected
                              ? "bg-primary/10 border-l-4 border-primary"
                              : ""
                          }`}
                        >
                          <span className="flex items-center gap-4 mt-2">
                            <div className="flex flex-col text-left">
                              <span className="font-medium">
                                {decor.title} — Rs{decor.price}
                                {isSelected && (
                                  <Badge variant="secondary" className="ml-2">
                                    Selected
                                  </Badge>
                                )}
                              </span>
                              <span className="text-sm text-gray-600 line-clamp-1 max-w-[400px]">
                                {decor.description}
                              </span>
                            </div>
                          </span>
                        </SelectItem>
                      );
                    })
                  : null}
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <Label>Promo Code (Optional)</Label>
            <Select
              name="promoCode"
              value={formData.promoCode || ""}
              onValueChange={(v) => {
                setFormData((prev) => ({ ...prev, promoCode: v }));
                // Manually trigger validation logic
                if (v) {
                  validatePromoCode(v)
                    .then((res) => {
                      if (res.isValid) {
                        setPromoMessage({
                          type: "success",
                          text: `Promo Applied: ${res.percentage}% Off`,
                        });
                      } else {
                        setPromoMessage({
                          type: "error",
                          text: res.message || "Invalid Promo",
                        });
                      }
                    })
                    .catch((err) =>
                      setPromoMessage({
                        type: "error",
                        text: "Error validating promo",
                      }),
                    );
                } else {
                  setPromoMessage(null);
                }
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                className={
                  promoMessage?.type === "success" ? "border-green-500" : ""
                }
              >
                <SelectValue placeholder="Select a promo code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Promo Code</SelectItem>
                {promoCodes
                  .filter((p) => p.status === "active")
                  .map((code) => (
                    <SelectItem key={code._id} value={code.code}>
                      {code.code} ({code.percentage}% Off)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {promoMessage && (
              <p
                className={`text-xs mt-1 ${promoMessage.type === "success" ? "text-green-600 font-medium" : "text-red-500"}`}
              >
                {promoMessage.text}
              </p>
            )}
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
            disabled={
              isSubmitting ||
              !formData.roomNumber ||
              formErrors.phone !== "" ||
              formErrors.cnic !== ""
            }
          >
            {isSubmitting ? "Processing..." : "Submit Check-In"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GuestsPage: React.FC = () => {
  const {
    guests,
    loading: guestsLoading,
    error,
    fetchGuests,
    createGuest,
    deleteGuest,
    // ADD THESE
    guestActivityReport,
    fetchGuestActivityReport,
    // Add Checked-out history
    checkedOutByRange,
    fetchCheckedOutByRange,
    fetchGuestById,
    invoice,
  } = useGuestContext();

  const { toast } = useToast();
  const { user } = useAuth();
  const { getReservationById } = useReservationContext();
  const isAdmin = user?.role === "admin";
  const ITEMS_PER_PAGE = 15;
  const HISTORY_ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("name");
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "report" | "history">(
    "list",
  );
  const [reportDate, setReportDate] = useState(new Date());
  // Date range for Checked-out History
  const [historyDateRange, setHistoryDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(),
    endDate: new Date(),
  });

  // Extend Stay Dialog State
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);

  const handleExtendClick = useCallback(
    async (guest: Guest) => {
      setIsFetchingInvoice(true);
      try {
        await fetchGuestById(guest._id);
        setSelectedGuest(guest);
        setIsExtendOpen(true);
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load guest details for extension.",
          variant: "destructive",
        });
      } finally {
        setIsFetchingInvoice(false);
      }
    },
    [fetchGuestById, toast],
  );

  const [prefill, setPrefill] = useState<Partial<CreateGuestInput> | null>(
    null,
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
              adults: r.adults || 1,
              infants: r.infants || 0,
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
    const loadData = async () => {
      const formatDateToYYYYMMDD = (date: Date) =>
        date.toISOString().split("T")[0];

      if (viewMode === "report") {
        const dateString = formatDateToYYYYMMDD(reportDate);
        await fetchGuestActivityReport(dateString);
      } else if (viewMode === "history") {
        // Fetch checked-out history
        const startStr = formatDateToYYYYMMDD(historyDateRange.startDate);
        const endStr = formatDateToYYYYMMDD(historyDateRange.endDate);
        await fetchCheckedOutByRange(startStr, endStr);
      } else {
        await fetchGuests();
      }
    };

    loadData();
  }, [
    viewMode,
    reportDate,
    historyDateRange, // Fetch when range changes
    fetchGuestActivityReport,
    fetchGuests,
    fetchCheckedOutByRange,
  ]);

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

  const paginatedHistory = useMemo(() => {
    if (viewMode !== "history") return [];
    const firstPageIndex = (currentPage - 1) * HISTORY_ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + HISTORY_ITEMS_PER_PAGE;
    return (checkedOutByRange || []).slice(firstPageIndex, lastPageIndex);
  }, [currentPage, checkedOutByRange, viewMode]);

  const totalPages = useMemo(() => {
    if (viewMode === "history") {
      return Math.ceil(
        (checkedOutByRange?.length || 0) / HISTORY_ITEMS_PER_PAGE,
      );
    }
    return Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);
  }, [filteredGuests.length, checkedOutByRange, viewMode]);

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
        duration: 3000,
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

    if (viewMode === "report") {
      if (!guestActivityReport) {
        return (
          <div className="text-center text-gray-500 p-6">
            Select a date to generate the report.
          </div>
        );
      }

      // Helper component to render a list of guests
      const ReportList = ({ data }) => (
        <Card>
          <CardContent className="p-4 space-y-3">
            {data.length > 0 ? (
              data.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">{item.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Room {item.room?.roomNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <Link to={`/guests/${item._id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No activity.
              </p>
            )}
          </CardContent>
        </Card>
      );

      return (
        <Tabs defaultValue="checkIns" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkIns">
              Check-Ins ({guestActivityReport.summary.checkIns})
            </TabsTrigger>
            <TabsTrigger value="checkOuts">
              Check-Outs ({guestActivityReport.summary.checkOuts})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="checkIns" className="mt-4">
            <ReportList data={guestActivityReport.data.checkIns} />
          </TabsContent>
          <TabsContent value="checkOuts" className="mt-4">
            <ReportList data={guestActivityReport.data.checkOuts} />
          </TabsContent>
        </Tabs>
      );
    }

    // Checked-Out History Rendering
    if (viewMode === "history") {
      if (!checkedOutByRange || checkedOutByRange.length === 0) {
        return (
          <div className="text-center text-gray-500 p-6 bg-white rounded-lg border">
            No checked-out guests found for this date range.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Total Check-outs: {checkedOutByRange.length}
            </Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 font-medium text-sm">
                  <div className="col-span-4">Guest Name</div>
                  <div className="col-span-2">Room</div>
                  <div className="col-span-2">Check In</div>
                  <div className="col-span-2">Check Out</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>
                <div className="divide-y">
                  {paginatedHistory.map((guest) => (
                    <div
                      key={guest._id}
                      className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className="col-span-4 font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {guest.fullName}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="font-normal">
                          {guest.room?.roomNumber || "N/A"}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {new Date(guest.checkInAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {new Date(guest.checkOutAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 text-right">
                        <Link to={`/guests/${guest._id}`}>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

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
            onExtend={handleExtendClick}
          />
        ))}
      </div>
    );
  };

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
    <>
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

      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "list" | "report" | "history")}
        className="mb-6"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            All Guests
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Daily Report
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Out History
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === "list" ? (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Search Category Filter Icons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={searchCategory === "name" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSearchCategory("name")}
              className={`h-8 px-3 text-xs ${searchCategory === "name" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              title="Search by Name"
            >
              <User className="h-4 w-4 mr-1" />
              Name
            </Button>
            <Button
              variant={searchCategory === "phone" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSearchCategory("phone")}
              className={`h-8 px-3 ${searchCategory === "phone" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              title="Search by Phone"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant={searchCategory === "roomNumber" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSearchCategory("roomNumber")}
              className={`h-8 px-3 ${searchCategory === "roomNumber" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              title="Search by Room"
            >
              <Bed className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : viewMode === "report" ? (
        <div className="mb-6 max-w-xs">
          <Label className="mb-1.5 block text-sm">Report Date</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <DatePicker
              selected={reportDate}
              onChange={(date: Date) => setReportDate(date)}
              dateFormat="yyyy-MM-dd"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background"
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-4 mb-6 max-w-md">
          <div className="space-y-1.5 flex-1">
            <Label className="text-sm">Start Date</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <DatePicker
                selected={historyDateRange.startDate}
                onChange={(date: Date) =>
                  setHistoryDateRange((prev) => ({
                    ...prev,
                    startDate: date,
                  }))
                }
                dateFormat="yyyy-MM-dd"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background"
              />
            </div>
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-sm">End Date</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <DatePicker
                selected={historyDateRange.endDate}
                onChange={(date: Date) =>
                  setHistoryDateRange((prev) => ({
                    ...prev,
                    endDate: date,
                  }))
                }
                dateFormat="yyyy-MM-dd"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background"
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative">{renderContent()}</div>
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
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {getPageNumbers(currentPage, totalPages).map((page, index) => (
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
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
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

      {/* Extend Stay Dialog */}
      {selectedGuest && (
        <ExtendStayDialog
          isOpen={isExtendOpen}
          setIsOpen={setIsExtendOpen}
          guest={selectedGuest}
          onSuccess={() => fetchGuests()}
          invoice={invoice}
        />
      )}

      <AlertDialog
        open={!!guestToDelete}
        onOpenChange={(open) => !open && setGuestToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the guest record for{" "}
              <span className="font-semibold">{guestToDelete?.fullName}</span>.
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
    </>
  );
};

export default GuestsPage;
