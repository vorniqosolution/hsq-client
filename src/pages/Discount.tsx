import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import HSQ from "../../public/HSQ.png";
import {
  Users,
  Bed,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Crown,
  Star,
  Plus,
  Search,
  MoreVertical,
  Tag,
  Percent,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Sparkles,
  Ticket,
  Archive,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useDiscountContext,
  Discount,
  CreateDiscountInput,
} from "@/contexts/DiscountContext";
import { useAuth } from "@/contexts/AuthContext";

const DiscountsPage = () => {
  const {
    discounts,
    currentDiscounts,
    loading,
    error,
    fetchDiscounts,
    deleteDiscount,
    updateDiscount,
  } = useDiscountContext();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "scheduled"
  >("all");
  const location = useLocation();

  // Update discount dialog state
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [discountToUpdate, setDiscountToUpdate] = useState<Discount | null>(
    null
  );
  const [updatedValues, setUpdatedValues] = useState<
    Partial<CreateDiscountInput>
  >({
    title: "",
    percentage: 0,
    startDate: "",
    endDate: "",
  });

  // Delete confirmation state
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(
    null
  );

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Set form values when discount to update changes
  useEffect(() => {
    if (discountToUpdate) {
      setUpdatedValues({
        title: discountToUpdate.title,
        percentage: discountToUpdate.percentage,
        startDate: discountToUpdate.startDate.split("T")[0], // Format date for input
        endDate: discountToUpdate.endDate.split("T")[0],
      });
    }
  }, [discountToUpdate]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  // Helper to determine discount status based on dates
  const getDiscountStatus = (
    discount: Discount
  ): "active" | "expired" | "scheduled" => {
    const now = new Date();
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);

    if (now < startDate) return "scheduled";
    if (now > endDate) return "expired";
    return "active";
  };

  // Filter discounts based on search query and status filter
  const filteredDiscounts = discounts.filter((discount) => {
    const status = getDiscountStatus(discount);
    const matchesSearch = discount.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get counts by status
  const activeCount = discounts.filter(
    (d) => getDiscountStatus(d) === "active"
  ).length;
  const scheduledCount = discounts.filter(
    (d) => getDiscountStatus(d) === "scheduled"
  ).length;
  const expiredCount = discounts.filter(
    (d) => getDiscountStatus(d) === "expired"
  ).length;

  // Format date in readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge
  const getStatusBadge = (status: "active" | "expired" | "scheduled") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
            Active
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
            Scheduled
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedValues((prev) => ({
      ...prev,
      [name]: name === "percentage" ? parseFloat(value) : value,
    }));
  };

  const handleUpdateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discountToUpdate) return;

    try {
      await updateDiscount(discountToUpdate._id, updatedValues);
      toast({
        title: "Success",
        description: `Discount "${updatedValues.title}" has been updated.`,
      });
      setIsUpdateDialogOpen(false);
      setDiscountToUpdate(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update the discount. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiscount = async () => {
    if (!discountToDelete) return;

    try {
      await deleteDiscount(discountToDelete._id);
      toast({
        title: "Success",
        description: `Discount "${discountToDelete.title}" has been deleted.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDiscountToDelete(null);
    }
  };

  // Loading state
  if (loading && !discounts.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="flex-1">
        {/* Discounts content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">
                  Discounts
                </h1>
                <p className="text-slate-600 mt-2 font-light">
                  Manage promotional offers and discount codes
                </p>
              </div>
            </div>

            {/* Stats and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Active:
                      </span>
                      <span className="font-medium text-emerald-600">
                        {activeCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Scheduled:
                      </span>
                      <span className="font-medium text-blue-600">
                        {scheduledCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Expired:
                      </span>
                      <span className="font-medium text-slate-600">
                        {expiredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-slate-800">
                        Total:
                      </span>
                      <span className="font-medium text-slate-800">
                        {discounts.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Discounts Table */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b bg-slate-50">
                <CardTitle className="text-xl font-light text-slate-900">
                  Discount Codes
                </CardTitle>
                <CardDescription className="font-light text-slate-500">
                  All promotional offers and their status
                </CardDescription>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                        Code
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                        Value
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                        Validity
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                        Status
                      </th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiscounts.map((discount) => {
                      const status = getDiscountStatus(discount);
                      return (
                        <tr
                          key={discount._id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <Tag className="h-4 w-4 text-amber-600" />
                              </div>
                              <span className="font-medium text-slate-800">
                                {discount.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-800 font-medium">
                                {discount.percentage === 0
                                  ? "0%"
                                  : `${discount.percentage}%`}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {formatDate(discount.startDate)} -{" "}
                            {formatDate(discount.endDate)}
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(status)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                onClick={() => {
                                  setDiscountToUpdate(discount);
                                  setIsUpdateDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Update
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredDiscounts.length === 0 && (
                <div className="py-12 text-center">
                  <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-light">
                    No discounts found
                  </p>
                </div>
              )}

              <CardContent className="p-6 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">
                    Showing {filteredDiscounts.length} of {discounts.length}{" "}
                    discounts
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Update Discount Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <DialogTitle>Update Discount</DialogTitle>
              <DialogDescription>
                Modify the discount settings and preferences.
              </DialogDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsUpdateDialogOpen(false);
                  setDiscountToUpdate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                form="update-discount-form"
                className="bg-amber-500 hover:bg-amber-600"
              >
                Update
              </Button>
            </div>
          </DialogHeader>
          <form
            id="update-discount-form"
            onSubmit={handleUpdateDiscount}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Discount Code</Label>
              <Input
                id="title"
                name="title"
                value={updatedValues.title}
                onChange={handleInputChange}
                placeholder="SUMMER25"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Discount Percentage</Label>
              <div className="relative">
                <Input
                  id="percentage"
                  name="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={updatedValues.percentage}
                  onChange={handleInputChange}
                  className="pr-8"
                  required
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-slate-500">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={updatedValues.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={updatedValues.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!discountToDelete}
        onOpenChange={(open) => !open && setDiscountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the discount code "
              {discountToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDiscount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscountsPage;
