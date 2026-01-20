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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export interface CheckedOutGuest {
  _id: string;
  fullName: string;
  room: { _id: string; roomNumber: string; category: string } | null;
  checkInAt: string;
  checkOutAt: string;
  status: string;
}

export interface Room {
  _id: string;
  roomNumber: string;
  bedType: string;
  category: string;
  view: string;
  rate: number;
  status: "available" | "reserved" | "occupied" | "maintenance";
  adults?: number; // Max adults capacity
  infants?: number; // Max infants capacity
}

export interface Guest {
  _id: string;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  cnic: string;
  room: Room | null;
  adults: number;
  infants: number;
  extraMattresses?: number;
  checkInAt: string;
  checkOutAt: string;
  status: "checked-in" | "checked-out";
  paymentMethod: "cash" | "card" | "online";
  stayDuration: number;
  additionaldiscount: number;
  applyDiscount: boolean;
  discountTitle?: string;
  totalRent: number;
  gst?: number;
  advancePayment?: number;
  promoCode?: string;
  promoDiscount?: number;
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
  advanceAdjusted?: number;
  balanceDue?: number;
  additionaldiscount?: number;
}

export interface CreateGuestInput {
  fullName: string;
  address: string;
  phone: string;
  cnic: string;
  email?: string;
  roomNumber: string;
  decorPackageid?: string;
  adults?: number;
  infants?: number;
  extraMattresses?: number;
  checkInDate: string;
  checkOutDate: string;
  paymentMethod: "cash" | "card" | "online";
  applyDiscount: boolean;
  additionaldiscount: number;
  reservationId?: string;
  promoCode?: string;
}

interface GuestContextType {
  guests: Guest[];
  guest: Guest | null;
  reservation: any | null;
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;

  guestActivityReport: GuestActivityResponse | null;
  fetchGuestActivityReport: (date: string) => Promise<void>;

  checkedOutByRange: CheckedOutGuest[] | null;
  fetchCheckedOutByRange: (startDate: string, endDate: string) => Promise<void>;

  fetchGuests: () => Promise<void>;
  fetchGuestsByCategory: (category: string) => Promise<void>;
  fetchGuestById: (id: string) => Promise<void>;
  createGuest: (data: CreateGuestInput) => Promise<void>;
  updateGuest: (id: string, data: Partial<Guest>) => Promise<void>;
  checkoutGuest: (id: string) => Promise<any>;
  deleteGuest: (id: string) => Promise<void>;
  downloadInvoicePdf: (invoiceId: string) => void;
  sendInvoiceByEmail: (invoiceId: string) => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ----- LOCAL STATE (for things not easily query-able or single-item focus) -----
  // We keep 'guest', 'reservation', 'invoice' in local state if we want to maintain
  // exact API behavior of "fetchGuestById sets these".
  // Alternatively, we could use a useQuery for single guest too, but the existing
  // pattern is "click view -> fetchById -> set state".
  // For migration safety, we will keep the explicit fetchById logic but use queryClient to fetch.
  const [guest, setGuest] = useState<Guest | null>(null);
  const [reservation, setReservation] = useState<any | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // We'll manage 'loading' and 'error' as a composite of query states or manual overrides
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // ============ QUERIES ============

