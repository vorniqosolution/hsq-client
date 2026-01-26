import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export type TransactionType =
  | "advance"
  | "payment"
  | "refund"
  | "security_deposit";

export interface Transaction {
  _id: string;
  reservation?: any | null; // can refine later
  guest?: any | null;
  amount: number;
  type: TransactionType;
  paymentMethod: "Cash" | "Card" | "Online" | "PayAtHotel";
  description?: string;
  recordedBy?: { _id: string; name: string } | string;
  createdAt: string;
}

interface TransactionPayload {
  reservationId?: string;
  guestId?: string;
  amount: number;
  type: TransactionType | "advance" | "payment" | "refund";
  paymentMethod: string;
  description?: string;
}

interface TransactionContextType {
  loading: boolean;
  transactions: Transaction[];
  addTransaction: (data: TransactionPayload) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsBySource: (
    sourceId: string,
    source: "reservation" | "guest",
  ) => Promise<Transaction[]>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined,
);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // 1. Fetch Transactions (useQuery)
  const {
    data: transactions = [],
    isLoading: loading,
    refetch: fetchTransactions,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: Transaction[];
      }>("/api/transactions/get-transactions");
      return res.data.data || [];
    },
  });

  // 2. Add Transaction (useMutation)
  const addMutation = useMutation({
    mutationFn: async (data: TransactionPayload) => {
      await apiClient.post("/api/transactions/add", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const addTransaction = async (data: TransactionPayload) => {
    await addMutation.mutateAsync(data);
  };

  // 3. Delete Transaction with Optimistic Updates
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/transactions/${id}`);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["transactions"] });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData<Transaction[]>([
        "transactions",
      ]);

      // Optimistically update to remove the item
      queryClient.setQueryData<Transaction[]>(["transactions"], (old) =>
        old ? old.filter((tx) => tx._id !== id) : [],
      );

      // Return a context object with the snapshot
      return { previousTransactions };
    },
    onError: (_err, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          ["transactions"],
          context.previousTransactions,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteTransaction = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const getTransactionsBySource = useCallback(
    async (sourceId: string, source: "reservation" | "guest") => {
      const query =
        source === "reservation"
          ? `reservationId=${sourceId}`
          : `guestId=${sourceId}`;
      const res = await apiClient.get<{
        success: boolean;
        data: Transaction[];
      }>(`/api/transactions?${query}`);
      return res.data.data || [];
    },
    [],
  );

  return (
    <TransactionContext.Provider
      value={{
        loading,
        transactions,
        addTransaction,
        fetchTransactions: async () => {
          await fetchTransactions();
        },
        deleteTransaction,
        getTransactionsBySource,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx)
    throw new Error("useTransaction must be used within TransactionProvider");
  return ctx;
};
