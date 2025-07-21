
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: 'available' | 'booked' | 'occupied' | 'maintenance';
}

export interface Guest {
  discountTitle: boolean;
  createdBy: any;
  _id: string;
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  email: string; // Optional email field
  room: {
    view: any;
    category: any;
    bedType: any;
    rate: any; roomNumber: string 
};
  checkInAt: string;
  checkInTime?: string;
  checkOutAt?: string;
  checkOutTime?: string;
  stayDuration: number;
  applyDiscount: boolean;
  status: 'checked-in' | 'checked-out';
  totalRent: number;
}

interface GuestContextType {
  guests: Guest[];
  guest: Guest | null;
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchGuests: () => Promise<void>;
  fetchGuestById: (id: string) => Promise<void>;
  createGuest: (data: Omit<Guest, '_id' | 'status' | 'totalRent'>) => Promise<void>;
  updateGuest: (id: string, data: Partial<Guest>) => Promise<void>;
  checkoutGuest: (id: string) => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider = ({ children }: { children: ReactNode }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track that we've done the first rooms fetch
  const didInitialRoomsFetch = useRef(false);

  const fetchGuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ guests: Guest[] }>(
        `${API_BASE}/api/guests/get-all-guest`,
        { withCredentials: true }
      );
      setGuests(res.data.guests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ guest: Guest }>(
        `${API_BASE}/api/guests/get-Guest-By-Id/${id}`,
        { withCredentials: true }
      );
      setGuest(res.data.guest);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Now accepts a flag to show spinner only on first load
  const fetchAvailableRooms = async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await axios.get<{ rooms: Room[] }>(
        `${API_BASE}/api/rooms/get-available-rooms`,
        { withCredentials: true }
      );
      setRooms(res.data.rooms);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const createGuest = async (
    data: Omit<Guest, '_id' | 'status' | 'totalRent'>
  ) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(
        `${API_BASE}/api/guests/create-guest`,
        data,
        { withCredentials: true }
      );
      await fetchGuests();
      await fetchAvailableRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateGuest = async (id: string, data: Partial<Guest>) => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE}/api/guests/update-guest/${id}`,
        data,
        { withCredentials: true }
      );
      await fetchGuestById(id);
      await fetchGuests();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkoutGuest = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE}/api/guests/check-out-Guest/${id}/checkout`,
        {},
        { withCredentials: true }
      );
      await fetchGuestById(id);
      await fetchGuests();
      await fetchAvailableRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1️⃣ load guests immediately
    fetchGuests();

    // 2️⃣ initial rooms fetch with spinner
    fetchAvailableRooms(true).then(() => {
      didInitialRoomsFetch.current = true;
    });

    // 3️⃣ then poll rooms silently every 5 seconds
    const intervalId = window.setInterval(() => {
      if (didInitialRoomsFetch.current) {
        fetchAvailableRooms(false);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <GuestContext.Provider
      value={{
        guests,
        guest,
        rooms,
        loading,
        error,
        fetchGuests,
        fetchGuestById,
        createGuest,
        updateGuest,
        checkoutGuest,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
};

export const useGuestContext = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuestContext must be used within a GuestProvider');
  }
  return context;
};
