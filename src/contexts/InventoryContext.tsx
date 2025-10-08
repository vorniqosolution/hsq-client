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

// Create a configured Axios instance
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Type definitions
export interface InventoryCategory {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  category: InventoryCategory | string;
  unitPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  location?: string;
  defaultCheckInQty: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  unitPrice: any;
  itemName: ReactNode;
  _id: string;
  item: InventoryItem | string;
  room?: string;
  guest?: string;
  transactionType: "issue" | "return" | "adjustment" | "usage";
  quantity: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface CreateItemInput {
  name: string;
  category: string;
  unitPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  location?: string;
  defaultCheckInQty: number;
}

export interface CreateTransactionInput {
  item: string;
  room?: string;
  guest?: string;
  transactionType: "issue" | "return" | "adjustment" | "usage";
  quantity: number;
  reason?: string;
}

interface InventoryContextType {
  // Data states
  categories: InventoryCategory[];
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;

  // Computed values
  lowStockItems: InventoryItem[];
  totalInventoryValue: number;

  // CRUD - Categories
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryInput) => Promise<void>;
  updateCategory: (
    id: string,
    data: Partial<CreateCategoryInput>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // CRUD - Items
  fetchItems: () => Promise<void>;
  createItem: (data: CreateItemInput) => Promise<void>;
  updateItem: (id: string, data: Partial<CreateItemInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setDefaultCheckInQuantity: (
    itemId: string,
    quantity: number
  ) => Promise<void>;

  // Transactions
  fetchTransactions: () => Promise<void>;
  createTransaction: (data: CreateTransactionInput) => Promise<void>;
  getTransactionsForRoom: (roomId: string) => Promise<InventoryTransaction[]>;
  getTransactionsForGuest: (guestId: string) => Promise<InventoryTransaction[]>;

  // Room Integration
  handleRoomCheckin: (roomId: string, guestId: string) => Promise<void>;
  handleRoomCheckout: (roomId: string, guestId: string) => Promise<void>;

  // Utility
  refreshData: () => Promise<void>;
  getFilteredItems: () => InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  // State
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
        // Extract detailed error message if available
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

  // Category APIs
  const fetchCategories = useCallback(async () => {
    await apiCall(
      async () => {
        const response = await apiClient.get<{ data: InventoryCategory[] }>(
          "/api/inventory/get-categories"
        );
        return response.data.data;
      },
      (data) => setCategories(data),
      "Failed to fetch inventory categories"
    );
  }, [apiCall]);

  const createCategory = useCallback(
    async (data: CreateCategoryInput) => {
      await apiCall(
        async () => {
          const response = await apiClient.post<{ data: InventoryCategory }>(
            "/api/inventory/create-category",
            data
          );
          return response.data.data;
        },
        (newCategory) => {
          setCategories((prev) => [...prev, newCategory]);
        },
        "Failed to create inventory category"
      );
    },
    [apiCall]
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<CreateCategoryInput>) => {
      await apiCall(
        async () => {
          const response = await apiClient.put<{ data: InventoryCategory }>(
            `/api/inventory/update-category/${id}`,
            data
          );
          return response.data.data;
        },
        (updatedCategory) => {
          setCategories((prev) =>
            prev.map((cat) => (cat._id === id ? updatedCategory : cat))
          );
        },
        "Failed to update inventory category"
      );
    },
    [apiCall]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await apiCall(
        async () => {
          await apiClient.delete(`/api/inventory/delete-category/${id}`);
        },
        () => {
          // Optimistic UI update
          setCategories((prev) => prev.filter((cat) => cat._id !== id));
        },
        "Failed to delete inventory category"
      );
    },
    [apiCall]
  );

  // Item APIs
  const fetchItems = useCallback(async () => {
    await apiCall(
      async () => {
        const response = await apiClient.get<{ data: InventoryItem[] }>(
          "/api/inventory/get-items"
        );
        return response.data.data;
      },
      (data) => setItems(data),
      "Failed to fetch inventory items"
    );
  }, [apiCall]);

  const createItem = useCallback(
    async (data: CreateItemInput) => {
      await apiCall(
        async () => {
          const response = await apiClient.post<{ data: InventoryItem }>(
            "/api/inventory/create-item",
            data
          );
          return response.data.data;
        },
        (newItem) => {
          setItems((prev) => [...prev, newItem]);
        },
        "Failed to create inventory item"
      );
    },
    [apiCall]
  );

  const updateItem = useCallback(
    async (id: string, data: Partial<CreateItemInput>) => {
      await apiCall(
        async () => {
          const response = await apiClient.put<{ data: InventoryItem }>(
            `/api/inventory/update-item/${id}`,
            data
          );
          return response.data.data;
        },
        (updatedItem) => {
          setItems((prev) =>
            prev.map((item) => (item._id === id ? updatedItem : item))
          );
        },
        "Failed to update inventory item"
      );
    },
    [apiCall]
  );

