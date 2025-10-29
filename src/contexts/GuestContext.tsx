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
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export interface GuestActivityData {
  checkIns: any[];
  checkOuts: any[];
}

export interface GuestActivitySummary {
  checkIns: number;
  checkOuts: number;
}

export interface GuestActivityResponse {
  summary: GuestActivitySummary;
  data: GuestActivityData;
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

export interface Guest {
  _id: string;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  cnic: string;
  room: Room | null; // Allow null explicitly
  checkInAt: string;
  checkOutAt: string;
  status: "checked-in" | "checked-out";
  paymentMethod: "cash" | "card" | "online";
  stayDuration: number;
  additionaldiscount: number;
  applyDiscount: boolean;
  discountTitle?: string;
  totalRent: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  pdfPath?: string;
}

export interface CreateGuestInput {
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  email?: string;
  roomNumber: string;
  checkInDate: string; // "YYYY-MM-DD"
  checkOutDate: string; // "YYYY-MM-DD"
  paymentMethod: "cash" | "card" | "online";
  applyDiscount: boolean;
  additionaldiscount: number;
  reservationId?: string;
}

interface GuestContextType {
  guests: Guest[];
  guest: Guest | null;
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;
  fetchGuests: () => Promise<void>;
  fetchGuestsByCategory: (category: string) => Promise<void>;
  fetchGuestById: (id: string) => Promise<void>;
  createGuest: (data: CreateGuestInput) => Promise<void>;
  updateGuest: (id: string, data: Partial<Guest>) => Promise<void>;
  checkoutGuest: (id: string) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  downloadInvoicePdf: (invoiceId: string) => void;
  sendInvoiceByEmail: (invoiceId: string) => Promise<void>;
}

interface GuestContextType {
  guests: Guest[];
  guest: Guest | null;
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;

  // Add the new state and function for the report
  guestActivityReport: GuestActivityResponse | null;
  fetchGuestActivityReport: (date: string) => Promise<void>;

  fetchGuests: () => Promise<void>;
  fetchGuestsByCategory: (category: string) => Promise<void>;
  fetchGuestById: (id: string) => Promise<void>;
  createGuest: (data: CreateGuestInput) => Promise<void>;
  updateGuest: (id: string, data: Partial<Guest>) => Promise<void>;
  checkoutGuest: (id: string) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  downloadInvoicePdf: (invoiceId: string) => void;
  sendInvoiceByEmail: (invoiceId: string) => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [guestActivityReport, setGuestActivityReport] = useState<GuestActivityResponse | null>(null);

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

  const fetchGuestActivityReport = useCallback(async (date: string) => {
    setGuestActivityReport(null); // Clear previous results before fetching
    await apiCall(
      // This calls your new guest activity API endpoint
      () => apiClient.get<GuestActivityResponse>(`/api/guests/activity-by-date?date=${date}`).then(res => res.data),
      (response) => {
        setGuestActivityReport(response);
      },
      "Failed to fetch guest activity report"
    );
  }, [apiCall]);

  const fetchGuests = useCallback(async () => {
    await apiCall(
      () =>
        apiClient
          .get<{ guests: Guest[] }>("/api/guests/get-all-guest")
          .then((res) =>
            // Ensure room is null if not populated
            res.data.guests.map((guest) => ({
              ...guest,
              room: guest.room || null,
            }))
          ),
      (data) => setGuests(data),
      "Failed to fetch guests"
    );
  }, [apiCall]);

  const fetchGuestsByCategory = useCallback(
    async (category: string) => {
      await apiCall(
        () =>
          apiClient
            .get<{ data: Guest[] }>(
              `/api/guests/get-guest-by-category?category=${encodeURIComponent(
                category
              )}`
            )
            .then((res) => res.data.data),
        (data) => setGuests(data),
        `Failed to fetch guests in category: ${category}`
      );
    },
    [apiCall]
  );

  const fetchGuestById = useCallback(
    async (id: string) => {
      await apiCall(
        () =>
          apiClient
            .get<{ data: { guest: Guest; invoice: Invoice | null } }>(
              `/api/guests/get-Guest-By-Id/${id}`
            )
            .then((res) => ({
              ...res.data.data,
              guest: {
                ...res.data.data.guest,
                room: res.data.data.guest.room || null,
              },
            })),
        (data) => {
          setGuest(data.guest);
          setInvoice(data.invoice);
        },
        `Failed to fetch guest with ID: ${id}`
      );
    },
    [apiCall]
  );

  const createGuest = useCallback(
    async (data: CreateGuestInput) => {
      await apiCall(
        () => apiClient.post("/api/guests/create-guest", data),
        () => fetchGuests(),
        "Failed to create guest"
      );
    },
    [apiCall, fetchGuests]
  );

  const updateGuest = useCallback(
    async (id: string, data: Partial<Guest>) => {
      await apiCall(
        () => apiClient.patch(`/api/guests/update-guest/${id}`, data),
        () => Promise.all([fetchGuestById(id), fetchGuests()]),
        "Failed to update guest"
      );
    },
    [apiCall, fetchGuestById, fetchGuests]
  );

  const checkoutGuest = useCallback(
    async (id: string) => {
      await apiCall(
        () => apiClient.patch(`/api/guests/check-out-Guest/${id}/checkout`, {}),
        () => Promise.all([fetchGuests(), fetchGuestById(id)]),
        "Failed to check out guest"
      );
    },
    [apiCall, fetchGuests, fetchGuestById]
  );

  const deleteGuest = useCallback(
    async (id: string) => {
      await apiCall(
        () => apiClient.delete(`/api/guests/guests/${id}`),
        () => {
          setGuests((prev) => prev.filter((g) => g._id !== id));
          fetchGuests(); // Re-sync with the server
        },
        "Failed to delete guest"
      );
    },
    [apiCall, fetchGuests]
  );

  const downloadInvoicePdf = useCallback((invoiceId: string) => {
    window.open(`${API_BASE}/api/invoice/${invoiceId}/download`, "_blank");
  }, []);

  const sendInvoiceByEmail = useCallback(
    async (invoiceId: string) => {
      await apiCall(
        () => apiClient.post(`/api/invoice/${invoiceId}/send-email`, {}),
        undefined,
        "Failed to send invoice email"
      );
    },
    [apiCall]
  );

  useEffect(() => {
    if (user) {
      fetchGuests();
    }
  }, [user, fetchGuests]);

  const contextValue = useMemo(
    () => ({
      guests,
      guest,
      invoice,
      loading,
      error,
      fetchGuests,
      fetchGuestsByCategory,
      fetchGuestById,
      createGuest,
      updateGuest,
      checkoutGuest,
      deleteGuest,
      downloadInvoicePdf,
      sendInvoiceByEmail,
      
      guestActivityReport,
      fetchGuestActivityReport,
    }),
    [
      guests,
      guest,
      invoice,
      loading,
      error,
      fetchGuests,
      fetchGuestsByCategory,
      fetchGuestById,
      createGuest,
      updateGuest,
      checkoutGuest,
      deleteGuest,
      downloadInvoicePdf,
      sendInvoiceByEmail,
      guestActivityReport,

      fetchGuestActivityReport,
    ]
  );

  return (
    <GuestContext.Provider value={contextValue}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuestContext = () => {
  const context = useContext(GuestContext);
  if (!context)
    throw new Error("useGuestContext must be used within GuestProvider");
  return context;
};
