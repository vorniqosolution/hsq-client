import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarDays, RefreshCcw, ArrowRight, Loader2, AlertCircle, Info } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useReservationContext, Reservation, SwapReservationInput } from "@/contexts/ReservationContext";
import { useRoomContext, Room } from "@/contexts/RoomContext";
import { toast } from "sonner";

interface SwapReservationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: Reservation;
}

const SwapReservationModal: React.FC<SwapReservationModalProps> = ({
    open,
    onOpenChange,
    reservation,
}) => {
    const { swapReservation, loading } = useReservationContext();
    const { fetchAvailableRooms, availableRooms, loading: roomsLoading } = useRoomContext();

    // Form state
    const [newRoomId, setNewRoomId] = useState<string>("");
    const [newCheckin, setNewCheckin] = useState<string>("");
    const [newCheckout, setNewCheckout] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetchedRooms, setHasFetchedRooms] = useState(false);

    // Current values from reservation
    const currentRoom = reservation.room;
    const currentStartAt = toZonedTime(reservation.startAt, "Asia/Karachi");
    const currentEndAt = toZonedTime(reservation.endAt, "Asia/Karachi");

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setNewRoomId("");
            setNewCheckin(format(currentStartAt, "yyyy-MM-dd"));
            setNewCheckout(format(currentEndAt, "yyyy-MM-dd"));
            setError(null);
            setHasFetchedRooms(false);
        }
    }, [open, reservation]);

    // Fetch available rooms when dates change
    useEffect(() => {
        if (open && newCheckin && newCheckout && newCheckin < newCheckout) {
            // Clear room selection when dates change (room may not be available anymore)
            setNewRoomId("");
            fetchAvailableRooms(newCheckin, newCheckout);
            setHasFetchedRooms(true);
        }
    }, [open, newCheckin, newCheckout, fetchAvailableRooms]);

    // Check if any changes were made
    const hasChanges = useMemo(() => {
        const originalCheckin = format(currentStartAt, "yyyy-MM-dd");
        const originalCheckout = format(currentEndAt, "yyyy-MM-dd");
        const roomChanged = newRoomId && currentRoom && newRoomId !== currentRoom._id;
        const checkinChanged = newCheckin !== originalCheckin;
        const checkoutChanged = newCheckout !== originalCheckout;
        return roomChanged || checkinChanged || checkoutChanged;
    }, [newRoomId, newCheckin, newCheckout, currentRoom, currentStartAt, currentEndAt]);

    // Calculate nights
    const calculateNights = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    };

    const currentNights = calculateNights(
        format(currentStartAt, "yyyy-MM-dd"),
        format(currentEndAt, "yyyy-MM-dd")
    );
    const newNights = newCheckin && newCheckout && newCheckout > newCheckin
        ? calculateNights(newCheckin, newCheckout)
        : currentNights;

    // Get selected room details - use available rooms when a room is selected
    const selectedRoom = useMemo(() => {
        if (!newRoomId) return currentRoom;
        const availableRoom = availableRooms.find(r => r._id === newRoomId);
        return availableRoom || currentRoom;
    }, [newRoomId, availableRooms, currentRoom]);

    // Estimate costs - recalculate when dates or room changes
    const currentRate = currentRoom?.rate || 0;
    const newRate = selectedRoom?.rate || currentRate;
    const currentEstimate = currentRate * currentNights;
    const newEstimate = newRate * newNights;
    const difference = newEstimate - currentEstimate;

    const handleSubmit = async () => {
        setError(null);

        if (!hasChanges) {
            setError("No changes detected. Please modify at least one field.");
            return;
        }

        if (newCheckin >= newCheckout) {
            setError("Checkout date must be after check-in date.");
            return;
        }

        const originalCheckin = format(currentStartAt, "yyyy-MM-dd");
        const originalCheckout = format(currentEndAt, "yyyy-MM-dd");

        const swapData: SwapReservationInput = {};

        if (newRoomId && currentRoom && newRoomId !== currentRoom._id) {
            swapData.newRoomId = newRoomId;
        }
        if (newCheckin !== originalCheckin) {
            swapData.newCheckin = newCheckin;
        }
        if (newCheckout !== originalCheckout) {
            swapData.newCheckout = newCheckout;
        }

        setIsSubmitting(true);
        try {
            await swapReservation(reservation._id, swapData);
            toast.success("Reservation swapped successfully!");
            onOpenChange(false);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || "Failed to swap reservation";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Only show available rooms for the selected date range
    // Always include the current room as it's already booked for this reservation
    const roomOptions = useMemo(() => {
        if (!hasFetchedRooms) return [];

        // Add current room to available rooms if not already included
        const rooms = [...availableRooms];
        if (currentRoom && !rooms.find(r => r._id === currentRoom._id)) {
            rooms.unshift(currentRoom as Room);
        }
        return rooms;
    }, [availableRooms, currentRoom, hasFetchedRooms]);

    const datesAreValid = newCheckin && newCheckout && newCheckin < newCheckout;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCcw className="h-5 w-5 text-blue-600" />
                        Swap Reservation
                    </DialogTitle>
                    <DialogDescription>
                        Change room and/or dates for <strong>{reservation.fullName}</strong>'s reservation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Current Info Summary */}
                    <div className="bg-slate-50 rounded-lg p-3 border">
                        <p className="text-xs font-medium text-slate-500 mb-2">CURRENT BOOKING</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Room {currentRoom?.roomNumber}</span>
                            <span className="text-slate-500">
                                {format(currentStartAt, "MMM d")} → {format(currentEndAt, "MMM d")} ({currentNights} nights)
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {currentRoom?.category} • Rs {currentRate.toLocaleString()}/night
                        </p>
                    </div>

                    {/* Date Selection - FIRST so rooms can be filtered */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="checkin">New Check-in</Label>
                            <div className="relative">
                                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="checkin"
                                    type="date"
                                    value={newCheckin}
                                    onChange={(e) => setNewCheckin(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="checkout">New Checkout</Label>
                            <div className="relative">
                                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="checkout"
                                    type="date"
                                    value={newCheckout}
                                    onChange={(e) => setNewCheckout(e.target.value)}
                                    min={newCheckin}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* New Room Selection - Shows available rooms for selected dates */}
                    <div className="space-y-2">
                        <Label htmlFor="room">
                            New Room (Optional)
                            {roomsLoading && <span className="ml-2 text-xs text-slate-400">Loading rooms...</span>}
                        </Label>

                        {!datesAreValid && (
                            <Alert className="py-2">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Select valid dates to see available rooms
                                </AlertDescription>
                            </Alert>
                        )}

                        {datesAreValid && (
                            <Select
                                value={newRoomId || "keep-current"}
                                onValueChange={(val) => setNewRoomId(val === "keep-current" ? "" : val)}
                                disabled={roomsLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Keep current room" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="keep-current">Keep current room</SelectItem>
                                    {roomOptions.length === 0 && !roomsLoading && (
                                        <SelectItem value="no-rooms" disabled>
                                            No rooms available for these dates
                                        </SelectItem>
                                    )}
                                    {roomOptions.map((room) => (
                                        <SelectItem
                                            key={room._id}
                                            value={room._id}
                                            disabled={room._id === currentRoom?._id}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Room {room.roomNumber}</span>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {room.category}
                                                </Badge>
                                                <span className="text-slate-500 text-xs">
                                                    Rs {room.rate.toLocaleString()}
                                                </span>
                                                {room._id === currentRoom?._id && (
                                                    <Badge variant="secondary" className="text-[10px]">Current</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {datesAreValid && hasFetchedRooms && roomOptions.length > 0 && (
                            <p className="text-xs text-slate-500">
                                {roomOptions.length} room{roomOptions.length !== 1 ? 's' : ''} available for selected dates
                            </p>
                        )}
                    </div>

                    {/* Cost Comparison - Always show when dates are valid */}
                    {datesAreValid && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <p className="text-xs font-medium text-blue-600 mb-2">ESTIMATED COST</p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-600">Rs {currentEstimate.toLocaleString()}</span>
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                                <span className="font-semibold text-slate-900">Rs {newEstimate.toLocaleString()}</span>
                                {difference !== 0 && (
                                    <Badge
                                        variant={difference > 0 ? "destructive" : "secondary"}
                                        className="ml-auto"
                                    >
                                        {difference > 0 ? "+" : ""}Rs {difference.toLocaleString()}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                {newNights} night{newNights !== 1 ? "s" : ""} × Rs {newRate.toLocaleString()}/night
                            </p>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !hasChanges || loading || !datesAreValid}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Swapping...
                            </>
                        ) : (
                            <>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Swap Reservation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SwapReservationModal;
