// import React, { useState, useEffect } from 'react';
// import { Search, Eye } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { useToast } from '@/hooks/use-toast';
// import { Link } from 'react-router-dom';
// import { useGuestContext } from '@/contexts/GuestContext';

// const GuestsPage: React.FC = () => {
//   const { guests, rooms, loading, error, fetchGuests, createGuest } = useGuestContext();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     fullName: '',
//     address: '',
//     phone: '',
//     cnic: '',
//     email: '',
//     roomNumber: '',
//     stayDuration: 1,
//     paymentMethod: "cash",
//     applyDiscount: false,
//   });
//   const { toast } = useToast();

//   useEffect(() => {
//     fetchGuests();
//   }, []);

//   const filtered = guests.filter((g) =>
//     g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     g.phone.includes(searchTerm) ||
//     g.room.roomNumber.includes(searchTerm)
//   );

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const selectedRoom = rooms.find((r) => r.roomNumber === formData.roomNumber);
//       const guestToCreate = {
//         ...formData,
//         room: selectedRoom,
//         checkInAt: new Date().toISOString(),
//         email: formData.email, // Provide email value here or add to formData
//         createdBy: '', // Provide createdBy value here or fetch from context/auth
//         discountTitle: formData.applyDiscount, // Set as boolean
//         paymentMethod: formData.paymentMethod as "cash" | "card" | "online",
//       };
//       await createGuest(guestToCreate);
//       toast({ title: 'Guest checked in', description: 'Successfully added.' });
//       setIsDialogOpen(false);
//       setFormData({
//         fullName: '',
//         address: '',
//         phone: '',
//         cnic: '',
//         email: '',
//         roomNumber: '',
//         paymentMethod: "cash",
//         stayDuration: 1,
//         applyDiscount: false,
//       });
//     } catch {
//       toast({ title: 'Error', description: 'Failed to check in.', variant: 'destructive' });
//     }
//   };

//   const getStatusColor = (status: string) =>
//     status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>Error: {error}</p>;

//   return (
//     <div className="p-6">
//       <div className="flex justify-between mb-4">
//         <h1 className="text-2xl font-bold">Guests</h1>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button>Check In Guest</Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Check In Guest</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <Label>Full Name</Label>
//                 <Input
//                   value={formData.fullName}
//                   onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
//                   placeholder="John Doe"
//                   required
//                 />
//               </div>
//               <div>
//                 <Label>Address</Label>
//                 <Input
//                   value={formData.address}
//                   onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//                   placeholder="123 Main St"
//                   required
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>Phone</Label>
//                   <Input
//                     value={formData.phone}
//                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                     placeholder="+1 555 1234"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Email</Label>
//                   <Input
//                     value={formData.email}
//                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                     placeholder="hsq@hotel.com"
//                   />
//                 </div>
//                 <div>
//                   <Label>CNIC</Label>
//                   <Input
//                     value={formData.cnic}
//                     onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
//                     placeholder="12345-6789012-3"
//                     required
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>Room</Label>
//                 <Select value={formData.roomNumber} onValueChange={(v) => setFormData({ ...formData, roomNumber: v })}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select room" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {rooms.map((r) => (
//                       <SelectItem key={r._id} value={r.roomNumber}>
//                         {`Room ${r.roomNumber} - ${r.bedType} - (Rs${r.rate}/night) - ${r.category} - ${r.view}`}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>Stay Duration (days)</Label>
//                   <Input
//                     type="number"
//                     min={1}
//                     value={formData.stayDuration}
//                     onChange={(e) => setFormData({ ...formData, stayDuration: parseInt(e.target.value) })}
//                     required
//                   />
//                 </div>
//                 <div className="flex items-center mt-6">
//                   <input
//                     type="checkbox"
//                     checked={formData.applyDiscount}
//                     onChange={(e) => setFormData({ ...formData, applyDiscount: e.target.checked })}
//                     id="applyDiscount"
//                     className="mr-2"
//                   />
//                   <Label htmlFor="applyDiscount">Apply Discount</Label>
//                 </div>
//                 <div>
//                   <Label>Payment Method</Label>
//                   <div className="flex gap-4">
//                     {["cash", "card", "online"].map((method) => (
//                       <label key={method} className="flex items-center">
//                         <input
//                           type="radio"
//                           name="paymentMethod"
//                           value={method}
//                           checked={formData.paymentMethod === method}
//                           onChange={() => setFormData({ ...formData, paymentMethod: method })}
//                           className="mr-2"
//                         />
//                         {method.charAt(0).toUpperCase() + method.slice(1)}
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//               <Button type="submit" className="w-full">
//                 Submit
//               </Button>
//             </form>
//           </DialogContent>
//         </Dialog>6
//       </div>
//       <Input
//         placeholder="Search guests..."
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         className="mb-4"
//       />
//       <div className="space-y-4">
//         {filtered.map((g) => (
//           <Card key={g._id} className="hover:shadow-md transition-shadow">
//             <CardContent className="flex justify-between items-center">
//               <div>
//                 <p className="font-semibold">{g.fullName}</p>
//                 <p className="text-sm text-gray-500">{g.phone}</p>
//                 <p className="text-sm text-gray-500">{g.email}</p>
//               </div>
//               <Badge className={getStatusColor(g.status)}>{g.status}</Badge>
//               <Link to={`/guests/${g._id}`}>
//                 <Button variant="outline">
//                   <Eye className="w-4 h-4 mr-1" />
//                   View Details
//                 </Button>
//               </Link>
//             </CardContent>
//           </Card>
//         ))}
//         {filtered.length === 0 && <p>No guests found.</p>}
//       </div>
//     </div>
//   );
// };

