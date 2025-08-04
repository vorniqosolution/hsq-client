import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Create a configured Axios instance
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Type definitions for Revenue API responses
export interface RevenueByCategoryItem {
  period: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  guestCount: number;
  averageRent: number;
  averageRentFormatted: string;
  minRent: number;
  maxRent: number;
}

export interface RevenueByCategoryResponse {
  success: boolean;
  category: string;
  period: string;
  year: number;
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalGuests: number;
    averageRevenuePerGuest: number;
    averageRevenuePerGuestFormatted: string;
  };
  data: RevenueByCategoryItem[];
}

export interface CategoryRevenueItem {
  category: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  guestCount: number;
  averageRent: number;
  roomCount: number;
}

export interface CompareRevenueByCategoriesResponse {
  success: boolean;
  period: string;
  year: number;
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalGuests: number;
    totalRooms: number;
  };
  data: CategoryRevenueItem[];
}

export interface DailyRevenueItem {
  date: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  guestCount: number;
  averageRevenue: number;
  averageRevenueFormatted: string;
  checkIns: number;
  checkOuts: number;
}

export interface DailyRevenueSummaryResponse {
  success: boolean;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
  summary: {
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalGuests: number;
    averageDailyRevenue: number;
    averageDailyRevenueFormatted: string;
    totalCheckIns: number;
    totalCheckOuts: number;
  };
  data: DailyRevenueItem[];
}

export interface OccupancyAnalyticsItem {
  period: string;
  occupancyRate: number;
  occupancyRateFormatted: string;
  occupiedRoomDays: number;
  totalRoomDays: number;
  uniqueRoomsOccupied: number;
  totalRooms: number;
  totalGuests: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  revPAR: number;
  revPARFormatted: string;
}

export interface OccupancyAnalyticsResponse {
  success: boolean;
  period: string;
  year: number;
  category: string;
  summary: {
    averageOccupancyRate: number;
    averageOccupancyRateFormatted: string;
    totalRooms: number;
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalGuests: number;
    averageRevPAR: number;
    averageRevPARFormatted: string;
  };
  data: OccupancyAnalyticsItem[];
}

export interface PaymentMethodRevenueItem {
  paymentMethod: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  percentage: number;
  percentageFormatted: string;
  guestCount: number;
  averageAmount: number;
  averageAmountFormatted: string;
  minAmount: number;
  maxAmount: number;
}

export interface MonthlyPaymentTrends {
  [month: string]: {
    [paymentMethod: string]: {
      revenue: number;
      count: number;
    };
  };
}

export interface RevenueByPaymentMethodsResponse {
  success: boolean;
  dateRange: {
    from: string;
    to: string;
  };
  category: string;
  summary: {
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalGuests: number;
    averageTransactionAmount: number;
    averageTransactionAmountFormatted: string;
    paymentMethodsUsed: number;
  };
  paymentBreakdown: PaymentMethodRevenueItem[];
  monthlyTrends: MonthlyPaymentTrends;
}

// Filter params types
export interface RevenueFilterParams {
  category?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  year?: number;
  startDate?: string;
  endDate?: string;
}

// Context Type
interface RevenueContextType {
  // State
  revenueByCategory: RevenueByCategoryResponse | null;
  compareRevenue: CompareRevenueByCategoriesResponse | null;
  dailyRevenue: DailyRevenueSummaryResponse | null;
  occupancyAnalytics: OccupancyAnalyticsResponse | null;
  paymentMethodsRevenue: RevenueByPaymentMethodsResponse | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchRevenueByCategory: (params: RevenueFilterParams) => Promise<void>;
  fetchCompareRevenue: (params: RevenueFilterParams) => Promise<void>;
  fetchDailyRevenue: (params: RevenueFilterParams) => Promise<void>;
  fetchOccupancyAnalytics: (params: RevenueFilterParams) => Promise<void>;
  fetchPaymentMethodsRevenue: (params: RevenueFilterParams) => Promise<void>;
  fetchAllRevenueData: (params: RevenueFilterParams) => Promise<void>;
  clearRevenueData: () => void;
}

// Create Context
const RevenueContext = createContext<RevenueContextType | undefined>(undefined);

