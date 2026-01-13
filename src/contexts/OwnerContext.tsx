
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Owner {
    _id: string;
    fullName: string;
    cardId: string;
    cnic?: string;
    phone?: string;
    email?: string;
    apartmentNumber: string;
    assignedRoom?: {
        _id: string;
        roomNumber: string;
        category: string;
    };
    agreementStartDate?: string;
    agreementEndDate?: string;
    seasonLimits: {
        summerWeekend: number;
        summerWeekday: number;
        winterWeekend: number;
        winterWeekday: number;
        totalSeasonLimit: number;
    };
}

export interface OwnerAttendanceLog {
    _id: string;
    date: string;
    amountCharged: number;
    markedBy: string;
}

export interface OwnerUsage {
    totalDaysUsed: number;
    remainingDays: number;
    limit: number;
    isOverStay: boolean;
    isTodayMarked: boolean;
    currentSeason?: "summer" | "winter" | "none";
    breakdown?: {
        weekendUsed: number;
        weekdayUsed: number;
        season: string;
    };
}

interface OwnerContextType {
    currentOwner: Owner | null;
    usageStats: OwnerUsage | null;
    recentLogs: OwnerAttendanceLog[];
    loading: boolean;

    // Actions
    searchOwner: (cardId: string) => Promise<boolean>;
    markAttendance: (cardId: string, amountCharged?: number) => Promise<boolean>;
    createOwner: (data: any) => Promise<boolean>;
    updateOwner: (id: string, data: any) => Promise<boolean>;
    deleteOwner: (id: string) => Promise<boolean>;
    clearOwner: () => void;

    // Management
    owners: Owner[];
    fetchOwners: () => Promise<void>;
    getOwnerTimeline: (id: string) => Promise<any>;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export const OwnerProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
    const [usageStats, setUsageStats] = useState<OwnerUsage | null>(null);
    const [recentLogs, setRecentLogs] = useState<OwnerAttendanceLog[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const clearOwner = () => {
        setCurrentOwner(null);
        setUsageStats(null);
        setRecentLogs([]);
    };

    const searchOwner = async (cardId: string) => {
        setLoading(true);
        clearOwner();
        try {
            const res = await axios.get(`${API_BASE}/api/owners/scan/${cardId}`, {
                withCredentials: true,
            });

            if (res.data.success) {
                setCurrentOwner(res.data.owner);
                setUsageStats(res.data.usage);
                setRecentLogs(res.data.recentLogs);
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("Search owner error:", err);
            toast.error(err.response?.data?.message || "Owner not found");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (cardId: string, amountCharged: number = 0) => {
        setLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE}/api/owners/mark-attendance`,
                { cardId, amountCharged },
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success("Attendance marked successfully");
                if (res.data.isOverStay) {
                    toast.warning("Notice: This owner has exceeded their allowed days.");
                }
                // Refresh the data
                await searchOwner(cardId);
                return true;
            }
            return false;
        } catch (err: any) {
            console.error("Mark attendance error:", err);
            toast.error(err.response?.data?.message || "Failed to mark attendance");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/owners/get-all-owners`, {
                withCredentials: true
            });
            if (res.data.success) {
                setOwners(res.data.owners);
            }
        } catch (err: any) {
            console.error("Fetch owners error:", err);
            toast.error("Failed to fetch owners list");
        } finally {
            setLoading(false);
        }
    };

    const createOwner = async (data: any) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/owners/create`, data, {
                withCredentials: true
            });
            toast.success("Owner created successfully");
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create owner");
            return false;
        } finally {
            setLoading(false);
        }
    }

    const updateOwner = async (id: string, data: any) => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE}/api/owners/update/${id}`, data, {
                withCredentials: true
            });
            toast.success("Owner updated successfully");
            await fetchOwners(); // Refresh list
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update owner");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteOwner = async (id: string) => {
        setLoading(true);
        try {
            await axios.delete(`${API_BASE}/api/owners/delete/${id}`, {
                withCredentials: true
            });
            toast.success("Owner deleted successfully");
            await fetchOwners(); // Refresh list
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete owner");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getOwnerTimeline = async (id: string) => {
        try {
            const res = await axios.get(`${API_BASE}/api/owners/timeline/${id}`, {
                withCredentials: true
            });
            return res.data;
        } catch (err: any) {
            console.error("Fetch timeline error:", err);
            toast.error("Failed to fetch timeline");
            return null;
        }
    };

    const contextValue = {
        currentOwner,
        usageStats,
        recentLogs,
        loading,
        searchOwner,
        markAttendance,
        createOwner,
        updateOwner,
        deleteOwner,
        clearOwner,
        owners,
        fetchOwners,
        getOwnerTimeline
    };

    return (
        <OwnerContext.Provider value={contextValue}>{children}</OwnerContext.Provider>
    );
};

export const useOwnerContext = () => {
    const context = useContext(OwnerContext);
    if (!context) {
        throw new Error("useOwnerContext must be used within an OwnerProvider");
    }
    return context;
};
