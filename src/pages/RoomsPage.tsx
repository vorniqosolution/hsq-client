// RoomsPage.tsx (updated with RoomContext integration and admin-only sidebar)
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Plus, Edit, Trash2, DollarSign, Menu, X, 
  Users, Bed, Settings, LogOut, Home, Crown, Star, Sparkles,
  Archive, FileText, Ticket, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useAuth } from "@/contexts/AuthContext"; // Import your auth context

const RoomsPage = () => {
  const { rooms, loading, createRoom, fetchRooms } = useRoomContext();
  const { user } = useAuth(); // Access the authenticated user
  const isAdmin = user?.role === "admin"; // Check if user is admin
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Room>>({
    roomNumber: "",
    bedType: "One Bed",
    category: "Standard",
    view: "Lobby Facing",
    rate: 0,
    status: "available" as "available" | "booked" | "occupied" | "maintenance",
    owner: "admin",
  });
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // --- Sidebar Navigation ---
  const mainNavItems = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Guests", href: "/guests", icon: Users },
      { name: "Rooms", href: "/rooms", icon: Bed },
      { name: "Discounts", href: "/Discount", icon: Ticket },
      { name: "Inventory", href: "/Inventory", icon: Archive },
      { name: "Invoices", href: "/Invoices", icon: FileText },
      { name: "Revenue", href: "/Revenue", icon: FileText },
    ];

  // const reportNavItems = [{ name: 'Reports', href: '/reports', icon: BarChart3 }];
  const systemNavItems = [{ name: 'Settings', href: '/settings', icon: Settings }];

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
    return location.pathname.startsWith(href);
  }

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
            ${active
              ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
          )}
          <Icon className={`
            mr-3 h-5 w-5 transition-all duration-200
            ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}
          `} />
          <span className="font-light tracking-wide">{item.name}</span>
          {active && (
            <Star className="ml-auto h-3 w-3 text-amber-400/60" />
          )}
        </Link>
      );
    });
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
            shadow-2xl transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            {/* Logo Section */}
            <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Crown className="h-9 w-9 text-amber-400" />
                  <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-xl font-light tracking-wider text-white">HSQ ADMIN</h1>
                  <p className="text-xs text-amber-400/80 tracking-widest uppercase">Management Panel</p>
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
                <div className="space-y-1">
                    {renderNavLinks(mainNavItems)}
                </div>
                
                {/* Reports Section */}
                {/* <div className="mt-6">
                    <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis</p>
                    <div className="space-y-1">
                        {renderNavLinks(reportNavItems)}
                    </div>
                </div> */}
              </div>
              
              {/* Bottom Section */}
              <div className="flex-shrink-0">
                <div className="my-4 px-4"><div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" /></div>
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
                  <p className="text-sm font-light text-white truncate">Admin Manager</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@hsqtowers.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isAdmin ? 'lg:ml-0' : ''}`}>
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
                <span className="font-light tracking-wider text-slate-900">HSQ ADMIN</span>
              </div>
              <div className="w-9" />
            </div>
          </div>
        )}

        {/* Room content - existing page content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
                <p className="text-gray-600 mt-2">
                  Manage your hotel rooms and availability
                </p>
              </div>

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
                            setFormData({ ...formData, roomNumber: e.target.value })
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
                            <SelectItem value="Dulux plus">Dulux plus</SelectItem>
                            <SelectItem value="Deluxe">Deluxe</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
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
                            <SelectItem value="Valley View">Valley View</SelectItem>
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
                            setFormData({ ...formData, status: val as "available" | "booked" | "occupied" | "maintenance" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600">
                      Create Room
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Room Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Card key={room._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        Room {room.roomNumber}
                      </CardTitle>
                      <Badge className={getStatusColor(room.status)}>
                        {room.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {room.dropdownLabel ||
                        `${room.bedType} ${room.category} ${room.view}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4 text-amber-500" />
                        <span>Rs {room.rate.toLocaleString()} per night</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No rooms found. Create your first room to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;

// // RoomsPage.tsx (updated with RoomContext integration)
// import React, { useState } from "react";
// import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";
// import { Room, useRoomContext } from "../contexts/RoomContext";

