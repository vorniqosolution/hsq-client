// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { ArrowLeft, Check, LogOut, Printer } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";
// import { useGuestContext } from "@/contexts/GuestContext";

// interface GuestDetail {
//   _id: string;
//   fullName: string;
//   address: string;
//   phone: string;
//   cnic: string;
//   email: string;
//   room: { roomNumber: string };
//   checkInAt: string;
//   checkOutAt?: string;
//   stayDuration: number;
//   applyDiscount: boolean;
//   discountTitle?: string;
//   totalRent: number;
//   status: "checked-in" | "checked-out";
// }

// const GuestDetailPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const { toast } = useToast();
//   const { guest, loading, error, fetchGuestById, checkoutGuest } =
//     useGuestContext();
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   useEffect(() => {
//     if (id) fetchGuestById(id);
//   }, [id]);

//   const handleCheckout = async () => {
//     try {
//       await checkoutGuest(id!);
//       toast({
//         title: "Checked out",
//         description: "Guest has been checked out.",
//       });
//       setIsDialogOpen(false);
//     } catch {
//       toast({
//         title: "Error",
//         description: "Checkout failed.",
//         variant: "destructive",
//       });
//     }
//   };

//   const getStatusColor = (status: string) =>
//     status === "checked-in"
//       ? "bg-green-100 text-green-800"
//       : "bg-gray-100 text-gray-800";

//   if (loading) return <p>Loading...</p>;
//   if (error || !guest)
//     return (
//       <div className="p-6 text-center">
//         <p className="text-red-500">Guest not found.</p>
//         <Link to="/guests">
//           <Button variant="outline">
//             <ArrowLeft className="mr-2" />
//             Back
//           </Button>
//         </Link>
//       </div>
//     );

//   return (
//     <div className="p-6 print:p-0">
//       <div className="flex justify-between items-center mb-4 print:hidden">
//         <Link to="/guests">
//           <Button variant="outline">
//             <ArrowLeft className="mr-2" />
//             Back
//           </Button>
//         </Link>
//         <div className="space-x-2">
//           {guest.status === "checked-in" && (
//             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//               <DialogTrigger asChild>
//                 <Button className="bg-red-600 hover:bg-red-700">
//                   <LogOut className="mr-2" />
//                   Check Out
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Confirm Check-out</DialogTitle>
//                 </DialogHeader>
//                 <div className="flex gap-4 mt-4">
//                   <Button
//                     variant="outline"
//                     onClick={() => setIsDialogOpen(false)}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleCheckout}
//                     className="bg-red-600 hover:bg-red-700"
//                     disabled={loading}
//                   >
//                     Confirm
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           )}
//           <Button onClick={() => window.print()} variant="outline">
//             <Printer className="mr-2" />
//             Print / Download PDF
//           </Button>
//         </div>
//       </div>

//       <div className="space-y-6" id="printable-area">
//         <div className="mt-4 flex items-center justify-between">
//           <h1 className="text-2xl font-bold">{guest.fullName}</h1>
//           <Badge className={getStatusColor(guest.status)}>{guest.status}</Badge>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>Guest Information</CardTitle>
//             <CardDescription>Personal & contact details</CardDescription>
//           </CardHeader>
//           {/* <CardContent className="space-y-2">
//             <p>
//               <strong>Name:</strong> {guest.fullName}
//             </p>
//             <p>
//               <strong>Phone:</strong> {guest.phone}
//             </p>
//             <p>
//               <strong>CNIC:</strong> {guest.cnic}
//             </p>
//             <p>
//               <strong>Room Number:</strong> {guest.room.roomNumber}
//             </p>
//             <p>
//               <strong>Check-in Date:</strong>{" "}
//               {new Date(guest.checkInAt).toLocaleDateString()}
//             </p>
//             <p>
//               <strong>Check-in Time:</strong>{" "}
//               {new Date(guest.checkInAt).toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </p>
//             {guest.checkOutAt && (
//               <p>
//                 <strong>Check-out:</strong>{" "}
//                 {new Date(guest.checkOutAt).toLocaleDateString()}
//               </p>
//             )}
//           </CardContent> */}
//           <CardContent className="space-y-2">
//             <p>
//               <strong>Name:</strong> {guest.fullName}
//             </p>
//             <p>
//               <strong>Phone:</strong> {guest.phone}
//             </p>
//             <p>
//               <strong>Email:</strong> {guest.email}
//             </p>
//             <p>
//               <strong>CNIC:</strong> {guest.cnic}
//             </p>
//             <p>
//               <strong>Room:</strong>{' '}
//               {`Room ${guest.room.roomNumber} - ${guest.room.bedType} - (Rs${guest.room.rate}/night) - ${guest.room.category} - ${guest.room.view}`}
//             </p>

