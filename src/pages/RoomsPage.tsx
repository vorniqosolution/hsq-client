import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import HSQ from "../../public/HSQ.png";
import {
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const RoomsPage = () => {
  // Enhanced context destructuring with all room management methods
  const {
    rooms,
    availableRooms,
    currentRoom,
    loading,
    error,
    createRoom,
    fetchRooms,
    fetchAvailableRooms,
    fetchRoomById,
    updateRoom,
    deleteRoom,
  } = useRoomContext();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [displayedRooms, setDisplayedRooms] = useState<Room[]>([]);

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
  });

  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Load available rooms when component mounts
  useEffect(() => {
    if (fetchAvailableRooms) {
      fetchAvailableRooms().catch(console.error);
    }
  }, [fetchAvailableRooms]);

  // Update displayed rooms when tab changes
  useEffect(() => {
    if (activeTab === "available") {
      setDisplayedRooms(availableRooms || []);
    } else {
      setDisplayedRooms(rooms || []);
    }
  }, [activeTab, rooms, availableRooms]);

  // Reset form for create/edit
  const resetForm = () => {
    setFormData({
      roomNumber: "",
      bedType: "One Bed",
      category: "Standard",
      view: "Lobby Facing",
      rate: 0,
      status: "available",
      owner: "admin",
    });
  };

  // Load room data for editing
  const handleEditRoom = (room: Room) => {
    setFormData({
      ...room,
    });
    setIsEditDialogOpen(true);
  };

  // Open room details view
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

  // Handle create room submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoom) return;

    const success = await createRoom(formData);
    if (success) {
      toast({
        title: "Room created",
        description: `Room ${formData.roomNumber} has been created.`,
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

  // Handle update room submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateRoom || !formData._id) return;

    const success = await updateRoom(formData._id, formData);
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

  // Handle room deletion
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

  // --- Sidebar Navigation ---
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Guests", href: "/guests", icon: Users },
    { name: "Reservation", href: "/reservation", icon: Calendar },
    { name: "Rooms", href: "/rooms", icon: Bed },
    { name: "Discounts", href: "/Discount", icon: Ticket },
    { name: "GST & Tax", href: "/Gst", icon: Percent },
    { name: "Inventory", href: "/Inventory", icon: Archive },
    { name: "Invoices", href: "/Invoices", icon: FileText },
    { name: "Revenue", href: "/Revenue", icon: FileText },
  ];

  const systemNavItems = [
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  // Helper function to render navigation links
  const renderNavLinks = (items: typeof mainNavItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => setSidebarOpen(false)}
          className={`
            group flex items-center px-4 py-3 text-sm rounded-lg
            transition-all duration-200 relative overflow-hidden
            ${
              active
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }
          `}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
          )}
          <Icon
            className={`
            mr-3 h-5 w-5 transition-all duration-200
            ${
              active
                ? "text-amber-400"
                : "text-slate-400 group-hover:text-slate-300"
            }
          `}
          />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && <Star className="ml-auto h-3 w-3 text-amber-400/60" />}
        </Link>
      );
    });
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium mb-2">Failed to load rooms</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => fetchRooms && fetchRooms()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render with or without sidebar based on admin role
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for admin users only */}
      {isAdmin && (
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
            shadow-2xl transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          >
            {/* Logo Section */}
            <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
              <div className="flex items-center space-x-3">
                <img className="w-8 h-8 rounded-lg" src={HSQ} alt="HSQ" />
                <div>
                  <h1 className="text-xl font-light tracking-wider text-white">
                    HSQ ADMIN
                  </h1>
                  <p className="text-xs text-amber-400/80 tracking-widest uppercase">
                    Management Panel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-8 px-4 flex flex-col h-[calc(100%-80px)]">
              <div className="flex-grow">
                <div className="space-y-1">{renderNavLinks(mainNavItems)}</div>
              </div>

              {/* Bottom Section */}
              <div className="flex-shrink-0">
                <div className="my-4 px-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                </div>
                <div className="space-y-1">
                  {renderNavLinks(systemNavItems)}
                  <button className="group flex items-center px-4 py-3 text-sm text-slate-300 rounded-lg hover:text-white hover:bg-slate-800/50 w-full transition-all duration-200">
                    <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300" />
                    <span className="font-light tracking-wide">Sign Out</span>
                  </button>
                </div>
              </div>
            </nav>

            {/* User Profile */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800/50 bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-medium text-slate-900">AM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-white truncate">
                    Admin Manager
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || "admin@hsqtowers.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? "lg:ml-0" : ""}`}>
        {/* Mobile header - only for admin */}
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
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
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
                <p className="text-gray-600 mt-2">
                  Manage your hotel rooms and availability
                </p>
              </div>

              <div className="flex space-x-3">
                {/* Room filtering tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-[260px]"
                >
                  <TabsList>
                    <TabsTrigger value="all" className="flex-1">
                      <Bed className="h-4 w-4 mr-2" />
                      All Rooms ({rooms?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="available" className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Available ({availableRooms?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Create Room Dialog */}
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Room</DialogTitle>
                      <DialogDescription>
                        Create a new room for your hotel
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem value="One Bed">One Bed</SelectItem>
                              <SelectItem value="Two Bed">Two Bed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem value="Standard">Standard</SelectItem>
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

                      <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="maintenance">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="reserved">reserved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRooms.map((room) => (
                <Card
                  key={room._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        Room {room.roomNumber}
                      </CardTitle>
                      <Badge className={getStatusColor(room.status)}>
                        {room.status.charAt(0).toUpperCase() +
                          room.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {room.dropdownLabel ||
                        `${room.bedType} ${room.category} ${room.view}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-gray-600">
                      {/* <DollarSign className="h-4 w-4 text-amber-500" /> */}
                      <span>Rs {room.rate.toLocaleString()} per night</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-2 gap-2">
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
                          className="text-red-600 border-red-200 hover:bg-red-50"
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
                            This action cannot be undone. This will permanently
                            delete the room and all associated data.
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
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Empty state */}
            {displayedRooms.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <Bed className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">
                  {activeTab === "available"
                    ? "No available rooms found."
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Room {formData.roomNumber}</DialogTitle>
                  <DialogDescription>
                    Update room details and availability
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Room {currentRoom?.roomNumber} Details
                  </DialogTitle>
                  <DialogDescription>
                    Complete information about this room
                  </DialogDescription>
                </DialogHeader>

                {currentRoom && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Room Information</h3>
                      <Badge className={getStatusColor(currentRoom.status)}>
                        {currentRoom.status.charAt(0).toUpperCase() +
                          currentRoom.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                        <p className="text-sm text-gray-500">Rate per Night</p>
                        <p className="font-medium text-amber-600">
                          Rs {currentRoom.rate.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Owner</p>
                        <p className="font-medium">{currentRoom.owner}</p>
                      </div>
                    </div>

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
