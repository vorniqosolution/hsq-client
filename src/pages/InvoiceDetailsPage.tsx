import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoiceContext, Invoice } from "@/contexts/InvoiceContext";
import {
  ArrowLeft,
  Download,
  Mail,
  Edit,
  Save,
  CalendarDays,
  User,
  Phone,
  AtSign,
  Home,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  DollarSign,
  Percent,
  Hash,
  Building,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// --- Helper Functions (No changes here) ---
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(
    amount
  );

const getStatusBadge = (status: Invoice["status"]) => {
  const styles = {
    paid: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
    },
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      icon: <Clock className="h-4 w-4 mr-2" />,
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: <XCircle className="h-4 w-4 mr-2" />,
    },
  };
  const style = styles[status];
  return (
    <Badge
      className={`${style.bg} ${style.text} border-transparent text-base font-medium py-2 px-4`}
    >
      {style.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-start space-x-3">
    <div className="text-slate-400 mt-1">{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

const BillingRow = ({
  label,
  value,
  isBold = false,
}: {
  label: string;
  value: string;
  isBold?: boolean;
}) => (
  <div className="flex justify-between items-center py-3">
    <p className={`text-slate-600 ${isBold ? "font-semibold" : ""}`}>{label}</p>
    <p className={`text-slate-900 ${isBold ? "font-semibold text-lg" : ""}`}>
      {value}
    </p>
  </div>
);

// --- Main Component ---
const InvoiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    currentInvoice,
    loading,
    error,
    fetchInvoiceById,
    downloadInvoicePdf,
    sendInvoiceByEmail,
    updateInvoiceStatus,
  } = useInvoiceContext();

  const [newStatus, setNewStatus] = useState<Invoice["status"] | "">("");

  useEffect(() => {
    if (id) {
      fetchInvoiceById(id);
    }
  }, [id, fetchInvoiceById]);

  useEffect(() => {
    if (currentInvoice) {
      setNewStatus(currentInvoice.status);
    }
  }, [currentInvoice]);

  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;
    try {
      await updateInvoiceStatus(id, newStatus as Invoice["status"]);
      toast({
        title: "Success",
        description: "Invoice status has been updated.",
        className: "bg-emerald-500 text-white",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  // --- MODIFICATION START ---
  // This function now re-fetches the invoice data on success to update the UI
  const handleSendEmail = async () => {
    if (!id) return;
    try {
      const result = await sendInvoiceByEmail(id);
      toast({
        title: "Success",
        description: result.message,
        className: "bg-emerald-500 text-white",
      });
      // CRUCIAL: Re-fetch data to get the new pdfPath and update the buttons
      await fetchInvoiceById(id);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to generate or send the invoice.",
        variant: "destructive",
      });
    }
  };
  // --- MODIFICATION END ---

  // Loading and Error states (No changes here)
  if (loading && !currentInvoice) {
    // Show skeleton only on initial load
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-8 w-1/2 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentInvoice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <FileText className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-semibold text-slate-700">
          Invoice Not Found
        </h2>
        <p className="text-slate-500 mt-2">
          {error || "The invoice you are looking for does not exist."}
        </p>
        <Button
          onClick={() => navigate("/invoices")}
          variant="outline"
          className="mt-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Toaster />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <Button
            onClick={() => navigate("/invoices")}
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Invoices
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-light text-slate-900 flex items-center gap-3">
                Invoice{" "}
                <span className="text-amber-500">
                  {currentInvoice.invoiceNumber}
                </span>
              </h1>
              <p className="text-slate-500 mt-2">
                Issued on {formatDate(currentInvoice.issueDate)} by{" "}
                {currentInvoice.createdBy.name}
              </p>
            </div>

            {/* --- MODIFICATION START --- */}
            {/* Conditional rendering for action buttons based on pdfPath */}
            <div className="flex items-center gap-2">
              {currentInvoice.pdfPath ? (
                // If PDF exists, show Download and Resend buttons
                <>
                  <Button
                    onClick={() => downloadInvoicePdf(currentInvoice._id)}
                    variant="outline"
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button onClick={handleSendEmail} disabled={loading}>
                    <Mail className="h-4 w-4 mr-2" />
                    {loading ? "Resending..." : "Resend Email"}
                  </Button>
                </>
              ) : (
                // If PDF does not exist, show a single button to generate it
                <Button onClick={handleSendEmail} disabled={loading}>
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate & Send PDF"}
                </Button>
              )}
            </div>
            {/* --- MODIFICATION END --- */}
          </div>
        </header>

        {/* The rest of the page remains the same */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              {/* NEW: This CardContent uses the permanent snapshot data */}
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem
                  icon={<User size={18} />}
                  label="Full Name"
                  value={
                    currentInvoice.guestDetails?.fullName ||
                    currentInvoice.guest?.fullName ||
                    "N/A"
                  }
                />
                <DetailItem
                  icon={<Phone size={18} />}
                  label="Phone Number"
                  value={
                    currentInvoice.guestDetails?.phone ||
                    currentInvoice.guest?.phone ||
                    "N/A"
                  }
                />
                {/* <DetailItem
                  icon={<AtSign size={18} />}
                  label="Email Address"
                  value={currentInvoice.guestDetails?.email || "Not Provided"}
                />
                <DetailItem
                  icon={<Home size={18} />}
                  label="Address"
                  value={currentInvoice.guest?.address || "N/A"}
                /> */}
                <DetailItem
                  icon={<Building size={18} />}
                  label="Room Number"
                  value={
                    currentInvoice.roomDetails?.roomNumber ||
                    currentInvoice.guest?.room?.roomNumber ||
                    "N/A"
                  }
                />
                <DetailItem
                  icon={<Hash size={18} />}
                  label="CNIC"
                  value={
                    currentInvoice.guestDetails?.cnic ||
                    currentInvoice.guest?.cnic ||
                    "N/A"
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Billing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <BillingRow
                    label="Subtotal"
                    value={formatCurrency(currentInvoice.subtotal)}
                  />
                  {currentInvoice.discountAmount > 0 && (
                    <BillingRow
                      label="Discount"
                      value={`- ${formatCurrency(
                        currentInvoice.discountAmount
                      )}`}
                    />
                  )}
                  {currentInvoice.additionaldiscount > 0 && (
                    <BillingRow
                      label="Additional Discount"
                      value={`- ${formatCurrency(
                        currentInvoice.additionaldiscount
                      )}`}
                    />
                  )}
                  <BillingRow
                    label={`Tax (${currentInvoice.taxRate}%)`}
                    value={formatCurrency(currentInvoice.taxAmount)}
                  />
                </div>
                <hr className="my-4" />
                <BillingRow
                  label="Grand Total"
                  value={formatCurrency(currentInvoice.grandTotal)}
                  isBold={true}
                />
              </CardContent>
            </Card>
          </div>
          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getStatusBadge(currentInvoice.status)}
                <div>
                  <label
                    htmlFor="status-select"
                    className="text-sm font-medium text-slate-700"
                  >
                    Change Status
                  </label>
                  <select
                    id="status-select"
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as Invoice["status"])
                    }
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={newStatus === currentInvoice.status || loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" /> Save Status
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {currentInvoice.items.map((item) => (
                    <li
                      key={item._id}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {item.description}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.total)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoiceDetailsPage;
