import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  DollarSign,
} from "lucide-react";

// UI Components
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

// Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import { useGuestContext, Guest, Invoice } from "@/contexts/GuestContext";

const getExpectedCheckoutDate = (checkIn: string, duration: number) => {
  const checkInDate = new Date(checkIn);
  checkInDate.setDate(checkInDate.getDate() + duration);
  return checkInDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// === Sub-Components ===

// Skeleton loader for guest information
const GuestDetailSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Card className="mb-4">
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex">
            <Skeleton className="h-5 w-24 mr-2" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex">
            <Skeleton className="h-5 w-24 mr-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Error display component
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => (
  <Alert variant="destructive" className="my-4">
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
interface EditGuestDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  guest: Guest;
  onUpdate: (data: Partial<Guest>) => Promise<void>;
}

const EditGuestDialog: React.FC<EditGuestDialogProps> = ({
  isOpen,
  setIsOpen,
  guest,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<Partial<Guest>>({
    fullName: "",
    address: "",
    phone: "",
    cnic: "",
    email: "",
    paymentMethod: "cash",
    additionaldiscount: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens with guest data
  useEffect(() => {
    if (guest && isOpen) {
      setFormData({
        fullName: guest.fullName,
        address: guest.address,
        phone: guest.phone,
        cnic: guest.cnic,
        email: guest.email || "",
        paymentMethod: guest.paymentMethod,
        additionaldiscount: guest.additionaldiscount,
      });
    }
  }, [guest, isOpen]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.cnic) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
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
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentMethod: value as "cash" | "card" | "online",
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
          <div className="space-y-2">
            <Label htmlFor="additionaldiscount">Additional Discount (Rs)</Label>
            <Input
              id="additionaldiscount"
              name="additionaldiscount"
              type="number"
              min={0}
              step="0.01"
              value={formData.additionaldiscount || 0}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="0.00"
            />
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
interface CheckoutDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCheckout: () => Promise<void>;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  setIsOpen,
  onCheckout,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      await onCheckout();
      toast({ title: "Guest successfully checked out" });
      setIsOpen(false);
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

// Invoice Card with Print Support
interface InvoiceCardProps {
  invoice: Invoice;
  guest: Guest;
  onPrint: () => void;
  onSendEmail: () => Promise<void>;
  isSendingEmail: boolean;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  guest,
  onPrint,
  onSendEmail,
  isSendingEmail,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5 print:hidden" />
          <span>Invoice #{invoice.invoiceNumber}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {invoice.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.description} × {item.quantity}
            </span>
            <span>Rs{item.total.toLocaleString()}</span>
          </div>
        ))}

        <div className="border-t my-2 pt-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs{invoice.subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-gray-500">
            <span>Discount</span>
            <span>-Rs {invoice.discountAmount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-gray-500">
            <span>Tax ({invoice.taxRate}%)</span>
            <span>Rs {invoice.taxAmount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between font-bold mt-2 text-lg">
            <span>Total</span>
            <span>Rs {invoice.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-2 print:hidden">
        <Button size="sm" variant="outline" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
        <Button size="sm" onClick={onSendEmail} disabled={isSendingEmail}>
          <Send className="mr-2 h-4 w-4" />
          {isSendingEmail ? "Sending..." : "Send Email"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// === Main Component ===

const GuestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const {
    guest,
    invoice,
    loading,
    error,
    fetchGuestById,
    updateGuest,
    checkoutGuest,
    sendInvoiceByEmail,
  } = useGuestContext();

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
    async (data: Partial<Guest>) => {
      if (!id) return;
      await updateGuest(id, data);
    },
    [id, updateGuest]
  );

  // Handle guest checkout
  const handleCheckout = useCallback(async () => {
    if (!id) return;
    await checkoutGuest(id);
  }, [id, checkoutGuest]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (id) fetchGuestById(id);
  }, [id, fetchGuestById]);

  // New Print Invoice function
  const handlePrintInvoice = useCallback(() => {
    if (!invoice || !guest) return;

    // Set a more descriptive page title for the print
    const originalTitle = document.title;
    document.title = `Invoice #${invoice.invoiceNumber} - ${guest.fullName}`;

    // Add print class to body for print-specific styling
    document.body.classList.add("printing-invoice");

    // Call the browser print function
    window.print();

    // Clean up after printing dialog closes
    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove("printing-invoice");
    }, 500);

    toast({
      title: "Print dialog opened",
      description: "The invoice is ready to print",
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
    () => (status: string) =>
      status === "checked-in"
        ? "bg-green-100 text-green-800"
        : "bg-gray-100 text-gray-800",
    []
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header with navigation and actions - hide during print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <div className="flex items-center">
          <Link to="/guests">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Guests
            </Button>
          </Link>

          {guest && (
            <h1 className="ml-4 text-2xl font-bold">{guest.fullName}</h1>
          )}
        </div>

        {guest && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </Button>

            {guest.status === "checked-in" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsCheckoutOpen(true)}
              >
                <LogOut className="mr-2 h-4 w-4" /> Check Out
              </Button>
            )}

            {/* Invoice Action Buttons */}
            {invoice && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrintInvoice}
                >
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendInvoice}
                  disabled={isSendingEmail}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSendingEmail ? "Sending..." : "Email Invoice"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content container - this is what gets printed */}
      <div className="min-h-[500px]" ref={printRef}>
        {/* Print-only header with hotel info */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold">HSQ TOWERS</h1>
          <p className="text-gray-500">HSQ Towers, Jhika Gali, Pakistan</p>
          <p className="text-gray-500">
            Tel: +92 330 0491479 | Email: hsqtower@gmail.com
          </p>
          {invoice && (
            <div className="mt-4 border-t border-b py-2">
              <h2 className="text-2xl font-bold">
                INVOICE #{invoice.invoiceNumber}
              </h2>
              <p className="text-sm text-gray-500">
                Generated on: {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <GuestDetailSkeleton />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={handleRetry} />
        ) : !guest ? (
          <ErrorDisplay message="Guest not found" />
        ) : (
          <div className="space-y-6">
            {/* Guest Information Card */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 print:hidden" />
                  <span className="print:text-xl">Guest Information</span>
                </CardTitle>
                <CardDescription className="print:hidden">
                  Personal and contact details
                </CardDescription>
              </CardHeader>

              <CardContent className="grid md:grid-cols-2 gap-4 print:gap-2 print:text-sm">
                <div className="space-y-2">
                  <div className="flex items-center print:hidden">
                    <Badge className={`${getStatusColor(guest.status)} mr-2`}>
                      {guest.status === "checked-in"
                        ? "Currently Staying"
                        : "Checked Out"}
                    </Badge>
                  </div>

                  <p>
                    <strong>Name:</strong> {guest.fullName}
                  </p>

                  <p>
                    <strong>CNIC:</strong> {guest.cnic}
                  </p>

                  <p>
                    <strong>Address:</strong> {guest.address}
                  </p>
                </div>

                <div className="space-y-2">
                  <p>
                    <Phone className="inline h-4 w-4 mr-1 print:hidden" />
                    <strong>Phone:</strong> {guest.phone}
                  </p>

                  {guest.email && (
                    <p>
                      <strong>Email:</strong> {guest.email}
                    </p>
                  )}

                  <p>
                    <strong>Payment Method:</strong>{" "}
                    {guest.paymentMethod.charAt(0).toUpperCase() +
                      guest.paymentMethod.slice(1)}
                  </p>



                  <p>
                    <strong>Stay Duration:</strong> {guest.stayDuration} day(s)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stay Information Card */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 print:hidden" />
                  <span className="print:text-xl">Stay Information</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="grid md:grid-cols-2 gap-4 print:gap-2 print:text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>Room Number:</strong> {guest.room.roomNumber}
                  </p>

                  <p>
                    <strong>Room Type:</strong> {guest.room.category} (
                    {guest.room.bedType})
                  </p>

                  <p>
                    <strong>View:</strong> {guest.room.view}
                  </p>

                  <p>
                    <strong>Rate:</strong> Rs{guest.room.rate.toLocaleString()}
                    /night
                  </p>
                </div>

                <div className="space-y-2">
                  <p>
                    <strong>Check-in:</strong> {formatDate(guest.checkInAt)}
                  </p>

                  <p>
                    <strong>
                      {guest.checkOutAt ? "Check-out" : "Expected Check-out"}:
                    </strong>{" "}
                    {guest.checkOutAt
                      ? formatDate(guest.checkOutAt)
                      : getExpectedCheckoutDate(
                          guest.checkInAt,
                          guest.stayDuration
                        )}
                  </p>

                  {guest.checkOutAt && (
                    <p>
                      <strong>Check-out:</strong> {formatDate(guest.checkOutAt)}
                    </p>
                  )}

                  <p>
                    <strong>Total:</strong> Rs{guest.totalRent.toLocaleString()}
                    {guest.applyDiscount && (
                      <span className="text-green-600 ml-2">
                        (Discount Applied)
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Card (if available) */}
            {invoice && (
              <InvoiceCard
                invoice={invoice}
                guest={guest}
                onPrint={handlePrintInvoice}
                onSendEmail={handleSendInvoice}
                isSendingEmail={isSendingEmail}
              />
            )}

            {/* Print-only footer */}
            <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-gray-500">
              <p>Thank you for choosing Hotel Management System!</p>
              <p>
                For any inquiries regarding this invoice, please contact our
                accounting department.
              </p>
              <p className="mt-4 font-bold">
                {guest.status === "checked-out"
                  ? "PAID IN FULL"
                  : `BALANCE DUE: Rs${
                      invoice?.grandTotal.toLocaleString() ||
                      guest.totalRent.toLocaleString()
                    }`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs - always hidden in print */}
      <div className="print:hidden">
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
          </>
        )}
      </div>
    </div>
  );
};

export default GuestDetailPage;
