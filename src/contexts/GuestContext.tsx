import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Create a configured Axios instance to avoid repetition
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Type definitions
export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
}

export interface Guest {
  _id: string;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  cnic: string;
  room: Room;
  checkInAt: string;
  checkOutAt?: string;
  status: 'checked-in' | 'checked-out';
  paymentMethod: 'cash' | 'card' | 'online';
  stayDuration: number;
  additionaldiscount: number;
  applyDiscount: boolean;
  discountTitle?: string;
  totalRent: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  pdfPath?: string;
}

export interface CreateGuestInput {
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  email?: string;
  roomNumber: string;
  stayDuration: number;
  paymentMethod: 'cash' | 'card' | 'online';
  applyDiscount: boolean;
  additionaldiscount: number;
}

interface GuestContextType {
  guests: Guest[];
  guest: Guest | null;
  invoice: Invoice | null;
  rooms: Room[];
  loading: boolean;
  error: string | null;

  fetchGuests: () => Promise<void>;
  fetchGuestsByCategory: (category: string) => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  fetchGuestById: (id: string) => Promise<void>;
  createGuest: (data: CreateGuestInput) => Promise<void>;
  updateGuest: (id: string, data: Partial<Guest>) => Promise<void>;
  checkoutGuest: (id: string) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  downloadInvoicePdf: (invoiceId: string) => void;
  sendInvoiceByEmail: (invoiceId: string) => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle API calls with consistent loading/error states
  const apiCall = useCallback(async <T,>(
    fn: () => Promise<T>,
    onSuccess?: (data: T) => void,
    errorMessage = 'An error occurred'
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      // Extract detailed error message if available
      let message = errorMessage;
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        message = axiosError.response?.data?.message || axiosError.message || errorMessage;
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // API Functions - wrapped in useCallback to maintain stable references
  const fetchGuests = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ guests: Guest[] }>('/api/guests/get-all-guest');
        return res.data.guests;
      },
      (guests) => setGuests(guests),
      'Failed to fetch guests'
    );
  }, [apiCall]);

  const fetchGuestsByCategory = useCallback(async (category: string) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ data: Guest[] }>(
          `/api/guests/get-guest-by-category?category=${encodeURIComponent(category)}`
        );
        return res.data.data;
      },
      (guests) => setGuests(guests),
      `Failed to fetch guests in category: ${category}`
    );
  }, [apiCall]);

  const fetchAvailableRooms = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ rooms: Room[] }>('/api/rooms/get-available-rooms');
        return res.data.rooms;
      },
      (rooms) => setRooms(rooms),
      'Failed to fetch available rooms'
    );
  }, [apiCall]);

  const fetchGuestById = useCallback(async (id: string) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ data: { guest: Guest; invoice: Invoice | null } }>(
          `/api/guests/get-Guest-By-Id/${id}`
        );
        return res.data.data;
      },
      (data) => {
        setGuest(data.guest);
        setInvoice(data.invoice);
      },
      `Failed to fetch guest with ID: ${id}`
    );
  }, [apiCall]);

  const createGuest = useCallback(async (data: CreateGuestInput) => {
    await apiCall(
      async () => {
        await apiClient.post('/api/guests/create-guest', data);
        // We'll return nothing here
      },
      async () => {
        // After successful creation, refresh data
        await Promise.all([fetchGuests(), fetchAvailableRooms()]);
      },
      'Failed to create guest'
    );
  }, [apiCall, fetchGuests, fetchAvailableRooms]);

  const updateGuest = useCallback(async (id: string, data: Partial<Guest>) => {
    await apiCall(
      async () => {
        await apiClient.patch(`/api/guests/update-guest/${id}`, data);
      },
      async () => {
        // After successful update, refresh data
        await Promise.all([fetchGuestById(id), fetchGuests()]);
      },
      'Failed to update guest'
    );
  }, [apiCall, fetchGuestById, fetchGuests]);

  const checkoutGuest = useCallback(async (id: string) => {
    await apiCall(
      async () => {
        await apiClient.patch(`/api/guests/check-out-Guest/${id}/checkout`, {});
      },
      async () => {
        // After successful checkout, refresh all relevant data in parallel
        await Promise.all([
          fetchGuests(),
          fetchGuestById(id),
          fetchAvailableRooms()
        ]);
      },
      'Failed to check out guest'
    );
  }, [apiCall, fetchGuests, fetchGuestById, fetchAvailableRooms]);

  const deleteGuest = useCallback(async (id: string) => {
    await apiCall(
      async () => {
        await apiClient.delete(`/api/guests/guests/${id}`);
      },
      async () => {
        // Optimistic UI update
        setGuests(prev => prev.filter(g => g._id !== id));
        await fetchGuests();
      },
      'Failed to delete guest'
    );
  }, [apiCall, fetchGuests]);

  // This is a synchronous function, so we don't need the apiCall helper
  const downloadInvoicePdf = useCallback((invoiceId: string) => {
    window.open(`${API_BASE}/api/invoice/${invoiceId}/download`, '_blank');
  }, []);

  const sendInvoiceByEmail = useCallback(async (invoiceId: string) => {
    await apiCall(
      async () => {
        await apiClient.post(`/api/invoice/${invoiceId}/send-email`, {});
      },
      undefined,
      'Failed to send invoice email'
    );
  }, [apiCall]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchGuests(), fetchAvailableRooms()]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [fetchGuests, fetchAvailableRooms]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    guests,
    guest,
    invoice,
    rooms,
    loading,
    error,
    fetchGuests,
    fetchGuestsByCategory,
    fetchAvailableRooms,
    fetchGuestById,
    createGuest,
    updateGuest,
    checkoutGuest,
    deleteGuest,
    downloadInvoicePdf,
    sendInvoiceByEmail,
  }), [
    guests,
    guest, 
    invoice,
    rooms,
    loading,
    error,
    fetchGuests,
    fetchGuestsByCategory,
    fetchAvailableRooms,
    fetchGuestById,
    createGuest,
    updateGuest,
    checkoutGuest,
    deleteGuest,
    downloadInvoicePdf,
    sendInvoiceByEmail,
  ]);

  return (
    <GuestContext.Provider value={contextValue}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuestContext = () => {
  const context = useContext(GuestContext);
  if (!context) throw new Error('useGuestContext must be used within GuestProvider');
  return context;
};