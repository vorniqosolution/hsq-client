import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";

// Configured Axios instance
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export interface AllRevenueResponse {
  success: boolean;
  totalRevenue: number;
  invoiceCount: number;
}

export interface MonthlyRevenueResponse {
  success: boolean;
  month: number;
  year: number;
  monthlyrevenue: {
    totalRevenue: number;
    invoiceCount: number;
  };
}

export interface YearlyRevenueResponse {
  success: boolean;
  year: number;
  totalRevenue: number;
  invoiceCount: number;
}

export interface RoomCategoryRevenueResponse {
  success: boolean;
  month: number;
  year: number;
  categories: {
    _id: string; // category name
    totalRevenue: number;
    invoiceCount: number;
    category: string;
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
    discountAmount: number;
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
    invoiceCount: number;
  };
}

export interface DailyRevenueResponse {
  success: boolean;
  day: number;
  month: number;
  year: number;
  totalRevenue: number;
  invoiceCount: number;
}

type ReportData =
  | AllRevenueResponse
  | MonthlyRevenueResponse
  | YearlyRevenueResponse
  | RoomCategoryRevenueResponse
  | DiscountedGuestsResponse
  | WeeklyRevenueResponse
  | DailyRevenueResponse;

// The new, streamlined Context Type definition
interface RevenueContextType {
  reportData: ReportData | null; // Single state to hold the current report's data
  loading: boolean;
  error: string | null;

  // Functions to trigger API calls
  fetchAllRevenue: () => Promise<void>;
  fetchMonthlyRevenue: (month: number, year: number) => Promise<void>;
  fetchYearlyRevenue: (year: number) => Promise<void>;
  fetchWeeklyRevenue: (week: number, year: number) => Promise<void>;
  fetchDailyRevenue: (day: number, month: number, year: number) => Promise<void>;
  fetchRoomCategoriesRevenue: (month: number, year: number) => Promise<void>;
  fetchDiscountedGuests: (month: number, year: number) => Promise<void>;

  clearRevenueData: () => void;
}

const RevenueContext = createContext<RevenueContextType | undefined>(undefined);

export const RevenueProvider = ({ children }: { children: ReactNode }) => {
  // A single state for data, plus loading and error states for a clean data flow
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // A single, powerful API request handler to avoid code repetition
  const makeApiRequest = useCallback(
    async <T extends ReportData>(
      endpoint: string,
      params?: object
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      setReportData(null); // Clear previous data on new request for better UX

      try {
        const response = await apiClient.get<T>(endpoint, { params });
        setReportData(response.data);
      } catch (err) {
        let message = "An error occurred while fetching revenue data.";
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message?: string }>;
          message = axiosError.response?.data?.message || axiosError.message;
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        console.error("API Request Failed:", message, err); // Log full error for debugging
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch functions are now simple, one-line wrappers calling the central handler
  const fetchAllRevenue = useCallback(
    () => makeApiRequest<AllRevenueResponse>("/api/revenue/all-revenue"),
    [makeApiRequest]
  );
  const fetchMonthlyRevenue = useCallback(
    (month: number, year: number) =>
      makeApiRequest<MonthlyRevenueResponse>(
        "/api/revenue/get-monthly-revenue",
        { month, year }
      ),
    [makeApiRequest]
  );
  const fetchYearlyRevenue = useCallback(
    (year: number) =>
      makeApiRequest<YearlyRevenueResponse>(
        "/api/revenue/get-yearly-revenue",
        { year }
      ),
    [makeApiRequest]
  );
  const fetchWeeklyRevenue = useCallback(
    (week: number, year: number) =>
      makeApiRequest<WeeklyRevenueResponse>(
        "/api/revenue/get-weekly-revenue",
        { week, year }
      ),
    [makeApiRequest]
  );
  const fetchDailyRevenue = useCallback(
    (day: number, month: number, year: number) =>
      makeApiRequest<DailyRevenueResponse>(
        "/api/revenue/get-daily-revenue",
        { day, month, year }
      ),
    [makeApiRequest]
  );
  const fetchRoomCategoriesRevenue = useCallback(
    (month: number, year: number) =>
      makeApiRequest<RoomCategoryRevenueResponse>(
        "/api/revenue/get-room-categories",
        { month, year }
      ),
    [makeApiRequest]
  );
  const fetchDiscountedGuests = useCallback(
    (month: number, year: number) =>
      makeApiRequest<DiscountedGuestsResponse>(
        "/api/revenue/get-discounted-guest",
        { month, year }
      ),
    [makeApiRequest]
  );

  const clearRevenueData = useCallback(() => {
    setReportData(null);
    setError(null);
  }, []);

  // The memoized context value is smaller and changes less often, improving performance
  const contextValue = useMemo(
    () => ({
      reportData,
      loading,
      error,
      fetchAllRevenue,
      fetchMonthlyRevenue,
      fetchYearlyRevenue,
      fetchWeeklyRevenue,
      fetchDailyRevenue,
      fetchRoomCategoriesRevenue,
      fetchDiscountedGuests,
      clearRevenueData,
    }),
    [
      reportData, loading, error, fetchAllRevenue, fetchMonthlyRevenue,
      fetchYearlyRevenue, fetchWeeklyRevenue, fetchDailyRevenue,
      fetchRoomCategoriesRevenue, fetchDiscountedGuests, clearRevenueData
    ]
  );

  return (
    <RevenueContext.Provider value={contextValue}>
      {children}
    </RevenueContext.Provider>
  );
};

// Custom hook for easy consumption of the context in your components
export const useRevenueContext = () => {
  const context = useContext(RevenueContext);
  if (!context) {
    throw new Error("useRevenueContext must be used within a RevenueProvider");
  }
  return context;
};
