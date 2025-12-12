import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";

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
  getTransactionsBySource: (
    sourceId: string,
    source: "reservation" | "guest"
  ) => Promise<Transaction[]>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = useCallback(async (data: TransactionPayload) => {
    setLoading(true);
    try {
      await apiClient.post("/api/transactions/add", data);
      // Optional: refresh list after add
      // await fetchTransactions();
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: Transaction[];
      }>("/api/transactions/get-transactions");
      setTransactions(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionsBySource = useCallback(
    async (sourceId: string, source: "reservation" | "guest") => {
      setLoading(true);
      try {
        const query =
          source === "reservation"
            ? `reservationId=${sourceId}`
            : `guestId=${sourceId}`;
        const res = await apiClient.get<{
          success: boolean;
          data: Transaction[];
        }>(`/api/transactions?${query}`);
        return res.data.data || [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <TransactionContext.Provider
      value={{
        loading,
        transactions,
        addTransaction,
        fetchTransactions,
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
