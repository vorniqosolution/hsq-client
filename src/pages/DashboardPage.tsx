import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
    CheckCircle,
    Key,
    Sun,
    Calendar,
    Wrench,
    ArrowRight,
    RefreshCcw,
    Clock,
    ArrowRightCircle,
    ArrowLeftCircle,
    Users,
    Bed,
    Hotel,
    Mountain,
    LayoutDashboard,
    Search,
    Filter
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parseISO, isWithinInterval } from "date-fns";

// --- API Configuration ---
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

interface DashboardStats {
    totalRooms: number;
    available: number;
    occupied: number;
    arrival: number;
    maintenance: number;
    reserved: number;
}

interface Arrival {
    _id: string;
    fullName: string;
    startAt: string;
    endAt: string;
    expectedArrivalTime?: string; // e.g., "14:00"
    room: {
        roomNumber: string;
        category: string;
    };
}

interface RoomStatus {
    _id: string;
    roomNumber: string;
    category: string;
    bedType: string;
    status: "Available" | "Occupied" | "Reserved" | "Maintenance" | "Arrival";
    styling: string;
    icon: string;
    details: any;
}

interface TimelineEvent {
    id?: string;
    type: string; // 'Guest (Checked-in)' | 'Reservation'
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    arrivalTime?: string | null; // e.g., "14:00"
}

