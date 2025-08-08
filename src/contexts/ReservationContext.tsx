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

// Updated field names to match your controller
export interface Reservation {
  _id: string;
  fullName: string; // Changed from guestName
  address: string;
  email: string;
  phone: string; // Changed from phoneNo
  cnic: string;
  room: string; // This refers to the room ID
  roomNumber: string; // Added to store the room number
  startAt: string; // Changed from startDate
  endAt: string; // Changed from endDate
  status: "reserved" | "cancelled" | "confirmed" | "checked-in";
  createdAt: string;
  createdBy: string; // Added to match your model
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
  loading: boolean;
  error: string | null;

  fetchReservations: () => Promise<void>;
  createReservation: (data: CreateReservationInput) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Promise<Reservation | null>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
        return res.data.data || [];
      },
      (data) => setReservations(data),
      "Failed to fetch reservations"
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
        setReservations(prev => [...prev, newReservation]);
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
    async (id: string): Promise<Reservation | null> => {
      return await apiCall(
        async () => {
          const res = await apiClient.get<{
            success: boolean;
            data: Reservation;
          }>(`/api/reservation/get-reservation/${id}`);
          return res.data.data || null;
        },
        undefined,
        "Failed to fetch reservation"
      );
    },
    [apiCall]
  );

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [fetchReservations, user]);

  const contextValue = useMemo(
    () => ({
      reservations,
      loading,
      error,
      fetchReservations,
      createReservation,
      deleteReservation,
      getReservationById,
    }),
    [
      reservations,
      loading,
      error,
      fetchReservations,
      createReservation,
      deleteReservation,
      getReservationById,
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
