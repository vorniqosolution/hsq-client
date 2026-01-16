import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { jsPDF } from "jspdf";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  LogOut,
  Printer,
  Send,
  User,
  Phone,
  FileText,
  Clock,
  CreditCard,
  Calendar,
  Home,
  Mail,
  Tag,
  PieChart,
  Percent,
  Users,
  Banknote,
  Receipt,
  Menu // Add Menu icon
} from "lucide-react";

// UI Components
import Sidebar from "@/components/Sidebar"; // Add Sidebar import
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import PaymentModal from "@/components/modals/PaymentModal";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import { useGuestContext, Guest, Invoice } from "@/contexts/GuestContext";

const formatInTimeZone = (date: string | Date, fmt: string, tz: string = "Asia/Karachi") => {
  return format(toZonedTime(date, tz), fmt);
};

// Skeleton loader for guest information
const GuestDetailSkeleton = () => (
  <div className="space-y-6">
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50 dark:bg-slate-800">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex">
            <Skeleton className="h-5 w-24 mr-3" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
        ))}
      </CardContent>
    </Card>
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50 dark:bg-slate-800">
        <Skeleton className="h-7 w-40" />
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex">
            <Skeleton className="h-5 w-24 mr-3" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Error display component
const ErrorDisplay = ({ message, onRetry }) => (
  <Alert variant="destructive" className="my-6">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex flex-col gap-2">
      <p>{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="self-start mt-2"
        >
          Retry
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

// Edit Guest Dialog
const EditGuestDialog = ({ isOpen, setIsOpen, guest, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    phone: "",
    cnic: "",
    email: "",
    paymentMethod: "cash",
    adults: 1,
    infants: 0,
    extraMattresses: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (guest && isOpen) {
      setFormData({
        fullName: guest.fullName,
        address: guest.address,
        phone: guest.phone,
        cnic: guest.cnic,
        email: guest.email || "",
        adults: guest.adults || 1,
        infants: guest.infants || 0,
        extraMattresses: guest.extraMattresses || 0,
        paymentMethod: guest.paymentMethod,
      });
    }
  }, [guest, isOpen]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;

    let finalValue = value;
    if (type === "number") {
      finalValue = value === "" ? 0 : parseInt(value, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.cnic) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Validate adults
    if (formData.adults < 1) {
      toast({
        title: "Validation Error",
        description: "At least 1 adult is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdate(formData);
      toast({ title: "Guest information updated successfully" });
      setIsOpen(false);
    } catch (err) {
      toast({
        title: "Update failed",
        description: "Could not update guest information.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Guest Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Occupancy Details
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="adults" className="text-sm">
                  Adults *
                </Label>
                <Input
                  id="adults"
                  name="adults"
                  type="number"
                  min="1"
                  value={formData.adults}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="infants" className="text-sm">
                  Infants
                </Label>
                <Input
                  id="infants"
                  name="infants"
                  type="number"
                  min="0"
                  value={formData.infants}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="extraMattresses" className="text-sm">
                  Mattresses
                </Label>
                <Input
                  id="extraMattresses"
                  name="extraMattresses"
                  type="number"
                  min="0"
                  max="4"
                  value={formData.extraMattresses}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentMethod: value,
                }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Checkout Confirmation Dialog
const CheckoutDialog = ({ isOpen, setIsOpen, onCheckout }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      await onCheckout();
      // Parent handles toast and closing
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: "Could not complete the checkout process.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isProcessing && setIsOpen(open)}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Check-out</DialogTitle>
        </DialogHeader>
        <p className="py-4">
          Are you sure you want to check out this guest? This will generate an
          invoice and mark the room as available.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            variant="destructive"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Confirm Checkout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Extend Stay Dialog
const ExtendStayDialog = ({ isOpen, setIsOpen, guest, onSuccess, invoice }) => {
  const [newCheckoutDate, setNewCheckoutDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);
  const [applyStandardDiscount, setApplyStandardDiscount] = useState(true);
  const [preview, setPreview] = useState<{
    additionalNights: number;
    grossAmount: number;
    stdDiscountPct: number;
    stdDiscountAmt: number;
    addlDiscountAmt: number;
    netAmount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Calculate preview when date changes
  useEffect(() => {
    if (!newCheckoutDate || !guest) {
      setPreview(null);
      setError("");
      return;
    }

    const currentCheckout = new Date(guest.checkOutAt);
    const newCheckout = new Date(newCheckoutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newCheckout <= today) {
      setError("New date must be in the future");
      setPreview(null);
      return;
    }

    if (newCheckout <= currentCheckout) {
      setError("New date must be after current checkout");
      setPreview(null);
      return;
    }

    // Calculate additional nights
    const diffTime = newCheckout.getTime() - currentCheckout.getTime();
    const additionalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nightlyRate = guest.room?.rate || 0;
    const grossAmount = additionalNights * nightlyRate;

    // Estimate discounts based on original invoice (if available)
    let stdDiscountPct = 0;
    let addlDiscountPerNight = 0;

    if (invoice && guest.applyDiscount !== false) {
      // Calculate standard discount percentage from room rent portion only
      // Find the original room rent item to get the room-only total
      const roomRentItem = invoice.items?.find((item: any) =>
        item.description && item.description.includes('Room Rent')
      );

      if (roomRentItem && roomRentItem.total > 0) {
        const originalRoomTotal = roomRentItem.total;
        const originalStdDiscount = invoice.discountAmount || 0;

        if (originalStdDiscount > 0) {
          // Discount was applied to roomTotal only
          stdDiscountPct = (originalStdDiscount / originalRoomTotal) * 100;
        }
      }

      // Prorate additional discount per night (for default value suggestion)
      const originalAddlDiscount = invoice.additionaldiscount || 0;
      if (originalAddlDiscount > 0 && guest.stayDuration > 0) {
        addlDiscountPerNight = originalAddlDiscount / guest.stayDuration;
      }
    }

    // Only apply standard discount if checkbox is checked
    const stdDiscountAmt = applyStandardDiscount ? Math.round(grossAmount * (stdDiscountPct / 100)) : 0;
    // Use user-provided additional discount (0 if not entered)
    const addlDiscountAmt = Math.max(0, additionalDiscount);
    const netAmount = Math.max(0, grossAmount - stdDiscountAmt - addlDiscountAmt);

    setError("");
    setPreview({
      additionalNights,
      grossAmount,
      stdDiscountPct: applyStandardDiscount ? Math.round(stdDiscountPct * 100) / 100 : 0,
      stdDiscountAmt,
      addlDiscountAmt,
      netAmount
    });
  }, [newCheckoutDate, guest, invoice, additionalDiscount, applyStandardDiscount]);

  const handleExtend = async () => {
    if (!preview || error) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/guests/${guest._id}/extend`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Use cookie-based auth
          body: JSON.stringify({ newCheckoutDate, additionalDiscount, applyStandardDiscount }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to extend stay");
      }

      toast({
        title: "Stay Extended Successfully",
        description: `Added ${preview.additionalNights} night(s). New checkout: ${formatInTimeZone(newCheckoutDate, "MMM d, yyyy")}`,
      });

      setIsOpen(false);
      setNewCheckoutDate("");
      setAdditionalDiscount(0);
      setPreview(null);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Failed to Extend Stay",
        description: err.message || "Could not extend the stay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setNewCheckoutDate("");
      setAdditionalDiscount(0);
      setApplyStandardDiscount(true);
      setPreview(null);
      setError("");
    }
  }, [isOpen]);

  const currentCheckoutDate = guest?.checkOutAt ? new Date(guest.checkOutAt).toISOString().split('T')[0] : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && setIsOpen(open)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Extend Stay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Checkout Info */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">Current Checkout</p>
            <p className="font-semibold">{guest?.checkOutAt ? formatInTimeZone(guest.checkOutAt, "MMM d, yyyy") : 'N/A'}</p>
          </div>

          {/* New Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Checkout Date</label>
            <input
              type="date"
              value={newCheckoutDate}
              onChange={(e) => setNewCheckoutDate(e.target.value)}
              min={currentCheckoutDate}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            />
          </div>

          {/* Apply Standard Discount Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="applyStdDiscount"
              checked={applyStandardDiscount}
              onChange={(e) => setApplyStandardDiscount(e.target.checked)}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="applyStdDiscount" className="text-sm font-medium">
              Apply Standard Discount ({preview?.stdDiscountPct || 0}%)
            </label>
          </div>

          {/* Additional Discount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Discount (Rs)</label>
            <input
              type="number"
              value={additionalDiscount || ""}
              onChange={(e) => setAdditionalDiscount(Number(e.target.value) || 0)}
              placeholder="0"
              min={0}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            />
            <p className="text-xs text-slate-500">Optional: Enter any additional discount for extended nights</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          {/* Price Preview */}
          {preview && !error && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-2">Price Preview</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Additional Nights:</span>
                  <span className="font-medium">{preview.additionalNights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Rate:</span>
                  <span>Rs {(guest?.room?.rate || 0).toLocaleString()}/night</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>Rs {preview.grossAmount.toLocaleString()}</span>
                </div>
                {(preview.stdDiscountAmt > 0 || preview.addlDiscountAmt > 0) && (
                  <>
                    {preview.stdDiscountAmt > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Standard Discount  ({preview.stdDiscountPct}%):</span>
                        <span>-Rs {preview.stdDiscountAmt.toLocaleString()}</span>
                      </div>
                    )}
                    {preview.addlDiscountAmt > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Additional Discount:</span>
                        <span>-Rs {preview.addlDiscountAmt.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                  <span>Net Additional Charges:</span>
                  <span>Rs {preview.netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={isProcessing || !preview || !!error}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? "Extending..." : `Extend by ${preview?.additionalNights || 0} Night(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Invoice Card with Print Support
const InvoiceCard = ({
  invoice,
  guest,
  reservation,
  onPrint,
  onSendEmail,
  isSendingEmail,
  innerRef,
  onOpenPayment,
}) => {
  // Safe formatter for ALL numbers
  const formatNumber = (value: any): string => {
    const num = typeof value === "number" ? value : value ? Number(value) : 0;
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString();
  };

  // Normalize financial fields so old invoices don't break
  const effectiveAdvance =
    typeof invoice.advanceAdjusted === "number" ? invoice.advanceAdjusted : 0;

  const effectiveBalanceDue =
    typeof invoice.balanceDue === "number"
      ? invoice.balanceDue
      : Math.max(0, (invoice.grandTotal || 0) - effectiveAdvance);

  // If we are holding more than the bill, guest has overpaid → refundDue
  const refundDue = Math.max(0, effectiveAdvance - (invoice.grandTotal || 0));

  // SAFE DISCOUNT CALCS
  const standardDiscountAmount = guest.applyDiscount
    ? invoice.discountAmount || 0
    : 0;

  const additionalDiscountAmount = guest.additionaldiscount || 0;
  const promoDiscountAmount = guest.promoDiscount || 0;
  const totalDiscountAmount = standardDiscountAmount + additionalDiscountAmount + promoDiscountAmount;

  return (
    <div ref={innerRef} className="invoice-print-section">
      {/* Print-only receipt header */}
      <div className="hidden invoice-print-only text-center" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>HSQ TOWERS</h1>
        <p style={{ fontSize: '8px', margin: '1px 0' }}>Jhika Gali, Pakistan | +92 330 0491479</p>
        <div className="receipt-divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
        <h2 style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>
          INVOICE #{invoice.invoiceNumber}
        </h2>
        <p style={{ fontSize: '8px', margin: '1px 0' }}>
          {formatInTimeZone(new Date(), "PPP p")}
        </p>
        <div className="receipt-divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Guest & Stay Info - Compact */}
        <div style={{ textAlign: 'left', fontSize: '9px', padding: '2px 0' }}>
          <p style={{ margin: '1px 0' }}><strong>Guest:</strong> {guest.fullName}</p>
          <p style={{ margin: '1px 0' }}><strong>Room:</strong> {guest.room?.roomNumber} ({guest.room?.category})</p>
          <p style={{ margin: '1px 0' }}><strong>Check-in:</strong> {formatInTimeZone(guest.checkInAt, "MMM d, yyyy")}</p>
          <p style={{ margin: '1px 0' }}><strong>Check-out:</strong> {guest.checkOutAt ? formatInTimeZone(guest.checkOutAt, "MMM d, yyyy") : 'N/A'}</p>
          <p style={{ margin: '1px 0' }}><strong>Duration:</strong> {guest.stayDuration} night(s)</p>
        </div>
        <div className="receipt-divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
      </div>

      <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden screen-invoice-card">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
              <FileText className="mr-2 h-5 w-5 text-primary invoice-print-hidden" />
              <span>Invoice Number {invoice.invoiceNumber}</span>
            </CardTitle>
            <Badge
              variant="outline"
              className={
                invoice.status === "paid"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                  : invoice.status === "cancelled"
                    ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                    : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
              }
            >
              {invoice.status ? invoice.status.toUpperCase() : "PENDING"}
            </Badge>
          </div>
          <CardDescription>
            Generated on {formatInTimeZone(invoice.createdAt, "PPP")}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Top: Billed To & Stay Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Billed To
              </h3>
              <p className="font-medium">{guest.fullName}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {guest.address}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {guest.phone}
              </p>
              {guest.email && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {guest.email}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Stay Details
              </h3>
              <p className="text-sm">
                <span className="font-medium">Room:</span>{" "}
                {guest.room.roomNumber} ({guest.room.category})
              </p>
              <p className="text-sm">
                <span className="font-medium">Check-in:</span>{" "}
                {formatInTimeZone(guest.checkInAt, "MMM d, yyyy")}
              </p>
              {reservation && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  <span className="font-medium">Original Booking:</span>{" "}
                  {formatInTimeZone(reservation.startAt, "MMM d, yyyy")}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Check-out:</span>{" "}
                {guest.checkOutAt
                  ? formatInTimeZone(guest.checkOutAt, "MMM d, yyyy")
                  : "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Duration:</span>{" "}
                {guest.stayDuration} day(s)
              </p>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 mb-6">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="h-10 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">
                    Description
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">
                    Qty
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">
                    Rate
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-200 dark:border-slate-700"
                  >
                    <td className="p-4 align-middle">{item.description}</td>
                    <td className="p-4 align-middle text-right">
                      {item.quantity}
                    </td>
                    <td className="p-4 align-middle text-right">
                      Rs{(item.total / item.quantity).toLocaleString()}
                    </td>
                    <td className="p-4 align-middle text-right font-medium">
                      Rs{item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Totals */}
          <div className="flex flex-col space-y-3 ml-auto w-full md:w-1/2 border rounded-md p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium flex items-center">Sub Total (All Inclusive):</span>
              <span>Rs{formatNumber(invoice.subtotal)}</span>
            </div>

            {/* Discounts Section */}
            {guest.applyDiscount && standardDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
                  Standard Discount: (Room Rent Portion Only)
                </span>
                <span>-Rs{formatNumber(standardDiscountAmount)}</span>
              </div>
            )}

            {guest.additionaldiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
                  Additional Discount: (Room Rent Portion Only)
                </span>
                <span>-Rs{formatNumber(additionalDiscountAmount)}</span>
              </div>
            )}

            {guest.promoDiscount && guest.promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
                  Promo Discount: {guest.promoCode ? `(${guest.promoCode})` : ''}
                </span>
                <span>-Rs{formatNumber(guest.promoDiscount)}</span>
              </div>
            )}

            {totalDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="flex items-center">
                  <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
                  Total Discount:
                </span>
                <span>-Rs{formatNumber(totalDiscountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium flex items-center">
                <PieChart className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
                Tax ({invoice.taxRate}%):
              </span>
              <span>Rs{formatNumber(invoice.taxAmount)}</span>
            </div>

            <Separator className="my-1" />

            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span className="text-primary">
                Rs{formatNumber(invoice.grandTotal)}
              </span>
            </div>

            {effectiveAdvance > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400 font-medium text-sm">
                <span>Less: Paid/Advance:</span>
                <span>-Rs{formatNumber(effectiveAdvance)}</span>
              </div>
            )}

            <Separator className="my-1" />

            <div className="flex justify-between font-bold text-xl mt-2">
              <span>Balance Due:</span>
              <span
                className={
                  effectiveBalanceDue > 0 ? "text-red-600" : "text-emerald-600"
                }
              >
                Rs{formatNumber(effectiveBalanceDue)}
              </span>
            </div>

            {refundDue > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex justify-between items-center text-red-700 font-bold">
                  <span>Refund Due:</span>
                  <span>Rs {formatNumber(refundDue)}</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Guest overpaid (Early Checkout or Deposit).
                </p>
              </div>
            )}

            {/* 1. Guest still owes us money → blue button = Receive Payment only */}
            {effectiveBalanceDue > 0 && (
              <Button
                onClick={() => onOpenPayment("payment")}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white invoice-print-hidden"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Settle Bill (Rs {formatNumber(effectiveBalanceDue)})
              </Button>
            )}

            {/* 2. Hotel owes guest money → red button = Refund only */}
            {refundDue > 0 && (
              <Button
                onClick={() => onOpenPayment("refund")}
                variant="destructive"
                className="w-full mt-4 border-red-200 text-white bg-red-600 hover:bg-red-700 invoice-print-hidden"
              >
                Issue Refund (Rs {formatNumber(refundDue)})
              </Button>
            )}

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Payment Method:</span>
              <span className="capitalize">{guest.paymentMethod}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2 invoice-print-hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
          <Button
            size="sm"
            onClick={onSendEmail}
            disabled={isSendingEmail}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSendingEmail ? "Sending..." : "Send Email"}
          </Button>
        </CardFooter>
      </Card>

      {/* Print-only receipt items and totals */}
      <div className="hidden invoice-print-only" style={{ fontSize: '9px' }}>
        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '2px 0', fontSize: '8px' }}>Item</th>
              <th style={{ textAlign: 'right', padding: '2px 0', fontSize: '8px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '2px 0', fontSize: '8px' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '2px 0', fontSize: '8px' }}>{item.description}</td>
                <td style={{ textAlign: 'right', padding: '2px 0', fontSize: '8px' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '2px 0', fontSize: '8px' }}>Rs{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Totals */}
        <div style={{ fontSize: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span>Subtotal:</span>
            <span>Rs{formatNumber(invoice.subtotal)}</span>
          </div>
          {totalDiscountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span>Discount:</span>
              <span>-Rs{formatNumber(totalDiscountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span>Tax ({invoice.taxRate}%):</span>
            <span>Rs{formatNumber(invoice.taxAmount)}</span>
          </div>
          <div className="receipt-double-divider" style={{ borderTop: '2px solid #000', margin: '3px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 'bold', fontSize: '11px' }}>
            <span>TOTAL:</span>
            <span>Rs{formatNumber(invoice.grandTotal)}</span>
          </div>
          {effectiveAdvance > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '9px' }}>
              <span>Paid/Advance:</span>
              <span>-Rs{formatNumber(effectiveAdvance)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>
            <span>BALANCE DUE:</span>
            <span>Rs{formatNumber(effectiveBalanceDue)}</span>
          </div>
        </div>

        <div className="receipt-divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '8px', padding: '2px 0' }}>
          <p style={{ margin: '1px 0', fontWeight: 'bold' }}>
            {guest.status === 'checked-out' ? '*** PAID ***' : 'Payment Method: ' + guest.paymentMethod}
          </p>
          <p style={{ margin: '2px 0' }}>Thank you for staying with us!</p>
          <p style={{ margin: '1px 0' }}>HSQ Towers - Jhika Gali</p>
        </div>
      </div>
    </div>
  );
};

// Invoice Card with Print Support
// const InvoiceCard = ({
//   invoice,
//   guest,
//   onPrint,
//   onSendEmail,
//   isSendingEmail,
//   innerRef,
//   onOpenPayment,
// }) => {

//   const formatNumber = (value: any): string => {
//     const num = typeof value === "number" ? value : value ? Number(value) : 0;
//     if (Number.isNaN(num)) return "0";
//     return num.toLocaleString();
//   };

//   // Normalize financial fields so old invoices don't break
//   const effectiveAdvance =
//     typeof invoice.advanceAdjusted === "number" ? invoice.advanceAdjusted : 0;

//   const effectiveBalanceDue =
//     typeof invoice.balanceDue === "number"
//       ? invoice.balanceDue
//       : Math.max(0, (invoice.grandTotal || 0) - effectiveAdvance);

//   const refundDue = Math.max(0, effectiveAdvance - (invoice.grandTotal || 0));

//   // SAFE DISCOUNT CALCS
//   const standardDiscountAmount = guest.applyDiscount
//     ? invoice.discountAmount || 0
//     : 0;

//   const additionalDiscountAmount = guest.additionaldiscount || 0;
//   const totalDiscountAmount = standardDiscountAmount + additionalDiscountAmount;

//   return (
//     <div ref={innerRef} className="invoice-print-section">
//       {/* Print-only header for invoice */}
//       <div className="hidden invoice-print-only text-center mb-8">
//         <h1 className="text-3xl font-bold">HSQ TOWERS</h1>
//         <p className="text-slate-600">HSQ Towers, Jhika Gali, Pakistan</p>
//         <p className="text-slate-600">
//           Tel: +92 330 0491479 | Email: hsqtower@gmail.com
//         </p>
//         <div className="mt-6 border-t border-b py-3">
//           <h2 className="text-2xl font-bold">
//             INVOICE #{invoice.invoiceNumber}
//           </h2>
//           <p className="text-sm text-slate-600">
//             Generated on: {new Date().toLocaleDateString()}
//           </p>
//         </div>
//       </div>

//       <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
//         <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
//           <div className="flex justify-between items-center">
//             <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
//               <FileText className="mr-2 h-5 w-5 text-primary invoice-print-hidden" />
//               <span>Invoice Number {invoice.invoiceNumber}</span>
//             </CardTitle>
//             <Badge
//               variant="outline"
//               className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
//             >
//               {invoice.status ? "PAID" : "PENDING"}
//             </Badge>
//           </div>
//           <CardDescription>
//             Generated on {new Date(invoice.createdAt).toLocaleDateString()}
//           </CardDescription>
//         </CardHeader>

//         <CardContent className="pt-6">
//           <div className="grid md:grid-cols-2 gap-6 mb-6">
//             <div>
//               <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
//                 Billed To
//               </h3>
//               <p className="font-medium">{guest.fullName}</p>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 {guest.address}
//               </p>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 {guest.phone}
//               </p>
//               {guest.email && (
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   {guest.email}
//                 </p>
//               )}
//             </div>
//             <div>
//               <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
//                 Stay Details
//               </h3>
//               <p className="text-sm">
//                 <span className="font-medium">Room:</span>{" "}
//                 {guest.room.roomNumber} ({guest.room.category})
//               </p>
//               <p className="text-sm">
//                 <span className="font-medium">Check-in:</span>{" "}
//                 {new Date(guest.checkInAt).toLocaleDateString()}
//               </p>
//               <p className="text-sm">
//                 <span className="font-medium">Check-out:</span>{" "}
//                 {guest.checkOutAt
//                   ? new Date(guest.checkOutAt).toLocaleDateString()
//                   : "N/A"}
//               </p>
//               <p className="text-sm">
//                 <span className="font-medium">Duration:</span>{" "}
//                 {guest.stayDuration} day(s)
//               </p>
//             </div>
//           </div>

//           <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 mb-6">
//             <table className="w-full caption-bottom text-sm">
//               <thead className="bg-slate-50 dark:bg-slate-800">
//                 <tr className="border-b border-slate-200 dark:border-slate-700">
//                   <th className="h-10 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">
//                     Description
//                   </th>
//                   <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">
//                     Qty
//                   </th>
//                   <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">
//                     Rate
//                   </th>
//                   <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">
//                     Amount
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoice.items.map((item, index) => (
//                   <tr
//                     key={index}
//                     className="border-b border-slate-200 dark:border-slate-700"
//                   >
//                     <td className="p-4 align-middle">{item.description}</td>
//                     <td className="p-4 align-middle text-right">
//                       {item.quantity}
//                     </td>
//                     <td className="p-4 align-middle text-right">
//                       Rs{(item.total / item.quantity).toLocaleString()}
//                     </td>
//                     <td className="p-4 align-middle text-right font-medium">
//                       Rs{item.total.toLocaleString()}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div className="flex flex-col space-y-3 ml-auto w-full md:w-1/2 border rounded-md p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
//             <div className="flex justify-between text-slate-600 dark:text-slate-400">
//               <span className="font-medium flex items-center">Room Total:</span>
//               <span>Rs{formatNumber(invoice.subtotal)}</span>
//             </div>

//             {/* Discounts Section */}
//             {guest.applyDiscount && standardDiscountAmount > 0 && (
//               <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
//                 <span className="font-medium flex items-center">
//                   <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
//                   Standard Discount:
//                 </span>
//                 <span>-Rs{formatNumber(standardDiscountAmount)}</span>
//               </div>
//             )}

//             {guest.additionaldiscount > 0 && (
//               <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
//                 <span className="font-medium flex items-center">
//                   <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
//                   Additional Discount:
//                 </span>
//                 <span>-Rs{formatNumber(additionalDiscountAmount)}</span>
//               </div>
//             )}

//             {totalDiscountAmount > 0 && (
//               <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
//                 <span className="flex items-center">
//                   <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
//                   Total Discount:
//                 </span>
//                 <span>-Rs{formatNumber(totalDiscountAmount)}</span>
//               </div>
//             )}

//             <div className="flex justify-between text-slate-600 dark:text-slate-400">
//               <span className="font-medium flex items-center">
//                 <PieChart className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" />{" "}
//                 Tax ({invoice.taxRate}%):
//               </span>
//               <span>Rs{formatNumber(invoice.taxAmount)}</span>
//             </div>

//             <Separator className="my-1" />

//             <div className="flex justify-between font-bold text-lg">
//               <span>Grand Total:</span>
//               <span className="text-primary">
//                 Rs{formatNumber(invoice.grandTotal)}
//               </span>
//             </div>

//             {effectiveAdvance > 0 && (
//               <div className="flex justify-between text-green-600 dark:text-green-400 font-medium text-sm">
//                 <span>Less: Paid/Advance:</span>
//                 <span>-Rs{formatNumber(effectiveAdvance)}</span>
//               </div>
//             )}

//             <Separator className="my-1" />

//             <div className="flex justify-between font-bold text-xl mt-2">
//               <span>Balance Due:</span>
//               <span
//                 className={
//                   effectiveBalanceDue > 0 ? "text-red-600" : "text-emerald-600"
//                 }
//               >
//                 Rs{formatNumber(effectiveBalanceDue)}
//               </span>
//             </div>

//             {refundDue > 0 && (
//               <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 animate-in fade-in slide-in-from-top-2">
//                 <div className="flex justify-between items-center text-red-700 font-bold">
//                   <span>Refund Due:</span>
//                   <span>Rs {formatNumber(refundDue)}</span>
//                 </div>
//                 <p className="text-xs text-red-600 mt-1">
//                   Guest overpaid (Early Checkout or Deposit).
//                 </p>
//               </div>
//             )}

//             {/* 1. Guest still owes us money → blue Settle Bill */}
//             {effectiveBalanceDue > 0 && (
//               <Button
//                 onClick={onOpenPayment}
//                 className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white invoice-print-hidden"
//               >
//                 <CreditCard className="mr-2 h-4 w-4" />
//                 Settle Bill (Rs {formatNumber(effectiveBalanceDue)})
//               </Button>
//             )}

//             {/* 2. Guest does NOT owe us, but we owe guest → red Issue Refund */}
//             {effectiveBalanceDue === 0 && refundDue > 0 && (
//               <Button
//                 onClick={onOpenPayment}
//                 variant="destructive"
//                 className="w-full mt-4 border-red-200 text-white bg-red-600 hover:bg-red-700 invoice-print-hidden"
//               >
//                 Issue Refund (Rs {formatNumber(refundDue)})
//               </Button>
//             )}

//             <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
//               <span>Payment Method:</span>
//               <span className="capitalize">{guest.paymentMethod}</span>
//             </div>
//           </div>
//         </CardContent>

//         <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2 invoice-print-hidden">
//           <Button
//             size="sm"
//             variant="outline"
//             onClick={onPrint}
//             className="hover:bg-slate-100 dark:hover:bg-slate-700"
//           >
//             <Printer className="mr-2 h-4 w-4" /> Print Invoice
//           </Button>
//           <Button
//             size="sm"
//             onClick={onSendEmail}
//             disabled={isSendingEmail}
//             className="bg-primary hover:bg-primary/90"
//           >
//             <Send className="mr-2 h-4 w-4" />
//             {isSendingEmail ? "Sending..." : "Send Email"}
//           </Button>
//         </CardFooter>
//       </Card>

//       {/* Print-only footer */}
//       <div className="hidden invoice-print-only mt-8 pt-6 border-t text-center text-sm text-slate-600">
//         <p className="font-semibold mb-1">Thank you for choosing HSQ Towers!</p>
//         <p>
//           For any inquiries regarding this invoice, please contact our
//           accounting department at accounts@hsqtowers.com
//         </p>
//         <p className="mt-6 text-lg font-bold">
//           {guest.status === "checked-out" ? (
//             "PAID IN FULL"
//           ) : (
//             <>BALANCE DUE: Rs{formatNumber(effectiveBalanceDue)}</>
//           )}
//         </p>
//         <div className="mt-8 text-xs text-slate-500">
//           <p>HSQ Towers - Your Home Away From Home</p>
//           <p>Invoice generated by HSQ Hotel Management System</p>
//         </div>
//       </div>
//     </div>
//   );
// };

const GuestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pageRef = useRef(null);
  const invoiceRef = useRef(null);

  const {
    guest,
    invoice,
    reservation,
    loading,
    error,
    fetchGuestById,
    updateGuest,
    checkoutGuest,
    sendInvoiceByEmail,
  } = useGuestContext();

  // Dialog states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPayModalOpen, setPayModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<
    "payment" | "refund"
  >("payment");
  const [paymentModalMode, setPaymentModalMode] = useState<
    "both" | "payment-only" | "refund-only"
  >("both");

  // Add CSS for invoice-only printing - Receipt/Token Format (80mm width)
  useEffect(() => {
    // Create a style element
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: 80mm auto;
          margin: 3mm;
        }
        body * {
          visibility: hidden;
        }
        .invoice-print-hidden {
          display: none !important;
        }
        .invoice-print-section,
        .invoice-print-section * {
          visibility: visible;
        }
        .invoice-print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 76mm !important;
          max-width: 76mm !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
          padding: 2mm !important;
        }
        .invoice-print-only {
          display: block !important;
        }
        /* Hide the screen card, show receipt format */
        .invoice-print-section .screen-invoice-card {
          display: none !important;
        }
        /* Compact receipt table styling */
        .invoice-print-section table {
          font-size: 9px !important;
          width: 100% !important;
        }
        .invoice-print-section table th,
        .invoice-print-section table td {
          padding: 1px 2px !important;
        }
        .invoice-print-section h1 {
          font-size: 14px !important;
          margin: 0 !important;
        }
        .invoice-print-section h2 {
          font-size: 12px !important;
          margin: 0 !important;
        }
        .invoice-print-section p {
          margin: 1px 0 !important;
          font-size: 9px !important;
        }
        .receipt-divider {
          border-top: 1px dashed #000 !important;
          margin: 4px 0 !important;
        }
        .receipt-double-divider {
          border-top: 2px solid #000 !important;
          margin: 4px 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch guest data on initial load
  useEffect(() => {
    if (id) {
      fetchGuestById(id);
    } else {
      navigate("/guests"); // Redirect if no ID
    }
  }, [id, fetchGuestById, navigate]);

  // Handle guest update
  const handleUpdate = useCallback(
    async (data) => {
      if (!id) return;
      await updateGuest(id, data);
    },
    [id, updateGuest]
  );

  // Handle guest checkout
  const handleCheckout = useCallback(async () => {
    if (!id) return;
    try {
      // @ts-ignore
      const res = await checkoutGuest(id);

      // Check for refund
      if (res && res.data && res.data.refundDue > 0) {
        toast({
          title: "Guest Checked Out",
          description: `REFUND DUE: Rs ${res.data.refundDue.toLocaleString()}`,
          duration: 10000,
          style: { border: '2px solid red', backgroundColor: '#FEF2F2', color: '#B91C1C' }
        });
      } else {
        toast({ title: "Guest successfully checked out" });
      }
      setIsCheckoutOpen(false);
    } catch (err) {
      // Error handled by context
      setIsCheckoutOpen(false);
    }
  }, [id, checkoutGuest, toast]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (id) fetchGuestById(id);
  }, [id, fetchGuestById]);

  // Print Invoice function - uses jsPDF to generate a proper receipt-sized PDF
  const handlePrintInvoice = useCallback(() => {
    if (!invoice || !guest) return;

    // Format number helper
    const formatNum = (value: any): string => {
      const num = typeof value === "number" ? value : value ? Number(value) : 0;
      if (Number.isNaN(num)) return "0";
      return num.toLocaleString();
    };

    // Calculate totals
    const standardDiscountAmount = guest.applyDiscount ? (invoice.discountAmount || 0) : 0;
    const additionalDiscountAmount = guest.additionaldiscount || 0;
    const totalDiscountAmount = standardDiscountAmount + additionalDiscountAmount;
    const effectiveAdvance = typeof invoice.advanceAdjusted === "number" ? invoice.advanceAdjusted : 0;
    const effectiveBalanceDue = typeof invoice.balanceDue === "number"
      ? invoice.balanceDue
      : Math.max(0, (invoice.grandTotal || 0) - effectiveAdvance);

    // Create PDF with 80mm width (convert to points: 80mm = 226.77 points)
    // Using custom page size for receipt
    const receiptWidth = 80; // mm
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [receiptWidth, 200] // width x height (height will grow)
    });

    const margin = 3;
    const pageWidth = receiptWidth - (margin * 2);
    let yPos = margin + 2;
    const lineHeight = 4;
    const smallLineHeight = 3;

    // Helper functions
    const drawDashedLine = (y: number) => {
      doc.setLineDashPattern([1, 1], 0);
      doc.setLineWidth(0.1);
      doc.line(margin, y, receiptWidth - margin, y);
      doc.setLineDashPattern([], 0);
    };

    const drawSolidLine = (y: number) => {
      doc.setLineWidth(0.3);
      doc.line(margin, y, receiptWidth - margin, y);
    };

    const centerText = (text: string, y: number, fontSize: number = 8) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (receiptWidth - textWidth) / 2, y);
    };

    const leftRightText = (left: string, right: string, y: number, fontSize: number = 8) => {
      doc.setFontSize(fontSize);
      doc.text(left, margin, y);
      const rightWidth = doc.getTextWidth(right);
      doc.text(right, receiptWidth - margin - rightWidth, y);
    };

    // === HEADER ===
    doc.setFont("helvetica", "bold");
    centerText("HSQ TOWERS", yPos, 14);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    centerText("Jhika Gali, Pakistan", yPos, 7);
    yPos += 3;
    centerText("+92 330 0491479", yPos, 7);
    yPos += 4;

    drawDashedLine(yPos);
    yPos += 3;

    // === INVOICE INFO ===
    doc.setFont("helvetica", "bold");
    centerText(`INVOICE #${invoice.invoiceNumber}`, yPos, 10);
    yPos += 4;

    doc.setFont("helvetica", "normal");
    const dateStr = formatInTimeZone(new Date(), "PPP p");
    centerText(dateStr, yPos, 7);
    yPos += 4;

    drawDashedLine(yPos);
    yPos += 4;

    // === GUEST INFO ===
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Guest:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(guest.fullName, margin + 12, yPos);
    yPos += smallLineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Room:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${guest.room?.roomNumber || 'N/A'} (${guest.room?.category || 'N/A'})`, margin + 12, yPos);
    yPos += smallLineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Check-in:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatInTimeZone(guest.checkInAt, "MMM d, yyyy"), margin + 16, yPos);
    yPos += smallLineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Check-out:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(guest.checkOutAt ? formatInTimeZone(guest.checkOutAt, "MMM d, yyyy") : 'N/A', margin + 18, yPos);
    yPos += smallLineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Duration:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${guest.stayDuration} night(s)`, margin + 16, yPos);
    yPos += 4;

    drawDashedLine(yPos);
    yPos += 3;

    // === ITEMS TABLE HEADER ===
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("Item", margin, yPos);
    doc.text("Qty", margin + 45, yPos);
    doc.text("Amt", receiptWidth - margin - doc.getTextWidth("Amt"), yPos);
    yPos += 2;
    drawSolidLine(yPos);
    yPos += 3;

    // === ITEMS ===
    doc.setFont("helvetica", "normal");
    invoice.items.forEach((item: any) => {
      const desc = item.description.length > 25 ? item.description.substring(0, 22) + "..." : item.description;
      doc.text(desc, margin, yPos);
      doc.text(String(item.quantity), margin + 47, yPos);
      const amtText = `Rs${item.total.toLocaleString()}`;
      doc.text(amtText, receiptWidth - margin - doc.getTextWidth(amtText), yPos);
      yPos += smallLineHeight;
    });
    yPos += 1;

    drawDashedLine(yPos);
    yPos += 3;

    // === TOTALS ===
    doc.setFontSize(8);
    leftRightText("Subtotal:", `Rs${formatNum(invoice.subtotal)}`, yPos);
    yPos += smallLineHeight;

    if (totalDiscountAmount > 0) {
      leftRightText("Discount:", `-Rs${formatNum(totalDiscountAmount)}`, yPos);
      yPos += smallLineHeight;
    }

    leftRightText(`Tax (${invoice.taxRate}%):`, `Rs${formatNum(invoice.taxAmount)}`, yPos);
    yPos += 3;

    drawSolidLine(yPos);
    yPos += 4;

    // === GRAND TOTAL ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    leftRightText("TOTAL:", `Rs${formatNum(invoice.grandTotal)}`, yPos, 10);
    yPos += 4;

    if (effectiveAdvance > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      leftRightText("Paid/Advance:", `-Rs${formatNum(effectiveAdvance)}`, yPos);
      yPos += smallLineHeight;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    leftRightText("BALANCE DUE:", `Rs${formatNum(effectiveBalanceDue)}`, yPos, 9);
    yPos += 4;

    drawDashedLine(yPos);
    yPos += 4;

    // === FOOTER ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const paymentStatus = guest.status === 'checked-out' ? '*** PAID ***' : `Payment: ${guest.paymentMethod}`;
    centerText(paymentStatus, yPos);
    yPos += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    centerText("Thank you for staying with us!", yPos);
    yPos += 3;
    centerText("HSQ Towers - Your Home Away From Home", yPos);
    yPos += 5;

    // Open PDF in new tab for printing
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    toast({
      title: "Receipt generated",
      description: "The receipt PDF has been opened. Use Ctrl+P to print.",
    });
  }, [invoice, guest, toast]);

  // Email invoice function
  const handleSendInvoice = useCallback(async () => {
    if (!invoice) return;

    setIsSendingEmail(true);
    try {
      await sendInvoiceByEmail(invoice._id);
      toast({
        title: "Invoice sent",
        description: "The invoice has been sent to the guest's email address.",
      });
    } catch (err) {
      toast({
        title: "Failed to send invoice",
        description: "Please check the guest's email address and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  }, [invoice, sendInvoiceByEmail, toast]);

  // Status badge color
  const getStatusColor = useMemo(
    () => (status) =>
      status === "checked-in"
        ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
        : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    []
  );

  // NEW: Format date for display (DATE ONLY)
  const formatOnlyDate = (dateString) => {
    if (!dateString) return "N/A";
    return formatInTimeZone(dateString, "MMM d, yyyy");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return formatInTimeZone(dateString, "PPP p");
  };

  const handlePaymentSuccess = useCallback(() => {
    if (id) fetchGuestById(id);
    toast({
      title: "Payment Recorded",
      description: "Invoice balance updated.",
    });
  }, [id, fetchGuestById, toast]);

  const safeFormat = (value) => {
    return (value || 0).toLocaleString();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          {/* Mobile Toggle */}
          <div className="lg:hidden mb-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-slate-600" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Guest Details</h1>
          </div>

          <div className="container mx-auto px-4 py-6 md:px-6 max-w-7xl">
            {/* Header with navigation and actions - hide during print */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
              <div className="flex items-center flex-wrap gap-2 sm:gap-0">
                <Link to="/guests">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Guests</span>
                  </Button>
                </Link>

                {guest && (
                  <h1 className="ml-2 sm:ml-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                    {guest.fullName}
                  </h1>
                )}
              </div>

              {guest && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditOpen(true)}
                    className="border-slate-200 dark:border-slate-700 flex-1 sm:flex-none"
                  >
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit Details</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>

                  {guest.status === "checked-in" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsExtendOpen(true)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
                      >
                        <Calendar className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Extend Stay</span>
                        <span className="sm:hidden">Extend</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setIsCheckoutOpen(true)}
                        className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
                      >
                        <LogOut className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Check Out</span>
                        <span className="sm:hidden">Out</span>
                      </Button>
                    </>
                  )}

                  {/* Invoice Action Buttons */}
                  {invoice && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintInvoice}
                        className="border-slate-200 dark:border-slate-700 flex-1 sm:flex-none"
                      >
                        <Printer className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Print Invoice</span>
                        <span className="sm:hidden">Print</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendInvoice}
                        disabled={isSendingEmail}
                        className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                      >
                        <Send className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{isSendingEmail ? "Sending..." : "Email Invoice"}</span>
                        <span className="sm:hidden">{isSendingEmail ? "..." : "Email"}</span>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Main content container */}
            <div className="min-h-[500px]" ref={pageRef}>
              {loading ? (
                <GuestDetailSkeleton />
              ) : error ? (
                <ErrorDisplay message={error} onRetry={handleRetry} />
              ) : !guest ? (
                <ErrorDisplay message="Guest not found" onRetry={undefined} />
              ) : (
                <div className="space-y-8">
                  {/* Guest Information Card */}
                  <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                          <User className="mr-2 h-5 w-5 text-primary" />
                          <span>Guest Information</span>
                        </CardTitle>

                        <Badge className={getStatusColor(guest.status)}>
                          {guest.status === "checked-in"
                            ? "Currently Staying"
                            : "Checked Out"}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-500 dark:text-slate-400">
                        Personal and contact details
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <User className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Full Name
                            </p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {guest.fullName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <FileText className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              CNIC
                            </p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {guest.cnic}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Home className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Address
                            </p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {guest.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Phone className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Phone
                            </p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {guest.phone}
                            </p>
                          </div>
                        </div>

                        {guest.email && (
                          <div className="flex items-start">
                            <Mail className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Email
                              </p>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {guest.email}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start">
                          <CreditCard className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Payment Method
                            </p>
                            <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                              {guest.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stay Information Card */}
                  <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                        <Clock className="mr-2 h-5 w-5 text-primary" />
                        <span>Stay Information</span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                      {/* Left Column - Room Details */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Home className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Room Number
                            </p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                              {guest.room.roomNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Tag className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Room Type
                            </p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                              {guest.room.category}
                              <span className="font-normal text-slate-600 dark:text-slate-400 ml-2">
                                • {guest.room.bedType}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Users className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                              Occupancy
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 px-2.5 py-0.5"
                              >
                                {guest.adults || 1} Adult
                                {(guest.adults || 1) !== 1 ? "s" : ""}
                              </Badge>
                              {guest.infants > 0 && (
                                <Badge
                                  variant="outline"
                                  className="font-medium bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 px-2.5 py-0.5"
                                >
                                  {guest.infants} Infant
                                  {guest.infants !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Banknote className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Room Rate
                            </p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                              Rs {guest.room.rate.toLocaleString()}
                              <span className="font-normal text-sm text-slate-600 dark:text-slate-400">
                                /night
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Stay Timeline & Payment */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Check-In
                            </p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                              {guest.checkInAt ? formatDate(guest.checkInAt) : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Calendar className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Check-Out
                            </p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                              {guest.checkOutAt
                                ? guest.status === "checked-in"
                                  ? formatOnlyDate(guest.checkOutAt)
                                  : formatDate(guest.checkOutAt)
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Clock className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Duration
                            </p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                              {guest.stayDuration} Night
                              {guest.stayDuration !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Receipt className="h-4 w-4 mt-0.5 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                              Total Amount
                            </p>
                            <div className="space-y-2">
                              <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                                Rs {guest.totalRent.toLocaleString()}
                              </p>
                              {(guest.applyDiscount ||
                                guest.additionaldiscount > 0) && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {guest.applyDiscount && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 px-2 py-0.5"
                                      >
                                        <Percent className="h-3 w-3 mr-1" />
                                        Standard
                                      </Badge>
                                    )}
                                    {guest.additionaldiscount > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 px-2 py-0.5"
                                      >
                                        <Tag className="h-3 w-3 mr-1" />
                                        Rs {guest.additionaldiscount} Off
                                      </Badge>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice Card (if available) */}
                  {invoice && (
                    <InvoiceCard
                      invoice={invoice}
                      guest={guest}
                      reservation={reservation}
                      onPrint={handlePrintInvoice}
                      onSendEmail={handleSendInvoice}
                      isSendingEmail={isSendingEmail}
                      innerRef={invoiceRef}
                      onOpenPayment={(kind: "payment" | "refund") => {
                        setPaymentModalType(kind);
                        setPaymentModalMode(
                          kind === "payment" ? "payment-only" : "refund-only"
                        );
                        setPayModalOpen(true);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Dialogs - always hidden in print */}
            <div>
              {guest && (
                <>
                  <EditGuestDialog
                    isOpen={isEditOpen}
                    setIsOpen={setIsEditOpen}
                    guest={guest}
                    onUpdate={handleUpdate}
                  />

                  <CheckoutDialog
                    isOpen={isCheckoutOpen}
                    setIsOpen={setIsCheckoutOpen}
                    onCheckout={handleCheckout}
                  />

                  <ExtendStayDialog
                    isOpen={isExtendOpen}
                    setIsOpen={setIsExtendOpen}
                    guest={guest}
                    invoice={invoice}
                    onSuccess={() => fetchGuestById(id!)}
                  />
                  <PaymentModal
                    isOpen={isPayModalOpen}
                    onClose={() => setPayModalOpen(false)}
                    context="guest"
                    contextId={guest._id}
                    onSuccess={handlePaymentSuccess}
                    // For payments: prefill with balance; for refunds: start at 0 (user types)
                    defaultAmount={
                      paymentModalType === "payment" ? invoice?.balanceDue || 0 : 0
                    }
                    initialType={paymentModalType}
                    mode={paymentModalMode}
                  />
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GuestDetailPage;