// export default GuestsPage;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Trash2, UserPlus, X } from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Hooks & Contexts
import { useToast } from '@/hooks/use-toast';
import { useGuestContext, Guest, Room, CreateGuestInput } from '@/contexts/GuestContext';

// --- Constants and Types ---
const ROOM_CATEGORIES = ['Standard', 'Deluxe', 'Executive', 'Presidential'];

const INITIAL_FORM_STATE: CreateGuestInput = {
  fullName: '',
  address: '',
  phone: '',
  cnic: '',
  email: '',
  roomNumber: '',
  stayDuration: 1,
  paymentMethod: 'cash',
  applyDiscount: false,
};

// --- Main Page Component ---
const GuestsPage: React.FC = () => {
  const {
    guests,
    rooms,
    loading,
    error,
    fetchGuests,
    fetchGuestsByCategory,
    createGuest,
    deleteGuest,
  } = useGuestContext();

  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const { toast } = useToast();

  // --- Data Fetching ---
  useEffect(() => {
    // Initial data fetch
    fetchGuests();
  }, [fetchGuests]);

  // --- Memoized Filtering ---
  const filteredGuests = useMemo(() => {
    if (!searchTerm) return guests;
    
    const searchLower = searchTerm.toLowerCase();
    return guests.filter(
      (g) =>
        g.fullName.toLowerCase().includes(searchLower) ||
        g.phone.includes(searchTerm) ||
        g.room.roomNumber.includes(searchTerm)
    );
  }, [guests, searchTerm]);

  // --- Event Handlers (with useCallback) ---
  const handleApplyCategoryFilter = useCallback(() => {
    if (categoryFilter) {
      fetchGuestsByCategory(categoryFilter);
    }
  }, [categoryFilter, fetchGuestsByCategory]);

  const handleClearFilters = useCallback(() => {
    setCategoryFilter('');
    setSearchTerm('');
    fetchGuests();
  }, [fetchGuests]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!guestToDelete) return;
    
    try {
      await deleteGuest(guestToDelete._id);
      toast({
        title: 'Success',
        description: `Guest "${guestToDelete.fullName}" has been deleted.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete the guest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGuestToDelete(null);
    }
  }, [guestToDelete, deleteGuest, toast]);

  const handleOpenCheckInDialog = useCallback(() => {
    setIsCheckInDialogOpen(true);
  }, []);

  const handleGuestDelete = useCallback((guest: Guest) => {
    setGuestToDelete(guest);
  }, []);

  // --- Render Logic ---
  // This ContentContainer ensures stable layout height
  const ContentContainer: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="relative min-h-[400px]">
      {children}
    </div>
  );

  // Content renderer with stable height
  const renderContent = () => {
    if (loading) {
      return <GuestListSkeleton />;
    }
    
    if (error) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center text-red-500 p-6 rounded-lg">
            <p className="text-xl mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      );
    }
    
    if (filteredGuests.length === 0) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center text-gray-500 p-6 rounded-lg">
            <p className="text-xl mb-2">No guests found</p>
            <p>Try adjusting your search or filters</p>
            {categoryFilter && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredGuests.map((guest) => (
          <GuestCard
            key={guest._id}
            guest={guest}
            onDelete={() => handleGuestDelete(guest)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
        <Button onClick={handleOpenCheckInDialog}>
          <UserPlus className="mr-2 h-4 w-4" /> Check In Guest
        </Button>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
        <div className="md:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by name, phone, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:col-span-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:col-span-1">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleApplyCategoryFilter} 
            className="w-full sm:col-span-1"
            disabled={!categoryFilter}
          >
            Filter
          </Button>
          <Button 
            onClick={handleClearFilters} 
            variant="outline" 
            className="w-full sm:col-span-1"
            disabled={!categoryFilter && !searchTerm}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
      
      {/* Content Area - Fixed height container prevents layout jumps */}
      <ContentContainer>
        {renderContent()}
      </ContentContainer>

      {/* Check-in Dialog */}
      <CheckInFormDialog
        isOpen={isCheckInDialogOpen}
        setIsOpen={setIsCheckInDialogOpen}
        rooms={rooms}
        createGuest={createGuest}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!guestToDelete} 
        onOpenChange={(open) => !open && setGuestToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guest record for{' '}
              <span className="font-semibold">{guestToDelete?.fullName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
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

// --- Sub-components with React.memo for performance ---

interface GuestCardProps {
  guest: Guest;
  onDelete: () => void;
}

const GuestCard = React.memo<GuestCardProps>(({ guest, onDelete }) => {
  const getStatusColor = (status: string) =>
    status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <Card className="hover:shadow transition-shadow duration-300">
      <CardContent className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4">
        <div className="md:col-span-2 flex flex-col">
          <p className="font-bold text-lg">{guest.fullName}</p>
          <p className="text-sm text-gray-500">{guest.phone}</p>
          {guest.email && <p className="text-sm text-gray-500">{guest.email}</p>}
        </div>
        <div className="flex justify-start md:justify-center">
          <Badge className={getStatusColor(guest.status)}>{guest.status}</Badge>
        </div>
        <div className="flex justify-start md:justify-end items-center gap-2">
          <Link to={`/guests/${guest._id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" /> Details
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Make the skeleton match the actual card layout
const GuestListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4">
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex justify-start md:justify-center">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex justify-start md:justify-end items-center gap-2">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

interface CheckInFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  rooms: Room[];
  createGuest: (data: CreateGuestInput) => Promise<void>;
}

const CheckInFormDialog: React.FC<CheckInFormDialogProps> = ({ 
  isOpen, 
  setIsOpen, 
  rooms, 
  createGuest 
}) => {
  const [formData, setFormData] = useState<CreateGuestInput>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to make sure the animation completes before resetting
      const timeout = setTimeout(() => {
        setFormData(INITIAL_FORM_STATE);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleFormChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);
  
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value}));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomNumber) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a room.", 
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createGuest(formData);
      toast({ 
        title: 'Guest Checked In', 
        description: 'The new guest has been added successfully.' 
      });
      setIsOpen(false);
    } catch (err) {
      toast({ 
        title: 'Check-in Failed', 
        description: 'Could not create the guest record.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter only available rooms for selection
  const availableRooms = useMemo(() => 
    rooms.filter(r => r.status === 'available'),
    [rooms]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Guest Check-In</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleFormChange} 
              placeholder="John Doe" 
              disabled={isSubmitting}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              value={formData.address} 
              onChange={handleFormChange} 
              placeholder="123 Main St, Anytown" 
              disabled={isSubmitting}
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handleFormChange} 
                placeholder="+92 300 1234567" 
                disabled={isSubmitting}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleFormChange} 
                placeholder="guest@example.com" 
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnic">CNIC</Label>
              <Input 
                id="cnic" 
                name="cnic" 
                value={formData.cnic} 
                onChange={handleFormChange} 
                placeholder="12345-6789012-3" 
                disabled={isSubmitting}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stayDuration">Stay (days)</Label>
              <Input 
                id="stayDuration" 
                name="stayDuration" 
                type="number" 
                min={1} 
                value={formData.stayDuration} 
                onChange={handleFormChange} 
                disabled={isSubmitting}
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Room</Label>
            <Select 
              name="roomNumber" 
              value={formData.roomNumber} 
              onValueChange={(v) => handleSelectChange('roomNumber', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an available room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 ? (
                  <div className="px-2 py-4 text-center text-gray-500">
                    No rooms available
                  </div>
                ) : (
                  availableRooms.map((r) => (
                    <SelectItem key={r._id} value={r.roomNumber}>
                      Room {r.roomNumber} — {r.bedType} — (Rs{r.rate}/night) — {r.category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select 
                name="paymentMethod" 
                value={formData.paymentMethod} 
                onValueChange={(v) => handleSelectChange('paymentMethod', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center pt-6 space-x-2">
              <input 
                type="checkbox" 
                name="applyDiscount" 
                checked={formData.applyDiscount} 
                onChange={handleFormChange} 
                id="applyDiscount" 
                disabled={isSubmitting}
                className="h-4 w-4" 
              />
              <Label htmlFor="applyDiscount" className="cursor-pointer">
                Apply Discount
              </Label>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.roomNumber}
          >
            {isSubmitting ? 'Processing...' : 'Submit Check-In'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestsPage;

// import React, { useState, useEffect, useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import { Search, Eye, Trash2, UserPlus, X } from 'lucide-react';

// // Shadcn UI Components
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Label } from '@/components/ui/label';
// import { Skeleton } from '@/components/ui/skeleton';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/components/ui/alert-dialog';

// // Hooks & Contexts
// import { useToast } from '@/hooks/use-toast';
// import { useGuestContext, Guest } from '@/contexts/GuestContext'; // Assuming Guest type is exported

// // --- Constants and Types ---

// const INITIAL_FORM_STATE = {
//   fullName: '',
//   address: '',
//   phone: '',
//   cnic: '',
//   email: '',
//   roomNumber: '',
//   stayDuration: 1,
//   paymentMethod: 'cash' as 'cash' | 'card' | 'online',
//   applyDiscount: false,
// };

// type FormData = typeof INITIAL_FORM_STATE;

// // --- Main Page Component ---

// const GuestsPage: React.FC = () => {
//   const {
//     guests,
//     rooms,
//     loading,
//     error,
//     fetchGuests,
//     fetchGuestsByCategory,
//     createGuest,
//     deleteGuest,
//   } = useGuestContext();

//   // --- State Management ---
//   const [searchTerm, setSearchTerm] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('');
//   const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
//   const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
//   const { toast } = useToast();

//   // --- Data Fetching ---
//   useEffect(() => {
//     fetchGuests();
//   }, [fetchGuests]);

//   // --- Memoized Filtering ---
//   const filteredGuests = useMemo(() => {
//     if (!searchTerm) return guests;
//     return guests.filter(
//       (g) =>
//         g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         g.phone.includes(searchTerm) ||
//         g.room.roomNumber.includes(searchTerm)
//     );
//   }, [guests, searchTerm]);

//   // --- Event Handlers ---
//   const handleApplyCategoryFilter = () => {
//     if (categoryFilter) {
//       fetchGuestsByCategory(categoryFilter);
//     }
//   };

//   const handleClearFilters = () => {
//     setCategoryFilter('');
//     fetchGuests(); // Refetch all guests
//   };

//   const handleDeleteConfirm = async () => {
//     if (!guestToDelete) return;
//     try {
//       await deleteGuest(guestToDelete._id);
//       toast({
//         title: 'Success',
//         description: `Guest "${guestToDelete.fullName}" has been deleted.`,
//       });
//     } catch (err) {
//       toast({
//         title: 'Error',
//         description: 'Failed to delete the guest. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setGuestToDelete(null);
//     }
//   };

//   // --- Render Logic ---
//   const renderContent = () => {
//     if (loading) {
//       return <GuestListSkeleton />;
//     }
//     if (error) {
//       return <p className="text-center text-red-500">Error: {error}</p>;
//     }
//     if (filteredGuests.length === 0) {
//       return <p className="text-center text-gray-500 py-10">No guests found.</p>;
//     }
//     return (
//       <div className="space-y-4">
//         {filteredGuests.map((guest) => (
//           <GuestCard
//             key={guest._id}
//             guest={guest}
//             onDelete={() => setGuestToDelete(guest)}
//           />
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="container mx-auto p-4 md:p-6 lg:p-8">
//       {/* Page Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//         <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
//         <CheckInFormDialog
//           isOpen={isCheckInDialogOpen}
//           setIsOpen={setIsCheckInDialogOpen}
//           rooms={rooms}
//           createGuest={createGuest}
//         />
//       </div>

//       {/* Toolbar */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
//         <div className="md:col-span-1">
//           <div className="relative">
//             <Input
//               placeholder="Search by name, phone, or room..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10"
//             />
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:col-span-2">
//            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
//             <SelectTrigger className="sm:col-span-1">
//               <SelectValue placeholder="Filter by Category" />
//             </SelectTrigger>
//             <SelectContent>
//               {['Standard', 'Deluxe', 'Executive', 'Presidential'].map((cat) => (
//                 <SelectItem key={cat} value={cat}>{cat}</SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           <Button onClick={handleApplyCategoryFilter} className="w-full sm:col-span-1">Filter</Button>
//           <Button onClick={handleClearFilters} variant="outline" className="w-full sm:col-span-1">
//             <X className="h-4 w-4 mr-2" />
//             Clear
//           </Button>
//         </div>
//       </div>
      
//       {/* Content Area */}
//       {renderContent()}

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={!!guestToDelete} onOpenChange={() => setGuestToDelete(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This action cannot be undone. This will permanently delete the guest record for{' '}
//               <span className="font-semibold">{guestToDelete?.fullName}</span>.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// };

// // --- Sub-components (kept in the same file for simplicity) ---

// interface GuestCardProps {
//   guest: Guest;
//   onDelete: () => void;
// }

// const GuestCard: React.FC<GuestCardProps> = ({ guest, onDelete }) => {
//   const getStatusColor = (status: string) =>
//     status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

//   return (
//     <Card className="hover:shadow-lg transition-shadow duration-300">
//       <CardContent className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4">
//         <div className="md:col-span-2 flex flex-col">
//           <p className="font-bold text-lg">{guest.fullName}</p>
//           <p className="text-sm text-gray-500">{guest.phone}</p>
//           {guest.email && <p className="text-sm text-gray-500">{guest.email}</p>}
//         </div>
//         <div className="flex justify-start md:justify-center">
//           <Badge className={getStatusColor(guest.status)}>{guest.status}</Badge>
//         </div>
//         <div className="flex justify-start md:justify-end items-center gap-2">
//           <Link to={`/guests/${guest._id}`}>
//             <Button variant="outline" size="sm">
//               <Eye className="mr-2 h-4 w-4" /> Details
//             </Button>
//           </Link>
//           <Button variant="destructive" size="sm" onClick={onDelete}>
//             <Trash2 className="h-4 w-4" />
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// const GuestListSkeleton: React.FC = () => (
//   <div className="space-y-4">
//     {[...Array(3)].map((_, i) => (
//       <Card key={i}>
//         <CardContent className="flex justify-between items-center p-4">
//           <div className="space-y-2">
//             <Skeleton className="h-6 w-48" />
//             <Skeleton className="h-4 w-32" />
//           </div>
//           <div className="flex gap-2">
//             <Skeleton className="h-10 w-24" />
//             <Skeleton className="h-10 w-10" />
//           </div>
//         </CardContent>
//       </Card>
//     ))}
//   </div>
// );

// interface CheckInFormDialogProps {
//   isOpen: boolean;
//   setIsOpen: (open: boolean) => void;
//   rooms: any[]; // Replace with specific Room type if available
//   createGuest: (data: FormData) => Promise<void>;
// }

// const CheckInFormDialog: React.FC<CheckInFormDialogProps> = ({ isOpen, setIsOpen, rooms, createGuest }) => {
//   const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
//   const { toast } = useToast();

//   const handleFormChange = (
//     e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string | number | boolean }
//   ) => {
//     if ('target' in e) {
//       const { name, value, type, checked } = e.target as HTMLInputElement;
//       setFormData((prev) => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked : value,
//       }));
//     } else {
//       const { name, value } = e;
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };
  
//   const handleSelectChange = (name: string, value: string) => {
//     setFormData(prev => ({ ...prev, [name]: value}));
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.roomNumber) {
//         toast({ title: "Validation Error", description: "Please select a room.", variant: "destructive"});
//         return;
//     }
//     try {
//       await createGuest(formData);
//       toast({ title: 'Guest Checked In', description: 'The new guest has been added successfully.' });
//       setIsOpen(false);
//       setFormData(INITIAL_FORM_STATE); // Reset form
//     } catch {
//       toast({ title: 'Check-in Failed', description: 'Could not create the guest record.', variant: 'destructive' });
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button>
//           <UserPlus className="mr-2 h-4 w-4" /> Check In Guest
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>New Guest Check-In</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4 pt-4">
//           <div className="space-y-2">
//             <Label htmlFor="fullName">Full Name</Label>
//             <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleFormChange} placeholder="John Doe" required />
//           </div>
//            <div className="space-y-2">
//             <Label htmlFor="address">Address</Label>
//             <Input id="address" name="address" value={formData.address} onChange={handleFormChange} placeholder="123 Main St, Anytown" required />
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="phone">Phone Number</Label>
//               <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+92 300 1234567" required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="email">Email (Optional)</Label>
//               <Input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="guest@example.com" />
//             </div>
//              <div className="space-y-2">
//               <Label htmlFor="cnic">CNIC</Label>
//               <Input id="cnic" name="cnic" value={formData.cnic} onChange={handleFormChange} placeholder="12345-6789012-3" required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="stayDuration">Stay (days)</Label>
//               <Input id="stayDuration" name="stayDuration" type="number" min={1} value={formData.stayDuration} onChange={handleFormChange} required />
//             </div>
//           </div>
//           <div className="space-y-2">
//             <Label>Room</Label>
//             <Select name="roomNumber" value={formData.roomNumber} onValueChange={(v) => handleSelectChange('roomNumber', v)}>
//               <SelectTrigger><SelectValue placeholder="Select an available room" /></SelectTrigger>
//               <SelectContent>
//                 {rooms.map((r) => (
//                   <SelectItem key={r._id} value={r.roomNumber}>
//                     Room {r.roomNumber} — {r.bedType} — (Rs{r.rate}/night) — {r.category}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
//             <div className="space-y-2">
//                 <Label>Payment Method</Label>
//                  <Select name="paymentMethod" value={formData.paymentMethod} onValueChange={(v) => handleSelectChange('paymentMethod', v)}>
//                    <SelectTrigger><SelectValue/></SelectTrigger>
//                    <SelectContent>
//                      <SelectItem value="cash">Cash</SelectItem>
//                      <SelectItem value="card">Card</SelectItem>
//                      <SelectItem value="online">Online</SelectItem>
//                    </SelectContent>
//                  </Select>
//             </div>
//             <div className="flex items-center pt-6 space-x-2">
//               <input type="checkbox" name="applyDiscount" checked={formData.applyDiscount} onChange={handleFormChange} id="applyDiscount" className="h-4 w-4" />
//               <Label htmlFor="applyDiscount" className="cursor-pointer">Apply Discount</Label>
//             </div>
//           </div>
//           <Button type="submit" className="w-full">Submit Check-In</Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default GuestsPage;