// ReservationDetailsPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Clock,
  Edit,
  CheckCircle,
  XCircle,
  Printer,
  Bed,
  Calendar as CalendarIcon,
  Settings,
  LogOut,
  Home,
  Crown,
  Star,
  Sparkles,
  Archive,
  FileText,
  Ticket,
  Percent,
  Menu,
  X,
  Users,
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useReservationContext } from "@/contexts/ReservationContext";
import { useGuestContext } from "@/contexts/GuestContext"; // Import GuestContext
import { useAuth } from "@/contexts/AuthContext";
import { useRoomContext } from "@/contexts/RoomContext";

const ReservationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  const { 
    getReservationById, 
    updateReservationStatus,
    loading, 
    error 
  } = useReservationContext();
  
  const { rooms } = useRoomContext();
  const { allRooms } = useGuestContext(); // Get room data from GuestContext

  const [reservation, setReservation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reservation data
  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getReservationById(id);
        setReservation(data);
      } catch (err) {
        console.error("Failed to fetch reservation details:", err);
        toast({
          title: "Error",
          description: "Failed to load reservation details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservationDetails();
  }, [id, getReservationById, toast]);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!reservation || !newStatus) return;
    
    try {
      await updateReservationStatus(reservation._id, newStatus);
      // Update local state
      setReservation((prev: any) => ({
        ...prev,
        status: newStatus
      }));
      toast({
        title: "Success",
        description: `Reservation status updated to ${newStatus}`,
      });
      setIsUpdateStatusDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update reservation status",
        variant: "destructive",
      });
    }
  };

  // Get room details from GuestContext
  const roomDetails = useMemo(() => {
    if (!reservation) return null;
    
    // Try to find room in allRooms from GuestContext first
    if (allRooms && allRooms.length) {
      const guestContextRoom = allRooms.find(
        (room) => room.roomNumber === reservation.roomNumber
      );
      if (guestContextRoom) return guestContextRoom;
    }
    
    // Fallback to RoomContext if not found
    if (rooms && rooms.length) {
      return rooms.find(room => room.roomNumber === reservation.roomNumber);
    }
    
    return null;
  }, [reservation, allRooms, rooms]);

  // Calculate duration and total price
  const reservationDetails = useMemo(() => {
    if (!reservation) return null;
    
    const startDate = parseISO(reservation.startAt);
    const endDate = parseISO(reservation.endAt);
    const days = differenceInCalendarDays(endDate, startDate);
    
    let totalPrice = 0;
    let roomRate = 0;
    
    if (roomDetails) {
      roomRate = roomDetails.price || roomDetails.rate || 0;
      totalPrice = roomRate * days;
    }
    
    return {
      days,
      roomRate,
      totalPrice,
      formattedStartDate: format(startDate, "PPP"),
      formattedEndDate: format(endDate, "PPP"),
    };
  }, [reservation, roomDetails]);

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Confirmed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "checked-in":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Checked In</Badge>;
      case "checked-out":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Checked Out</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  // Navigation items
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

  // Memoized sidebar
  const Sidebar = useMemo(() => {
    if (!isAdmin) return null;
    
    return (
      <>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
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
              <div className="relative">
                <Crown className="h-9 w-9 text-amber-400" />
                <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" />
              </div>
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
        </aside>
      </>
    );
  }, [isAdmin, sidebarOpen, user?.email, renderNavLinks, mainNavItems, systemNavItems]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      {Sidebar}

      {/* Main content */}
      <div className="flex-1 w-full h-screen overflow-y-auto flex flex-col">
        {/* Mobile header - only for admin */}
        {isAdmin && (
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-4 flex-shrink-0">
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

        {/* Main content area */}
        <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
          {/* Back button and title */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit"
              onClick={() => navigate('/reservation')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reservations
            </Button>
            <h1 className="text-2xl font-bold">Reservation Details</h1>
          </div>

          {isLoading ? (
            <ReservationDetailsSkeleton />
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load reservation details. Please try again.
              </AlertDescription>
            </Alert>
          ) : !reservation ? (
            <Alert>
              <AlertDescription>
                Reservation not found. It may have been deleted.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main info card */}
              <Card className="lg:col-span-2 shadow-md border-0">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">Reservation #{reservation._id.slice(-6)}</CardTitle>
                      <CardDescription>Created on {format(new Date(reservation.createdAt), "PPP")}</CardDescription>
                    </div>
                    <div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Guest Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <User className="mr-2 h-5 w-5 text-amber-500" />
                      Guest Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{reservation.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{reservation.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{reservation.email || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">CNIC</p>
                        <p className="font-medium">{reservation.cnic}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{reservation.address}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stay Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-amber-500" />
                      Stay Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Room Number</p>
                        <p className="font-medium">Room {reservation.roomNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Room Type</p>
                        <p className="font-medium">
                          {roomDetails?.category || 
                           roomDetails?.type || 
                           roomDetails?.roomType || 
                           "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-in Date</p>
                        <p className="font-medium">{reservationDetails?.formattedStartDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-out Date</p>
                        <p className="font-medium">{reservationDetails?.formattedEndDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{reservationDetails?.days} nights</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Daily Rate</p>
                        <p className="font-medium">
                          {reservationDetails?.roomRate 
                            ? `Rs. ${reservationDetails.roomRate.toLocaleString()}` 
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Room Details Section */}
                  {roomDetails && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <Bed className="mr-2 h-5 w-5 text-amber-500" />
                          Room Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {roomDetails.capacity && (
                            <div>
                              <p className="text-sm text-gray-500">Capacity</p>
                              <p className="font-medium">{roomDetails.capacity} Persons</p>
                            </div>
                          )}
                          {roomDetails.bedType && (
                            <div>
                              <p className="text-sm text-gray-500">Bed Type</p>
                              <p className="font-medium">{roomDetails.bedType}</p>
                            </div>
                          )}
                          {roomDetails.amenities && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Amenities</p>
                              <p className="font-medium">
                                {Array.isArray(roomDetails.amenities) 
                                  ? roomDetails.amenities.join(", ") 
                                  : roomDetails.amenities}
                              </p>
                            </div>
                          )}
                          {roomDetails.description && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Description</p>
                              <p className="font-medium">{roomDetails.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-amber-500" />
                      Reservation Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Reservation Created</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reservation.createdAt), "PPP 'at' p")}
                          </p>
                        </div>
                      </div>

                      {reservation.status === "checked-in" && (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Checked In</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(reservation.updatedAt), "PPP 'at' p")}
                            </p>
                          </div>
                        </div>
                      )}

                      {reservation.status === "checked-out" && (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <ArrowLeft className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Checked Out</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(reservation.updatedAt), "PPP 'at' p")}
                            </p>
                          </div>
                        </div>
                      )}

                      {reservation.status === "cancelled" && (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">Reservation Cancelled</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(reservation.updatedAt), "PPP 'at' p")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t flex justify-between items-center p-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/guests?reservation=${reservation._id}`)}
                    disabled={reservation.status === "checked-in" || reservation.status === "checked-out"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Check In Guest
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Details
                    </Button>
                    
                    <Button onClick={() => {
                      setNewStatus(reservation.status);
                      setIsUpdateStatusDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Status
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Summary and payment card */}
              <Card className="shadow-md border-0 h-fit">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-xl">Reservation Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Room {reservation.roomNumber}</span>
                    <span>
                      {reservationDetails?.roomRate 
                        ? `Rs. ${reservationDetails.roomRate.toLocaleString()}` 
                        : "—"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration</span>
                    <span>{reservationDetails?.days} nights</span>
                  </div>
                  
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-gray-900">Subtotal</span>
                    <span>
                      {reservationDetails?.totalPrice 
                        ? `Rs. ${reservationDetails.totalPrice.toLocaleString()}` 
                        : "—"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Tax (GST)</span>
                    <span>Rs. 0</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {reservationDetails?.totalPrice 
                        ? `Rs. ${reservationDetails.totalPrice.toLocaleString()}` 
                        : "—"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t p-6">
                  <div className="w-full">
                    <p className="text-sm text-gray-500 mb-4">Payment Status</p>
                    <Badge className="w-full justify-center p-2 text-base bg-amber-100 text-amber-800 border-amber-200">
                      {reservation.isPaid ? "Paid" : "Payment Pending"}
                    </Badge>
                    
                    {!reservation.isPaid && (
                      <Button className="w-full mt-4">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* Update Status Dialog */}
          <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Reservation Status</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate}>
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

const ReservationDetailsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2 shadow-md border-0">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-36 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-5 w-36 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t p-4">
        <div className="flex justify-between w-full">
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </CardFooter>
    </Card>

    <Card className="shadow-md border-0 h-fit">
      <CardHeader className="bg-slate-50 border-b">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <Skeleton className="h-px w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t p-6">
        <div className="w-full">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-8 w-full rounded-full" />
          <Skeleton className="h-9 w-full mt-4" />
        </div>
      </CardFooter>
    </Card>
  </div>
);

export default ReservationDetailsPage;