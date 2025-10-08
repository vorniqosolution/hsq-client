import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Create a configured Axios instance
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
  status: 'available' | 'booked' | 'occupied' | 'maintenance';
}

export interface CreateRoomInput {
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: 'available' | 'booked' | 'occupied' | 'maintenance';
}

interface RoomContextType {
  rooms: Room[];
  availableRooms: Room[];
  presidentialRooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;

  fetchAllRooms: () => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  fetchPresidentialRooms: () => Promise<void>;
  fetchRoomById: (id: string) => Promise<void>;
  createRoom: (data: CreateRoomInput) => Promise<void>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [presidentialRooms, setPresidentialRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function for API calls with error handling
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

  // API Functions
  const fetchAllRooms = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ rooms: Room[] }>('/api/rooms/get-all-rooms');
        return res.data.rooms;
      },
      (rooms) => setRooms(rooms),
      'Failed to fetch all rooms'
    );
  }, [apiCall]);

  const fetchAvailableRooms = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ rooms: Room[] }>('/api/rooms/get-available-rooms');
        return res.data.rooms;
      },
      (rooms) => setAvailableRooms(rooms),
      'Failed to fetch available rooms'
    );
  }, [apiCall]);

  const fetchPresidentialRooms = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ rooms: Room[] }>('/api/rooms/get-presidential-rooms');
        return res.data.rooms;
      },
      (rooms) => setPresidentialRooms(rooms),
      'Failed to fetch presidential rooms'
    );
  }, [apiCall]);

  const fetchRoomById = useCallback(async (id: string) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ room: Room }>(`/api/rooms/get-by-id/${id}`);
        return res.data.room;
      },
      (room) => setCurrentRoom(room),
      `Failed to fetch room with ID: ${id}`
    );
  }, [apiCall]);

  const createRoom = useCallback(async (data: CreateRoomInput) => {
    await apiCall(
      async () => {
        await apiClient.post('/api/rooms/create-room', data);
      },
      async () => {
        await fetchAllRooms();
      },
      'Failed to create room'
    );
  }, [apiCall, fetchAllRooms]);

  const updateRoom = useCallback(async (id: string, data: Partial<Room>) => {
    await apiCall(
      async () => {
        await apiClient.put(`/api/rooms/update-room/${id}`, data);
      },
      async () => {
        await Promise.all([fetchRoomById(id), fetchAllRooms(), fetchAvailableRooms()]);
      },
      'Failed to update room'
    );
  }, [apiCall, fetchRoomById, fetchAllRooms, fetchAvailableRooms]);

  const deleteRoom = useCallback(async (id: string) => {
    await apiCall(
      async () => {
        await apiClient.delete(`/api/rooms/delete-room/${id}`);
      },
      async () => {
        // Optimistic UI update
        setRooms(prev => prev.filter(r => r._id !== id));
        await fetchAllRooms();
      },
      'Failed to delete room'
    );
  }, [apiCall, fetchAllRooms]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAllRooms(), fetchAvailableRooms(), fetchPresidentialRooms()]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [fetchAllRooms, fetchAvailableRooms, fetchPresidentialRooms]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    rooms,
    availableRooms,
    presidentialRooms,
    currentRoom,
    loading,
    error,
    fetchAllRooms,
    fetchAvailableRooms,
    fetchPresidentialRooms,
    fetchRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
  }), [
    rooms,
    availableRooms,
    presidentialRooms,
    currentRoom,
    loading,
    error,
    fetchAllRooms,
    fetchAvailableRooms,
    fetchPresidentialRooms,
    fetchRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
  ]);

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoomContext must be used within RoomProvider');
  return context;
};