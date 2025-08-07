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
  CreditCard,
  Calendar,
  CheckCircle,
  Home,
  Mail,
  Tag,
  PieChart,
  Percent,
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
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import { useGuestContext, Guest, Invoice } from "@/contexts/GuestContext";

const getExpectedCheckoutDate = (checkIn, duration) => {
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
        <Button variant="outline" size="sm" onClick={onRetry} className="self-start mt-2">
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
    applyDiscount: false,
    additionaldiscount: 0,
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
        paymentMethod: guest.paymentMethod,
        applyDiscount: guest.applyDiscount || false,
        additionaldiscount: guest.additionaldiscount || 0,
      });
    }
  }, [guest, isOpen]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

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
          
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="applyDiscount" className="font-medium">Apply Standard Discount</Label>
              <Switch
                id="applyDiscount"
                checked={formData.applyDiscount}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, applyDiscount: checked }))
                }
                disabled={isSubmitting}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Standard discount is applied to the room rate as per hotel policy
            </p>
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Custom discount amount in Rupees
            </p>
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
          <Button onClick={handleCheckout} variant="destructive" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Confirm Checkout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Invoice Card with Print Support
const InvoiceCard = ({ invoice, guest, onPrint, onSendEmail, isSendingEmail, innerRef }) => {
  // Calculate the standard discount amount (if available)
  const standardDiscountAmount = guest.applyDiscount ? 
    (invoice.standardDiscountAmount || invoice.discountAmount * 0.7) : 0;
  
  // Calculate the additional discount amount
  const additionalDiscountAmount = guest.additionaldiscount || 
    (invoice.additionalDiscountAmount || invoice.discountAmount * 0.3);
  
  // Total discount amount
  const totalDiscountAmount = invoice.discountAmount;

  return (
    <div ref={innerRef} className="invoice-print-section">
      {/* Print-only header for invoice */}
      <div className="hidden invoice-print-only text-center mb-8">
        <h1 className="text-3xl font-bold">HSQ TOWERS</h1>
        <p className="text-slate-600">HSQ Towers, Jhika Gali, Pakistan</p>
        <p className="text-slate-600">
          Tel: +92 330 0491479 | Email: hsqtower@gmail.com
        </p>
        <div className="mt-6 border-t border-b py-3">
          <h2 className="text-2xl font-bold">
            INVOICE #{invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-slate-600">
            Generated on: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
              <FileText className="mr-2 h-5 w-5 text-primary invoice-print-hidden" />
              <span>Invoice Number {" "}{invoice.invoiceNumber}</span>
            </CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
              {invoice.status ? "PAID" : "PENDING"}
            </Badge>
          </div>
          <CardDescription>
            Generated on {new Date(invoice.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Billed To</h3>
              <p className="font-medium">{guest.fullName}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{guest.address}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{guest.phone}</p>
              {guest.email && <p className="text-sm text-slate-600 dark:text-slate-400">{guest.email}</p>}
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Stay Details</h3>
              <p className="text-sm">
                <span className="font-medium">Room:</span> {guest.room.roomNumber} ({guest.room.category})
              </p>
              <p className="text-sm">
                <span className="font-medium">Check-in:</span> {new Date(guest.checkInAt).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Expected Check-out:</span> {guest.checkOutAt ? new Date(guest.checkOutAt).toLocaleDateString() : getExpectedCheckoutDate(guest.checkInAt, guest.stayDuration)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Duration:</span> {guest.stayDuration} day(s)
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 mb-6">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="h-10 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Description</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">Qty</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">Rate</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700">
                    <td className="p-4 align-middle">{item.description}</td>
                    <td className="p-4 align-middle text-right">{item.quantity}</td>
                    <td className="p-4 align-middle text-right">Rs{(item.total / item.quantity).toLocaleString()}</td>
                    <td className="p-4 align-middle text-right font-medium">Rs{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col space-y-3 ml-auto w-full md:w-1/2 border rounded-md p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium flex items-center">
                Room Total:
              </span>
              <span>Rs{invoice.subtotal.toLocaleString()}</span>
            </div>

            {/* Discounts Section */}
            {guest.applyDiscount && standardDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" /> Standard Discount:
                </span>
                <span>-Rs{standardDiscountAmount.toLocaleString()}</span>
              </div>
            )}

            {guest.additionaldiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" /> Additional Discount:
                </span>
                <span>-Rs{additionalDiscountAmount.toLocaleString()}</span>
              </div>
            )}

            {totalDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="flex items-center">
                  <Percent className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" /> Total Discount:
                </span>
                <span>-Rs{totalDiscountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium flex items-center">
                <PieChart className="h-4 w-4 mr-1 opacity-70 invoice-print-hidden" /> Tax ({invoice.taxRate}%):
              </span>
              <span>Rs{invoice.taxAmount.toLocaleString()}</span>
            </div>

            <Separator className="my-1" />

            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span className="text-primary">Rs{invoice.grandTotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Payment Method:</span>
              <span className="capitalize">{guest.paymentMethod}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2 invoice-print-hidden">
          <Button size="sm" variant="outline" onClick={onPrint} className="hover:bg-slate-100 dark:hover:bg-slate-700">
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
          <Button size="sm" onClick={onSendEmail} disabled={isSendingEmail} className="bg-primary hover:bg-primary/90">
            <Send className="mr-2 h-4 w-4" />
            {isSendingEmail ? "Sending..." : "Send Email"}
          </Button>
        </CardFooter>
      </Card>

      {/* Print-only footer */}
      <div className="hidden invoice-print-only mt-8 pt-6 border-t text-center text-sm text-slate-600">
        <p className="font-semibold mb-1">Thank you for choosing HSQ Towers!</p>
        <p>
          For any inquiries regarding this invoice, please contact our
          accounting department at accounts@hsqtowers.com
        </p>
        <p className="mt-6 text-lg font-bold">
          {guest.status === "checked-out"
            ? "PAID IN FULL"
            : `BALANCE DUE: Rs${invoice.grandTotal.toLocaleString()}`}
        </p>
        <div className="mt-8 text-xs text-slate-500">
          <p>HSQ Towers - Your Home Away From Home</p>
          <p>Invoice generated by HSQ Hotel Management System</p>
        </div>
      </div>
    </div>
  );
};

// === Main Component ===

const GuestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pageRef = useRef(null);
  const invoiceRef = useRef(null);

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

  // Add CSS for invoice-only printing
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
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
          width: 100%;
        }
        .invoice-print-only {
          display: block !important;
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
    await checkoutGuest(id);
  }, [id, checkoutGuest]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (id) fetchGuestById(id);
  }, [id, fetchGuestById]);

  // Print Invoice function - modified to only print the invoice
  const handlePrintInvoice = useCallback(() => {
    if (!invoice || !guest) return;

    // Set a more descriptive page title for the print
    const originalTitle = document.title;
    document.title = `Invoice #${invoice.invoiceNumber} - ${guest.fullName}`;

    // Call the browser print function
    window.print();

    // Clean up after printing dialog closes
    setTimeout(() => {
      document.title = originalTitle;
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
    () => (status) =>
      status === "checked-in"
        ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
        : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    []
  );

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 max-w-7xl">
      {/* Header with navigation and actions - hide during print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center">
          <Link to="/guests">
            <Button variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Guests
            </Button>
          </Link>

          {guest && (
            <h1 className="ml-4 text-2xl font-bold text-slate-900 dark:text-white">{guest.fullName}</h1>
          )}
        </div>

        {guest && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="border-slate-200 dark:border-slate-700"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </Button>

            {guest.status === "checked-in" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsCheckoutOpen(true)}
                className="bg-red-600 hover:bg-red-700"
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
                  className="border-slate-200 dark:border-slate-700"
                >
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendInvoice}
                  disabled={isSendingEmail}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSendingEmail ? "Sending..." : "Email Invoice"}
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
                    {guest.status === "checked-in" ? "Currently Staying" : "Checked Out"}
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
                      <p className="text-sm text-slate-500 dark:text-slate-400">Full Name</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{guest.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">CNIC</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{guest.cnic}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Home className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{guest.address}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{guest.phone}</p>
                    </div>
                  </div>

                  {guest.email && (
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{guest.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <CreditCard className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Payment Method</p>
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
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Home className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Room Number</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{guest.room.roomNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Tag className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Room Type</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{guest.room.category} ({guest.room.bedType})</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Room Rate</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">Rs{guest.room.rate.toLocaleString()}/night</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Check-in</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(guest.checkInAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-1 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{guest.checkOutAt ? "Check-out" : "Expected Check-out"}</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {guest.checkOutAt
                          ? formatDate(guest.checkOutAt)
                          : getExpectedCheckoutDate(guest.checkInAt, guest.stayDuration)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200">Rs{guest.totalRent.toLocaleString()}</p>
                        {guest.applyDiscount && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                            Standard Discount
                          </Badge>
                        )}
                        {guest.additionaldiscount > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                            +Rs{guest.additionaldiscount} Off
                          </Badge>
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
                onPrint={handlePrintInvoice}
                onSendEmail={handleSendInvoice}
                isSendingEmail={isSendingEmail}
                innerRef={invoiceRef}
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
          </>
        )}
      </div>
    </div>
  );
};

export default GuestDetailPage;