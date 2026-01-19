import React, { useState } from "react";
import { useOwnerContext } from "@/contexts/OwnerContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
    Search,
    CheckCircle,
    AlertTriangle,
    User,
    Calendar,
    Briefcase,
    Sun,
    Snowflake,
    Home,
    Menu
} from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


const OwnerReceptionPage = () => {
    const { currentOwner, usageStats, loading, searchOwner, markAttendance } =
        useOwnerContext();
    const [cardIdInput, setCardIdInput] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [chargeAmount, setChargeAmount] = useState<string>("");


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (cardIdInput.trim()) {
            searchOwner(cardIdInput.trim());
        }
    };

    const handleMarkAttendance = async () => {
        if (!currentOwner) return;

        const charge = chargeAmount ? parseFloat(chargeAmount) : 0;
        const success = await markAttendance(currentOwner.cardId, charge);
        if (success) {
            setIsConfirmOpen(false);
            setChargeAmount("");
        }
    };

    // Calculate percentage safely
    const usagePercentage = usageStats
        ? Math.min(100, (usageStats.totalDaysUsed / usageStats.limit) * 100)
        : 0;

    // Determine season details (if any)
    const renderSeasonBadge = () => {
        if (!usageStats?.currentSeason || usageStats.currentSeason === "none") return null;
        const isSummer = usageStats.currentSeason === "summer";
        return (
            <Badge variant="outline" className={`ml-2 ${isSummer ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                {isSummer ? <Sun className="w-3 h-3 mr-1" /> : <Snowflake className="w-3 h-3 mr-1" />}
                {usageStats.currentSeason.toUpperCase()} SEASON
            </Badge>
        );
    };

    return (
        <div className="h-full">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">

                    <div className="max-w-4xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Owner Reception
                            </h1>
                            <p className="text-slate-500 mt-2">
                                Scan or enter Card ID to track attendance
                            </p>
                        </div>

                        {/* Search Section */}
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-6">
                                <form onSubmit={handleSearch} className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            value={cardIdInput}
                                            onChange={(e) => setCardIdInput(e.target.value)}
                                            placeholder="Enter Card ID (e.g. hsq123)"
                                            className="pl-10 h-12 text-lg"
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={loading}
                                        className="bg-amber-500 hover:bg-amber-600 h-12 px-8"
                                    >
                                        {loading ? "Searching..." : "Search"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Results Section */}
                        {loading ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="border-0 shadow-md h-full">
                                    <CardHeader className="pb-4 border-b border-gray-100">
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-1/2" />
                                            <Skeleton className="h-4 w-1/3" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-md h-full">
                                    <CardHeader className="pb-4 border-b border-gray-100">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-6 w-1/2" />
                                            <Skeleton className="h-6 w-20" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <Skeleton className="h-8 w-20" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Skeleton className="h-20 w-full" />
                                            <Skeleton className="h-20 w-full" />
                                        </div>
                                        <Skeleton className="h-14 w-full" />
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            currentOwner && usageStats && (
                                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Profile Card */}
                                    <Card className="border-0 shadow-md h-full">
                                        <CardHeader className="pb-4 border-b border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <User className="h-5 w-5 text-amber-500" />
                                                        {currentOwner.fullName}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        Card ID: <span className="font-mono font-medium text-slate-700">{currentOwner.cardId}</span>
                                                    </CardDescription>
                                                </div>
                                                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                                    <Home className="h-4 w-4" />
                                                    Apt {currentOwner.apartmentNumber}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 mb-1">Phone</p>
                                                    <p className="font-medium text-slate-900">{currentOwner.phone || "N/A"}</p>
                                                </div>
                                                {currentOwner.assignedRoom && (
                                                    <div>
                                                        <p className="text-gray-500 mb-1">Assigned Room</p>
                                                        <p className="font-medium text-slate-900">Room {currentOwner.assignedRoom.roomNumber}</p>
                                                    </div>
                                                )}
                                                {currentOwner.agreementEndDate && (
                                                    <div className="col-span-2">
                                                        <p className="text-gray-500 mb-1">Agreement Valid Until</p>
                                                        <p className="font-medium text-slate-900">
                                                            {format(new Date(currentOwner.agreementEndDate), "MMMM d, yyyy")}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Usage Stats Card */}
                                    <Card className={`border-0 shadow-md h-full relative overflow-hidden ${usageStats.isOverStay ? "ring-2 ring-red-500" : ""}`}>
                                        {usageStats.isOverStay && (
                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 rounded-bl-lg font-bold uppercase tracking-wider z-10">
                                                Overstay Limit Reached
                                            </div>
                                        )}

                                        <CardHeader className="pb-4 border-b border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    Monthly / Season Usage
                                                </CardTitle>
                                                {renderSeasonBadge()}
                                            </div>
                                            <CardDescription>
                                                Tracking configured season or monthly limit
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            {/* Main Progress */}
                                            <div>
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <span className="text-3xl font-bold text-slate-900">{usageStats.totalDaysUsed}</span>
                                                        <span className="text-gray-400 font-medium"> / {usageStats.limit} Days</span>
                                                    </div>
                                                    <span className={`font-medium text-sm ${usageStats.isOverStay ? "text-red-500" : "text-emerald-600"}`}>
                                                        {usageStats.remainingDays} remaining
                                                    </span>
                                                </div>
                                                <Progress value={usagePercentage} className="h-3" />
                                            </div>

                                            {/* Seasonal Breakdown */}
                                            {usageStats.currentSeason !== "none" && usageStats.breakdown && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Weekend
                                                        </div>
                                                        <div className="font-mono text-lg font-bold text-slate-700">
                                                            {usageStats.breakdown.weekendUsed}
                                                            <span className="text-gray-400 text-sm font-normal"> used</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                                                            <Briefcase className="w-3 h-3" />
                                                            Weekday
                                                        </div>
                                                        <div className="font-mono text-lg font-bold text-slate-700">
                                                            {usageStats.breakdown.weekdayUsed}
                                                            <span className="text-gray-400 text-sm font-normal"> used</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="lg"
                                                        className={`w-full text-lg h-14 ${usageStats.isTodayMarked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}
                                                        disabled={usageStats.isTodayMarked}
                                                    >
                                                        {usageStats.isTodayMarked ? (
                                                            <>
                                                                <CheckCircle className="mr-2 h-5 w-5" />
                                                                Marked for Today
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-5 w-5" />
                                                                Mark Attendance
                                                            </>
                                                        )}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Confirm Attendance</DialogTitle>
                                                        <DialogDescription>
                                                            Marking attendance for <strong>{format(new Date(), "MMMM d, yyyy")}</strong>.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    {usageStats.isOverStay && (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                                                            <div className="flex gap-3">
                                                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                                                <div>
                                                                    <h4 className="font-semibold text-red-800 text-sm">Limit Reached</h4>
                                                                    <p className="text-red-700 text-sm mt-1">
                                                                        This owner has used <strong>{usageStats.totalDaysUsed}</strong> of {usageStats.limit} allowed days.
                                                                        Charges should apply for today.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4">
                                                                <Label htmlFor="charge" className="text-red-900 font-medium">Overstay Charge Amount</Label>
                                                                <div className="relative mt-1">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rs.</span>
                                                                    <Input
                                                                        id="charge"
                                                                        type="number"
                                                                        placeholder="0.00"
                                                                        className="pl-10 border-red-300 focus:ring-red-500"
                                                                        value={chargeAmount}
                                                                        onChange={(e) => setChargeAmount(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!usageStats.isOverStay && (
                                                        <div className="py-4 text-center text-slate-600">
                                                            Verify the owner's identity using Card ID: <span className="font-mono font-bold text-slate-900">{currentOwner.cardId}</span>
                                                        </div>
                                                    )}

                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                                                        <Button onClick={handleMarkAttendance} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                                            {loading ? "Processing..." : "Confirm & Mark"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerReceptionPage;