//             {/* Check-in */}
//             <p>
//               <strong>Check-in Date:</strong>{" "}
//               {new Date(guest.checkInAt).toLocaleDateString()}
//             </p>
//             <p>
//               <strong>Check-in Time:</strong>{" "}
//               {guest.checkInTime /* e.g. "14:30" */}
//             </p>

//             {/* Check-out (if done) */}
//             {guest.checkOutAt && (
//               <>
//                 <p>
//                   <strong>Check-out Date:</strong>{" "}
//                   {new Date(guest.checkOutAt).toLocaleDateString()}
//                 </p>
//                 <p>
//                   <strong>Check-out Time:</strong>{" "}
//                   {guest.checkOutTime /* e.g. "11:15" */}
//                 </p>
//               </>
//             )}
//             <p><strong>Payment Method:</strong></p>
//             <ul className="list-none">
//               {["cash", "card", "online"].map((m) => (
//                 <li key={m} className="flex items-center">
//                   {guest.paymentMethod === m
//                     ? <Check className="w-4 h-4 text-green-600 mr-1" />
//                     : <span className="w-4 h-4 mr-1" />}
//                   {m.charAt(0).toUpperCase() + m.slice(1)}
//                 </li>
//               ))}
//             </ul>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Billing</CardTitle>
//             <CardDescription>Total stay and discount details</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             <p>
//               <strong>Stay Duration:</strong> {guest.stayDuration} day(s)
//             </p>

//             {guest.applyDiscount && guest.discountTitle ? (
//               <>
//                 <p>
//                   <strong>Rent After Discount:</strong>{" "}
//                   Rs{guest.totalRent.toLocaleString()}
//                 </p>
//                 <p>
//                   <strong>Original Total:</strong>{" "}
//                   Rs{(guest.room.rate * guest.stayDuration).toLocaleString()}
//                 </p>
//                 <p>
//                   <strong>Discount ({guest.discountTitle}):</strong> Applied
//                 </p>
//               </>
//             ) : (
//               <p>
//                 <strong>Total Rent:</strong>{" "}
//                 Rs{(guest.room.rate * guest.stayDuration).toLocaleString()}
//               </p>
//             )}
//           </CardContent>

//         </Card>
//       </div>
//     </div>
//   );
// };

// export default GuestDetailPage;

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, LogOut, Printer, Building2, Calendar, Clock, CreditCard, User, Phone, Mail, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGuestContext } from "@/contexts/GuestContext";

interface GuestDetail {
  _id: string;
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  email: string;
  room: { roomNumber: string };
  checkInAt: string;
  checkOutAt?: string;
  stayDuration: number;
  applyDiscount: boolean;
  discountTitle?: string;
  totalRent: number;
  status: "checked-in" | "checked-out";
}

const GuestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { guest, loading, error, fetchGuestById, checkoutGuest } =
    useGuestContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchGuestById(id);
  }, [id]);

  const handleCheckout = async () => {
    try {
      await checkoutGuest(id!);
      toast({
        title: "Checked out",
        description: "Guest has been checked out.",
      });
      setIsDialogOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Checkout failed.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) =>
    status === "checked-in"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  if (loading) 
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guest details...</p>
        </div>
      </div>
    );

  if (error || !guest)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border max-w-md">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Guest Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load guest information</p>
          <Link to="/guests">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Guests
            </Button>
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 print:p-0">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link to="/guests">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Guests
            </Button>
          </Link>
          <div className="flex space-x-3">
            {guest.status === "checked-in" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Check Out
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirm Check-out</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-gray-600 mb-6">Are you sure you want to check out this guest?</p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCheckout}
                        variant="destructive"
                        className="flex-1"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Confirm"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-sm" id="printable-area">
          
          {/* HSQ TOWERS Header */}
          <div className="text-center py-8 border-b-2 border-blue-600">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 tracking-wide">HSQ TOWERS</h1>
            </div>
            <p className="text-gray-600 text-sm font-medium">Premium Hospitality Services</p>
            <div className="mt-4 text-xs text-gray-500">
              Invoice Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="p-8">
            {/* Guest Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">{guest.fullName}</h2>
                <p className="text-gray-600 text-sm">
                  Guest ID: {guest._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <Badge className={`${getStatusColor(guest.status)} px-3 py-1 font-medium border`}>
                {guest.status === "checked-in" ? "Active Stay" : "Completed Stay"}
              </Badge>
            </div>

            {/* Guest Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Guest Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 font-medium">{guest.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900 font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      {guest.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      {guest.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">CNIC Number</label>
                    <p className="text-gray-900 font-medium flex items-center">
                      <Hash className="h-4 w-4 mr-1 text-gray-400" />
                      {guest.cnic}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Room Details</label>
                    <p className="text-gray-900 font-medium">
                      Room {guest.room.roomNumber}
                      {guest.room.bedType && ` • ${guest.room.bedType}`}
                      {guest.room.category && ` • ${guest.room.category}`}
                      {guest.room.view && ` • ${guest.room.view}`}
                    </p>
                    {guest.room.rate && (
                      <p className="text-sm text-gray-600">Rate: Rs{guest.room.rate}/night</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <div className="flex items-center mt-1">
                      {["cash", "card", "online"].map((method) => (
                        <div key={method} className="flex items-center mr-4">
                          {guest.paymentMethod === method ? (
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-600 mr-1" />
                              <span className="text-gray-900 font-medium capitalize">{method}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 capitalize">{method}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Stay Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Check-in Details
                  </h4>
                  <p className="text-gray-700">
                    <span className="font-medium">{new Date(guest.checkInAt).toLocaleDateString()}</span>
                  </p>
                  <p className="text-gray-600 text-sm flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {guest.checkInTime || new Date(guest.checkInAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {guest.checkOutAt ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Check-out Details
                    </h4>
                    <p className="text-gray-700">
                      <span className="font-medium">{new Date(guest.checkOutAt).toLocaleDateString()}</span>
                    </p>
                    <p className="text-gray-600 text-sm flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {guest.checkOutTime || new Date(guest.checkOutAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">Check-out Details</h4>
                    <p className="text-gray-500 italic">Guest is currently checked in</p>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                Billing Summary
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stay Duration</span>
                    <span className="font-medium text-gray-900">{guest.stayDuration} day(s)</span>
                  </div>
                  
                  {guest.room.rate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Room Rate (per night)</span>
                      <span className="font-medium text-gray-900">Rs{guest.room.rate.toLocaleString()}</span>
                    </div>
                  )}

                  {guest.applyDiscount && guest.discountTitle ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-500 line-through">
                          Rs{(guest.room.rate * guest.stayDuration).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Discount ({guest.discountTitle})</span>
                        <span className="font-medium text-green-600">
                          -Rs{((guest.room.rate * guest.stayDuration) - guest.totalRent).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-gray-900">Rs{guest.totalRent.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-xl font-bold text-gray-900">
                          Rs{(guest.room.rate * guest.stayDuration).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm mt-8 pt-6 border-t border-gray-200">
              <p className="font-medium">Thank you for choosing HSQ Towers</p>
              <p>For any inquiries, please contact our reception desk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailPage;