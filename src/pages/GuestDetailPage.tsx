
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Bed, Users, LogOut, Edit, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Guest {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  roomId: number;
  roomNumber: string;
  checkInDate: string;
  checkOutDate?: string;
  status: 'checked-in' | 'reserved' | 'checked-out';
  notes?: string;
}

const GuestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    cnic: '',
    notes: '',
  });

  // Fetch guest details
  const { data: guest, isLoading, error } = useQuery({
    queryKey: ['guest', id],
    queryFn: async () => {
      const response = await fetch(`/api/guests/${id}`);
      if (!response.ok) throw new Error('Failed to fetch guest details');
      return response.json();
    },
    enabled: !!id,
  });

  // Update guest mutation
  const updateGuestMutation = useMutation({
    mutationFn: async (updateData: Partial<Guest>) => {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update guest');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest', id] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({
        title: "Guest updated",
        description: "Guest information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update guest information.",
        variant: "destructive",
      });
    },
  });

  // Check-out guest mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/guests/${id}/checkout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to check out guest');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest', id] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Guest checked out",
        description: `${guest?.fullName} has been successfully checked out from room ${guest?.roomNumber}.`,
      });
      setIsCheckoutDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check out guest. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form when guest data loads
  React.useEffect(() => {
    if (guest) {
      setEditFormData({
        fullName: guest.fullName,
        address: guest.address,
        phone: guest.phone,
        cnic: guest.cnic,
        notes: guest.notes || '',
      });
    }
  }, [guest]);

  const handleUpdateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    updateGuestMutation.mutate(editFormData);
  };

  const handleCheckOut = () => {
    checkoutMutation.mutate();
  };

  const getStatusColor = (status: Guest['status']) => {
    switch (status) {
      case 'checked-in':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      case 'checked-out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guest details...</p>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Guest Not Found</h2>
          <p className="text-gray-600 mb-6">The guest you're looking for doesn't exist or has been removed.</p>
          <Link to="/guests">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Guests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/guests">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Guests
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{guest.fullName}</h1>
            <p className="text-gray-600 mt-2">Guest Details & Management</p>
          </div>
          <Badge className={getStatusColor(guest.status)}>
            {guest.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Guest contact details and information</CardDescription>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Guest Information</DialogTitle>
                      <DialogDescription>
                        Update guest contact details and notes
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateGuest} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editFormData.fullName}
                          onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cnic">CNIC</Label>
                          <Input
                            id="cnic"
                            value={editFormData.cnic}
                            onChange={(e) => setEditFormData({...editFormData, cnic: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={updateGuestMutation.isPending}
                      >
                        {updateGuestMutation.isPending ? 'Updating...' : 'Update Guest'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{guest.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{guest.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">CNIC</p>
                      <p className="font-medium">{guest.cnic}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="font-medium">{guest.address}</p>
                </div>
                {guest.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700">{guest.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stay Information */}
            <Card>
              <CardHeader>
                <CardTitle>Stay Information</CardTitle>
                <CardDescription>Reservation and room details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Bed className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Room Number</p>
                      <p className="font-medium text-lg">Room {guest.roomNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium">{new Date(guest.checkInDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {guest.checkOutDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium">{new Date(guest.checkOutDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guest.status === 'checked-in' && (
                  <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        <LogOut className="w-4 h-4 mr-2" />
                        Check Out
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Check-out</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to check out {guest.fullName} from room {guest.roomNumber}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsCheckoutDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCheckOut}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={checkoutMutation.isPending}
                        >
                          {checkoutMutation.isPending ? 'Checking Out...' : 'Confirm Check-out'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button variant="outline" className="w-full">
                  Print Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailPage;
