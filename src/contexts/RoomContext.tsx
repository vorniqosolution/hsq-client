import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';


const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Room {
  room: any;
  price: number;
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  owner: string;
  dropdownLabel?: string;
}

interface RoomContextType {
  rooms: Room[];
  availableRooms: Room[];
  presidentialRooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
  
  // Existing methods
  fetchRooms: () => Promise<void>;
  createRoom: (room: Partial<Room>) => Promise<boolean>;
  
  // New methods to add
  fetchAvailableRooms: () => Promise<void>;
  fetchPresidentialRooms: () => Promise<void>;
  fetchRoomById: (id: string) => Promise<void>;
  updateRoom: (id: string, roomData: Partial<Room>) => Promise<boolean>;
  deleteRoom: (id: string) => Promise<boolean>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); 
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [presidentialRooms, setPresidentialRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  // --------------------------- EXISTING METHODS ---------------------------

  // Fetch all rooms; showSpinner controls loading indicator
  const fetchRoomsInternal = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await axios.get<{ rooms: Room[] }>(
        `${API_BASE}/api/rooms/get-all-rooms`,
        { withCredentials: true }
      );
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const fetchRooms = () => fetchRoomsInternal(true);

  const createRoom = async (room: Partial<Room>) => {
    try {
      await axios.post(
        `${API_BASE}/api/rooms/create-room`,
        room,
        { withCredentials: true }
      );
      // After creation, show spinner and refresh
      await fetchRoomsInternal(true);
      return true;
    } catch (err) {
      console.error('Create room error:', err);
      return false;
    }
  };

  // --------------------------- NEW METHODS ---------------------------

  // Fetch available rooms
  const fetchAvailableRooms = async () => {
    setError(null);
    try {
      const res = await axios.get<{ rooms: Room[] }>(
        `${API_BASE}/api/rooms/get-available-rooms`,
        { withCredentials: true }
      );
      setAvailableRooms(res.data.rooms);
    } catch (err) {
      console.error('Fetch available rooms error:', err);
      setError('Failed to fetch available rooms');
    }
  };

  // Fetch presidential rooms
  const fetchPresidentialRooms = async () => {
    setError(null);
    try {
      const res = await axios.get<{ rooms: Room[] }>(
        `${API_BASE}/api/rooms/get-presidential-rooms`,
        { withCredentials: true }
      );
      setPresidentialRooms(res.data.rooms);
    } catch (err) {
      console.error('Fetch presidential rooms error:', err);
      setError('Failed to fetch presidential rooms');
    }
  };

  // Fetch a specific room by ID
  const fetchRoomById = async (id: string) => {
    setError(null);
    try {
      const res = await axios.get<{ room: Room }>(
        `${API_BASE}/api/rooms/get-by-id/${id}`,
        { withCredentials: true }
      );
      setCurrentRoom(res.data.room);
    } catch (err) {
      console.error(`Fetch room ${id} error:`, err);
      setError(`Failed to fetch room ${id}`);
    }
  };

  // Update a room
  const updateRoom = async (id: string, roomData: Partial<Room>) => {
    setError(null);
    try {
      await axios.put(
        `${API_BASE}/api/rooms/update-room/${id}`,
        roomData,
        { withCredentials: true }
      );
      
      // Refresh rooms data after update
      await fetchRoomsInternal(false);
      
      // If the current room is the one being updated, also refresh it
      if (currentRoom?._id === id) {
        await fetchRoomById(id);
      }
      
      return true;
    } catch (err) {
      console.error(`Update room ${id} error:`, err);
      setError(`Failed to update room ${id}`);
      return false;
    }
  };

  // Delete a room
  const deleteRoom = async (id: string) => {
    setError(null);
    try {
      await axios.delete(
        `${API_BASE}/api/rooms/delete-room/${id}`,
        { withCredentials: true }
      );
      
      // Optimistic update of the rooms list
      setRooms(prevRooms => prevRooms.filter(room => room._id !== id));
      
      // If the current room is the one being deleted, clear it
      if (currentRoom?._id === id) {
        setCurrentRoom(null);
      }
      
      // Refresh other room lists that might contain this room
      await Promise.all([
        fetchAvailableRooms(),
        fetchPresidentialRooms()
      ]);
      
      return true;
    } catch (err) {
      console.error(`Delete room ${id} error:`, err);
      setError(`Failed to delete room ${id}`);
      return false;
    }
  };

  // --------------------------- EFFECTS ---------------------------

  useEffect(() => {
    // Initial load with spinner
    Promise.all([
      fetchRoomsInternal(true),
      fetchAvailableRooms(),
      fetchPresidentialRooms()
    ]).then(() => {
      initialFetchDone.current = true;
      setLoading(false);
    }).catch(err => {
      console.error('Initial data loading error:', err);
      setLoading(false);
    });

    // Silent polling every POLL_INTERVAL
    
  }, []);

  const contextValue = {
    rooms,
    availableRooms,
    presidentialRooms,
    currentRoom,
    loading,
    error,
    fetchRooms,
    createRoom,
    fetchAvailableRooms,
    fetchPresidentialRooms,
    fetchRoomById,
    updateRoom,
    deleteRoom
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};