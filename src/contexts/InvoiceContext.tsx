import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";
import { Room, Guest } from "./GuestContext";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export interface InvoiceItem {
  _id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  guest?: Guest | null; // The link to the live guest record is now optional
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  additionaldiscount: number;
  promoDiscount?: number;
  grandTotal: number;
  status: "pending" | "paid" | "cancelled";
  issueDate: string;
  dueDate?: string;
  pdfPath?: string;
  createdBy: { _id: string; name: string };
  createdAt: string;
  checkInAt: string;
  // 👇 ADD THIS 👇
  advanceAdjusted?: number;
  balanceDue?: number;
  totalRefunded?: number;
  // 👆 --------- 👆
  guestDetails: {
    fullName: string;
    phone: string;
    cnic: string;
  };
  roomDetails: {
    roomNumber: string;
    category: string;
  };
}

export interface PaginatedInvoices {
  count: number;
  totalPages: number;
  currentPage: number;
  data: Invoice[];
}

export interface InvoiceSearchParams {
  guestName?: string;
  roomNumber?: string;
  invoiceNumber?: string;
}

interface InvoiceContextType {
  invoices: Invoice[]; // For holding search results or a flat list
  paginatedInvoices: PaginatedInvoices | null; // For the main paginated view
  currentInvoice: Invoice | null;
  loading: boolean;
  error: string | null;

  // API Functions
  fetchAllInvoices: (page?: number, limit?: number) => Promise<void>;
  searchInvoices: (params: InvoiceSearchParams) => Promise<void>;
  fetchInvoiceById: (id: string) => Promise<void>;
  updateInvoiceStatus: (
    id: string,
    status: "pending" | "paid" | "cancelled"
  ) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  sendInvoiceByEmail: (
    id: string
  ) => Promise<{ success: boolean; message: string }>;
  downloadInvoicePdf: (id: string) => void;
  clearError: () => void;
}

// --- Context Definition ---
const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

// --- Provider Component ---
export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
  // State
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paginatedInvoices, setPaginatedInvoices] =
    useState<PaginatedInvoices | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Generic API call handler
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
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- API Functions ---

  const fetchAllInvoices = useCallback(
    async (page = 1, limit = 25) => {
      await apiCall(
        async () => {
          const res = await apiClient.get<PaginatedInvoices>(
            `/api/invoice/get-all-invoices?page=${page}&limit=${limit}`
          );
          return res.data;
        },
        (data) => setPaginatedInvoices(data),
        "Failed to fetch invoices"
      );
    },
    [apiCall]
  );

  const searchInvoices = useCallback(
    async (params: InvoiceSearchParams) => {
      const query = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      await apiCall(
        async () => {
          const res = await apiClient.get<{ data: Invoice[] }>(
            `/api/invoice/search-Invoices?${query}`
          );
          return res.data.data;
        },
        (data) => {
          setInvoices(data); // Store search results in the flat `invoices` state
          setPaginatedInvoices(null); // Clear paginated results when searching
        },
        "Failed to search for invoices"
      );
    },
    [apiCall]
  );

  const fetchInvoiceById = useCallback(
    async (id: string) => {
      await apiCall(
        async () => {
          const res = await apiClient.get<{ data: Invoice }>(
            `/api/invoice/get-Invoice-By-Id/${id}`
          );
          return res.data.data;
        },
        (data) => setCurrentInvoice(data),
        "Failed to fetch invoice details"
      );
    },
    [apiCall]
  );

  const updateInvoiceStatus = useCallback(
    async (id: string, status: "pending" | "paid" | "cancelled") => {
      await apiCall(
        () => apiClient.patch(`/api/invoice/${id}/status`, { status }),
        () => {
          // Refresh data to reflect the change
          if (paginatedInvoices) {
            fetchAllInvoices(paginatedInvoices.currentPage);
          }
          if (currentInvoice?._id === id) {
            fetchInvoiceById(id);
          }
        },
        "Failed to update invoice status"
      );
    },
    [
      apiCall,
      fetchAllInvoices,
      fetchInvoiceById,
      paginatedInvoices,
      currentInvoice,
    ]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      await apiCall(
        () => apiClient.delete(`/api/invoice/delete-Invoice/${id}`),
        () => {
          // Refresh the list after deletion
          if (paginatedInvoices) {
            fetchAllInvoices(paginatedInvoices.currentPage);
          } else {
            fetchAllInvoices();
          }
        },
        "Failed to delete invoice"
      );
    },
    [apiCall, fetchAllInvoices, paginatedInvoices]
  );

  const sendInvoiceByEmail = useCallback(
    async (id: string) => {
      return await apiCall<{ success: boolean; message: string }>(
        async () => {
          const res = await apiClient.post(`/api/invoice/${id}/send-email`);
          return res.data;
        },
        undefined, // No state update needed, but we want the return value for the component
        "Failed to send invoice email"
      );
    },
    [apiCall]
  );

  const downloadInvoicePdf = useCallback(async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/invoice/${id}/download`);
      const url = res.data.url;

      // Create a temporary <a> element
      const link = document.createElement("a");
      link.href = url;

      link.rel = "noopener noreferrer";
      link.click();
    } catch (e) {
      setError("Could not download the invoice. Please try again.");
    }
  }, []);

  // Initial data load
  // useEffect(() => {
  //   fetchAllInvoices();
  // }, [fetchAllInvoices]);

  useEffect(() => {
    if (user) {
      // ← run only once `user` exists
      fetchAllInvoices();
    }
  }, [fetchAllInvoices, user]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      invoices,
      paginatedInvoices,
      currentInvoice,
      loading,
      error,
      fetchAllInvoices,
      searchInvoices,
      fetchInvoiceById,
      updateInvoiceStatus,
      deleteInvoice,
      sendInvoiceByEmail,
      downloadInvoicePdf,
      clearError,
    }),
    [
      invoices,
      paginatedInvoices,
      currentInvoice,
      loading,
      error,
      fetchAllInvoices,
      searchInvoices,
      fetchInvoiceById,
      updateInvoiceStatus,
      deleteInvoice,
      sendInvoiceByEmail,
      downloadInvoicePdf,
    ]
  );

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
};

// --- Custom Hook ---
export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoiceContext must be used within an InvoiceProvider");
  }
  return context;
};
