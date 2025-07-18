// // src/pages/GuestDetailPage.tsx
// import React, { useEffect, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { ArrowLeft, LogOut } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { useToast } from '@/hooks/use-toast';
// import { useGuestContext } from '@/contexts/GuestContext';

// interface GuestDetail {
//   _id: string;
//   fullName: string;
//   address: string;
//   phone: string;
//   cnic: string;
//   room: { roomNumber: string };
//   checkInAt: string;
//   checkOutAt?: string;
//   status: 'checked-in' | 'checked-out';
//   // populated by controller
//   createdBy: { name: string; email: string };
// }

// const GuestDetailPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const { toast } = useToast();
//   const { guest, loading, error, fetchGuestById, checkoutGuest } = useGuestContext();
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   useEffect(() => {
//     if (id) fetchGuestById(id);
//   }, [id]);

//   const handleCheckout = async () => {
//     try {
//       await checkoutGuest(id!);
//       toast({ title: 'Checked out', description: 'Guest has been checked out.' });
//       setIsDialogOpen(false);
//     } catch {
//       toast({ title: 'Error', description: 'Checkout failed.', variant: 'destructive' });
//     }
//   };

//   const getStatusColor = (status: string) =>
//     status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

//   if (loading) return <p>Loading...</p>;
//   if (error || !guest) return (
//     <div className="p-6 text-center">
//       <p className="text-red-500">Guest not found.</p>
//       <Link to="/guests"><Button variant="outline"><ArrowLeft className="mr-2"/>Back</Button></Link>
//     </div>
//   );

//   return (
//     <div className="p-6">
//       <Link to="/guests">
//         <Button variant="outline">
//           <ArrowLeft className="mr-2"/>Back
//         </Button>
//       </Link>

//       <div className="mt-4 flex items-center justify-between">
//         <h1 className="text-2xl font-bold">{guest.fullName}</h1>
//         <Badge className={getStatusColor(guest.status)}>
//           {guest.status}
//         </Badge>
//       </div>

//       <Card className="mt-6">
//         <CardHeader>
//           <CardTitle>Guest Information</CardTitle>
//           <CardDescription>Personal & contact details</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <p><strong>Name:</strong> {guest.fullName}</p>
//           <p><strong>Phone:</strong> {guest.phone}</p>
//           <p><strong>CNIC:</strong> {guest.cnic}</p>
//           <p><strong>Room Number:</strong> {guest.room.roomNumber}</p>
//            <p><strong>Total Rent:</strong> {guest.totalRent}</p>
//           <p><strong>Check-in:</strong> {new Date(guest.checkInAt).toLocaleDateString()}</p>
//           {guest.checkOutAt && (
//             <p><strong>Check-out:</strong> {new Date(guest.checkOutAt).toLocaleDateString()}</p>
//           )}
//         </CardContent>
//       </Card>

//       {guest.status === 'checked-in' && (
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button className="mt-4 w-full bg-red-600 hover:bg-red-700">
//               <LogOut className="mr-2"/>Check Out
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Confirm Check-out</DialogTitle>
//             </DialogHeader>
//             <div className="flex gap-4 mt-4">
//               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
//               <Button
//                 onClick={handleCheckout}
//                 className="flex-1 bg-red-600 hover:bg-red-700"
//                 disabled={loading}
//               >
//                 Confirm
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   );
// };

// export default GuestDetailPage;

// src/pages/GuestDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGuestContext } from '@/contexts/GuestContext';

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
  status: 'checked-in' | 'checked-out';
}

const GuestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { guest, loading, error, fetchGuestById, checkoutGuest } = useGuestContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchGuestById(id);
  }, [id]);

  const handleCheckout = async () => {
    try {
      await checkoutGuest(id!);
      toast({ title: 'Checked out', description: 'Guest has been checked out.' });
      setIsDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Checkout failed.', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) =>
    status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  if (loading) return <p>Loading...</p>;
  if (error || !guest) return (
    <div className="p-6 text-center">
      <p className="text-red-500">Guest not found.</p>
      <Link to="/guests">
        <Button variant="outline"><ArrowLeft className="mr-2"/>Back</Button>
      </Link>
    </div>
  );

  return (
    <div className="p-6 print:p-0">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Link to="/guests">
          <Button variant="outline"><ArrowLeft className="mr-2"/>Back</Button>
        </Link>
        <div className="space-x-2">
          {guest.status === 'checked-in' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700"><LogOut className="mr-2"/>Check Out</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Check-out</DialogTitle>
                </DialogHeader>
                <div className="flex gap-4 mt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCheckout} className="bg-red-600 hover:bg-red-700" disabled={loading}>Confirm</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={() => window.print()} variant="outline"><Printer className="mr-2"/>Print / Download PDF</Button>
        </div>
      </div>

      <div className="space-y-6" id="printable-area">
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{guest.fullName}</h1>
          <Badge className={getStatusColor(guest.status)}>{guest.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
            <CardDescription>Personal & contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {guest.fullName}</p>
            <p><strong>Phone:</strong> {guest.phone}</p>
            <p><strong>CNIC:</strong> {guest.cnic}</p>
            <p><strong>Room Number:</strong> {guest.room.roomNumber}</p>
            <p><strong>Check-in:</strong> {new Date(guest.checkInAt).toLocaleDateString()}</p>
            {guest.checkOutAt && (
              <p><strong>Check-out:</strong> {new Date(guest.checkOutAt).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Total stay and discount details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Stay Duration:</strong> {guest.stayDuration} day(s)</p>
            <p><strong>Total Rent:</strong> Rs{guest.totalRent.toLocaleString()}</p>
            {guest.applyDiscount && guest.discountTitle && (
              <p><strong>Discount ({guest.discountTitle}):</strong> Applied</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestDetailPage;
