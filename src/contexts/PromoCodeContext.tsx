import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from "react";
import axios, { AxiosError, AxiosInstance } from "axios";
import { useAuth } from "@/contexts/AuthContext";

// Axios client setup
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

export interface PromoCode {
    _id: string;
    code: string;
    percentage: number;
    startDate: string;
    endDate: string;
    status: "active" | "inactive";
    usageCount: number;
    createdBy?: string;
}

export interface CreatePromoInput {
    code: string;
    percentage: number;
    startDate: string;
    endDate: string;
}

interface PromoCodeContextType {
    promoCodes: PromoCode[];
    loading: boolean;
    error: string | null;
    fetchPromoCodes: () => Promise<void>;
    createPromoCode: (data: CreatePromoInput) => Promise<void>;
    updatePromoStatus: (id: string, status: "active" | "inactive") => Promise<void>;
    validatePromoCode: (code: string) => Promise<{ isValid: boolean; percentage?: number; message?: string }>;
}

const PromoCodeContext = createContext<PromoCodeContextType | undefined>(undefined);

export const PromoCodeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
                    message = err.response?.data?.message || err.message || errorMessage;
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

    const fetchPromoCodes = useCallback(async () => {
        await apiCall(
            async () => {
                const res = await apiClient.get<any>("/api/promocodes/all");
                return res.data.data;
            },
            setPromoCodes,
            "Failed to fetch promo codes"
        );
    }, [apiCall]);

    const createPromoCode = useCallback(async (data: CreatePromoInput) => {
        await apiCall(
            async () => {
                await apiClient.post("/api/promocodes/create", data);
            },
            async () => {
                await fetchPromoCodes();
            },
            "Failed to create promo code"
        );
    }, [apiCall, fetchPromoCodes]);

    const updatePromoStatus = useCallback(async (id: string, status: "active" | "inactive") => {
        await apiCall(
            async () => {
                await apiClient.put(`/api/promocodes/status/${id}`, { status });
            },
            async () => {
                await fetchPromoCodes();
            },
            "Failed to update promo status"
        );
    }, [apiCall, fetchPromoCodes]);

    const validatePromoCode = useCallback(async (code: string): Promise<{ isValid: boolean; percentage?: number; message?: string }> => {
        try {
            // API returns { success: true, data: { code, percentage, ... } }
            const res = await apiClient.get<{ success: boolean; data?: PromoCode; message?: string }>(
                `/api/promocodes/validate/${code}`
            );
            if (res.data.success && res.data.data) {
                return { isValid: true, percentage: res.data.data.percentage };
            }
            return { isValid: false, message: res.data.message || "Invalid promo code" };
        } catch (err) {
            // Should return logic structure even if failed
            if (axios.isAxiosError(err) && err.response) {
                return { isValid: false, message: err.response.data.message || "Invalid promo code" };
            }
            return { isValid: false, message: "Error validating promo code" };
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchPromoCodes();
        }
    }, [fetchPromoCodes, user]);

    const value = useMemo(
        () => ({
            promoCodes,
            loading,
            error,
            fetchPromoCodes,
            createPromoCode,
            updatePromoStatus,
            validatePromoCode
        }),
        [promoCodes, loading, error, fetchPromoCodes, createPromoCode, updatePromoStatus, validatePromoCode]
    );

    return (
        <PromoCodeContext.Provider value={value}>
            {children}
        </PromoCodeContext.Provider>
    );
};

export const usePromoCodeContext = () => {
    const context = useContext(PromoCodeContext);
    if (!context)
        throw new Error("usePromoCodeContext must be used within PromoCodeProvider");
    return context;
};