// Provider Component
export const RevenueProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategoryResponse | null>(null);
  const [compareRevenue, setCompareRevenue] = useState<CompareRevenueByCategoriesResponse | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueSummaryResponse | null>(null);
  const [occupancyAnalytics, setOccupancyAnalytics] = useState<OccupancyAnalyticsResponse | null>(null);
  const [paymentMethodsRevenue, setPaymentMethodsRevenue] = useState<RevenueByPaymentMethodsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function for API calls with consistent loading/error handling
  const apiCall = useCallback(async <T,>(
    fn: () => Promise<T>,
    onSuccess?: (data: T) => void,
    errorMessage = 'An error occurred'
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      // Extract detailed error message if available
      let message = errorMessage;
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string, error?: string }>;
        message = axiosError.response?.data?.message || 
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

  // Helper function to build URL with query params
  const buildQueryParams = (params: RevenueFilterParams): string => {
    const queryParams = new URLSearchParams();
    
    if (params.category) queryParams.append('category', params.category);
    if (params.period) queryParams.append('period', params.period);
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  };

  // API Functions
  const fetchRevenueByCategory = useCallback(async (params: RevenueFilterParams) => {
    if (!params.category) {
      setError('Category is required for revenue by category analysis');
      return;
    }
    
    await apiCall(
      async () => {
        const queryParams = buildQueryParams(params);
        const res = await apiClient.get<RevenueByCategoryResponse>(`/api/revenue/revenue-by-category${queryParams}`);
        return res.data;
      },
      (data) => setRevenueByCategory(data),
      'Failed to fetch revenue by category'
    );
  }, [apiCall]);

  const fetchCompareRevenue = useCallback(async (params: RevenueFilterParams) => {
    await apiCall(
      async () => {
        const queryParams = buildQueryParams(params);
        const res = await apiClient.get<CompareRevenueByCategoriesResponse>(`/api/revenue/compare-by-category${queryParams}`);
        return res.data;
      },
      (data) => setCompareRevenue(data),
      'Failed to fetch revenue comparison'
    );
  }, [apiCall]);

  const fetchDailyRevenue = useCallback(async (params: RevenueFilterParams) => {
    await apiCall(
      async () => {
        const queryParams = buildQueryParams(params);
        const res = await apiClient.get<DailyRevenueSummaryResponse>(`/api/revenue/daily${queryParams}`);
        return res.data;
      },
      (data) => setDailyRevenue(data),
      'Failed to fetch daily revenue summary'
    );
  }, [apiCall]);

  const fetchOccupancyAnalytics = useCallback(async (params: RevenueFilterParams) => {
    await apiCall(
      async () => {
        const queryParams = buildQueryParams(params);
        const res = await apiClient.get<OccupancyAnalyticsResponse>(`/api/revenue/occupancy-rate${queryParams}`);
        return res.data;
      },
      (data) => setOccupancyAnalytics(data),
      'Failed to fetch occupancy analytics'
    );
  }, [apiCall]);

  const fetchPaymentMethodsRevenue = useCallback(async (params: RevenueFilterParams) => {
    await apiCall(
      async () => {
        const queryParams = buildQueryParams(params);
        const res = await apiClient.get<RevenueByPaymentMethodsResponse>(`/api/revenue/payment-methods${queryParams}`);
        return res.data;
      },
      (data) => setPaymentMethodsRevenue(data),
      'Failed to fetch payment methods revenue'
    );
  }, [apiCall]);

  // Function to fetch all revenue data at once
  const fetchAllRevenueData = useCallback(async (params: RevenueFilterParams) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Promise.allSettled to ensure all requests complete regardless of individual failures
      const results = await Promise.allSettled([
        // Only fetch category specific data if a category is provided
        params.category ? fetchRevenueByCategory(params) : Promise.resolve(),
        fetchCompareRevenue(params),
        fetchDailyRevenue(params),
        fetchOccupancyAnalytics(params),
        fetchPaymentMethodsRevenue(params)
      ]);
      
      // Check if any requests failed
      const failedRequests = results.filter(r => r.status === 'rejected');
      if (failedRequests.length > 0) {
        // Log failures but don't throw to maintain data that did load successfully
        console.error('Some revenue data failed to load:', failedRequests);
        setError('Some revenue data could not be loaded. Please check console for details.');
      }
    } catch (err) {
      console.error('Failed to fetch revenue data:', err);
      setError('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [fetchRevenueByCategory, fetchCompareRevenue, fetchDailyRevenue, fetchOccupancyAnalytics, fetchPaymentMethodsRevenue]);

  
  const clearRevenueData = useCallback(() => {
    setRevenueByCategory(null);
    setCompareRevenue(null);
    setDailyRevenue(null);
    setOccupancyAnalytics(null);
    setPaymentMethodsRevenue(null);
    setError(null);
  }, []);

  // Create memoized context value
  const contextValue = useMemo(() => ({
    // State
    revenueByCategory,
    compareRevenue,
    dailyRevenue,
    occupancyAnalytics,
    paymentMethodsRevenue,
    loading,
    error,
    
    // Actions
    fetchRevenueByCategory,
    fetchCompareRevenue,
    fetchDailyRevenue,
    fetchOccupancyAnalytics,
    fetchPaymentMethodsRevenue,
    fetchAllRevenueData,
    clearRevenueData,
  }), [
    revenueByCategory,
    compareRevenue,
    dailyRevenue,
    occupancyAnalytics,
    paymentMethodsRevenue,
    loading,
    error,
    fetchRevenueByCategory,
    fetchCompareRevenue,
    fetchDailyRevenue,
    fetchOccupancyAnalytics,
    fetchPaymentMethodsRevenue,
    fetchAllRevenueData,
    clearRevenueData,
  ]);

  return (
    <RevenueContext.Provider value={contextValue}>
      {children}
    </RevenueContext.Provider>
  );
};

// Custom hook for using the context
export const useRevenueContext = () => {
  const context = useContext(RevenueContext);
  if (!context) {
    throw new Error('useRevenueContext must be used within a RevenueProvider');
  }
  return context;
};