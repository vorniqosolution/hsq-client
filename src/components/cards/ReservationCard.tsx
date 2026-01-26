import React, { useMemo } from "react";
import {
  Bed,
  CalendarDays,
  Phone,
  Trash2,
  CheckCircle,
  Eye,
  RefreshCcw,
  MessageSquare,
  ArrowLeftRight,
  X,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Reservation, Room } from "@/contexts/ReservationContext";

interface ReservationCardProps {
  reservation: Reservation;
  allRooms: Room[];
  onDelete: () => void;
  onCheckIn: () => void;
  onViewDetails: () => void;
  onSwap?: () => void;
  onHardDelete?: () => void;
  getStatus: (reservation: Reservation) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const isPopulatedRoom = (room: any): room is Room => {
  return (
    typeof room === "object" && room !== null && room.roomNumber !== undefined
  );
};

const ReservationCard = React.memo(
  ({
    reservation,
    allRooms,
    onDelete,
    onHardDelete,
    onCheckIn,
    onViewDetails,
    onSwap,
    getStatus,
    getStatusBadge,
  }: ReservationCardProps) => {
    // const { user } = useAuth(); // Unused

    const status = getStatus(reservation);

    const roomDetails = useMemo(() => {
      if (isPopulatedRoom(reservation.room)) {
        return reservation.room;
      }
      if (allRooms && allRooms.length) {
        return allRooms.find(
          (room) => room.roomNumber === reservation.roomNumber,
        );
      }
      return null;
    }, [reservation.room, reservation.roomNumber, allRooms]);

    const startDate = toZonedTime(reservation.startAt, "Asia/Karachi");
    const endDate = toZonedTime(reservation.endAt, "Asia/Karachi");

    // Helper for Category Color
    const getCategoryBadgeStyle = (category: string = "") => {
      const lower = category.toLowerCase();
      if (lower.includes("presidential"))
        return "bg-purple-100 text-purple-700";
      if (lower.includes("executive")) return "bg-blue-100 text-blue-700";
      return "bg-slate-100 text-slate-700";
    };

    return (
      <Card className="mb-3 border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center p-4 gap-4 md:gap-6 min-h-[80px]">
          {/* 1. Name & Category Section */}
          <div className="flex-1 min-w-[200px] flex flex-col justify-center">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {reservation.fullName}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {roomDetails?.category && (
                <Badge
                  variant="secondary"
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeStyle(roomDetails.category)}`}
                >
                  {roomDetails.category}
                </Badge>
              )}
              {reservation.financials &&
                reservation.financials.totalAdvance > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-green-50 text-green-700 border-green-200 h-5 px-1.5"
                  >
                    Adv: {reservation.financials.totalAdvance.toLocaleString()}
                  </Badge>
                )}
              {reservation.specialRequest && (
                <div
                  title={reservation.specialRequest}
                  className="group relative flex items-center justify-center h-5 w-5 bg-purple-50 rounded-full cursor-help"
                >
                  <MessageSquare className="h-3 w-3 text-purple-600" />
                </div>
              )}
            </div>
          </div>

          {/* 2. Dates Section (IN / OUT) */}
          <div className="flex-[0.8] min-w-[180px] border-l-0 md:border-l border-slate-100 md:pl-6 py-1 flex flex-col justify-center gap-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-slate-400 text-[10px] w-8">
                IN
              </span>
              <span className="font-medium text-slate-700 flex-1 text-right md:text-left">
                {format(startDate, "d MMM, EEE")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-slate-400 text-[10px] w-8">
                OUT
              </span>
              <span className="font-medium text-slate-700 flex-1 text-right md:text-left">
                {format(endDate, "d MMM, EEE")}
              </span>
            </div>
          </div>

          {/* 3. Room & Occupancy Section */}
          <div className="flex-[0.6] min-w-[140px] border-l-0 md:border-l border-slate-100 md:pl-6 py-1 flex flex-col justify-center">
            <p className="font-bold text-slate-900 text-sm">
              Room{" "}
              {isPopulatedRoom(reservation.room)
                ? reservation.room.roomNumber
                : reservation.roomNumber}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {reservation.adults || 1} Adult
              {(reservation.adults || 1) !== 1 ? "s" : ""}
              {(reservation.infants || 0) > 0 &&
                `, ${reservation.infants} Infant${reservation.infants !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* 4. Status & Actions */}
          <div className="flex-[0.8] border-l-0 md:border-l border-slate-100 md:pl-6 py-1 flex items-center justify-between md:justify-end gap-3 md:gap-6">
            {/* Status Dot + Text */}
            <div className="flex items-center gap-2 mr-auto md:mr-0">
              {reservation.status === "checked-in" ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                  <span className="text-sm font-medium text-emerald-600">
                    Active
                  </span>
                </div>
              ) : reservation.status === "reserved" ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-sky-500"></div>
                  <span className="text-sm font-medium text-sky-600">
                    Reserved
                  </span>
                </div>
              ) : reservation.status === "confirmed" ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-600">
                    Confirmed
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                  <span className="text-sm font-medium text-slate-500 capitalize">
                    {reservation.status}
                  </span>
                </div>
              )}
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-1">
              {/* View */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onViewDetails}
                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-full"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {/* Check In (Only if eligible) */}
              {(status === "reserved" ||
                status === "upcoming" ||
                status === "confirmed") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCheckIn}
                  className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-full"
                  title="Check In Guest"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}

              {/* Swap (Only if reserved/confirmed/upcoming - not checked in) */}
              {onSwap &&
                (status === "reserved" ||
                  status === "confirmed" ||
                  status === "upcoming") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSwap}
                    className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50/50 rounded-full"
                    title="Swap Room/Dates"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                )}

              {/* Cancel/Delete - shows Cancel for reserved/confirmed, Delete for cancelled/checked-out */}
              {status === "reserved" ||
              status === "confirmed" ||
              status === "upcoming" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50/50 rounded-full"
                  title="Cancel Reservation"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (status === "cancelled" ||
                  status === "checked-out" ||
                  status === "expired") &&
                onHardDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onHardDelete}
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-full"
                  title="Delete Permanently"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    );
  },
);

export default ReservationCard;
