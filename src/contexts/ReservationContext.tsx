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

export interface Reservation {
  _id: string;
  guestName: string;
  address: string;
  email: string;
  phoneNo: string;
  cnic: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
  status: "reserved" | "cancelled" | "confirmed";
  createdAt: string;
}

export interface CreateReservationInput {
  guestName: string;
  address: string;
  email?: string;
  phoneNo: string;
  cnic: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
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

  const fetchReservations = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ reservations: Reservation[] }>(
          "/api/reservations"
        );
        return res.data.reservations;
      },
      (data) => setReservations(data),
      "Failed to fetch reservations"
    );
  }, [apiCall]);

  const createReservation = useCallback(
    async (data: CreateReservationInput) => {
      await apiCall(
        async () => {
          await apiClient.post("/api/reservations", data);
        },
        async () => {
          await fetchReservations();
        },
        "Failed to create reservation"
      );
    },
    [apiCall, fetchReservations]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
      await apiCall(
        async () => {
          await apiClient.delete(`/api/reservations/${id}`);
        },
        async () => {
          setReservations((prev) => prev.filter((r) => r._id !== id));
        },
        "Failed to delete reservation"
      );
    },
    [apiCall]
  );

  const getReservationById = useCallback(
    async (id: string): Promise<Reservation | null> => {
      return await apiCall(
        async () => {
          const res = await apiClient.get<{ reservation: Reservation }>(
            `/api/reservations/${id}`
          );
          return res.data.reservation;
        },
        undefined,
        "Failed to fetch reservation"
      );
    },
    [apiCall]
  );

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

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
