import React, {
  createContext, useContext, useState, useCallback, useMemo, ReactNode
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";

// Configured Axios instance
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Backend response types
export interface AllRevenueResponse {
  success: boolean;
  totalRevenue: number; // Fixed typo from totalrevene
  totalReservations: number;
}

export interface MonthlyRevenueResponse {
  success: boolean;
  month: number;
  year: number;
  monthlyrevenue: {
    totalRevenue: number;
    totalReservations: number;
  };
}

export interface YearlyRevenueResponse {
  success: boolean;
  year: number;
  totalRevenue: number;
  totalReservations: number;
}

export interface RoomCategoryRevenueResponse {
  success: boolean;
  month: number;
  year: number;
  categories: {
    _id: string; // category name
    totalRevenue: number;
    totalGuests: number;
  }[];
}

export interface DiscountedGuestsResponse {
  success: boolean;
  month: number;
  year: number;
  count: number;
  guests: {
    fullName: string;
    email: string;
    totalRent: number;
    applyDiscount: boolean;
    additionaldiscount: number;
    discountTitle: string;
    roomNumber: string;
    roomCategory: string;
    createdByEmail: string;
  }[];
}

export interface WeeklyRevenueResponse {
  success: boolean;
  week: number;
  year: number;
  weeklyrevenue: {
    totalRevenue: number;
    totalReservations: number; // Changed from totalGuests for consistency
  };
}

export interface DailyRevenueResponse {
  success: boolean;
  day: number;
  month: number;
  year: number;
  totalRevenue: number;
  totalReservations: number;
  // Removed data: any which wasn't in the backend
}

// Context Type
interface RevenueContextType {
  allRevenue: AllRevenueResponse | null;
  monthlyRevenue: MonthlyRevenueResponse | null;
  yearlyRevenue: YearlyRevenueResponse | null;
  roomCategoriesRevenue: RoomCategoryRevenueResponse | null;
  discountedGuests: DiscountedGuestsResponse | null;
  weeklyRevenue: WeeklyRevenueResponse | null;
  dailyRevenue: DailyRevenueResponse | null;
  loading: boolean;
  error: string | null;

  fetchAllRevenue: () => Promise<void>;
  fetchMonthlyRevenue: (month: number, year: number) => Promise<void>;
  fetchYearlyRevenue: (year: number) => Promise<void>;
  fetchRoomCategoriesRevenue: (month: number, year: number) => Promise<void>;
  fetchDiscountedGuests: (month: number, year: number) => Promise<void>;
  fetchWeeklyRevenue: (week: number, year: number) => Promise<void>;
  fetchDailyRevenue: (day: number, month: number, year: number) => Promise<void>;
  clearRevenueData: () => void;
}

const RevenueContext = createContext<RevenueContextType | undefined>(undefined);

export const RevenueProvider = ({ children }: { children: ReactNode }) => {
  // States
  const [allRevenue, setAllRevenue] = useState<AllRevenueResponse | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueResponse | null>(null);
  const [yearlyRevenue, setYearlyRevenue] = useState<YearlyRevenueResponse | null>(null);
  const [roomCategoriesRevenue, setRoomCategoriesRevenue] = useState<RoomCategoryRevenueResponse | null>(null);
  const [discountedGuests, setDiscountedGuests] = useState<DiscountedGuestsResponse | null>(null);
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyRevenueResponse | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generic API call helper
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
        const axiosError = err as AxiosError<{ message?: string; error?: string }>;
        message =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
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
  }, []);

  // API methods (each maps directly to your backend endpoints)
  const fetchAllRevenue = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<AllRevenueResponse>(`/api/revenue/all-revenue`);
        return res.data;
      },
      setAllRevenue,
      "Failed to fetch all revenue"
    );
  }, [apiCall]);

  const fetchMonthlyRevenue = useCallback(async (month: number, year: number) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<MonthlyRevenueResponse>(
          `/api/revenue/get-monthly-revenue?month=${month}&year=${year}`
        );
        return res.data;
      },
      setMonthlyRevenue,
      "Failed to fetch monthly revenue"
    );
  }, [apiCall]);

  const fetchYearlyRevenue = useCallback(async (year: number) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<YearlyRevenueResponse>(
          `/api/revenue/get-yearly-revenue?year=${year}`
        );
        return res.data;
      },
      setYearlyRevenue,
      "Failed to fetch yearly revenue"
    );
  }, [apiCall]);

  const fetchRoomCategoriesRevenue = useCallback(async (month: number, year: number) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<RoomCategoryRevenueResponse>(
          `/api/revenue/get-room-categories?month=${month}&year=${year}`
        );
        return res.data;
      },
      setRoomCategoriesRevenue,
      "Failed to fetch revenue by room categories"
    );
  }, [apiCall]);

  const fetchDiscountedGuests = useCallback(async (month: number, year: number) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<DiscountedGuestsResponse>(
          `/api/revenue/get-discounted-guest?month=${month}&year=${year}`
        );
        return res.data;
      },
      setDiscountedGuests,
      "Failed to fetch discounted guests"
    );
  }, [apiCall]);

  // const fetchWeeklyRevenue = useCallback(async (week: number, year: number) => {
  //   await apiCall(
  //     async () => {
  //       const res = await apiClient.get<WeeklyRevenueResponse>(
  //         `/api/revenue/get-weekly-revenue?week=${week}&year=${year}`
  //       );
  //       return res.data;
  //     },
  //     setWeeklyRevenue,
  //     "Failed to fetch weekly revenue"
  //   );
  // }, [apiCall]);

  const fetchWeeklyRevenue = useCallback(async (week: number, year: number) => {
  await apiCall(
    async () => {
      const res = await apiClient.get<WeeklyRevenueResponse>(
        `/api/revenue/get-weekly-revenue?week=${week}&year=${year}`
      );
      return res.data;
    },
    setWeeklyRevenue,
    "Failed to fetch weekly revenue"
  );
}, [apiCall]);

  const fetchDailyRevenue = useCallback(async (day: number, month: number, year: number) => {
    await apiCall(
      async () => {
        const res = await apiClient.get<DailyRevenueResponse>(
          `/api/revenue/get-daily-revenue?day=${day}&month=${month}&year=${year}`
        );
        return res.data;
      },
      setDailyRevenue,
      "Failed to fetch daily revenue"
    );
  }, [apiCall]);

  const clearRevenueData = useCallback(() => { 
    setAllRevenue(null);
    setMonthlyRevenue(null);
    setYearlyRevenue(null);
    setRoomCategoriesRevenue(null);
    setDiscountedGuests(null);
    setWeeklyRevenue(null);
    setDailyRevenue(null);
    setError(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      allRevenue,
      monthlyRevenue,
      yearlyRevenue,
      roomCategoriesRevenue,
      discountedGuests,
      weeklyRevenue,
      dailyRevenue,
      loading,
      error,
      fetchAllRevenue,
      fetchMonthlyRevenue,
      fetchYearlyRevenue,
      fetchRoomCategoriesRevenue,
      fetchDiscountedGuests,
      fetchWeeklyRevenue,
      fetchDailyRevenue,
      clearRevenueData
    }),
    [
      allRevenue,
      monthlyRevenue,
      yearlyRevenue,
      roomCategoriesRevenue,
      discountedGuests,
      weeklyRevenue,
      dailyRevenue,
      loading,
      error,
      fetchAllRevenue,
      fetchMonthlyRevenue,
      fetchYearlyRevenue,
      fetchRoomCategoriesRevenue,
      fetchDiscountedGuests,
      fetchWeeklyRevenue,
      fetchDailyRevenue,
      clearRevenueData
    ]
  );

  return (
    <RevenueContext.Provider value={contextValue}>
      {children}
    </RevenueContext.Provider>
  );
};

// Custom hook
export const useRevenueContext = () => {
  const context = useContext(RevenueContext);
  if (!context) {
    throw new Error("useRevenueContext must be used within a RevenueProvider");
  }
  return context;
};
