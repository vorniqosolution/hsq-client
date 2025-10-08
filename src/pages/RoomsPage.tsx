import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Clock,
  Upload,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Menu,
  X,
  Users,
  Bed,
  Settings,
  LogOut,
  Home,
  Crown,
  Star,
  Sparkles,
  Archive,
  FileText,
  Ticket,
  Eye,
  Filter,
  Check,
  RefreshCw,
  Percent,
  LucideChartNoAxesColumnDecreasing,
  Calendar,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Room, useRoomContext } from "../contexts/RoomContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RoomsPage = () => {
  const availableAmenities = [
    "WiFi",
    "TV",
    "Air Conditioning",
    "Mini Bar",
    "Room Safety",
    "Telephone",
    "Laundry",
  ];

  const {
    rooms,
    availableRooms,
    currentRoom,
    loading,
    error,
    createRoom,
    fetchRooms,
    fetchRoomById,
    updateRoom,
    deleteRoom,
    fetchAvailableRooms,
  } = useRoomContext();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [displayedRooms, setDisplayedRooms] = useState<Room[]>([]);
  const [searchDates, setSearchDates] = useState({
    checkin: "",
    checkout: "",
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

  const roomCategories = [
    "Standard",
    "Deluxe",
    "Duluxe-Plus",
    "Executive",
    "Presidential",
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [formData, setFormData] = useState<Partial<Room>>({
    roomNumber: "",
    bedType: "One Bed",
    category: "Standard",
    view: "Lobby Facing",
    rate: 0,
    status: "available" as
      | "available"
      | "reserved"
      | "occupied"
      | "maintenance",
    owner: "admin",
    amenities: [],
    isPubliclyVisible: false,
    publicDescription: "",
    adults: 2,
    cleaniness: "Redefining standard living our rooms.",
  });

  useEffect(() => {
    fetchRooms().catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === "available") {
      setDisplayedRooms(availableRooms || []);
    } else {
      setDisplayedRooms(rooms || []);
    }
  }, [activeTab, rooms, availableRooms]);

  const resetForm = () => {
    setFormData({
      roomNumber: "",
      bedType: "One Bed",
      category: "Standard",
      view: "Lobby Facing",
      rate: 0,
      status: "available",
      owner: "admin",
      amenities: [],
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setDeletedImages([]);
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData((prev) => {
      const currentAmenities = prev.amenities || [];
      if (currentAmenities.includes(amenity)) {
        // If it's already there, remove it
        return {
          ...prev,
          amenities: currentAmenities.filter((a) => a !== amenity),
        };
      } else {
        // If it's not there, add it
        return { ...prev, amenities: [...currentAmenities, amenity] };
      }
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages =
      selectedImages.length +
      (existingImages?.length || 0) -
      deletedImages.length +
      files.length;

    if (totalImages > 3) {
      toast({
        title: "Too many images",
        description: "You can only upload up to 3 images per room",
        variant: "destructive",
      });
      return;
    }

    setSelectedImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setDeletedImages((prev) => [...prev, imageUrl]);
  };

  const handleEditRoom = (room: Room) => {
    setFormData({
      ...room,
    });
    setExistingImages(room.images || []);
    setDeletedImages([]);
    setSelectedImages([]);
    setImagePreviews([]);
    setIsEditDialogOpen(true);
  };

  const handleViewRoom = (roomId: string) => {
    if (fetchRoomById) {
      fetchRoomById(roomId)
        .then(() => setIsViewDialogOpen(true))
        .catch((err) => {
          console.error(err);
          toast({
            title: "Error",
            description: "Failed to fetch room details",
            variant: "destructive",
          });
        });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoom) return;

    const formDataToSend = new FormData();

    // Add room data
    Object.entries(formData).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        key !== "_id" &&
        key !== "images" &&
        key !== "amenities"
      ) {
        formDataToSend.append(key, value.toString());
      }
    });

    if (formData.amenities && formData.amenities.length > 0) {
      formData.amenities.forEach((amenity) => {
        formDataToSend.append("amenities", amenity);
      });
    }

    // Add images
    selectedImages.forEach((image) => {
      formDataToSend.append("images", image);
    });

    const success = await createRoom(formDataToSend);
    if (success) {
      toast({
        title: "Room created",
        description: `Room ${formData.roomNumber} has been created with ${selectedImages.length} images.`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } else {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateRoom || !formData._id) return;

    const formDataToSend = new FormData();

    // Add room data
    Object.entries(formData).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        key !== "_id" &&
        key !== "images" &&
        key !== "amenities"
      ) {
        formDataToSend.append(key, value.toString());
      }
    });

    // --- ADD THIS BLOCK: Handle amenities array specifically ---
    if (formData.amenities && formData.amenities.length > 0) {
      formData.amenities.forEach((amenity) => {
        formDataToSend.append("amenities", amenity);
      });
    }
    // --- END OF NEW BLOCK ---

    // Add new images
    selectedImages.forEach((image) => {
      formDataToSend.append("images", image);
    });

    // Add deleted images if any
    if (deletedImages.length > 0) {
      formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
    }

    const success = await updateRoom(formData._id, formDataToSend);
    if (success) {
      toast({
        title: "Room updated",
        description: `Room ${formData.roomNumber} has been updated.`,
      });
      setIsEditDialogOpen(false);
      resetForm();
    } else {
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoom || !roomToDelete) return;

    const success = await deleteRoom(roomToDelete);
    if (success) {
      toast({
        title: "Room deleted",
        description: "The room has been successfully deleted.",
      });
      setRoomToDelete(null);
    } else {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const handleSearchAvailableRooms = async () => {
    if (!searchDates.checkin || !searchDates.checkout) {
      toast({
        title: "Missing dates",
        description: "Please select both check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(searchDates.checkout) <= new Date(searchDates.checkin)) {
      toast({
        title: "Invalid dates",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    await fetchAvailableRooms(searchDates.checkin, searchDates.checkout);
    setHasSearched(true);
    setActiveTab("available");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-800";
      case "occupied":
        return "bg-amber-100 text-amber-800";
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ADD SIDE_BAR */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
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
        {/* Room content - enhanced with tabs and CRUD operations */}
        <div className="p-6 ">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="w-full mb-6">
                <Card className="p-6">
                  <div className="backdrop-blur-sm rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="checkin"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                        >
                          <Calendar className="h-4 w-4 " />
                          Check-in Date
                        </Label>
                        <div className="relative group">
                          <Input
                            id="checkin"
                            type="date"
                            value={searchDates.checkin}
                            min={new Date().toISOString().split("T")[0]}
                            max={searchDates.checkout || undefined}
                            onChange={(e) =>
                              setSearchDates({
                                ...searchDates,
                                checkin: e.target.value,
                              })
                            }
                            className={`
            w-full pl-10 pr-3 py-2.5 
            border-gray-200 rounded-lg`}
                            required
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

                          {/* Date preview */}
                          {searchDates.checkin && (
                            <div className="absolute -bottom-5 left-0 text-xs  font-medium">
                              {new Date(searchDates.checkin).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center justify-center px-2 mt-6">
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-[2px] bg-gradient-to-r from-amber-300 to-amber-400"></div>
                          <Clock className="h-4 w-4 text-amber-400" />
                          <div className="w-8 h-[2px] bg-gradient-to-r from-amber-400 to-amber-300"></div>
                        </div>
                      </div>

                      {/* Check-out Date */}
                      <div className="flex-1">
                        <Label
                          htmlFor="checkout"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Check-out Date
                          {!searchDates.checkin && (
                            <span className="text-xs text-gray-400 font-normal">
                              (Select check-in first)
                            </span>
                          )}
                        </Label>
                        <div className="relative group">
                          <Input
                            id="checkout"
                            type="date"
                            value={searchDates.checkout}
                            min={
                              searchDates.checkin ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              setSearchDates({
                                ...searchDates,
                                checkout: e.target.value,
                              })
                            }
                            disabled={!searchDates.checkin}
                            className={`
            w-full pl-10 pr-3 py-2.5
            border-gray-200 rounded-lg
            focus:ring-2`}
                            required
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

                          {/* Date preview */}
                          {searchDates.checkout && (
                            <div className="absolute -bottom-5 left-0 text-xs font-medium">
                              {new Date(
                                searchDates.checkout
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 items-end lg:mt-6">
                        {/* Clear Button */}
                        {(searchDates.checkin || searchDates.checkout) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchDates({ checkin: "", checkout: "" });
                              setHasSearched(false);
                              setActiveTab("all");
                            }}
                            className="px-3 py-2.5 transition-all group"
                            title="Clear dates"
                          >
                            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                          </Button>
                        )}

                        {/* Search Button */}
                        <Button
                          onClick={handleSearchAvailableRooms}
                          disabled={
                            !searchDates.checkin ||
                            !searchDates.checkout ||
                            loading
                          }
                          className={`
          relative overflow-hidden
          px-6 py-2.5 font-medium
          bg-gradient-to-r from-amber-500 to-amber-600
          hover:from-amber-600 hover:to-amber-700
          text-white rounded-lg
          transform transition-all duration-200
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:scale-100
          shadow-lg shadow-amber-500/25
          group
        `}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {loading ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Searching...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                Find Available Rooms
                              </>
                            )}
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                        </Button>
                      </div>
                    </div>
                    {hasSearched && (
                      <div
                        className={`mt-4 pt-4 border-t border-amber-100 animate-in slide-in-from-bottom-2 duration-300`}
                      >
                        {availableRooms && availableRooms.length > 0 ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                              <Check className="h-4 w-4 bg-green-100 rounded-full p-0.5" />
                              Found {availableRooms.length} available room
                              {availableRooms.length !== 1 ? "s" : ""} for your
                              selected dates
                            </p>
                          </div>
                        ) : (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-sm text-orange-700 flex items-center gap-2">
                              <X className="h-4 w-4" />
                              No rooms available for these dates. Try different
                              dates or contact us for assistance.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Room Management Section */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border border-red">
                    {/* Room filtering tabs */}
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full sm:w-auto"
                    >
                      <TabsList className="grid grid-cols-2 w-full sm:w-[320px]">
                        <TabsTrigger
                          value="all"
                          className="flex items-center justify-center"
                        >
                          <Bed className="h-4 w-4 mr-2" />
                          All Rooms ({rooms?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger
                          value="available"
                          className="flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {hasSearched ? "Search Results" : "Available"} (
                          {availableRooms?.length || 0})
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Create Room Dialog */}
                    <Dialog
                      open={isCreateDialogOpen}
                      onOpenChange={setIsCreateDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-amber-500 hover:bg-amber-600 w-full sm:w-auto">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Room
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl lg:max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Add New Room</DialogTitle>
                          <DialogDescription>
                            Create a new room for your hotel
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleCreateSubmit}
                          className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-4"
                        >
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="roomNumber">Room Number</Label>
                              <Input
                                id="roomNumber"
                                value={formData.roomNumber}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    roomNumber: e.target.value,
                                  })
                                }
                                placeholder="101"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="bedType">Bed Type</Label>
                              <Select
                                value={formData.bedType}
                                onValueChange={(val) =>
                                  setFormData({ ...formData, bedType: val })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Studio">Studio</SelectItem>
                                  <SelectItem value="One Bed">
                                    One Bed
                                  </SelectItem>
                                  <SelectItem value="Two Bed">
                                    Two Bed
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Select
                                value={formData.category}
                                onValueChange={(val) =>
                                  setFormData({ ...formData, category: val })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Standard">
                                    Standard
                                  </SelectItem>
                                  <SelectItem value="Duluxe-Plus">
                                    Duluxe-Plus
                                  </SelectItem>
                                  <SelectItem value="Deluxe">Deluxe</SelectItem>
                                  <SelectItem value="Executive">
                                    Executive
                                  </SelectItem>
                                  <SelectItem value="Presidential">
                                    Presidential
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="view">View</Label>
                              <Select
                                value={formData.view}
                                onValueChange={(val) =>
                                  setFormData({ ...formData, view: val })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Lobby Facing">
                                    Lobby Facing
                                  </SelectItem>
                                  <SelectItem value="Terrace View">
                                    Terrace View
                                  </SelectItem>
                                  <SelectItem value="Valley View">
                                    Valley View
                                  </SelectItem>
                                  <SelectItem value="Corner">Corner</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="rate">Rate per Night</Label>
                              <Input
                                id="rate"
                                type="number"
                                value={formData.rate}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    rate: parseFloat(e.target.value),
                                  })
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(val) =>
                                  setFormData({
                                    ...formData,
                                    status: val as
                                      | "available"
                                      | "reserved"
                                      | "occupied"
                                      | "maintenance",
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">
                                    Available
                                  </SelectItem>
                                  <SelectItem value="occupied">
                                    Occupied
                                  </SelectItem>
                                  <SelectItem value="maintenance">
                                    Maintenance
                                  </SelectItem>
                                  <SelectItem value="reserved">
                                    Reserved
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="adults">Max Adults</Label>
                              <Input
                                id="adults"
                                type="number"
                                min="1"
                                value={formData.adults}
                                placeholder="max: 8"
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    adults: parseInt(e.target.value, 10),
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="flex items-center space-x-2 pt-2 col-span-2">
                              <input
                                type="checkbox"
                                id="create-isPubliclyVisible"
                                name="isPubliclyVisible"
                                checked={!!formData.isPubliclyVisible}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    isPubliclyVisible: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              />
                              <label
                                htmlFor="create-isPubliclyVisible"
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                Show this room on the public website
                              </label>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center gap-6 border-t pt-4">
                            <div className="space-y-2 md:w-1/2">
                              <Label>Amenities</Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md">
                                {availableAmenities.map((amenity) => (
                                  <div
                                    key={amenity}
                                    className="flex items-center space-x-2"
                                  >
                                    <input
                                      type="checkbox"
                                      id={`amenity-${amenity}`}
                                      checked={formData.amenities?.includes(
                                        amenity
                                      )}
                                      onChange={() =>
                                        handleAmenityChange(amenity)
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <label
                                      htmlFor={`amenity-${amenity}`}
                                      className="text-sm font-medium text-gray-700"
                                    >
                                      {amenity}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2 md:w-1/2">
                              <Label htmlFor="create-publicDescription">
                                Public Description (for Website)
                              </Label>
                              <Textarea
                                id="create-publicDescription"
                                value={formData.publicDescription || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    publicDescription: e.target.value,
                                  })
                                }
                                placeholder="Enter a guest-friendly description that will be shown on the public website..."
                                className="min-h-[100px]"
                              />
                              <p className="text-xs text-gray-500">
                                This text will be visible to guests on the hotel
                                website.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Room Images (Max 6)</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                              <input
                                type="file"
                                id="room-images"
                                multiple
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                              <label
                                htmlFor="room-images"
                                className="flex flex-col items-center cursor-pointer"
                              >
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                  Click to upload images
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  JPG, PNG or GIF • Max 6 images
                                </span>
                              </label>
                            </div>

                            {/* Image previews */}
                            {imagePreviews.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mt-4">
                                {imagePreviews.map((preview, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeNewImage(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600"
                          >
                            Create Room
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
              {displayedRooms.map((room) => (
                <Card
                  key={room._id}
                  className="flex flex-col lg:flex-row overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Image Section */}
                  <div className="lg:w-1/3 flex-shrink-0">
                    {room.images && room.images.length > 0 ? (
                      <img
                        src={room.images[0]}
                        alt={`Room ${room.roomNumber}`}
                        className="w-full h-48 lg:h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-48 lg:h-full bg-slate-100">
                        <ImageIcon className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex flex-col flex-grow justify-between lg:w-2/3">
                    {/* Top part: Title, Description, and Status */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">
                            Room {room.roomNumber}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {room.dropdownLabel ||
                              `${room.bedType} ${room.category} ${room.view}`}
                          </p>
                        </div>
                        <Badge
                          className={`${getStatusColor(
                            room.status
                          )} flex-shrink-0 ml-2`}
                        >
                          {room.status.charAt(0).toUpperCase() +
                            room.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Bottom part: Price and Actions */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Rate</p>
                        <p className="text-lg font-semibold text-slate-900">
                          Rs {room.rate.toLocaleString()}
                          <span className="text-sm font-normal text-slate-500">
                            {" "}
                            / night
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* View Room Details */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRoom(room._id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {/* Edit Room */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>

                        {/* Delete Room */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setRoomToDelete(room._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Room {room.roomNumber}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the room and all associated
                                data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setRoomToDelete(null)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteRoom}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty state */}
            {displayedRooms.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Bed className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">
                  {activeTab === "available"
                    ? hasSearched
                      ? "No available rooms found for the selected dates. Try different dates."
                      : "Search for available rooms by selecting check-in and check-out dates above."
                    : "No rooms found. Create your first room to get started."}
                </p>
                {activeTab === "available" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab("all")}
                  >
                    Show all rooms
                  </Button>
                )}
              </div>
            )}

            {/* Edit Room Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-3xl lg:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Edit Room {formData.roomNumber}</DialogTitle>
                  <DialogDescription>
                    Update room details and availability
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleUpdateSubmit}
                  className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="edit-roomNumber">Room Number</Label>
                      <Input
                        id="edit-roomNumber"
                        value={formData.roomNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roomNumber: e.target.value,
                          })
                        }
                        placeholder="101"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-bedType">Bed Type</Label>
                      <Select
                        value={formData.bedType}
                        onValueChange={(val) =>
                          setFormData({ ...formData, bedType: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Studio">Studio</SelectItem>
                          <SelectItem value="One Bed">One Bed</SelectItem>
                          <SelectItem value="Two Bed">Two Bed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) =>
                          setFormData({ ...formData, category: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Duluxe-Plus">
                            Duluxe-Plus
                          </SelectItem>
                          <SelectItem value="Deluxe">Deluxe</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                          <SelectItem value="Presidential">
                            Presidential
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-view">View</Label>
                      <Select
                        value={formData.view}
                        onValueChange={(val) =>
                          setFormData({ ...formData, view: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lobby Facing">
                            Lobby Facing
                          </SelectItem>
                          <SelectItem value="Terrace View">
                            Terrace View
                          </SelectItem>
                          <SelectItem value="Valley View">
                            Valley View
                          </SelectItem>
                          <SelectItem value="Corner">Corner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="edit-rate">Rate per Night</Label>
                      <Input
                        id="edit-rate"
                        type="number"
                        value={formData.rate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rate: parseFloat(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-adults">Max Adults</Label>
                      <Input
                        id="edit-adults"
                        type="number"
                        min="1"
                        value={formData.adults}
                        placeholder="Max: 8"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adults: parseInt(e.target.value, 10),
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(val) =>
                          setFormData({
                            ...formData,
                            status: val as
                              | "available"
                              | "reserved"
                              | "occupied"
                              | "maintenance",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="reserved">reserved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 p-2 col-span-2 border rounded">
                      <input
                        type="checkbox"
                        id="edit-isPubliclyVisible"
                        name="isPubliclyVisible"
                        checked={!!formData.isPubliclyVisible} // Use !! to safely convert undefined/null to false
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isPubliclyVisible: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <label
                        htmlFor="edit-isPubliclyVisible"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Show this room on the public website
                      </label>
                    </div>

                    <div className="space-x-2">
                      <Label>Amenities</Label>
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 p-3 w-96 border rounded-md">
                        {availableAmenities.map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`edit-amenity-${amenity}`}
                              checked={formData.amenities?.includes(amenity)}
                              onChange={() => handleAmenityChange(amenity)}
                              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <label
                              htmlFor={`edit-amenity-${amenity}`}
                              className="text-sm font-medium text-gray-700"
                            >
                              {amenity}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="create-publicDescription">
                        Public Description (for Website)
                      </Label>
                      <Textarea
                        id="create-publicDescription"
                        value={formData.publicDescription || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            publicDescription: e.target.value,
                          })
                        }
                        placeholder="Enter a guest-friendly description that will be shown on the public website..."
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-gray-500">
                        This text will be visible to guests on the hotel
                        website.
                      </p>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Room Images (Max 3)</Label>
                      {existingImages && existingImages.length > 0 && (
                        <>
                          <div className="text-sm text-gray-500 mb-2">
                            Existing images:
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {existingImages
                              .filter(
                                (imageUrl) => !deletedImages.includes(imageUrl)
                              )
                              .map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Room ${formData.roomNumber} - ${
                                      index + 1
                                    }`}
                                    className="w-full h-24 object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeExistingImage(imageUrl)
                                    }
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        </>
                      )}

                      {/* Upload new images */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          id="edit-room-images"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-room-images"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            Click to upload new images
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            JPG, PNG or GIF • Max 3 images total
                          </span>
                        </label>
                      </div>

                      {/* New image previews */}
                      {imagePreviews.length > 0 && (
                        <>
                          <div className="text-sm text-gray-500 mb-2">
                            New images to add:
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`New preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* View Room Details Dialog */}
            <Dialog
              open={isViewDialogOpen && currentRoom !== null}
              onOpenChange={setIsViewDialogOpen}
            >
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    Room {currentRoom?.roomNumber} Details
                  </DialogTitle>
                  <DialogDescription>
                    Complete information about this room
                  </DialogDescription>
                </DialogHeader>

                {currentRoom && (
                  <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Room Information</h3>
                      <Badge className={getStatusColor(currentRoom.status)}>
                        {currentRoom.status.charAt(0).toUpperCase() +
                          currentRoom.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Room Images Gallery */}
                    {currentRoom.images && currentRoom.images.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Room Images
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {currentRoom.images.map((imageUrl, index) => (
                            <a
                              key={index}
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <img
                                src={imageUrl}
                                alt={`Room ${currentRoom.roomNumber} - ${
                                  index + 1
                                }`}
                                className="w-full h-32 object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <ImageIcon className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">
                          No images available for this room
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 border-t pt-4">
                      <div>
                        <p className="text-sm text-gray-500">Room Number</p>
                        <p className="font-medium">{currentRoom.roomNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium">{currentRoom.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bed Type</p>
                        <p className="font-medium">{currentRoom.bedType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">View</p>
                        <p className="font-medium">{currentRoom.view}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Max Adults</p>
                        <p className="font-medium">{currentRoom.adults}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Owner</p>
                        <p className="font-medium">{currentRoom.owner}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rate per Night</p>
                        <p className="font-medium text-amber-600">
                          Rs {currentRoom.rate.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Showing on website
                        </p>
                        <p className="font-medium text-amber-600">
                          {currentRoom.isPubliclyVisible ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {currentRoom.cleaniness && (
                      <div className="pt-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Cleanliness
                        </h4>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">
                            {currentRoom.cleaniness}
                          </p>
                        </div>
                      </div>
                    )}

                    {currentRoom.amenities &&
                      currentRoom.amenities.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">
                            Amenities
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentRoom.amenities.map((amenity) => (
                              <Badge
                                key={amenity}
                                variant="secondary"
                                className="font-normal"
                              >
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {currentRoom.publicDescription && (
                      <div className="pt-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Public Website Description
                        </h4>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">
                            {currentRoom.publicDescription}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end space-x-2">
                      <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                      </DialogClose>
                      <Button
                        className="bg-amber-500 hover:bg-amber-600"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleEditRoom(currentRoom);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Room
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
