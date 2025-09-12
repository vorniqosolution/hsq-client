// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useRef,
//   ReactNode,
//   useCallback,
// } from "react";
// import axios from "axios";
// import { useAuth } from "@/contexts/AuthContext";

// const API_BASE = import.meta.env.VITE_API_BASE_URL;

// export interface RoomImage {
//   filename: string;
//   path: string;
//   mimetype: string;
//   size: number;
// }

// export interface Room {
//   room: any;
//   price: number;
//   _id: string;
//   roomNumber: string;
//   bedType: string;
//   category: string;
//   view: string;
//   rate: number;
//   status: "available" | "reserved" | "occupied" | "maintenance";
//   owner: string;
//   dropdownLabel?: string;
//   images?: RoomImage[];
// }

// // New: Reservation interfaces
// export interface ReservedRoomByDate {
//   _id: string;
//   fullName: string;
//   roomNumber: string;
//   roomStatus: string;
//   daysBooked: number;
//   startAt: string;
//   endAt: string;
// }

// export interface Reservation {
//   _id: string;
//   fullName: string;
//   address: string;
//   phone: string;
//   email: string;
//   cnic: string;
//   room: string | Room;
//   startAt: Date | string;
//   endAt: Date | string;
//   status: "reserved" | "checked-in" | "cancelled";
//   createdBy: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface RoomContextType {
//   rooms: Room[];
//   availableRooms: Room[];
//   presidentialRooms: Room[];
//   currentRoom: Room | null;
//   loading: boolean;
//   error: string | null;

//   // Reservation data
//   reservedRoomsByDate: ReservedRoomByDate[];
//   currentReservation: Reservation | null;

//   // Existing methods
//   fetchRooms: () => Promise<void>;
//   createRoom: (room: Partial<Room> | FormData) => Promise<boolean>; // Update to accept FormData

//   // Room methods
//   fetchAvailableRooms: () => Promise<void>;
//   fetchPresidentialRooms: () => Promise<void>;
//   fetchRoomById: (id: string) => Promise<void>;
//   updateRoom: (
//     id: string,
//     roomData: Partial<Room> | FormData
//   ) => Promise<boolean>; // Update to accept FormData
//   deleteRoom: (id: string) => Promise<boolean>;

//   // New: Reservation methods
//   fetchReservedRoomsByDate: (
//     year: number,
//     month: number,
//     day?: number | null
//   ) => Promise<void>;
//   fetchReservationById: (id: string) => Promise<void>;
// }

// const RoomContext = createContext<RoomContextType | undefined>(undefined);

// export const RoomProvider = ({ children }: { children: ReactNode }) => {
//   const { user } = useAuth();

//   // Room state
//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
//   const [presidentialRooms, setPresidentialRooms] = useState<Room[]>([]);
//   const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

//   // New: Reservation state
//   const [reservedRoomsByDate, setReservedRoomsByDate] = useState<
//     ReservedRoomByDate[]
//   >([]);
//   const [currentReservation, setCurrentReservation] =
//     useState<Reservation | null>(null);

//   // UI state
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const initialFetchDone = useRef(false);

//   // Fetch all rooms; showSpinner controls loading indicator
//   const fetchRoomsInternal = async (showSpinner = false) => {
//     if (showSpinner) setLoading(true);
//     try {
//       const res = await axios.get<{ rooms: Room[] }>(
//         `${API_BASE}/api/rooms/get-all-rooms`,
//         { withCredentials: true }
//       );
//       setRooms(res.data.rooms);
//     } catch (err) {
//       console.error("Fetch rooms error:", err);
//     } finally {
//       if (showSpinner) setLoading(false);
//     }
//   };

//   const fetchRooms = () => fetchRoomsInternal(true);

//   const createRoom = async (room: Partial<Room> | FormData) => {
//     try {
//       // Check if room is FormData (for image uploads) or a regular object
//       const isFormData = room instanceof FormData;

//       await axios.post(`${API_BASE}/api/rooms/create-room`, room, {
//         withCredentials: true,
//         // Set the correct content type for FormData using the variable
//         headers: isFormData
//           ? {
//               "Content-Type": "multipart/form-data",
//             }
//           : undefined,
//       });

//       // After creation, show spinner and refresh
//       await fetchRoomsInternal(true);
//       return true;
//     } catch (err) {
//       console.error("Create room error:", err);
//       return false;
//     }
//   };

//   // Fetch available rooms
//   const fetchAvailableRooms = useCallback(async () => {
//     setError(null);
//     try {
//       const res = await axios.get<{ rooms: Room[] }>(
//         `${API_BASE}/api/rooms/get-available-rooms`,
//         { withCredentials: true }
//       );
//       console.log("Available roms", res.data.rooms);
//       setAvailableRooms(res.data.rooms);
//     } catch (err) {
//       console.error("Fetch available rooms error:", err);
//       setError("Failed to fetch available rooms");
//     }
//   }, []);

//   // Fetch presidential rooms
//   const fetchPresidentialRooms = async () => {
//     setError(null);
//     try {
//       const res = await axios.get<{ rooms: Room[] }>(
//         `${API_BASE}/api/rooms/get-presidential-rooms`,
//         { withCredentials: true }
//       );
//       setPresidentialRooms(res.data.rooms);
//     } catch (err) {
//       console.error("Fetch presidential rooms error:", err);
//       setError("Failed to fetch presidential rooms");
//     }
//   };