// const RoomsPage = () => {
//   const { rooms, loading, createRoom, fetchRooms } = useRoomContext();
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [formData, setFormData] = useState<Partial<Room>>({
//     roomNumber: "",
//     bedType: "One Bed",
//     category: "Standard",
//     view: "Lobby Facing",
//     rate: 0,
//     status: "available" as "available" | "booked" | "occupied" | "maintenance",
//     owner: "admin",
//   });
//   const { toast } = useToast();

//   const resetForm = () => {
//     setFormData({
//       roomNumber: "",
//       bedType: "One Bed",
//       category: "Standard",
//       view: "Lobby Facing",
//       rate: 0,
//       status: "available",
//       owner: "admin",
//     });
//   };

//   const handleCreateSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const success = await createRoom(formData);
//     if (success) {
//       toast({
//         title: "Room created",
//         description: `Room ${formData.roomNumber} has been created.`,
//       });
//       setIsCreateDialogOpen(false);
//       resetForm();
//     } else {
//       toast({
//         title: "Error",
//         description: "Failed to create room",
//         variant: "destructive",
//       });
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "available":
//         return "bg-green-100 text-green-800";
//       case "occupied":
//         return "bg-red-100 text-red-800";
//       case "maintenance":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
//           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
//             <p className="text-gray-600 mt-2">
//               Manage your hotel rooms and availability
//             </p>
//           </div>

//           <Dialog
//             open={isCreateDialogOpen}
//             onOpenChange={setIsCreateDialogOpen}
//           >
//             <DialogTrigger asChild>
//               <Button className="bg-blue-600 hover:bg-blue-700">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add Room
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Add New Room</DialogTitle>
//                 <DialogDescription>
//                   Create a new room for your hotel
//                 </DialogDescription>
//               </DialogHeader>
//               <form onSubmit={handleCreateSubmit} className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="roomNumber">Room Number</Label>
//                     <Input
//                       id="roomNumber"
//                       value={formData.roomNumber}
//                       onChange={(e) =>
//                         setFormData({ ...formData, roomNumber: e.target.value })
//                       }
//                       placeholder="101"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="bedType">Bed Type</Label>
//                     <Select
//                       value={formData.bedType}
//                       onValueChange={(val) =>
//                         setFormData({ ...formData, bedType: val })
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Studio">Studio</SelectItem>
//                         <SelectItem value="One Bed">One Bed</SelectItem>
//                         <SelectItem value="Two Bed">Two Bed</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="category">Category</Label>
//                     <Select
//                       value={formData.category}
//                       onValueChange={(val) =>
//                         setFormData({ ...formData, category: val })
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Standard">Standard</SelectItem>
//                         <SelectItem value="Dulux plus">Dulux plus</SelectItem>
//                         <SelectItem value="Deluxe">Deluxe</SelectItem>
//                         <SelectItem value="Executive">Executive</SelectItem>
//                         <SelectItem value="Presidential">
//                           Presidential
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <Label htmlFor="view">View</Label>
//                     <Select
//                       value={formData.view}
//                       onValueChange={(val) =>
//                         setFormData({ ...formData, view: val })
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Lobby Facing">
//                           Lobby Facing
//                         </SelectItem>
//                         <SelectItem value="Terrace View">
//                           Terrace View
//                         </SelectItem>
//                         <SelectItem value="Valley View">Valley View</SelectItem>
//                         <SelectItem value="Corner">Corner</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="rate">Rate per Night</Label>
//                     <Input
//                       id="rate"
//                       type="number"
//                       value={formData.rate}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           rate: parseFloat(e.target.value),
//                         })
//                       }
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="status">Status</Label>
//                     <Select
//                       value={formData.status}
//                       onValueChange={(val) =>
//                         setFormData({ ...formData, status: val })
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="available">Available</SelectItem>
//                         <SelectItem value="occupied">Occupied</SelectItem>
//                         <SelectItem value="maintenance">Maintenance</SelectItem>
//                         <SelectItem value="booked">Booked</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 <Button type="submit" className="w-full">
//                   Create Room
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Room Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {rooms.map((room) => (
//             <Card key={room._id} className="hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="text-xl">
//                     Room {room.roomNumber}
//                   </CardTitle>
//                   <Badge className={getStatusColor(room.status)}>
//                     {room.status}
//                   </Badge>
//                 </div>
//                 <CardDescription>
//                   {room.dropdownLabel ||
//                     `${room.bedType} ${room.category} ${room.view}`}
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   <div className="flex items-center gap-2 text-gray-600">
                    
//                     <span>Rs {room.rate.toLocaleString()} per night</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {rooms.length === 0 && (
//           <div className="text-center py-12">
//             <p className="text-gray-500 text-lg">
//               No rooms found. Create your first room to get started.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RoomsPage;
