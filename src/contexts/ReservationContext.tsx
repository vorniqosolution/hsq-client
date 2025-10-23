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

export interface CreatedOnDateSummary {
  totalCreated: number;
  byStatus: {
    reserved: number;
    'checked-in': number;
    'checked-out': number;
    cancelled: number;
  };
}

export interface CreatedOnDateReservation {
  _id: string;
  fullName: string;
  phone: string;
  status: string;
  source: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  totalDays: number;
  createdBy?: string;
  createdAt: string;
}

export interface CreatedOnDateResponse {
  summary: CreatedOnDateSummary;
  data: CreatedOnDateReservation[];
}

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
  room: Room | null;
  roomNumber: string;
  startAt: string;
  endAt: string;
  status: "reserved" | "cancelled" | "checked-in" | "checked-out";
  createdAt: string;
  updatedAt: string;
  createdBy: string | { _id: string; name: string; email: string; };
}

export interface CreateReservationInput {
  fullName: string;
  address: string;
  email: string;
  phone: string;
  cnic: string;
  roomNumber: string;
  checkin: string; // "YYYY-MM-DD"
  checkout: string; // "YYYY-MM-DD"
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

interface ReservationContextType {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  loading: boolean;
  error: string | null;

  createdOnDateReservations: CreatedOnDateReservation[];
  createdOnDateSummary: CreatedOnDateSummary | null;
  fetchReservationsCreatedOnDate: (date: string) => Promise<void>;

  fetchReservations: () => Promise<void>;
  createReservation: (data: CreateReservationInput) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Promise<Reservation>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
   const [createdOnDateReservations, setCreatedOnDateReservations] = useState<CreatedOnDateReservation[]>([]);
  const [createdOnDateSummary, setCreatedOnDateSummary] = useState<CreatedOnDateSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const apiCall = useCallback(async <T,>(
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

  const fetchReservationsCreatedOnDate = useCallback(async (date: string) => {
    // Clear previous results while fetching new ones for a better user experience
    setCreatedOnDateReservations([]);
    setCreatedOnDateSummary(null);

    await apiCall(
      // The API call to your new endpoint
      () => apiClient.get<CreatedOnDateResponse>(`/api/reservation/created-on?date=${date}`).then(res => res.data),
      
      // On success, update the new state variables
      (response) => {
        setCreatedOnDateReservations(response.data);
        setCreatedOnDateSummary(response.summary);
      },
      "Failed to fetch reservations created on this date"
    );
  }, [apiCall]);

  const fetchReservations = useCallback(async () => {
    await apiCall(
      () => apiClient.get<{ data: Reservation[] }>("/api/reservation/get-reservations").then(res => res.data.data || []),
      (data) => setReservations(data),
      "Failed to fetch reservations"
    );
  }, [apiCall]);

  const createReservation = useCallback(async (data: CreateReservationInput) => {
    await apiCall(
      () => apiClient.post<{ data: Reservation }>("/api/reservation/create-reservation", data).then(res => res.data.data),
      (newReservation) => {
        setReservations((prev) => [...prev, newReservation]);
      },
      "Failed to create reservation"
    );
  }, [apiCall]);

  const deleteReservation = useCallback(async (id: string) => {
    await apiCall(
      () => apiClient.delete(`/api/reservation/cancel-reservation/${id}/cancel`),
      () => {
        setReservations((prev) => prev.filter((r) => r._id !== id));
      },
      "Failed to cancel reservation"
    );
  }, [apiCall]);

  const getReservationById = useCallback(async (id: string): Promise<Reservation> => {
    return await apiCall(
      () => apiClient.get<{ data: Reservation }>(`/api/reservation/get-reservation/${id}`).then(res => res.data.data),
      (reservation) => {
        setCurrentReservation(reservation);
      },
      "Failed to fetch reservation"
    );
  }, [apiCall]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user, fetchReservations]);

    const contextValue = useMemo(() => ({
    reservations,
    currentReservation,
    loading,
    error,

    createdOnDateReservations, // Included
    createdOnDateSummary,      // Included
    fetchReservationsCreatedOnDate, // Included

    fetchReservations,
    createReservation,
    deleteReservation,
    getReservationById,
  }), [
    // Add the new dependencies here
    reservations,
    currentReservation,
    loading,
    error,
    
    createdOnDateReservations, // ADD THIS
    createdOnDateSummary,      // ADD THIS
    
    fetchReservations,
    createReservation,
    deleteReservation,
    getReservationById,
    fetchReservationsCreatedOnDate, // ADD THIS
  ]);

  // const contextValue = useMemo(() => ({
  //   reservations,
  //   currentReservation,
  //   loading,
  //   error,

  //   createdOnDateReservations,
  //   createdOnDateSummary,
  //   fetchReservationsCreatedOnDate,
  //   fetchReservations,
  //   createReservation,
  //   deleteReservation,
  //   getReservationById,
  // }), [
  //   reservations,
  //   currentReservation,
  //   loading,
  //   error,
  //   fetchReservations,
  //   createReservation,
  //   deleteReservation,
  //   getReservationById,
  // ]);

  return (
    <ReservationContext.Provider value={contextValue}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservationContext = () => {
  const context = useContext(ReservationContext);
  if (!context) throw new Error("useReservationContext must be used within ReservationProvider");
  return context;
};