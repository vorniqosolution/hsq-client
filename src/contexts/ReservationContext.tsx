import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";
import { useAuth } from "./AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  status: "reserved" | "confirmed" | "cancelled" | "checked-in" | "checked-out";

  financials?: {
    nights: number;
    roomRate: number;
    estimatedTotal: number;
    totalAdvance: number;
    estimatedBalance: number;
  };

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

  advanceAmount?: number;
  advancePaymentMethod?: "Cash" | "Card" | "Online" | "PayAtHotel";

  // ✅ ADD THESE NEW FIELDS:
  adults?: number;           // Optional, defaults to 1
  infants?: number;          // Optional, defaults to 0
  arrivalTime?: string;      // Maps to expectedArrivalTime
  specialRequest?: string;   // Guest notes
  paymentMethod?: "Cash" | "Card" | "Online" | "PayAtHotel";
  promoCode?: string;
}

export interface SwapReservationInput {
  newRoomId?: string;
  newCheckin?: string;
  newCheckout?: string;
}

export interface SwapReservationResult {
  reservation: Reservation;
  changes: {
    room: { from: { roomNumber: string; rate: number }; to: { roomNumber: string; rate: number } } | null;
    dates: { from: { startAt: string; endAt: string; nights: number }; to: { startAt: string; endAt: string; nights: number } } | null;
  };
  financials: {
    originalEstimate: number;
    newEstimate: number;
    difference: number;
    totalAdvance: number;
    newBalance: number;
  };
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
  swapReservation: (id: string, data: SwapReservationInput) => Promise<SwapReservationResult>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);
export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for single item view (to maintain existing behavior)
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);

  // Queries
  const reservationsQuery = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Reservation[] }>(
        "/api/reservation/get-reservations"
      );
      return res.data.data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const [reportDate, setReportDate] = useState<string | null>(null);
  const dailyReportQuery = useQuery({
    queryKey: ["reservations", "report", reportDate],
    queryFn: async () => {
      if (!reportDate) return null;
      const res = await apiClient.get<DailyActivityResponse>(
        `/api/reservation/reports/daily-activity?date=${reportDate}`
      );
      return res.data;
    },
    enabled: !!reportDate,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const createReservationMutation = useMutation({
    mutationFn: (data: CreateReservationInput) =>
      apiClient
        .post<{ data: Reservation }>(
          "/api/reservation/create-reservation",
          data
        )
        .then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardRoomStatuses"] });
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/reservation/cancel-reservation/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardRoomStatuses"] });
    },
  });

  const hardDeleteReservationMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/reservation/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  const swapReservationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SwapReservationInput }) =>
      apiClient
        .put<{ success: boolean; data: SwapReservationResult }>(
          `/api/reservation/${id}/swap`,
          data
        )
        .then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardRoomStatuses"] });
    },
  });

  // Exposed Functions
  const fetchReservations = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["reservations"] });
  }, [queryClient]);

  const fetchDailyActivityReport = useCallback(async (date: string) => {
    setReportDate(date);
    // Logic dictates that setting state triggers query, so no manual fetch needed here
  }, []);

  const createReservation = useCallback(
    async (data: CreateReservationInput) => {
      await createReservationMutation.mutateAsync(data);
    },
    [createReservationMutation]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
      await deleteReservationMutation.mutateAsync(id);
    },
    [deleteReservationMutation]
  );

  const hardDeleteReservation = useCallback(
    async (id: string) => {
      await hardDeleteReservationMutation.mutateAsync(id);
    },
    [hardDeleteReservationMutation]
  );

  const getReservationById = useCallback(
    async (id: string): Promise<Reservation> => {
      // For single fetch, we can just use normal query fetcher helper or axios directly,
      // but to simulate existing behavior we update local state.
      // Ideally we'd replace this consumption with useQuery(['reservation', id]) in components.
      // But for backward compat:
      const res = await apiClient.get<{ data: Reservation }>(
        `/api/reservation/get-reservation/${id}`
      );
      const data = res.data.data;
      setCurrentReservation(data);
      return data;
    },
    []
  );

  const swapReservation = useCallback(
    async (id: string, data: SwapReservationInput): Promise<SwapReservationResult> => {
      return await swapReservationMutation.mutateAsync({ id, data });
    },
    [swapReservationMutation]
  );

  const contextValue = useMemo(
    () => ({
      reservations: reservationsQuery.data || [],
      currentReservation,
      loading:
        reservationsQuery.isLoading ||
        dailyReportQuery.isLoading ||
        createReservationMutation.isPending ||
        deleteReservationMutation.isPending ||
        hardDeleteReservationMutation.isPending ||
        swapReservationMutation.isPending,
      error:
        (reservationsQuery.error as any)?.message ||
        (dailyReportQuery.error as any)?.message ||
        (createReservationMutation.error as any)?.message ||
        (deleteReservationMutation.error as any)?.message ||
        (hardDeleteReservationMutation.error as any)?.message ||
        (swapReservationMutation.error as any)?.message ||
        null,

      dailyActivityReport: dailyReportQuery.data || null,
      fetchDailyActivityReport,

      fetchReservations,
      createReservation,
      deleteReservation,
      hardDeleteReservation,
      getReservationById,
      swapReservation,
    }),
    [
      reservationsQuery.data,
      reservationsQuery.isLoading,
      reservationsQuery.error,
      dailyReportQuery.data,
      dailyReportQuery.isLoading,
      dailyReportQuery.error,
      createReservationMutation.isPending,
      createReservationMutation.error,
      deleteReservationMutation.isPending,
      deleteReservationMutation.error,
      hardDeleteReservationMutation.isPending,
      hardDeleteReservationMutation.error,
      swapReservationMutation.isPending,
      swapReservationMutation.error,
      currentReservation,
      fetchDailyActivityReport,
      fetchReservations,
      createReservation,
      deleteReservation,
      hardDeleteReservation,
      getReservationById,
      swapReservation,
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
