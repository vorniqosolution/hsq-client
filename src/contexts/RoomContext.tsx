import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 5_000; // 5 seconds
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: 'available' | 'booked' | 'occupied' | 'maintenance';
  owner: string;
  dropdownLabel?: string;
}

interface RoomContextType {
  rooms: Room[];
  loading: boolean;
  fetchRooms: () => Promise<void>;
  createRoom: (room: Partial<Room>) => Promise<boolean>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const initialFetchDone = useRef(false);

  // Fetch rooms; showSpinner controls loading indicator
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

  useEffect(() => {
    // Initial load with spinner
    fetchRoomsInternal(true).then(() => {
      initialFetchDone.current = true;
    });

    // Silent polling every POLL_INTERVAL
    const id = window.setInterval(() => {
      if (initialFetchDone.current) {
        fetchRoomsInternal(false);
      }
    }, POLL_INTERVAL);

    return () => window.clearInterval(id);
  }, []);

  return (
    <RoomContext.Provider value={{ rooms, loading, fetchRooms, createRoom }}>
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