const DashboardPage = () => {

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [arrivals, setArrivals] = useState<Arrival[]>([]);
    const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter & Search State
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Dialog State
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [roomTimeline, setRoomTimeline] = useState<TimelineEvent[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [cancellationLoading, setCancellationLoading] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [statsRes, arrivalsRes, statusesRes] = await Promise.all([
                apiClient.get("/api/dashboard/stats"),
                apiClient.get("/api/dashboard/arrivals"),
                apiClient.get("/api/dashboard/room-statuses"),
            ]);

            setStats(statsRes.data.data);
            setArrivals(arrivalsRes.data.data);
            setRoomStatuses(statusesRes.data.data);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeline = async (roomId: string) => {
        try {
            setTimelineLoading(true);
            const res = await apiClient.get<{ timeline: TimelineEvent[] }>(`/api/rooms/${roomId}/timeline`);
            setRoomTimeline(res.data.timeline);
        } catch (err) {
            console.error("Timeline fetch error", err);
        } finally {
            setTimelineLoading(false);
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        if (!window.confirm("Are you sure you want to cancel this reservation? This action cannot be undone.")) return;

        try {
            setCancellationLoading(reservationId);
            await apiClient.delete(`/api/reservation/cancel-reservation/${reservationId}/cancel`);
            // Refresh timeline
            if (selectedRoomId) fetchTimeline(selectedRoomId);
            // Refresh stats/arrivals
            fetchData();
        } catch (err) {
            console.error("Cancellation error:", err);
            alert("Failed to cancel reservation.");
        } finally {
            setCancellationLoading(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedRoomId) {
            fetchTimeline(selectedRoomId);
        } else {
            setRoomTimeline([]);
        }
    }, [selectedRoomId]);

    // Computed Filtered Rooms
    const filteredRooms = useMemo(() => {
        return roomStatuses.filter(room => {
            const matchesStatus = filterStatus === "All" || room.status === filterStatus;
            const matchesSearch =
                room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (room.details?.guestName && room.details.guestName.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [roomStatuses, filterStatus, searchQuery]);

    const StatCard = ({
        label,
        count,
        total,
        icon: Icon,
        colorClass,
        bgClass,
        onClick
    }: {
        label: string;
        count: number;
        total?: number;
        icon: any;
        colorClass: string;
        bgClass: string;
        onClick?: () => void;
    }) => {
        const percentage = total && total > 0 ? Math.round((count / total) * 100) : 0;

        return (
            <div
                onClick={onClick}
                className={`relative overflow-hidden cursor-pointer group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${bgClass}`}
            >
                <div className="flex items-center gap-4 z-10">
                    <div className={`p-3 rounded-xl bg-white shadow-sm ring-1 ring-inset transition-colors duration-300 group-hover:bg-white/80 ${colorClass.replace('text-', 'ring-').replace('600', '100')}`}>
                        <Icon className={`w-6 h-6 ${colorClass}`} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? <Skeleton className="h-8 w-16" /> : count}</p>
                            {total !== undefined && !loading && (
                                <span className="text-xs font-medium text-slate-400">/ {total}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Optional Percentage Ring for Occupancy */}
                {total !== undefined && (
                    <div className="absolute right-[-10px] bottom-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icon className={`w-36 h-36 ${colorClass}`} />
                    </div>
                )}
            </div>
        );
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'CheckCircle': return CheckCircle;
            case 'Key': return Key;
            case 'Sun': return Sun;
            case 'Calendar': return Calendar;
            case 'Wrench': return Wrench;
            default: return CheckCircle;
        }
    };

    return (
        <div className="h-full bg-slate-50/50 flex flex-col font-sans">
            <div className="flex-1 overflow-hidden flex flex-col h-full">



                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-[1600px] mx-auto space-y-8">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                            <StatCard
                                label="Available"
                                count={stats?.available || 0}
                                total={stats?.totalRooms}
                                icon={CheckCircle}
                                colorClass="text-emerald-600"
                                bgClass="bg-white border-slate-200 hover:border-emerald-300"
                                onClick={() => setFilterStatus("Available")}
                            />
                            <StatCard
                                label="Occupied"
                                count={stats?.occupied || 0}
                                total={stats?.totalRooms}
                                icon={Key}
                                colorClass="text-amber-600"
                                bgClass="bg-white border-slate-200 hover:border-amber-300"
                                onClick={() => setFilterStatus("Occupied")}
                            />
                            <StatCard
                                label="Arrivals"
                                count={stats?.arrival || 0}
                                icon={Sun}
                                colorClass="text-purple-600"
                                bgClass="bg-white border-slate-200 hover:border-purple-300"
                                onClick={() => setFilterStatus("Arrival")}
                            />
                            <StatCard
                                label="Reserved"
                                count={stats?.reserved || 0}
                                icon={Calendar}
                                colorClass="text-sky-600"
                                bgClass="bg-white border-slate-200 hover:border-sky-300"
                                onClick={() => setFilterStatus("Reserved")}
                            />
                            <StatCard
                                label="Maintenance"
                                count={stats?.maintenance || 0}
                                icon={Wrench}
                                colorClass="text-red-600"
                                bgClass="bg-white border-slate-200 hover:border-red-300"
                                onClick={() => setFilterStatus("Maintenance")}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Room Quick View (Takes up 2 columns) */}
                            <Card className="lg:col-span-2 border-0 shadow-lg bg-white h-full flex flex-col">
                                <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Bed className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-slate-800">Room Status</CardTitle>
                                            <CardDescription>Live real-time room availability</CardDescription>
                                        </div>
                                    </div>

                                    {/* Search & Filter Controls */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-48 hidden sm:block">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search room..."
                                                className="pl-9 h-9 text-xs"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0 flex-1 flex flex-col">
                                    {/* Tabs */}
                                    <Tabs defaultValue="All" value={filterStatus} onValueChange={setFilterStatus} className="w-full">
                                        <div className="px-6 py-3 border-b bg-slate-50/50">
                                            <TabsList className="bg-slate-200/60 h-9 p-1">
                                                <TabsTrigger value="All" className="text-xs px-3 h-7">All Rooms</TabsTrigger>
                                                <TabsTrigger value="Available" className="text-xs px-3 h-7 text-emerald-700 data-[state=active]:bg-white data-[state=active]:text-emerald-800">Available</TabsTrigger>
                                                <TabsTrigger value="Occupied" className="text-xs px-3 h-7 text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-800">Occupied</TabsTrigger>
                                                <TabsTrigger value="Arrival" className="text-xs px-3 h-7 text-purple-700 data-[state=active]:bg-white data-[state=active]:text-purple-800">Arrivals</TabsTrigger>
                                                <TabsTrigger value="Reserved" className="text-xs px-3 h-7 text-sky-700 data-[state=active]:bg-white data-[state=active]:text-sky-800">Reserved</TabsTrigger>
                                                <TabsTrigger value="Maintenance" className="text-xs px-3 h-7 text-red-700 data-[state=active]:bg-white data-[state=active]:text-red-800">Maintenance</TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <div className="p-6 overflow-y-auto max-h-[500px]">
                                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                                                {loading ? (
                                                    Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                                                ) : filteredRooms.length === 0 ? (
                                                    <div className="col-span-full py-10 text-center text-slate-400 flex flex-col items-center">
                                                        <Search className="h-10 w-10 mb-2 opacity-20" />
                                                        <p>No rooms found matching your criteria</p>
                                                    </div>
                                                ) : (
                                                    filteredRooms.map((room) => {
                                                        const Icon = getIcon(room.icon);
                                                        return (
                                                            <TooltipProvider key={room._id} delayDuration={300}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div
                                                                            onClick={() => setSelectedRoomId(room._id)}
                                                                            className={`relative p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center h-20 group ${room.styling} hover:scale-105 hover:shadow-lg`}
                                                                        >
                                                                            <span className="font-bold text-sm tracking-tight">{room.roomNumber}</span>
                                                                            <Icon className="h-4 w-4 mt-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="p-3 bg-slate-900 text-slate-50 border-0 shadow-xl rounded-lg text-xs" side="top">
                                                                        <p className="font-bold mb-1">{room.category}</p>
                                                                        <div className="space-y-0.5 opacity-90">
                                                                            <p>Type: {room.bedType}</p>
                                                                            <p>Status: {room.status}</p>
                                                                            {room.details?.guestName && (
                                                                                <p className="text-amber-300 mt-1 pb-0.5 border-b border-white/20">Guest: {room.details.guestName}</p>
                                                                            )}
                                                                            {room.details?.checkOut && (
                                                                                <p>Out: {format(parseISO(room.details.checkOut), "MMM d, h:mm a")}</p>
                                                                            )}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Today's Arrivals (Takes up 1 column on right) */}
                            <Card className="border-0 shadow-lg bg-white h-fit flex flex-col">
                                <CardHeader className="border-b bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Sun className="h-4 w-4 text-purple-500" /> Today's Arrivals
                                    </CardTitle>
                                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                                        {arrivals.length} GUESTS
                                    </span>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="p-6 space-y-4">
                                            {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                                        </div>
                                    ) : arrivals.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                            <div className="bg-slate-100 p-3 rounded-full mb-3">
                                                <Sun className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-600">No arrivals scheduled</p>
                                            <p className="text-xs text-slate-400 mt-1">Check reservations for upcoming bookings</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                                            {arrivals.map((guest) => (
                                                <div key={guest._id} className="p-4 hover:bg-purple-50/30 transition-colors flex items-start gap-4 group cursor-pointer">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs shadow-inner">
                                                        {guest.fullName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                                                            {guest.fullName}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                            <span className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-mono">
                                                                {guest.room?.roomNumber}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {guest.expectedArrivalTime || format(parseISO(guest.startAt), "MMM d")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 group-hover:text-purple-600">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>

            {/* Room Timeline Dialog */}
            <Dialog open={!!selectedRoomId} onOpenChange={(open) => !open && setSelectedRoomId(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="px-6 py-5 bg-slate-50 border-b">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Bed className="h-5 w-5 text-slate-500" />
                            Room Schedule
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Timeline for Room {roomStatuses.find(r => r._id === selectedRoomId)?.roomNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 min-h-[300px] max-h-[60vh]">
                        {timelineLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-32 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        ) : roomTimeline.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-slate-900 font-bold">Completely Free</h3>
                                <p className="text-slate-500 text-sm mt-1 max-w-[200px]">No upcoming bookings or active guests for the next 30 days.</p>
                                <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                                    Create Reservation
                                </Button>
                            </div>
                        ) : (
                            <div className="relative pl-4 space-y-0 text-sm">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-slate-200 z-0"></div>

                                {roomTimeline.map((event, idx) => {
                                    const isAvailable = event.type === 'Available';
                                    const isNow = isAvailable && isWithinInterval(new Date(), { start: parseISO(event.startDate), end: parseISO(event.endDate) });
                                    const isReservation = event.type === 'Reservation';
                                    const isCheckedInGuest = event.type.includes('Guest') && event.status === 'checked-in';
                                    const canCancel = isReservation && (event.status === 'reserved' || event.status === 'confirmed');

                                    const formatEventDate = (dateString: string, isEndDate: boolean = false) => {
                                        const date = parseISO(dateString);
                                        const timeStr = format(date, "h:mm a");
                                        const dateStr = format(date, "MMM d");

                                        // Check if this is a "date-only" value (stored as UTC midnight 00:00:00)
                                        // UTC midnight appears as 5:00 AM in PKT, 12:00 AM in UTC, etc.
                                        const isUtcMidnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;

                                        // Hide time for: 
                                        // 1. Available slots (calculated ranges)
                                        // 2. UTC midnight values (date-only, no actual time set)
                                        // 3. Checked-in guests' expected checkout
                                        const showTime = !isUtcMidnight && !isAvailable && !(isCheckedInGuest && isEndDate);

                                        return (
                                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                {dateStr}
                                                {showTime && <span className="text-slate-400 text-[10px] font-normal">({timeStr})</span>}
                                            </span>
                                        );
                                    };

                                    return (
                                        <div key={idx} className="relative z-10 flex gap-4 pb-8 last:pb-0 group">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${isAvailable
                                                ? (isNow ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600')
                                                : event.type.includes('Guest') ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {isAvailable ? <CheckCircle className="h-4 w-4" /> : (event.type.includes('Guest') ? <Key className="h-4 w-4" /> : <Calendar className="h-4 w-4" />)}
                                            </div>

                                            {/* Content Card */}
                                            <div className={`flex-1 rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${isAvailable
                                                ? (isNow ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-dashed border-slate-300')
                                                : 'bg-white border-slate-200'
                                                }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className={`font-bold ${isAvailable ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                            {event.name}
                                                        </span>
                                                        {isNow && <span className="ml-2 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Now</span>}
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isAvailable
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : event.status === 'checked-in' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {event.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">
                                                            {isCheckedInGuest ? 'Check-in' : (isReservation ? 'Arrival' : 'Start')}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                            <ArrowRightCircle className="h-3 w-3 text-slate-400" />
                                                            {formatEventDate(event.startDate, false)}
                                                            {/* Show arrivalTime if available for reservations */}
                                                            {isReservation && event.arrivalTime && (
                                                                <span className="text-slate-400 text-[10px] font-normal">({event.arrivalTime})</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">
                                                            {isCheckedInGuest ? 'Expected Out' : (isReservation ? 'Checkout' : 'End')}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                            <ArrowLeftCircle className="h-3 w-3 text-slate-400" />
                                                            {formatEventDate(event.endDate, true)}
                                                        </span>
                                                    </div>
                                                </div>



                                                {canCancel && event.id && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            className="h-7 text-xs px-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-0 shadow-none"
                                                            onClick={() => handleCancelReservation(event.id!)}
                                                            disabled={cancellationLoading === event.id}
                                                        >
                                                            {cancellationLoading === event.id ? "Cancelling..." : "Cancel Reservation"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default DashboardPage;