  // Special function to set default check-in quantity
  const setDefaultCheckInQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      await apiCall(
        async () => {
          const response = await apiClient.patch<{ data: InventoryItem }>(
            `/api/inventory/set-default-quantity/${itemId}`,
            { defaultCheckInQty: quantity }
          );
          return response.data.data;
        },
        (updatedItem) => {
          // Update the item in our local state
          setItems((prev) =>
            prev.map((item) => (item._id === itemId ? updatedItem : item))
          );
        },
        "Failed to set default check-in quantity"
      );
    },
    [apiCall]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await apiCall(
        async () => {
          await apiClient.delete(`/api/inventory/delete-item/${id}`);
        },
        () => {
          // Optimistic UI update
          setItems((prev) => prev.filter((item) => item._id !== id));
        },
        "Failed to delete inventory item"
      );
    },
    [apiCall]
  );

  // Transaction APIs
  const fetchTransactions = useCallback(async () => {
    await apiCall(
      async () => {
        const response = await apiClient.get<{ data: InventoryTransaction[] }>(
          "/api/inventory/get-transactions"
        );
        return response.data.data;
      },
      (data) => setTransactions(data),
      "Failed to fetch inventory transactions"
    );
  }, [apiCall]);

  const createTransaction = useCallback(
    async (data: CreateTransactionInput) => {
      await apiCall(
        async () => {
          const response = await apiClient.post<{ data: InventoryTransaction }>(
            "/api/inventory/create-transaction",
            data
          );
          return response.data.data;
        },
        (newTransaction) => {
          setTransactions((prev) => [...prev, newTransaction]);

          // Update item quantity based on transaction type
          const itemId = data.item;
          const quantity = data.quantity;

          setItems((prev) =>
            prev.map((item) => {
              if (item._id === itemId) {
                const quantityChange =
                  data.transactionType === "issue" ||
                  data.transactionType === "usage"
                    ? -quantity
                    : quantity;

                return {
                  ...item,
                  quantityOnHand: item.quantityOnHand + quantityChange,
                };
              }
              return item;
            })
          );
        },
        "Failed to create inventory transaction"
      );
    },
    [apiCall]
  );

  const getTransactionsForRoom = useCallback(
    async (roomId: string) => {
      return await apiCall(
        async () => {
          const response = await apiClient.get<{
            data: InventoryTransaction[];
          }>(`/api/inventory/get-transactions?room=${roomId}`);
          return response.data.data;
        },
        undefined,
        `Failed to fetch transactions for room ${roomId}`
      );
    },
    [apiCall]
  );

  const getTransactionsForGuest = useCallback(
    async (guestId: string) => {
      return await apiCall(
        async () => {
          const response = await apiClient.get<{
            data: InventoryTransaction[];
          }>(`/api/inventory/get-transactions?guest=${guestId}`);
          return response.data.data;
        },
        undefined,
        `Failed to fetch transactions for guest ${guestId}`
      );
    },
    [apiCall]
  );

  // Room Integration Functions
  const handleRoomCheckin = useCallback(
    async (roomId: string, guestId: string) => {
      await apiCall(
        async () => {
          await apiClient.post("/api/inventory/checkin", { roomId, guestId });
        },
        async () => {
          // Refresh transactions and items after check-in
          await Promise.all([fetchTransactions(), fetchItems()]);
        },
        "Failed to process room check-in inventory"
      );
    },
    [apiCall, fetchTransactions, fetchItems]
  );

  const handleRoomCheckout = useCallback(
    async (roomId: string, guestId: string) => {
      await apiCall(
        async () => {
          await apiClient.post("/api/inventory/checkout", { roomId, guestId });
        },
        async () => {
          // Refresh transactions and items after check-out
          await Promise.all([fetchTransactions(), fetchItems()]);
        },
        "Failed to process room check-out inventory"
      );
    },
    [apiCall, fetchTransactions, fetchItems]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCategories(), fetchItems(), fetchTransactions()]);
    } catch (err) {
      console.error("Error refreshing inventory data:", err);
      setError("Failed to refresh inventory data");
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchItems, fetchTransactions]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      // ← run only once `user` exists
      refreshData();
    }
  }, [refreshData, user]);

  // Computed values
  const lowStockItems = useMemo(
    () => items.filter((item) => item.quantityOnHand <= item.reorderLevel),
    [items]
  );

  const totalInventoryValue = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantityOnHand * item.unitPrice,
        0
      ),
    [items]
  );

  // Filtered items based on search query and category filter
  const getFilteredItems = useCallback(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item._id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" ||
        (typeof item.category === "object"
          ? item.category.name === categoryFilter
          : item.category === categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Data
      categories,
      items,
      transactions,
      loading,
      error,

      // Filters
      searchQuery,
      setSearchQuery,
      categoryFilter,
      setCategoryFilter,

      // Computed values
      lowStockItems,
      totalInventoryValue,

      // CRUD - Categories
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,

      // CRUD - Items
      fetchItems,
      createItem,
      updateItem,
      deleteItem,
      setDefaultCheckInQuantity,

      // Transactions
      fetchTransactions,
      createTransaction,
      getTransactionsForRoom,
      getTransactionsForGuest,

      // Room Integration
      handleRoomCheckin,
      handleRoomCheckout,

      // Utility
      refreshData,
      getFilteredItems,
    }),
    [
      categories,
      items,
      transactions,
      loading,
      error,
      searchQuery,
      setSearchQuery,
      categoryFilter,
      setCategoryFilter,
      lowStockItems,
      totalInventoryValue,
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      fetchItems,
      createItem,
      updateItem,
      deleteItem,
      setDefaultCheckInQuantity,
      fetchTransactions,
      createTransaction,
      getTransactionsForRoom,
      getTransactionsForGuest,
      handleRoomCheckin,
      handleRoomCheckout,
      refreshData,
      getFilteredItems,
    ]
  );

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

// Custom hook for using the context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
