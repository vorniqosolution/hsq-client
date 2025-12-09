import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";

// Data shape for sending money
interface TransactionPayload {
  reservationId?: string;
  guestId?: string;
  amount: number;
  type: "advance" | "payment" | "refund";
  paymentMethod: string;
  description?: string;
}

// Data shape for receiving history (Optional, for Ledger view)
interface TransactionRecord {
  _id: string;
  amount: number;
  type: string;
  paymentMethod: string;
  createdAt: string;
  // ... other fields
}

interface TransactionContextType {
  addTransaction: (data: TransactionPayload) => Promise<void>;
  getTransactions: (sourceId: string, source: "reservation" | "guest") => Promise<TransactionRecord[]>;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransaction must be used within TransactionProvider");
  return context;
};

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  // 1. Add Money (Advance or Settlement)
  const addTransaction = async (data: TransactionPayload) => {
    setLoading(true);
    try {
      // We don't need headers; cookies are sent automatically via withCredentials=true
      await axios.post("/api/transactions/add", data);
    } catch (error: any) {
      console.error("Transaction failed", error);
      const msg = error.response?.data?.message || "Payment failed";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Get History (for Ledger Tables)
  const getTransactions = async (sourceId: string, source: "reservation" | "guest") => {
    setLoading(true);
    try {
      const query = source === "reservation" ? `reservationId=${sourceId}` : `guestId=${sourceId}`;
      const { data } = await axios.get(`/api/transactions?${query}`);
      return data.data; // Assuming backend returns { success: true, data: [...] }
    } catch (error: any) {
      console.error("Fetch history failed", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return (
    <TransactionContext.Provider value={{ addTransaction, getTransactions, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};