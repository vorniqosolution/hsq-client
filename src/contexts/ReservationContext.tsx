import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";
import { useAuth } from "./AuthContext";

export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: "available" | "reserved" | "occupied" | "maintenance";
}

export interface Reservation {
  _id: string;
  fullName: string;
  address: string;
  email: string;
  phone: string;
  cnic: string;
  // Make room a union type to handle both string ID and populated object
  room:
    | string
    | {
        _id: string;
        roomNumber: string;
        category: string;
        rate: number;
        status: string;
        bedType?: string;
        view?: string;
      };
  roomNumber: string;
  startAt: string;
  endAt: string;
  status: "reserved" | "cancelled" | "checked-in" | "checked-out";
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  createdBy:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
}

// Updated input interface to match your controller
export interface CreateReservationInput {
  fullName: string; // Changed from guestName
  address: string;
  email: string;
  phone: string; // Changed from phoneNo
  cnic: string;
  roomNumber: string; // We'll use this to find the room
  checkin: string; // Changed from startDate
  checkout: string; // Changed from endDate
}

// Setup Axios
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Types
interface ReservationContextType {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  rooms: Room[];
  allRooms: Room[]; // All rooms including occupied ones
  loading: boolean;
  error: string | null;

  fetchReservations: () => Promise<void>;
  createReservation: (data: CreateReservationInput) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Promise<Reservation>;
  fetchRooms: () => Promise<void>;
  fetchAllRooms: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]); // All rooms including occupied ones
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const apiCall = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      errorMessage = "An error occurred"
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
          message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            errorMessage;
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Updated to match your API response format
  const fetchReservations = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{
          success: boolean;
          count: number;
          data: Reservation[];
        }>("/api/reservation/get-reservations");
        // console.log("getallreservation", res.data.data);
        return res.data.data || [];
      },
      (data) => setReservations(data),
      "Failed to fetch reservations"
    );
  }, [apiCall]);

  // Fetch available rooms
  const fetchRooms = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{
          success: boolean;
          rooms: Room[];
        }>("/api/rooms/get-available-rooms");
        return res.data.rooms || [];
      },
      (data) => setRooms(data),
      "Failed to fetch available rooms"
    );
  }, [apiCall]);

  // Fetch all rooms regardless of status
  const fetchAllRooms = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{
          success: boolean;
          rooms: Room[];
        }>("/api/rooms/get-all-rooms");
        return res.data.rooms || [];
      },
      (data) => setAllRooms(data),
      "Failed to fetch all rooms"
    );
  }, [apiCall]);

  // Updated to match your controller
  const createReservation = useCallback(
    async (data: CreateReservationInput) => {
      await apiCall(
        async () => {
          const res = await apiClient.post<{
            success: boolean;
            data: Reservation;
          }>("/api/reservation/create-reservation", data);
          return res.data.data;
        },
        (newReservation) => {
          // Just add the new reservation to state instead of refetching
          setReservations((prev) => [...prev, newReservation]);
        },
        "Failed to create reservation"
      );
    },
    [apiCall]
  );

  // Updated to match your controller's endpoint
  const deleteReservation = useCallback(
    async (id: string) => {
      await apiCall(
        async () => {
          await apiClient.delete(
            `/api/reservation/cancel-reservation/${id}/cancel`
          );
          return true;
        },
        async () => {
          setReservations((prev) => prev.filter((r) => r._id !== id));
        },
        "Failed to cancel reservation"
      );
    },
    [apiCall]
  );

  // Updated to match your controller's response format
  const getReservationById = useCallback(
    async (id: string): Promise<Reservation> => {
      return await apiCall(
        async () => {
          const res = await apiClient.get<{
            success: boolean;
            data: Reservation;
          }>(`/api/reservation/get-reservation/${id}`);
          return res.data.data;
        },
        (reservation) => {
          setCurrentReservation(reservation);
        },
        "Failed to fetch reservation"
      );
    },
    [apiCall]
  );

  useEffect(() => {
    if (user) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchReservations(),
            fetchRooms(),
            fetchAllRooms(),
          ]);
        } catch (err) {
          console.error("Failed to load initial data:", err);
        }
      };

      loadInitialData();
    }
  }, [fetchReservations, fetchRooms, fetchAllRooms, user]);

  const contextValue = useMemo(
    () => ({
      reservations,
      currentReservation,
      rooms,
      allRooms,
      loading,
      error,
      fetchReservations,
      createReservation,
      deleteReservation,
      getReservationById,

      fetchRooms,
      fetchAllRooms,
    }),
    [
      reservations,
      currentReservation,
      rooms,
      allRooms,
      loading,
      error,
      fetchReservations,
      createReservation,
      deleteReservation,
      getReservationById,

      fetchRooms,
      fetchAllRooms,
    ]
  );

  return (
    <ReservationContext.Provider value={contextValue}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservationContext = () => {
  const context = useContext(ReservationContext);
  if (!context)
    throw new Error(
      "useReservationContext must be used within ReservationProvider"
    );
  return context;
};
