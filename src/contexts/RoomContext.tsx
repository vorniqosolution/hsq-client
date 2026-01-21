import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  roomTimeline: RoomBooking[];

  fetchRooms: () => Promise<void>;
  createRoom: (room: Partial<Room> | FormData) => Promise<boolean>;
  updateRoom: (id: string, roomData: Partial<Room> | FormData) => Promise<boolean>;
  deleteRoom: (id: string) => Promise<boolean>;
  fetchRoomById: (id: string) => Promise<void>;
  fetchAvailableRooms: (checkin: string, checkout: string) => Promise<void>;
  fetchRoomTimeline: (roomId: string) => Promise<void>;
  clearRoomTimeline: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ----- LOCAL STATE -----
  // Keeping these for specific workflows (search, details view)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomTimeline, setRoomTimeline] = useState<RoomBooking[]>([]);

  // Manual loading/error states for non-query operations (like search)
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // ============ QUERIES ============

  // 1. All Rooms Query
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await axios.get<{ rooms: Room[] }>(`${API_BASE}/api/rooms/get-all-rooms`, {
        withCredentials: true
      });
      return res.data.rooms;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // ============ MUTATIONS ============

  const createRoomMutation = useMutation({
    mutationFn: (room: Partial<Room> | FormData) =>
      axios.post(`${API_BASE}/api/rooms/create-room`, room, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> | FormData }) =>
      axios.put(`${API_BASE}/api/rooms/update-room/${id}`, data, {
        withCredentials: true,
      }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["rooms"] });
      const previousRooms = queryClient.getQueryData<Room[]>(["rooms"]);

      // Optimistically update if not FormData (simplification for "instant" feel on text edits)
      if (!(data instanceof FormData)) {
        queryClient.setQueryData<Room[]>(["rooms"], (old) =>
          old?.map((room) => (room._id === id ? { ...room, ...data } : room))
        );
      }

      return { previousRooms };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(["rooms"], context.previousRooms);
      }
    },
    onSettled: (_, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      // If we updated the currently viewed room, refresh it
      if (currentRoom && currentRoom._id === id) {
        fetchRoomById(id);
      }
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`${API_BASE}/api/rooms/delete-room/${id}`, {
        withCredentials: true,
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["rooms"] });
      const previousRooms = queryClient.getQueryData<Room[]>(["rooms"]);

      queryClient.setQueryData<Room[]>(["rooms"], (old) =>
        old?.filter((room) => room._id !== id)
      );

      return { previousRooms };
    },
    onError: (err, id, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(["rooms"], context.previousRooms);
      }
    },
    onSettled: (_, error, id) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      if (currentRoom?._id === id) {
        setCurrentRoom(null);
      }
    },
  });

  // ============ EXPOSED HELPER FUNCTIONS ============

  // Main fetch simply invalidates to refresh
  const fetchRooms = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
  }, [queryClient]);

  const createRoom = async (room: Partial<Room> | FormData) => {
    try {
      await createRoomMutation.mutateAsync(room);
      return true;
    } catch (err) {
      console.error("Create room error:", err);
      // We rely on the exposed `error` state generally, but consumers expect boolean return
      return false;
    }
  };

  const updateRoom = async (id: string, roomData: Partial<Room> | FormData) => {
    try {
      await updateRoomMutation.mutateAsync({ id, data: roomData });
      return true;
    } catch (err) {
      console.error(`Update room ${id} error:`, err);
      return false;
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await deleteRoomMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error(`Delete room ${id} error:`, err);
      return false;
    }
  };

  const fetchRoomById = useCallback(async (id: string) => {
    setManualLoading(true);
    setManualError(null);
    try {
      const res = await axios.get<{ room: Room }>(`${API_BASE}/api/rooms/get-by-id/${id}`, {
        withCredentials: true
      });
      setCurrentRoom(res.data.room);
    } catch (err) {
      console.error(`Fetch room ${id} error:`, err);
      setManualError(`Failed to fetch room ${id}`);
    } finally {
      setManualLoading(false);
    }
  }, []);

  const fetchAvailableRooms = useCallback(async (checkin: string, checkout: string) => {
    setManualLoading(true);
    setManualError(null);
    setAvailableRooms([]);
    try {
      const res = await axios.get<{ rooms: Room[] }>(`${API_BASE}/api/rooms/get-available-rooms`, {
        params: { checkin, checkout },
        withCredentials: true,
      });
      setAvailableRooms(res.data.rooms);
    } catch (err) {
      console.error("Fetch available rooms error:", err);
      setManualError("Failed to fetch available rooms. Please check the dates and try again.");
    } finally {
      setManualLoading(false);
    }
  }, []);

  const fetchRoomTimeline = useCallback(async (roomId: string) => {
    setManualLoading(true);
    setManualError(null);
    setRoomTimeline([]);
    try {
      const res = await axios.get<{ timeline: RoomBooking[] }>(`${API_BASE}/api/rooms/${roomId}/timeline`, {
        withCredentials: true,
      });
      setRoomTimeline(res.data.timeline);
    } catch (err) {
      console.error(`Fetch timeline for room ${roomId} error:`, err);
      setManualError("Could not fetch the room's schedule.");
    } finally {
      setManualLoading(false);
    }
  }, []);

  const clearRoomTimeline = () => {
    setRoomTimeline([]);
  };

  // ============ CONTEXT VALUE ============

  const contextValue = useMemo(() => ({
    rooms: roomsQuery.data || [],
    availableRooms,
    currentRoom,
    roomTimeline,
    loading:
      roomsQuery.isLoading ||
      manualLoading ||
      createRoomMutation.isPending ||
      updateRoomMutation.isPending ||
      deleteRoomMutation.isPending,
    error:
      (roomsQuery.error as any)?.message ||
      (createRoomMutation.error as any)?.message ||
      (updateRoomMutation.error as any)?.message ||
      manualError,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    fetchRoomById,
    fetchAvailableRooms,
    fetchRoomTimeline,
    clearRoomTimeline,
  }), [
    roomsQuery.data,
    roomsQuery.isLoading,
    roomsQuery.error,
    availableRooms,
    currentRoom,
    roomTimeline,
    manualLoading,
    manualError,
    createRoomMutation.isPending,
    createRoomMutation.error,
    updateRoomMutation.isPending,
    updateRoomMutation.error,
    deleteRoomMutation.isPending,
    fetchRooms,
    fetchRoomById,
    fetchAvailableRooms,
    fetchRoomTimeline
  ]);

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