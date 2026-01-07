import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Tag,
    Edit2,
    Percent,
    CheckCircle,
    XCircle,
    Plus,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePromoCodeContext, PromoCode, CreatePromoInput } from "@/contexts/PromoCodeContext";

const PromoCodesPage = () => {
    const {
        promoCodes,
        loading,
        error,
        fetchPromoCodes,
        createPromoCode,
        updatePromoStatus,
    } = usePromoCodeContext();

    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const [newPromo, setNewPromo] = useState<CreatePromoInput>({
        code: "",
        percentage: 0,
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        fetchPromoCodes();
    }, [fetchPromoCodes]);

    const filteredPromos = promoCodes.filter((promo) => {
        const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || promo.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeCount = promoCodes.filter(p => p.status === "active").length;
    const inactiveCount = promoCodes.filter(p => p.status === "inactive").length;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleCreatePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPromoCode(newPromo);
            toast({
                title: "Success",
                description: `Promo code "${newPromo.code}" created successfully.`,
            });
            setIsCreateDialogOpen(false);
            setNewPromo({ code: "", percentage: 0, startDate: "", endDate: "" });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to create promo code.",
                variant: "destructive",
            });
        }
    };

    const toggleStatus = async (promo: PromoCode) => {
        const newStatus = promo.status === "active" ? "inactive" : "active";
        try {
            await updatePromoStatus(promo._id, newStatus);
            toast({
                title: "Status Updated",
                description: `Promo code "${promo.code}" is now ${newStatus}.`,
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        }
    };

    if (loading && !promoCodes.length) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Header - Optional if Layout handles it, but let's keep page content structure simpler */}

            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
                        <div>
                            <h1 className="text-4xl font-light text-slate-900 tracking-wide">
                                Promo Codes
                            </h1>
                            <p className="text-slate-600 mt-2 font-light">
                                Manage promotional codes and discounts.
                            </p>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4 md:mt-0 bg-amber-500 hover:bg-amber-600">
                            <Plus className="mr-2 h-4 w-4" /> Create Promo Code
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="border-0 shadow-lg bg-white">
                            <CardContent className="p-6">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Active:</span>
                                        <span className="font-medium text-emerald-600">{activeCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Inactive:</span>
                                        <span className="font-medium text-slate-600">{inactiveCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="text-sm font-medium text-slate-800">Total:</span>
                                        <span className="font-medium text-slate-800">{promoCodes.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <Card className="border-0 shadow-lg bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b bg-slate-50">
                            <CardTitle className="text-xl font-light text-slate-900">
                                All Promo Codes
                            </CardTitle>
                            <CardDescription className="font-light text-slate-500">
                                List of all generated promo codes.
                            </CardDescription>
                        </CardHeader>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Code</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Discount</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Validity</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Usage</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Status</th>
                                        <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPromos.map((promo) => (
                                        <tr key={promo._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-800">{promo.code}</td>
                                            <td className="py-4 px-6 text-emerald-600 font-bold">{promo.percentage}%</td>
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">{promo.usageCount} times</td>
                                            <td className="py-4 px-6">
                                                <Badge className={promo.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}>
                                                    {promo.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleStatus(promo)}
                                                    className={promo.status === "active" ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"}
                                                >
                                                    {promo.status === "active" ? "Deactivate" : "Activate"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Promo Code</DialogTitle>
                        <DialogDescription>Generates a new code for guests to use.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePromo} className="space-y-4">
                        <div>
                            <Label>Code (Uppercase)</Label>
                            <Input
                                value={newPromo.code}
                                onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                placeholder="SUMMER2026"
                                required
                            />
                        </div>
                        <div>
                            <Label>Percentage (%)</Label>
                            <Input
                                type="number"
                                min="1" max="100"
                                value={newPromo.percentage}
                                onChange={(e) => setNewPromo({ ...newPromo, percentage: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={newPromo.startDate}
                                    onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={newPromo.endDate}
                                    onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-amber-500 hover:bg-amber-600">Create</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PromoCodesPage;
