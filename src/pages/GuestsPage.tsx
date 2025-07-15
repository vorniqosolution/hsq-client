
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
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
  status: 'checked-in' | 'reserved' | 'checked-out';
}

interface Room {
  id: number;
  roomNumber: string;
  type: string;
  rate: number;
  status: string;
}

interface CreateGuestData {
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  roomId: number;
}

const GuestsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    cnic: '',
    roomId: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch guests
  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['guests'],
    queryFn: async () => {
      const response = await fetch('/api/guests');
      if (!response.ok) throw new Error('Failed to fetch guests');
      return response.json();
    },
  });

  // Fetch available rooms
  const { data: availableRooms = [] } = useQuery({
    queryKey: ['rooms', 'available'],
    queryFn: async () => {
      const response = await fetch('/api/rooms?status=available');
      if (!response.ok) throw new Error('Failed to fetch available rooms');
      return response.json();
    },
  });

  // Create guest mutation
  const createGuestMutation = useMutation({
    mutationFn: async (guestData: CreateGuestData) => {
      const response = await fetch('/api/guests/create-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestData),
      });
      if (!response.ok) throw new Error('Failed to create guest');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Guest checked in",
        description: "Guest has been successfully checked in.",
      });
      setIsDialogOpen(false);
      setFormData({
        fullName: '',
        address: '',
        phone: '',
        cnic: '',
        roomId: '',
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to check in guest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredGuests = guests.filter((guest: Guest) =>
    guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.includes(searchTerm) ||
    guest.roomNumber.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.address || !formData.phone || !formData.cnic || !formData.roomId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createGuestMutation.mutate({
      fullName: formData.fullName,
      address: formData.address,
      phone: formData.phone,
      cnic: formData.cnic,
      roomId: parseInt(formData.roomId),
    });
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

  if (guestsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
            <p className="text-gray-600 mt-2">Manage guest reservations and check-ins</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Check In Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Check In Guest</DialogTitle>
                <DialogDescription>
                  Register a new guest and assign them to a room
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main St, City"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                      id="cnic"
                      value={formData.cnic}
                      onChange={(e) => setFormData({...formData, cnic: e.target.value})}
                      placeholder="12345-6789012-3"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Select value={formData.roomId} onValueChange={(value) => setFormData({...formData, roomId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map((room: Room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          Room {room.roomNumber} - {room.type} (${room.rate}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createGuestMutation.isPending}
                >
                  {createGuestMutation.isPending ? 'Checking In...' : 'Check In Guest'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search guests, rooms, or phone numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Guests List */}
        <div className="grid gap-4">
          {filteredGuests.map((guest: Guest) => (
            <Card key={guest.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {guest.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{guest.fullName}</h3>
                      <p className="text-gray-600">{guest.phone}</p>
                      <p className="text-sm text-gray-500">CNIC: {guest.cnic}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="font-semibold">{guest.roomNumber}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-semibold">{new Date(guest.checkInDate).toLocaleDateString()}</p>
                    </div>
                    <Badge className={getStatusColor(guest.status)}>
                      {guest.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link to={`/guests/${guest.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No guests found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestsPage;