  // 1. All Guests Query
  const guestsQuery = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const res = await apiClient.get<{ guests: Guest[] }>(
        "/api/guests/get-all-guest"
      );
      return res.data.guests.map((g) => ({ ...g, room: g.room || null }));
    },
    enabled: !!user, // Only fetch if logged in
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });

  // 2. Guest Activity Report Query (Dependent on 'reportDate' state if we had it here)
  // The existing context exposes `fetchGuestActivityReport(date)`.
  // To verify 1:1 behavior, we'll store the 'reportDate' in state to trigger the query.
  const [reportDate, setReportDate] = useState<string | null>(null);
  const reportQuery = useQuery({
    queryKey: ["guestActivity", reportDate],
    queryFn: async () => {
      if (!reportDate) return null;
      const res = await apiClient.get<GuestActivityResponse>(
        `/api/guests/activity-by-date?date=${reportDate}`
      );
      return res.data;
    },
    enabled: !!reportDate,
  });

  // 3. Checked Out Range Query
  const [historyRange, setHistoryRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const historyQuery = useQuery({
    queryKey: ["checkedOutGuests", historyRange?.start, historyRange?.end],
    queryFn: async () => {
      if (!historyRange) return null;
      const res = await apiClient.get<{ data: CheckedOutGuest[] }>(
        `/api/guests/checked-out-by-range`,
        { params: { startDate: historyRange.start, endDate: historyRange.end } }
      );
      return res.data.data;
    },
    enabled: !!historyRange,
  });

  // ============ MUTATIONS ============

  const createGuestMutation = useMutation({
    mutationFn: (data: CreateGuestInput) =>
      apiClient.post("/api/guests/create-guest", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      // Also invalidate rooms if we had a RoomContext query, but that's separate.
      // We might need to invalidate 'guestActivity' or 'checkedOutGuests' too?
      // For now, main list is critical.
      queryClient.invalidateQueries({ queryKey: ["guestActivity"] });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Guest> }) =>
      apiClient.patch(`/api/guests/update-guest/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["guests"] });
      await queryClient.cancelQueries({ queryKey: ["guest", id] });

      const previousGuests = queryClient.getQueryData<Guest[]>(["guests"]);
      const previousGuestDetail = queryClient.getQueryData<Guest>(["guest", id]);

      // Optimistically update list
      queryClient.setQueryData<Guest[]>(["guests"], (old) => {
        return old
          ? old.map((g) => (g._id === id ? { ...g, ...data } : g))
          : [];
      });

      // Optimistically update detail view if active
      if (previousGuestDetail) {
        queryClient.setQueryData<Guest>(["guest", id], {
          ...previousGuestDetail,
          ...data,
        });
      }

      return { previousGuests, previousGuestDetail };
    },
    onError: (err, variables, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(["guests"], context.previousGuests);
      }
      if (context?.previousGuestDetail) {
        queryClient.setQueryData(["guest", variables.id], context.previousGuestDetail);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest", variables.id] });
    },
  });

  const checkoutGuestMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient
        .patch(`/api/guests/check-out-Guest/${id}/checkout`, {})
        .then((res) => res.data),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest", id] });
      queryClient.invalidateQueries({ queryKey: ["guestActivity"] });
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/guests/guests/${id}`),
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["guests"] });

      // Snapshot the previous value
      const previousGuests = queryClient.getQueryData<Guest[]>(["guests"]);

      // Optimistically update to the new value
      queryClient.setQueryData<Guest[]>(["guests"], (old) => {
        return old ? old.filter((g) => g._id !== id) : [];
      });

      // Return a context object with the snapshotted value
      return { previousGuests };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousGuests) {
        queryClient.setQueryData(["guests"], context.previousGuests);
      }
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });

  // ============ EXPOSED FUNCTIONS ============

  const fetchGuests = useCallback(async () => {
    // With RQ, we just ensure data is fresh.
    await queryClient.invalidateQueries({ queryKey: ["guests"] });
  }, [queryClient]);

  const fetchGuestsByCategory = useCallback(
    async (category: string) => {
      // This was an ad-hoc fetch that replaced the main list.
      // To support this with RQ, we'd need a separate state for filter or valid query param.
      // For backward compat, we'll do a manual fetch and update the cache artificially
      // OR mostly just setState if we were using local state.
      // BUT, since we are moving valid state to RQ, we should probably update the "guests" query data.
      // However, best practice is to have "guests" query depend on a filter.
      // For this migration, I will use a direct fetch to respect the imperative call,
      // but warn that it might desync from the "all guests" query.
      setManualLoading(true);
      try {
        const res = await apiClient.get<{ data: Guest[] }>(
          `/api/guests/get-guest-by-category?category=${encodeURIComponent(
            category
          )}`
        );
        // We manually update the 'guests' query data to show this filtered list
        queryClient.setQueryData(["guests"], res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setManualLoading(false);
      }
    },
    [queryClient]
  );

  const fetchGuestById = useCallback(
    async (id: string) => {
      setManualLoading(true);
      try {
        const res = await apiClient.get<{
          data: { guest: Guest; invoice: Invoice | null; reservation: any | null };
        }>(`/api/guests/get-Guest-By-Id/${id}`);

        const data = res.data.data;
        const processedGuest = {
          ...data.guest,
          room: data.guest.room || null,
        };

        setGuest(processedGuest);
        setInvoice(data.invoice);
        setReservation(data.reservation);
      } catch (err) {
        console.error(err);
        setManualError("Failed to fetch guest details");
        throw err;
      } finally {
        setManualLoading(false);
      }
    },
    []
  );

  const createGuest = useCallback(
    async (data: CreateGuestInput) => {
      await createGuestMutation.mutateAsync(data);
    },
    [createGuestMutation]
  );

  const updateGuest = useCallback(
    async (id: string, data: Partial<Guest>) => {
      await updateGuestMutation.mutateAsync({ id, data });
      // Refresh single guest view if open
      fetchGuestById(id);
    },
    [updateGuestMutation, fetchGuestById]
  );

  const checkoutGuest = useCallback(
    async (id: string) => {
      const result = await checkoutGuestMutation.mutateAsync(id);
      // Refresh single guest view if open
      fetchGuestById(id);
      return result;
    },
    [checkoutGuestMutation, fetchGuestById]
  );

  const deleteGuest = useCallback(
    async (id: string) => {
      await deleteGuestMutation.mutateAsync(id);
    },
    [deleteGuestMutation]
  );

  const fetchGuestActivityReport = useCallback(async (date: string) => {
    setReportDate(date);
    // The query will auto-run. We can await a refetch if we really want to wait for it.
    // But setting state triggers the effect. To make this function "awaitable" until data is ready
    // is tricky with just setState.
    // However, usually the UI sets this and waits for 'loading' state.
    // For now, we'll force a refetch if date matches, or let the key change handle it.
  }, []);

  const fetchCheckedOutByRange = useCallback(
    async (startDate: string, endDate: string) => {
      setHistoryRange({ start: startDate, end: endDate });
    },
    []
  );

  const downloadInvoicePdf = useCallback((invoiceId: string) => {
    window.open(`${API_BASE}/api/invoice/${invoiceId}/download`, "_blank");
  }, []);

  const sendInvoiceByEmail = useCallback(
    async (invoiceId: string) => {
      setManualLoading(true);
      try {
        await apiClient.post(`/api/invoice/${invoiceId}/send-email`, {});
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        setManualLoading(false);
      }
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      guests: guestsQuery.data || [],
      guest,
      reservation,
      invoice,
      loading:
        guestsQuery.isLoading ||
        reportQuery.isLoading ||
        historyQuery.isLoading ||
        manualLoading ||
        createGuestMutation.isPending ||
        updateGuestMutation.isPending ||
        checkoutGuestMutation.isPending ||
        deleteGuestMutation.isPending,
      error:
        (guestsQuery.error as any)?.message ||
        (reportQuery.error as any)?.message ||
        manualError,
      fetchGuests,
      fetchGuestsByCategory,
      fetchGuestById,
      createGuest,
      updateGuest,
      checkoutGuest,
      deleteGuest,
      downloadInvoicePdf,
      sendInvoiceByEmail,
      guestActivityReport: reportQuery.data || null,
      fetchGuestActivityReport,
      checkedOutByRange: historyQuery.data || null,
      fetchCheckedOutByRange,
    }),
    [
      guestsQuery.data,
      guestsQuery.isLoading,
      guestsQuery.error,
      guest,
      reservation,
      invoice,
      reportQuery.data,
      reportQuery.isLoading,
      reportQuery.error,
      historyQuery.data,
      historyQuery.isLoading,
      manualLoading,
      manualError,
      createGuestMutation.isPending,
      updateGuestMutation.isPending,
      checkoutGuestMutation.isPending,
      deleteGuestMutation.isPending,
      fetchGuests,
      fetchGuestsByCategory,
      fetchGuestById,
      createGuest,
      updateGuest,
      checkoutGuest,
      deleteGuest,
      downloadInvoicePdf,
      sendInvoiceByEmail,
      fetchGuestActivityReport,
      fetchCheckedOutByRange,
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
