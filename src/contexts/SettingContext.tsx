import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SystemAlert {
  message: string;
  isActive: boolean;
  type: "info" | "warning" | "error";
}

export interface Settings {
  _id: string;
  taxRate: number;
  currencySymbol: string;
  hotelName: string;
  systemAlert?: SystemAlert;
}

interface SettingContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingContext = createContext<SettingContextType | undefined>(undefined);

export const SettingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const output = await axios.get(`${BASE_URL}/api/tax/get-all-gst`, {
        withCredentials: true,
      });
      if (output.data.success) {
        setSettings(output.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const payload = { ...settings, ...newSettings };
      // Optimistic update
      setSettings(payload as Settings);

      const response = await axios.put(
        `${BASE_URL}/api/tax/update-setting`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSettings(response.data.data);
        toast({
          title: "Success",
          description: "Settings updated successfully",
        });
      }
    } catch (err: any) {
      console.error("Error updating settings:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update settings",
      });
      // Revert optimization on error
      fetchSettings();
    }
  };

  return (
    <SettingContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingContext.Provider>
  );
};

export const useSetting = () => {
  const context = useContext(SettingContext);
  if (context === undefined) {
    throw new Error("useSetting must be used within a SettingProvider");
  }
  return context;
};

export default SettingContext;
