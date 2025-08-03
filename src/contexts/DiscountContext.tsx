import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Axios client setup
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Type definitions
export interface Discount {
  _id: string;
  title: string;
  percentage: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountInput {
  title: string;
  percentage: number;
  startDate: string;
  endDate: string;
}

interface DiscountContextType {
  discounts: Discount[];
  currentDiscounts: Discount[];
  loading: boolean;
  error: string | null;
  fetchDiscounts: () => Promise<void>;
  fetchCurrentDiscounts: () => Promise<void>;
  createDiscount: (data: CreateDiscountInput) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;
}

const DiscountContext = createContext<DiscountContextType | undefined>(undefined);

export const DiscountProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [currentDiscounts, setCurrentDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for API calls with loading/error handling
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

  // Fetch all discounts
  const fetchDiscounts = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ discounts: Discount[] }>('/api/discount/get-Discounts');
        return res.data.discounts;
      },
      setDiscounts,
      'Failed to fetch discounts'
    );
  }, [apiCall]);

  // Fetch currently active discounts
  const fetchCurrentDiscounts = useCallback(async () => {
    await apiCall(
      async () => {
        const res = await apiClient.get<{ discount: Discount[] }>('/api/discount/currentdiscount');
        return res.data.discount;
      },
      setCurrentDiscounts,
      'Failed to fetch current discounts'
    );
  }, [apiCall]);

  // Create a new discount
  const createDiscount = useCallback(async (data: CreateDiscountInput) => {
    await apiCall(
      async () => {
        await apiClient.post('/api/discount/create-Discount', data);
      },
      async () => {
        // Refresh both lists after creation
        await Promise.all([fetchDiscounts(), fetchCurrentDiscounts()]);
      },
      'Failed to create discount'
    );
  }, [apiCall, fetchDiscounts, fetchCurrentDiscounts]);

  // Delete a discount by ID
  const deleteDiscount = useCallback(async (id: string) => {
    await apiCall(
      async () => {
        await apiClient.delete(`/api/discount/delete-discount/${id}`);
      },
      () => {
        // Optimistic UI: remove locally
        setDiscounts(prev => prev.filter(d => d._id !== id));
      },
      'Failed to delete discount'
    );
  }, [apiCall]);

  // Initial load
  useEffect(() => {
    fetchDiscounts();
    fetchCurrentDiscounts();
  }, [fetchDiscounts, fetchCurrentDiscounts]);

  // Memoized context value
  const value = useMemo(() => ({
    discounts,
    currentDiscounts,
    loading,
    error,
    fetchDiscounts,
    fetchCurrentDiscounts,
    createDiscount,
    deleteDiscount,
  }), [discounts, currentDiscounts, loading, error, fetchDiscounts, fetchCurrentDiscounts, createDiscount, deleteDiscount]);

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  );
};

// Custom hook for consuming context
export const useDiscountContext = () => {
  const context = useContext(DiscountContext);
  if (!context) throw new Error('useDiscountContext must be used within DiscountProvider');
  return context;
};
