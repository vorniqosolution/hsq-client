import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Edit2,
  Trash2,
  X,
  Plus,
  Menu,
  Crown,
  Package,
  ImagePlus,
  Sparkles,
  FileText,
  Layers,
  AlertTriangle,
  Check,
  Search,
  Filter,
  MoreVertical,
  Save,
  CheckCircle,
} from "lucide-react";
import { useInventory } from "@/contexts/InventoryContext";
import { useDecor } from "@/contexts/DecorContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";

export default function Decor() {
  const { user } = useAuth();
  const { items } = useInventory();
  const {
    createPackage,
    packages,
    fetchPackages,
    updatePackage,
    deletePackage,
  } = useDecor();

  const [isOpen, setIsOpen] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formState, setFormState] = useState({
    title: "",
    price: "",
    description: "",
    isCustom: false,
    itemsQty: {} as Record<string, number>,
    images: [] as File[],
    existingImages: [] as string[], // Track existing images to keep
  });

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const resetForm = () =>
    setFormState({
      title: "",
      price: "",
      description: "",
      isCustom: false,
      itemsQty: {},
      images: [],
      existingImages: [],
    });

  const loadPkgToForm = (pkg: any) => {
    const itemsQty = (pkg.inventoryRequirements || []).reduce(
      (acc: any, cur: any) => {
        const name = cur?.item?.name ? cur.item.name : cur?.item;
        if (name) acc[name] = cur.quantity;
        return acc;
      },
      {}
    );

    setFormState({
      title: pkg.title || "",
      price: pkg.price ?? "",
      description: pkg.description || "",
      isCustom: !!pkg.isCustom,
      itemsQty,
      images: [],
      existingImages: pkg.images || [], // Load existing images
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormState((prev) => ({
        ...prev,
        images: [...prev.images, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeNewImage = (index: number) => {
    setFormState((prev) => {
      const updated = [...prev.images];
      updated.splice(index, 1);
      return { ...prev, images: updated };
    });
  };

  const removeExistingImage = (index: number) => {
    setFormState((prev) => {
      const updated = [...prev.existingImages];
      updated.splice(index, 1);
      return { ...prev, existingImages: updated };
    });
  };

  const increaseQty = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      itemsQty: { ...prev.itemsQty, [name]: (prev.itemsQty[name] || 0) + 1 },
    }));
  };

  const decreaseQty = (name: string) => {
    setFormState((prev) => {
      const cur = prev.itemsQty[name] || 0;
      if (cur <= 1) {
        const up = { ...prev.itemsQty };
        delete up[name];
        return { ...prev, itemsQty: up };
      }
      return { ...prev, itemsQty: { ...prev.itemsQty, [name]: cur - 1 } };
    });
  };

  const saveNew = async () => {
    if (!formState.title || !formState.price || !formState.description) {
      alert("All fields required");
      return;
    }
    if (Object.keys(formState.itemsQty).length === 0) {
      alert("Select items");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("title", formState.title);
    fd.append("price", String(formState.price));
    fd.append("description", formState.description);
    fd.append("isCustom", String(formState.isCustom));

    const arr = Object.entries(formState.itemsQty).map(([name, qty]) => {
      const item = items.find((i) => i.name === name);
      return { item: item?._id ?? name, quantity: qty };
    });

    fd.append("inventoryRequirements", JSON.stringify(arr));

    if (formState.images.length > 0) {
      formState.images.forEach((f) => fd.append("images", f));
    }

    try {
      await createPackage(fd);
      resetForm();
      setOpenAdd(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create package");
    } finally {
      setLoading(false);
    }
  };

  const saveUpdate = async () => {
    if (!selectedPkg) return;
    if (!formState.title || !formState.price || !formState.description) {
      alert("All fields required");
      return;
    }
    if (Object.keys(formState.itemsQty).length === 0) {
      alert("Select items");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("title", formState.title);
    fd.append("price", String(formState.price));
    fd.append("description", formState.description);
    fd.append("isCustom", String(formState.isCustom));

    const arr = Object.entries(formState.itemsQty).map(([name, qty]) => {
      const item = items.find((i) => i.name === name);
      return { item: item?._id ?? name, quantity: qty };
    });

    fd.append("inventoryRequirements", JSON.stringify(arr));

    // Send existing images that should be kept
    fd.append("existingImages", JSON.stringify(formState.existingImages));

    // Send new images
    if (formState.images.length > 0) {
      formState.images.forEach((f) => fd.append("images", f));
    }

    try {
      await updatePackage(selectedPkg._id, fd);
      setOpenUpdate(false);
      resetForm();
      setSelectedPkg(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update package");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPkg) return;
    setLoading(true);
    try {
      await deletePackage(selectedPkg._id);
      setOpenDelete(false);
      setSelectedPkg(null);
      fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete package");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";
  const customCount = packages.filter((p: any) => p.isCustom).length;
  const standardCount = packages.length - customCount;

  const filteredPackages = packages.filter(
    (pkg: any) =>
      pkg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              <div className="flex items-center space-x-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <span className="font-light tracking-wider text-slate-900">
                  HSQ ADMIN
                </span>
              </div>
              <div className="w-9" />
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-light text-slate-900 tracking-wide flex items-center">
                  <Sparkles className="h-7 w-7 text-amber-500 mr-3" />
                  Decor Packages
                </h1>
                <p className="text-slate-600 mt-1 font-light">
                  Manage decoration packages and inventory requirements
                </p>
              </div>

              <Button
                onClick={() => {
                  resetForm();
                  setOpenAdd(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>

            {/* Success Alert */}
            {saveSuccess && (
              <div className="flex items-center p-3 mb-6 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
                <span>Operation completed successfully!</span>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-800">
                        {packages.length}
                      </p>
                      <p className="text-sm text-slate-500 font-light">
                        Total Packages
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-800">
                        {standardCount}
                      </p>
                      <p className="text-sm text-slate-500 font-light">
                        Standard Packages
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-800">
                        {customCount}
                      </p>
                      <p className="text-sm text-slate-500 font-light">
                        Custom Packages
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <Card className="border-0 shadow-md bg-white mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search packages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Packages Grid */}
            {filteredPackages.length === 0 ? (
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    No Packages Found
                  </h3>
                  <p className="text-slate-500 font-light mb-6">
                    {searchTerm
                      ? "No packages match your search criteria"
                      : "Get started by creating your first decor package"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => {
                        resetForm();
                        setOpenAdd(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Package
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPackages.map((pkg: any) => (
                  <PackageCard
                    key={pkg._id}
                    pkg={pkg}
                    onEdit={() => {
                      setSelectedPkg(pkg);
                      loadPkgToForm(pkg);
                      setOpenUpdate(true);
                    }}
                    onDelete={() => {
                      setSelectedPkg(pkg);
                      setOpenDelete(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {openAdd && (
        <Modal
          title="Create New Package"
          subtitle="Add a new decor package to your collection"
          onClose={() => setOpenAdd(false)}
          onSave={saveNew}
          loading={loading}
        >
          <Form
            items={items}
            formState={formState}
            setFormState={setFormState}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            handleImageChange={handleImageChange}
            removeNewImage={removeNewImage}
            removeExistingImage={removeExistingImage}
            isUpdate={false}
          />
        </Modal>
      )}

      {/* Update Modal */}
      {openUpdate && (
        <Modal
          title="Update Package"
          subtitle="Modify the package details"
          onClose={() => {
            setOpenUpdate(false);
            setSelectedPkg(null);
          }}
          onSave={saveUpdate}
          loading={loading}
          saveLabel="Update"
        >
          <Form
            items={items}
            formState={formState}
            setFormState={setFormState}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            handleImageChange={handleImageChange}
            removeNewImage={removeNewImage}
            removeExistingImage={removeExistingImage}
            isUpdate={true}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {openDelete && selectedPkg && (
        <DeleteModal
          packageName={selectedPkg.title}
          onClose={() => setOpenDelete(false)}
          onConfirm={confirmDelete}
          loading={loading}
        />
      )}
    </div>
  );
}

// Package Card Component
function PackageCard({ pkg, onEdit, onDelete }: any) {
  const [imageIndex, setImageIndex] = useState(0);
  const hasImages = pkg.images?.length > 0;

  return (
    <Card className="border-0 shadow-md bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {hasImages ? (
          <>
            <img
              src={pkg.images[imageIndex]}
              alt={pkg.title}
              className="w-full h-full object-cover"
            />
            {pkg.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {pkg.images.slice(0, 4).map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === imageIndex
                        ? "bg-white w-4"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-slate-300 mb-2" />
            <span className="text-sm text-slate-400 font-light">No images</span>
          </div>
        )}

        {/* Custom Badge */}
        {pkg.isCustom && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Customizable
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-slate-800 font-semibold rounded-lg shadow-lg">
          Rs{pkg.price?.toLocaleString()}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <h3 className="text-lg font-medium text-slate-800 mb-2 line-clamp-1">
          {pkg.title}
        </h3>
        <p className="text-slate-500 text-sm font-light mb-4 line-clamp-2">
          {pkg.description}
        </p>

        {/* Items */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Includes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(pkg.inventoryRequirements || [])
              .slice(0, 3)
              .map((i: any, idx: number) => {
                const name = i?.item?.name || i.item;
                return (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium"
                  >
                    {name} ×{i.quantity}
                  </span>
                );
              })}
            {(pkg.inventoryRequirements?.length || 0) > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full">
                +{pkg.inventoryRequirements.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Modal Component
function Modal({
  title,
  subtitle,
  onClose,
  onSave,
  children,
  loading,
  saveLabel = "Save",
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-light text-slate-900">
                  {title}
                </CardTitle>
                {subtitle && (
                  <CardDescription className="font-light text-slate-500">
                    {subtitle}
                  </CardDescription>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {children}
        </CardContent>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saveLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Delete Modal Component
function DeleteModal({ packageName, onClose, onConfirm, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-medium text-slate-800 mb-2">
            Delete Package?
          </h3>
          <p className="text-slate-500 font-light mb-2">
            Are you sure you want to delete
          </p>
          <p className="font-medium text-slate-800 mb-4">"{packageName}"</p>
          <p className="text-sm text-slate-400 font-light">
            This action cannot be undone.
          </p>
        </CardContent>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Form Component - Updated with removable existing images
function Form({
  items,
  formState,
  setFormState,
  increaseQty,
  decreaseQty,
  handleImageChange,
  removeNewImage,
  removeExistingImage,
  isUpdate = false,
}: any) {
  const totalImages =
    (formState.existingImages?.length || 0) + (formState.images?.length || 0);

  return (
    <div className="space-y-5">
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-slate-700">
          Package Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Enter package title..."
          className="border-slate-200 focus:border-amber-500 focus:ring-amber-500"
          value={formState.title}
          onChange={(e) =>
            setFormState({ ...formState, title: e.target.value })
          }
        />
      </div>

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="price" className="text-slate-700">
          Price (Rs) <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="price"
            type="number"
            placeholder="Enter price..."
            className="border-slate-200 focus:border-amber-500 focus:ring-amber-500 pl-8"
            value={formState.price}
            onChange={(e) =>
              setFormState({ ...formState, price: e.target.value })
            }
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-700">
          Description <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="description"
          placeholder="Describe the package..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none text-sm"
          value={formState.description}
          onChange={(e) =>
            setFormState({ ...formState, description: e.target.value })
          }
        />
      </div>

      {/* Custom Checkbox */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
        <input
          type="checkbox"
          id="isCustom"
          checked={!!formState.isCustom}
          onChange={(e) =>
            setFormState({ ...formState, isCustom: e.target.checked })
          }
          className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
        />
        <label htmlFor="isCustom" className="cursor-pointer">
          <span className="font-medium text-slate-800 text-sm">
            Customizable Package
          </span>
          <p className="text-xs text-slate-500 font-light">
            Allow customers to modify this package
          </p>
        </label>
      </div>

      {/* Items Selection */}
      <div className="space-y-3">
        <Label className="text-slate-700">
          Select Items <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
          {items.map((item: any) => (
            <div
              key={item._id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                formState.itemsQty?.[item.name]
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-sm font-medium text-slate-700 truncate mr-2">
                {item.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-sm font-bold transition-colors"
                  onClick={() => decreaseQty(item.name)}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium text-slate-800">
                  {formState.itemsQty?.[item.name] || 0}
                </span>
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded text-sm font-bold transition-colors"
                  onClick={() => increaseQty(item.name)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        {Object.keys(formState.itemsQty).length > 0 && (
          <p className="text-xs text-amber-600 font-medium">
            {Object.keys(formState.itemsQty).length} item(s) selected
          </p>
        )}
      </div>

      {/* Image Upload */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-700">
            Images{" "}
            <span className="text-slate-400 font-light">(Optional)</span>
          </Label>
          {totalImages > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              {totalImages} image(s)
            </span>
          )}
        </div>

        {/* Existing Images - Only show in update mode */}
        {isUpdate && formState.existingImages?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Current Images (click × to remove)
            </p>
            <div className="flex gap-3 flex-wrap p-3 bg-slate-50 rounded-lg border border-slate-200">
              {formState.existingImages.map((img: string, idx: number) => (
                <div key={`existing-${idx}`} className="relative group">
                  <img
                    src={img}
                    alt={`existing-${idx}`}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200 group-hover:border-red-300 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded font-medium">
                    Current
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <ImagePlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Click to upload {isUpdate ? "new " : ""}images
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PNG, JPG up to 5MB each
            </p>
          </label>
        </div>

        {/* New Images Preview */}
        {formState.images?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              New Images to Upload
            </p>
            <div className="flex gap-3 flex-wrap p-3 bg-blue-50 rounded-lg border border-blue-200">
              {formState.images.map((file: File, idx: number) => (
                <div key={`new-${idx}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview-${idx}`}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200 group-hover:border-red-300 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded font-medium">
                    New
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No images message */}
        {isUpdate &&
          formState.existingImages?.length === 0 &&
          formState.images?.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-2">
              No images. Upload some to add visuals to your package.
            </p>
          )}
      </div>
    </div>
  );
}