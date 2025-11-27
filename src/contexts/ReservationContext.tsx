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

export interface DailyActivityData {
  arrivals: any[];
  checkIns: any[];
  checkOuts: any[];
  newBookings: any[];
  cancellations: any[];
}

export interface DailyActivitySummary {
  arrivals: number;
  checkIns: number;
  checkOuts: number;
  newBookings: number;
  cancellations: number;
}

export interface DailyActivityResponse {
  summary: DailyActivitySummary;
  data: DailyActivityData;
}

export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: "available" | "reserved" | "occupied" | "maintenance";
  adults?: number;   // Max adults capacity
  infants?: number;
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

  // ✅ ADD THESE NEW FIELDS:
  adults: number;
  infants: number;
  expectedArrivalTime?: string;
  specialRequest?: string;
  paymentMethod?: "Cash" | "Card" | "Online" | "PayAtHotel";
  promoCode?: string;
  source: "CRM" | "Website" | "API";


  createdAt: string;
  updatedAt: string;
  createdBy: string | { _id: string; name: string; email: string };
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

  // ✅ ADD THESE NEW FIELDS:
  adults?: number;           // Optional, defaults to 1
  infants?: number;          // Optional, defaults to 0
  arrivalTime?: string;      // Maps to expectedArrivalTime
  specialRequest?: string;   // Guest notes
  paymentMethod?: "Cash" | "Card" | "Online" | "PayAtHotel";
  promoCode?: string;   
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

  dailyActivityReport: DailyActivityResponse | null;

  fetchDailyActivityReport: (date: string) => Promise<void>;
  fetchReservations: () => Promise<void>;
  createReservation: (data: CreateReservationInput) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  hardDeleteReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Promise<Reservation>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);
export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [dailyActivityReport, setDailyActivityReport] =
    useState<DailyActivityResponse | null>(null);

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

  const fetchDailyActivityReport = useCallback(
    async (date: string) => {
      // Clear previous report data before fetching new data
      setDailyActivityReport(null);
      await apiCall(
        // This calls the new, powerful backend endpoint
        () =>
          apiClient
            .get<DailyActivityResponse>(
              `/api/reservation/reports/daily-activity?date=${date}`
            )
            .then((res) => res.data),
        (response) => {
          setDailyActivityReport(response);
        },
        "Failed to fetch daily activity report"
      );
    },
    [apiCall]
  );

  const fetchReservations = useCallback(async () => {
    await apiCall(
      () =>
        apiClient
          .get<{ data: Reservation[] }>("/api/reservation/get-reservations")
          .then((res) => res.data.data || []),
      (data) => setReservations(data),
      "Failed to fetch reservations"
    );
  }, [apiCall]);

  const createReservation = useCallback(
    async (data: CreateReservationInput) => {
      await apiCall(
        () =>
          apiClient
            .post<{ data: Reservation }>(
              "/api/reservation/create-reservation",
              data
            )
            .then((res) => res.data.data),
        (newReservation) => {
          setReservations((prev) => [...prev, newReservation]);
        },
        "Failed to create reservation"
      );
    },
    [apiCall]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
      await apiCall(
        () =>
          apiClient.delete(`/api/reservation/cancel-reservation/${id}/cancel`),
        () => {
          setReservations((prev) => prev.filter((r) => r._id !== id));
        },
        "Failed to cancel reservation"
      );
    },
    [apiCall]
  );

  const hardDeleteReservation = useCallback(async (id: string) => {
    await apiCall(
      // This calls the new, admin-only DELETE endpoint
      () => apiClient.delete(`/api/reservation/${id}`), // Use the simplified, correct path
      () => {
        // On success, remove the reservation from all local state arrays
        setReservations((prev) => prev.filter((r) => r._id !== id));
        // You could also update the dailyActivityReport state if needed
      },
      "Failed to permanently delete reservation"
    );
  }, [apiCall]);

  const getReservationById = useCallback(
    async (id: string): Promise<Reservation> => {
      return await apiCall(
        () =>
          apiClient
            .get<{ data: Reservation }>(
              `/api/reservation/get-reservation/${id}`
            )
            .then((res) => res.data.data),
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
      fetchReservations();
    }
  }, [user, fetchReservations]);

  const contextValue = useMemo(
    () => ({
      reservations,
      currentReservation,
      loading,
      error,

      dailyActivityReport,
      fetchDailyActivityReport,

      fetchReservations,
      createReservation,
      deleteReservation,
      hardDeleteReservation,
      getReservationById,
    }),
    [
      reservations,
      currentReservation,
      loading,
      error,

      dailyActivityReport,
      fetchDailyActivityReport,

      fetchReservations,
      createReservation,
      deleteReservation,
      hardDeleteReservation,
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
