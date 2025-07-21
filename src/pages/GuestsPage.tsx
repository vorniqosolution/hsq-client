import React, { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useGuestContext } from '@/contexts/GuestContext';

const GuestsPage: React.FC = () => {
  const { guests, rooms, loading, error, fetchGuests, createGuest } = useGuestContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    cnic: '',
    email: '',
    roomNumber: '',
    stayDuration: 1,
    paymentMethod: "cash",
    applyDiscount: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGuests();
  }, []);

  const filtered = guests.filter((g) =>
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone.includes(searchTerm) ||
    g.room.roomNumber.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoom = rooms.find((r) => r.roomNumber === formData.roomNumber);
      const guestToCreate = {
        ...formData,
        room: selectedRoom,
        checkInAt: new Date().toISOString(),
        email: formData.email, // Provide email value here or add to formData
        createdBy: '', // Provide createdBy value here or fetch from context/auth
        discountTitle: formData.applyDiscount, // Set as boolean
        paymentMethod: formData.paymentMethod as "cash" | "card" | "online",
      };
      await createGuest(guestToCreate);
      toast({ title: 'Guest checked in', description: 'Successfully added.' });
      setIsDialogOpen(false);
      setFormData({
        fullName: '',
        address: '',
        phone: '',
        cnic: '',
        email: '',
        roomNumber: '',
        paymentMethod: "cash",
        stayDuration: 1,
        applyDiscount: false,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to check in.', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) =>
    status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Guests</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Check In Guest</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check In Guest</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555 1234"
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="hsq@hotel.com"
                  />
                </div>
                <div>
                  <Label>CNIC</Label>
                  <Input
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    placeholder="12345-6789012-3"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Room</Label>
                <Select value={formData.roomNumber} onValueChange={(v) => setFormData({ ...formData, roomNumber: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r._id} value={r.roomNumber}>
                        {`Room ${r.roomNumber} - ${r.bedType} - (Rs${r.rate}/night) - ${r.category} - ${r.view}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stay Duration (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.stayDuration}
                    onChange={(e) => setFormData({ ...formData, stayDuration: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={formData.applyDiscount}
                    onChange={(e) => setFormData({ ...formData, applyDiscount: e.target.checked })}
                    id="applyDiscount"
                    className="mr-2"
                  />
                  <Label htmlFor="applyDiscount">Apply Discount</Label>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <div className="flex gap-4">
                    {["cash", "card", "online"].map((method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={formData.paymentMethod === method}
                          onChange={() => setFormData({ ...formData, paymentMethod: method })}
                          className="mr-2"
                        />
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </DialogContent>
        </Dialog>6
      </div>
      <Input
        placeholder="Search guests..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="space-y-4">
        {filtered.map((g) => (
          <Card key={g._id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{g.fullName}</p>
                <p className="text-sm text-gray-500">{g.phone}</p>
                <p className="text-sm text-gray-500">{g.email}</p>
              </div>
              <Badge className={getStatusColor(g.status)}>{g.status}</Badge>
              <Link to={`/guests/${g._id}`}>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p>No guests found.</p>}
      </div>
    </div>
  );
};

export default GuestsPage;