//   // Fetch a specific room by ID
//   const fetchRoomById = async (id: string) => {
//     setError(null);
//     try {
//       const res = await axios.get<{ room: Room }>(
//         `${API_BASE}/api/rooms/get-by-id/${id}`,
//         { withCredentials: true }
//       );
//       setCurrentRoom(res.data.room);
//     } catch (err) {
//       console.error(`Fetch room ${id} error:`, err);
//       setError(`Failed to fetch room ${id}`);
//     }
//   };

//   // Update a room
//   const updateRoom = async (id: string, roomData: Partial<Room> | FormData) => {
//     setError(null);
//     try {
//       // Check if roomData is FormData or a regular object
//       const isFormData = roomData instanceof FormData;

//       await axios.put(`${API_BASE}/api/rooms/update-room/${id}`, roomData, {
//         withCredentials: true,
//         // Set the correct content type for FormData
//         headers: isFormData
//           ? {
//               "Content-Type": "multipart/form-data",
//             }
//           : undefined,
//       });

//       // Refresh rooms data after update
//       await fetchRoomsInternal(false);

//       // If the current room is the one being updated, also refresh it
//       if (currentRoom?._id === id) {
//         await fetchRoomById(id);
//       }

//       return true;
//     } catch (err) {
//       console.error(`Update room ${id} error:`, err);
//       setError(`Failed to update room ${id}`);
//       return false;
//     }
//   };

//   // Delete a room
//   const deleteRoom = async (id: string) => {
//     setError(null);
//     try {
//       await axios.delete(`${API_BASE}/api/rooms/delete-room/${id}`, {
//         withCredentials: true,
//       });

//       // Optimistic update of the rooms list
//       setRooms((prevRooms) => prevRooms.filter((room) => room._id !== id));

//       // If the current room is the one being deleted, clear it
//       if (currentRoom?._id === id) {
//         setCurrentRoom(null);
//       }

//       // Refresh other room lists that might contain this room
//       await Promise.all([fetchAvailableRooms(), fetchPresidentialRooms()]);

//       return true;
//     } catch (err) {
//       console.error(`Delete room ${id} error:`, err);
//       setError(`Failed to delete room ${id}`);
//       return false;
//     }
//   };

//   // Fetch reserved rooms by date (from Reservation MVC)
//   const fetchReservedRoomsByDate = useCallback(
//     async (year: number, month: number, day?: number | null) => {
//       setError(null);
//       try {
//         const res = await axios.get<{
//           success: boolean;
//           data: ReservedRoomByDate[];
//         }>(`${API_BASE}/api/reservation/Get-All-ReservedRoom-With-Date`, {
//           params: {
//             year,
//             month,
//             ...(day ? { day } : {}),
//           },
//           withCredentials: true,
//         });

//         if (res.data.success) {
//           // console.log(res.data.success);
//           setReservedRoomsByDate(res.data.data);
//         } else {
//           setError("Failed to fetch reserved rooms by date");
//           // console.log("Failed", res.data);
//           setReservedRoomsByDate([]);
//         }
//       } catch (err) {
//         console.error("Fetch reserved rooms by date error:", err);
//         setError("Failed to fetch reserved rooms by date");
//         setReservedRoomsByDate([]);
//       }
//     },
//     []
//   );

//   // Fetch a specific reservation by ID
//   const fetchReservationById = async (id: string) => {
//     setError(null);
//     try {
//       const res = await axios.get<{ success: boolean; data: Reservation }>(
//         `${API_BASE}/api/reservation/get-reservation/${id}`,
//         { withCredentials: true }
//       );

//       if (res.data.success) {
//         setCurrentReservation(res.data.data);
//       } else {
//         setError(`Failed to fetch reservation ${id}`);
//         setCurrentReservation(null);
//       }
//     } catch (err) {
//       console.error(`Fetch reservation ${id} error:`, err);
//       setError(`Failed to fetch reservation ${id}`);
//       setCurrentReservation(null);
//     }
//   };

//   useEffect(() => {
//     // Initial load with spinner
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1; // 1-12
//     const currentYear = currentDate.getFullYear();

//     Promise.all([
//       fetchRoomsInternal(true),
//       fetchAvailableRooms(),
//       fetchPresidentialRooms(),
//       fetchReservedRoomsByDate(currentYear, currentMonth), // Also load current month's reservations
//     ])
//       .then(() => {
//         initialFetchDone.current = true;
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Initial data loading error:", err);
//         setLoading(false);
//       });
//   }, []);

//   const contextValue = {
//     // Room state
//     rooms,
//     availableRooms,
//     presidentialRooms,
//     currentRoom,

//     // Reservation state
//     reservedRoomsByDate,
//     currentReservation,

//     // UI state
//     loading,
//     error,

//     // Room methods
//     fetchRooms,
//     createRoom,
//     fetchAvailableRooms,
//     fetchPresidentialRooms,
//     fetchRoomById,
//     updateRoom,
//     deleteRoom,

//     // Reservation methods
//     fetchReservedRoomsByDate,
//     fetchReservationById,
//   };

//   return (
//     <RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
//   );
// };

// export const useRoomContext = () => {
//   const context = useContext(RoomContext);
//   if (!context) {
//     throw new Error("useRoomContext must be used within a RoomProvider");
//   }
//   return context;
// };

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
  images?: RoomImage[];
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
        withCredentials: true,
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
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
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
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