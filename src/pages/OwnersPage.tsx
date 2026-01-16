import React, { useEffect, useState } from "react";
import { useOwnerContext, Owner } from "@/contexts/OwnerContext";
import { useRoomContext } from "@/contexts/RoomContext";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Calendar, User, Home, CreditCard, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

const OwnersPage = () => {
    const { owners, fetchOwners, createOwner, updateOwner, deleteOwner, loading } = useOwnerContext();
    const { rooms, fetchRooms } = useRoomContext();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Selected Owner for Actions
    const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        cardId: "",
        cnic: "",
        phone: "",
        email: "",
        apartmentNumber: "",
        assignedRoom: "",
        agreementStartDate: "",
        agreementEndDate: "",
        seasonLimits: {
            summerWeekend: 0,
            summerWeekday: 0,
            winterWeekend: 0,
            winterWeekday: 0,
            totalSeasonLimit: 22
        }
    });

    useEffect(() => {
        fetchOwners();
        fetchRooms();
    }, []);

    // Reset Form
    const resetForm = () => {
        setFormData({
            fullName: "",
            cardId: "",
            cnic: "",
            phone: "",
            email: "",
            apartmentNumber: "",
            assignedRoom: "",
            agreementStartDate: "",
            agreementEndDate: "",
            seasonLimits: {
                summerWeekend: 0,
                summerWeekday: 0,
                winterWeekend: 0,
                winterWeekday: 0,
                totalSeasonLimit: 22
            }
        });
        setSelectedOwner(null);
    };

    // Handlers
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createOwner(formData);
        if (success) {
            setIsCreateOpen(false);
            resetForm();
            fetchOwners();
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOwner) return;
        const success = await updateOwner(selectedOwner._id, formData);
        if (success) {
            setIsEditOpen(false);
            resetForm();
            fetchOwners();
        }
    };

    const handleDelete = async () => {
        if (!selectedOwner) return;
        const success = await deleteOwner(selectedOwner._id);
        if (success) {
            setIsDeleteOpen(false);
            setSelectedOwner(null);
            fetchOwners();
        }
    };

    const openEdit = (owner: Owner) => {
        setSelectedOwner(owner);
        setFormData({
            fullName: owner.fullName,
            cardId: owner.cardId,
            cnic: owner.cnic || "",
            phone: owner.phone || "",
            email: owner.email || "",
            apartmentNumber: owner.apartmentNumber,
            assignedRoom: owner.assignedRoom?._id || "",
            agreementStartDate: owner.agreementStartDate ? owner.agreementStartDate.split('T')[0] : "",
            agreementEndDate: owner.agreementEndDate ? owner.agreementEndDate.split('T')[0] : "",
            seasonLimits: {
                summerWeekend: owner.seasonLimits?.summerWeekend || 0,
                summerWeekday: owner.seasonLimits?.summerWeekday || 0,
                winterWeekend: owner.seasonLimits?.winterWeekend || 0,
                winterWeekday: owner.seasonLimits?.winterWeekday || 0,
                totalSeasonLimit: owner.seasonLimits?.totalSeasonLimit || 22
            }
        });
        setIsEditOpen(true);
    };

    const openView = (owner: Owner) => {
        setSelectedOwner(owner);
        setIsViewOpen(true);
    };

    const openDelete = (owner: Owner) => {
        setSelectedOwner(owner);
        setIsDeleteOpen(true);
    };

    const filteredOwners = owners.filter(
        (owner) =>
            owner.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.cardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Timeline State
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const { getOwnerTimeline } = useOwnerContext();

    const openTimeline = async (owner: Owner) => {
        setSelectedOwner(owner);
        const data = await getOwnerTimeline(owner._id);
        if (data && data.success) {
            setTimelineData(data.timeline);
            setIsTimelineOpen(true);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* Mobile Toggle */}
                    <div className="lg:hidden mb-4 flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-6 w-6 text-slate-600" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-800">Owners</h1>
                    </div>

                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Owners</h1>
                                <p className="text-slate-500 mt-1">Manage apartment owners and agreements</p>
                            </div>
                            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-amber-500 hover:bg-amber-600">
                                <Plus className="mr-2 h-4 w-4" /> Add Owner
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, card ID or apartment..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Card ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Apartment</TableHead>
                                        <TableHead>Agreement Valid</TableHead>
                                        <TableHead>Seasonal Limit</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOwners.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                No owners found. Create one to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOwners.map((owner) => (
                                            <TableRow key={owner._id}>
                                                <TableCell className="font-mono font-medium">{owner.cardId}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-900">{owner.fullName}</div>
                                                    <div className="text-xs text-gray-500">{owner.phone}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                                                        {owner.apartmentNumber}
                                                    </span>
                                                    {owner.assignedRoom && (
                                                        <div className="text-xs text-gray-400 mt-1">Rm: {owner.assignedRoom.roomNumber}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {owner.agreementStartDate ? format(new Date(owner.agreementStartDate), "MMM yyyy") : "-"}
                                                        {" → "}
                                                        {owner.agreementEndDate ? format(new Date(owner.agreementEndDate), "MMM yyyy") : "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {owner.seasonLimits?.totalSeasonLimit || 22} Days
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openTimeline(owner)} title="View Timeline">
                                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => openView(owner)} title="View Details">
                                                            <Eye className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(owner)} title="Edit">
                                                            <Pencil className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => openDelete(owner)} title="Delete">
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Create Dialog */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Owner</DialogTitle>
                                <DialogDescription>Create a new owner profile.</DialogDescription>
                            </DialogHeader>
                            <OwnerForm
                                onSubmit={handleCreateSubmit}
                                submitLabel="Create Owner"
                                formData={formData}
                                setFormData={setFormData}
                                loading={loading}
                                onCancel={() => { setIsCreateOpen(false); resetForm(); }}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Owner</DialogTitle>
                                <DialogDescription>Update owner details.</DialogDescription>
                            </DialogHeader>
                            <OwnerForm
                                onSubmit={handleEditSubmit}
                                submitLabel="Update Owner"
                                formData={formData}
                                setFormData={setFormData}
                                loading={loading}
                                onCancel={() => { setIsEditOpen(false); resetForm(); }}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* View Dialog */}
                    <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Owner Details</DialogTitle>
                            </DialogHeader>
                            {selectedOwner && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-500 text-xs">Full Name</Label>
                                            <p className="font-medium">{selectedOwner.fullName}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500 text-xs">Card ID</Label>
                                            <p className="font-mono">{selectedOwner.cardId}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500 text-xs">Apartment</Label>
                                            <p>{selectedOwner.apartmentNumber}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500 text-xs">Phone</Label>
                                            <p>{selectedOwner.phone || "N/A"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500 text-xs">Limits (Summer)</Label>
                                            <p className="text-sm">We: {selectedOwner.seasonLimits.summerWeekend} | Wd: {selectedOwner.seasonLimits.summerWeekday}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500 text-xs">Limits (Winter)</Label>
                                            <p className="text-sm">We: {selectedOwner.seasonLimits.winterWeekend} | Wd: {selectedOwner.seasonLimits.winterWeekday}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <Label className="text-gray-500 text-xs">Total Season Limit</Label>
                                        <p className="text-2xl font-bold text-amber-600">{selectedOwner.seasonLimits.totalSeasonLimit} Days</p>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Timeline Dialog */}
                    <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Attendance Timeline</DialogTitle>
                                <DialogDescription>
                                    Visit history for <strong>{selectedOwner?.fullName}</strong>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
                                {timelineData.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        No attendance records found.
                                    </div>
                                ) : (
                                    timelineData.map((log: any) => (
                                        <div key={log._id} className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-blue-50 text-blue-700 w-16 h-16 rounded-lg">
                                                <span className="text-xs font-bold uppercase">{format(new Date(log.date), "MMM")}</span>
                                                <span className="text-xl font-bold">{format(new Date(log.date), "dd")}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-slate-900">{log.dayName}</h4>
                                                        <div className="flex gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {log.dayType}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                                                                {log.season.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 text-right">
                                                        <p>Marked by</p>
                                                        <p className="font-medium text-slate-700">{log.markedBy?.name || "Unknown"}</p>
                                                    </div>
                                                </div>
                                                {log.amountCharged > 0 && (
                                                    <div className="mt-2 text-sm text-red-600 font-medium">
                                                        Extra Charge: {log.amountCharged}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogContent className="max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Delete Owner?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete <strong>{selectedOwner?.fullName}</strong>? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                    {loading ? "Deleting..." : "Delete Owner"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    );
};

const OwnerForm = ({
    onSubmit,
    submitLabel,
    formData,
    setFormData,
    loading,
    onCancel
}: {
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
    formData: any,
    setFormData: any,
    loading: boolean,
    onCancel: () => void
}) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        id="fullName"
                        required
                        className="pl-9"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="cardId">Card ID (Unique)</Label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        id="cardId"
                        required
                        className="pl-9"
                        placeholder="e.g. hsq101"
                        value={formData.cardId}
                        onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="cnic">CNIC</Label>
                <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
            </div>

            {/* Apartment Info */}
            <div className="space-y-2">
                <Label htmlFor="aptNo">Apartment No.</Label>
                <div className="relative">
                    <Home className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        id="aptNo"
                        required
                        className="pl-9"
                        placeholder="e.g. 205"
                        value={formData.apartmentNumber}
                        onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
                    />
                </div>
            </div>

            {/* Agreement Info */}
            <div className="space-y-2">
                <Label htmlFor="startDate">Agreement Start</Label>
                <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.agreementStartDate}
                    onChange={(e) => setFormData({ ...formData, agreementStartDate: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="endDate">Agreement End</Label>
                <Input
                    id="endDate"
                    type="date"
                    required
                    value={formData.agreementEndDate}
                    onChange={(e) => setFormData({ ...formData, agreementEndDate: e.target.value })}
                />
            </div>

            {/* Limits */}
            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold mb-3 text-slate-800">Seasonal Voucher Configuration</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="totalLimit" className="font-bold">Total Season Limit</Label>
                        <Input
                            id="totalLimit"
                            type="number"
                            className="bg-white border-slate-300"
                            value={formData.seasonLimits.totalSeasonLimit}
                            onChange={(e) => setFormData({
                                ...formData,
                                seasonLimits: { ...formData.seasonLimits, totalSeasonLimit: parseInt(e.target.value) || 0 }
                            })}
                        />
                        <p className="text-xs text-slate-500">Max days allowed per season</p>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sWe">Summer Weekend</Label>
                            <Input
                                id="sWe"
                                type="number"
                                className="bg-white"
                                value={formData.seasonLimits.summerWeekend}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    seasonLimits: { ...formData.seasonLimits, summerWeekend: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sWd">Summer Weekday</Label>
                            <Input
                                id="sWd"
                                type="number"
                                className="bg-white"
                                value={formData.seasonLimits.summerWeekday}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    seasonLimits: { ...formData.seasonLimits, summerWeekday: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wWe">Winter Weekend</Label>
                            <Input
                                id="wWe"
                                type="number"
                                className="bg-white"
                                value={formData.seasonLimits.winterWeekend}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    seasonLimits: { ...formData.seasonLimits, winterWeekend: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wWd">Winter Weekday</Label>
                            <Input
                                id="wWd"
                                type="number"
                                className="bg-white"
                                value={formData.seasonLimits.winterWeekday}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    seasonLimits: { ...formData.seasonLimits, winterWeekday: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? "Processing..." : submitLabel}
            </Button>
        </div>
    </form>
);

export default OwnersPage;
