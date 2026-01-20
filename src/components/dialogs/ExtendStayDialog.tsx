
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Guest, Invoice } from "@/contexts/GuestContext"; // Assuming these types are exported

interface ExtendStayDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    guest: Guest | null;
    invoice?: Invoice | null;
    onSuccess?: () => void;
}

const formatInTimeZone = (date: string | Date, fmt: string, tz: string = "Asia/Karachi") => {
    return format(toZonedTime(date, tz), fmt);
};

const ExtendStayDialog: React.FC<ExtendStayDialogProps> = ({ isOpen, setIsOpen, guest, onSuccess, invoice }) => {
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
        if (!preview || error || !guest) return;

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

export default ExtendStayDialog;
