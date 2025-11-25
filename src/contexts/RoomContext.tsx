
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface RoomImage {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: "available" | "reserved" | "occupied" | "maintenance";
  owner: string;
  dropdownLabel?: string;
  images?: string[];
  amenities?: string[];
  isPubliclyVisible?: boolean;
  publicDescription?: string;
  adults?: number;
  infants?: number;
  cleaniness?: string;
}

export interface RoomBooking {
  type: 'Guest (Checked-in)' | 'Reservation';
  name: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  status: string;
}

interface RoomContextType {
  rooms: Room[];
  availableRooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
  // NEW: State for the room timeline.
  roomTimeline: RoomBooking[];

  // Room methods
  fetchRooms: () => Promise<void>;
  createRoom: (room: Partial<Room> | FormData) => Promise<boolean>;
  updateRoom: (id: string, roomData: Partial<Room> | FormData) => Promise<boolean>;
  deleteRoom: (id: string) => Promise<boolean>;
  fetchRoomById: (id: string) => Promise<void>;

  // CHANGED: fetchAvailableRooms now requires a date range to find available rooms.
  fetchAvailableRooms: (checkin: string, checkout: string) => Promise<void>;
  
  // NEW: Method to fetch the detailed schedule for a single room.
  fetchRoomTimeline: (roomId: string) => Promise<void>;
  // NEW: Utility method to clear the timeline data when it's no longer needed.
  clearRoomTimeline: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomTimeline, setRoomTimeline] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ rooms: Room[] }>(`${API_BASE}/api/rooms/get-all-rooms`, { withCredentials: true });
      setRooms(res.data.rooms);
    } catch (err) {
      console.error("Fetch rooms error:", err);
      setError("Failed to fetch all rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableRooms = useCallback(async (checkin: string, checkout: string) => {
    setLoading(true);
    setError(null);
    setAvailableRooms([]); // Clear previous results before starting a new search
    try {
      const res = await axios.get<{ rooms: Room[] }>(`${API_BASE}/api/rooms/get-available-rooms`, {
        params: { checkin, checkout },
        withCredentials: true,
      });
      setAvailableRooms(res.data.rooms);
    } catch (err) {
      console.error("Fetch available rooms error:", err);
      setError("Failed to fetch available rooms. Please check the dates and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoomTimeline = useCallback(async (roomId: string) => {
    setLoading(true);
    setError(null);
    setRoomTimeline([]); // Clear previous timeline
    try {
      const res = await axios.get<{ timeline: RoomBooking[] }>(`${API_BASE}/api/rooms/${roomId}/timeline`, {
        withCredentials: true,
      });
      setRoomTimeline(res.data.timeline);
    } catch (err) {
      console.error(`Fetch timeline for room ${roomId} error:`, err);
      setError("Could not fetch the room's schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoomTimeline = () => {
    setRoomTimeline([]);
  };

  const fetchRoomById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // NOTE: The server should return a single `room` object, not `{ data: { room: Room }}`
      const res = await axios.get<{ room: Room }>(`${API_BASE}/api/rooms/get-by-id/${id}`, { withCredentials: true });
      setCurrentRoom(res.data.room);
    } catch (err) {
      console.error(`Fetch room ${id} error:`, err);
      setError(`Failed to fetch room ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (room: Partial<Room> | FormData) => {
    setError(null);
    try {
      const isFormData = room instanceof FormData;
      await axios.post(`${API_BASE}/api/rooms/create-room`, room, {
      });
      await fetchRooms();
      return true;
    } catch (err) {
      console.error("Create room error:", err);
      setError("Failed to create room.");
      return false;
    }
  };

  const updateRoom = async (id: string, roomData: Partial<Room> | FormData) => {
    setError(null);
    try {
      const isFormData = roomData instanceof FormData;
      await axios.put(`${API_BASE}/api/rooms/update-room/${id}`, roomData, {
        withCredentials: true,
        // headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined, // Also optional here
      });
      await fetchRooms();
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

  const deleteRoom = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API_BASE}/api/rooms/delete-room/${id}`, { withCredentials: true });
      setRooms((prev) => prev.filter((room) => room._id !== id));
      if (currentRoom?._id === id) {
        setCurrentRoom(null);
      }
      return true;
    } catch (err) {
      console.error(`Delete room ${id} error:`, err);
      setError(`Failed to delete room ${id}`);
      return false;
    }
  };
  
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchRooms().finally(() => setLoading(false));
    }
  }, [user, fetchRooms]);

  const contextValue = {
    rooms,
    availableRooms,
    currentRoom,
    loading,
    error,
    roomTimeline, // NEW
    fetchRooms,
    createRoom,
    fetchAvailableRooms, // CHANGED
    fetchRoomById,
    updateRoom,
    deleteRoom,
    fetchRoomTimeline, // NEW
    clearRoomTimeline, // NEW
  };

  return (
    <RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
  );
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }
  return context;
};