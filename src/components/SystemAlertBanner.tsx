import React from "react";
import { AlertCircle, Info, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSetting } from "@/contexts/SettingContext";

const SystemAlertBanner = () => {
  const { settings, loading } = useSetting();

  if (loading || !settings || !settings.systemAlert || !settings.systemAlert.isActive) {
    return null;
  }

  const { message, type } = settings.systemAlert;

  const getVariant = () => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        // ui/alert doesn't have warning by default, use default or custom
        return "default"; 
      default:
        return "default";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBgClass = () => {
      switch (type) {
          case 'error': return 'bg-red-50 border-red-200 text-red-800';
          case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
          default: return 'bg-blue-50 border-blue-200 text-blue-800';
      }
  }

  return (
    <div className={`w-full px-4 py-3 border-b flex items-center justify-center gap-2 ${getBgClass()}`}>
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default SystemAlertBanner;
