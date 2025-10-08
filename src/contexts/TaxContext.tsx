import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Create a configured Axios instance to avoid repetition
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Type definitions
export interface TaxSettings {
  _id: string;
  taxRate: number;
  currencySymbol: string;
  hotelName: string;
  updatedAt: string;
}

interface TaxContextType {
  settings: TaxSettings | null;
  loading: boolean;
  error: string | null;
  
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<TaxSettings>) => Promise<void>;
  calculateTax: (amount: number) => number;
  formatCurrency: (amount: number) => string;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const TaxProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // State
  const [settings, setSettings] = useState<TaxSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle API calls with consistent loading/error states
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

  // API Functions - wrapped in useCallback to maintain stable references
  const fetchSettings = useCallback(async () => {
    await apiCall(
      async () => {
        // Use the correct endpoint that matches your router
        const res = await apiClient.get<{ success: boolean; data: TaxSettings }>('/api/tax/get-all-gst');
        return res.data.data;
      },
      (data) => setSettings(data),
      'Failed to fetch tax settings'
    );
  }, [apiCall]);

  const updateSettings = useCallback(async (data: Partial<TaxSettings>) => {
    if (!user || user.role !== 'admin') {
      setError('Only administrators can update tax settings');
      return;
    }
    
    await apiCall(
      async () => {
        const res = await apiClient.put<{ success: boolean; data: TaxSettings }>(
          '/api/tax/update-setting',
          data
        );
        return res.data.data;
      },
      (updatedSettings) => setSettings(updatedSettings),
      'Failed to update tax settings'
    );
  }, [apiCall, user]);

  // Utility functions
  const calculateTax = useCallback((amount: number): number => {
    if (!settings) return 0;
    return (amount * settings.taxRate) / 100;
  }, [settings]);

  const formatCurrency = useCallback((amount: number): string => {
    if (!settings) return `Rs ${amount.toFixed(2)}`;
    return `${settings.currencySymbol} ${amount.toFixed(2)}`;
  }, [settings]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchSettings();
      } catch (err) {
        console.error('Failed to load tax settings:', err);
      }
    };
    
    loadInitialData();
  }, [fetchSettings]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    calculateTax,
    formatCurrency,
  }), [
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    calculateTax,
    formatCurrency,
  ]);

  return (
    <TaxContext.Provider value={contextValue}>
      {children}
    </TaxContext.Provider>
  );
};

export const useTax = () => {
  const context = useContext(TaxContext);
  if (!context) throw new Error('useTax must be used within TaxProvider');
  return context;
};