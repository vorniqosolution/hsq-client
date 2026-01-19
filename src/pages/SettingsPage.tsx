import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  LockKeyhole,
  AlertTriangle,
  Banknote,
  Calendar,
  ShieldCheck,
  UserCog,
  Save,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSetting, SystemAlert } from "@/contexts/SettingContext";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Receptionist = {
  _id: string;
  name: string;
  email: string;
  role: string;
  message: string;
};

// function for check strong password
function getPasswordStrength(password: string) {
  if (password.length > 8 && /[A-Z]/.test(password) && /\d/.test(password)) {
    return "Strong";
  }
  if (password.length > 5) {
    return "Medium";
  }
  return "Weak";
}

const SystemAlertSettings = () => {
  const { settings, updateSettings, loading } = useSetting();
  const [formData, setFormData] = useState<SystemAlert>({
    message: "",
    isActive: false,
    type: "info",
  });
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasInitialized = React.useRef(false);

  // Only sync from server on initial load, not during/after saves
  useEffect(() => {
    if (settings?.systemAlert && !hasInitialized.current) {
      setFormData(settings.systemAlert);
      hasInitialized.current = true;
    }
  }, [settings]);

  const handleChange = (key: keyof SystemAlert, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setIsChanged(true);
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ systemAlert: formData });
      setIsChanged(false);
      toast({
        title: "Settings Saved",
        description: "System alert configuration updated successfully.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !hasInitialized.current) return <div className="p-4 text-sm text-slate-500">Loading settings...</div>;

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${formData.isActive ? 'text-amber-500' : 'text-slate-400'}`} />
              System Maintenance Alert
            </CardTitle>
            <CardDescription>
              Display a global banner message to all users
            </CardDescription>
          </div>
          <Switch
            id="alert-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleChange("isActive", checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase text-slate-500">Alert Style</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => handleChange("type", val)}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Information (Blue)</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Warning (Orange)</span>
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Critical (Red)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-message" className="text-xs font-medium uppercase text-slate-500">
              Banner Message
            </Label>
            <Textarea
              id="alert-message"
              placeholder="e.g. System maintenance scheduled from 2 AM to 4 AM..."
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className="min-h-[80px] bg-slate-50 border-slate-200 resize-none focus-visible:ring-amber-500"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/50 border-t py-3 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          size="sm"
          className={isChanged ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
          variant={isChanged ? "default" : "outline"}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const MattressRateSettings = () => {
  const { settings, updateSettings, loading } = useSetting();
  const [rate, setRate] = useState<number>(1500);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.mattressRate !== undefined) {
      setRate(settings.mattressRate);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({ mattressRate: rate });
    setIsChanged(false);
    setIsSaving(false);
    toast({
      title: "Rate Updated",
      description: "Mattress charges updated successfully.",
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200 h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-600" />
          Extra Mattress Charges
        </CardTitle>
        <CardDescription>
          Set the default fee for additional bedding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mattress-rate" className="text-xs font-medium uppercase text-slate-500">
            Rate per Night
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rs.</span>
            <Input
              id="mattress-rate"
              type="number"
              min="0"
              value={rate}
              onChange={(e) => {
                setRate(Number(e.target.value) || 0);
                setIsChanged(true);
              }}
              className="pl-9 bg-slate-50 border-slate-200 text-lg font-medium"
              placeholder="1500"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/50 border-t py-3 flex justify-end mt-auto">
        <Button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          size="sm"
          className={isChanged ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          variant={isChanged ? "default" : "outline"}
        >
          {isSaving ? "Saving..." : "Update Rate"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const months = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const SeasonSettings = () => {
  const { settings, updateSettings, loading } = useSetting();
  const [config, setConfig] = useState({
    summer: { startMonth: 5, endMonth: 7 },
    winter: { startMonth: 11, endMonth: 0 },
  });
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.seasonConfig) {
      setConfig(settings.seasonConfig);
    }
  }, [settings]);

  const handleChange = (season: "summer" | "winter", field: "startMonth" | "endMonth", value: string) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        [season]: {
          ...prev[season],
          [field]: parseInt(value)
        }
      };
      setIsChanged(true);
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({ seasonConfig: config });
    setIsChanged(false);
    setIsSaving(false);
    toast({
      title: "Seasons Configured",
      description: "Seasonal timeline settings have been saved.",
    });
  };

  if (loading) return null;

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Season Configuration
        </CardTitle>
        <CardDescription>
          Define the months for Summer and Winter seasons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summer */}
          <div className="space-y-3 p-4 bg-amber-50/50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <Label className="font-semibold text-amber-900">Summer Season</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-700/60">Starts</span>
                <Select
                  value={config.summer.startMonth.toString()}
                  onValueChange={(val) => handleChange("summer", "startMonth", val)}
                >
                  <SelectTrigger className="border-amber-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={`s-start-${m.value}`} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-700/60">Ends</span>
                <Select
                  value={config.summer.endMonth.toString()}
                  onValueChange={(val) => handleChange("summer", "endMonth", val)}
                >
                  <SelectTrigger className="border-amber-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={`s-end-${m.value}`} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Winter */}
          <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <Label className="font-semibold text-blue-900">Winter Season</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-blue-700/60">Starts</span>
                <Select
                  value={config.winter.startMonth.toString()}
                  onValueChange={(val) => handleChange("winter", "startMonth", val)}
                >
                  <SelectTrigger className="border-blue-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={`w-start-${m.value}`} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-blue-700/60">Ends</span>
                <Select
                  value={config.winter.endMonth.toString()}
                  onValueChange={(val) => handleChange("winter", "endMonth", val)}
                >
                  <SelectTrigger className="border-blue-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={`w-end-${m.value}`} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/50 border-t py-3 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          size="sm"
          className={isChanged ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
          variant={isChanged ? "default" : "outline"}
        >
          {isSaving ? "Saving..." : "Save Season Config"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function SettingsPage() {
  // Admin password
  const [adminPassword, setAdminPassword] = useState("");
  const [adminprevPassword, setadminprevPassword] = useState("");
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  //Show Receptionist
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);

  // Receptionist password
  const [selectedRecep, setSelectedRecep] = useState<Receptionist | null>(null);
  const [recepPassword, setRecepPassword] = useState("");
  const [recepPasswordLoading, setRecepPasswordLoading] = useState(false);
  const [showRecepPassword, setShowRecepPassword] = useState(false);


  // Delete confirmation
  const [deleteRecep, setDeleteRecep] = useState<Receptionist | null>(null);

  // HandleGetALLReceptionists my changes
  useEffect(() => {
    const HandleGetALLReceptionists = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/admin/view-receptionist`,
          { withCredentials: true }
        );
        setReceptionists(response.data.data);
      } catch (err: any) {
        toast({
          variant: "destructive",
          description: err.response?.data?.message || "Failed to load receptionists",
        });
      }
    };

    HandleGetALLReceptionists();
  }, []);

  // Admin updatepassword my change
  const Handle_Admin_Update_Password = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!adminPassword || !adminprevPassword) {
        toast({
          variant: "destructive",
          description: "Please enter complete details",
        });
        return;
      }
      setAdminPasswordLoading(true);
      const response = await axios.post(
        `${BASE_URL}/api/admin/updatepassword`,
        {
          prevpassword: adminprevPassword,
          newpassword: adminPassword,
        },
        { withCredentials: true }
      );
      toast({
        title: "Success",
        description: response.data.message,
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      });

      setAdminPassword("");
      setadminprevPassword("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.response?.data?.message || "An error occurred",
      });
      setAdminPassword("");
      setadminprevPassword("");
    } finally {
      setAdminPasswordLoading(false);
    }
  };

  // HandleRecepPassword
  const handleRecepPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRecepPasswordLoading(true);
      const response = await axios.post(
        `${BASE_URL}/api/admin/update-receptionist-password/${selectedRecep?._id}`,
        {
          newPassword: recepPassword,
        },
        { withCredentials: true }
      );
      setRecepPassword("");

      toast({
        title: "Password Updated",
        description: response.data.message,
      });
      setSelectedRecep(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        description: err.response?.data?.message || "Failed to update password",
      });
      setRecepPassword("");
    } finally {
      setRecepPasswordLoading(false);
    }
  };

  // HandleDeleteRecep
  const handleDeleteRecep = async (id?: string) => {
    if (!id) return;
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/admin/delete-receptionist/${id}`,
        { withCredentials: true }
      );
      toast({
        title: "Receptionist Deleted",
        description: response.data.message,
      });
      // Update local state
      setReceptionists(prev => prev.filter(r => r._id !== id));
      setDeleteRecep(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.response?.data?.message || "An error occurred",
      });
    }
  };

  return (
    <div className="h-full bg-slate-50/50">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">

            <div className="mb-8">
              <h1 className="text-3xl font-light text-slate-900 tracking-wide flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-amber-500" />
                System Settings
              </h1>
              <p className="text-slate-500 mt-2 font-light">
                Manage operational configurations and access control
              </p>
            </div>

            <Tabs defaultValue="general" className="w-full space-y-6">
              <TabsList className="bg-white border p-1 h-12 rounded-lg shadow-sm">
                <TabsTrigger value="general" className="flex-1 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 h-10 rounded-md">
                  General Config
                </TabsTrigger>
                <TabsTrigger value="accounts" className="flex-1 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 h-10 rounded-md">
                  Security & Team
                </TabsTrigger>
              </TabsList>

              {/* GENERAL SETTINGS TAB */}
              <TabsContent value="general" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <SeasonSettings />
                    <SystemAlertSettings />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <MattressRateSettings />
                    {/* Placeholder for future sidebar widgets if needed */}
                  </div>
                </div>
              </TabsContent>

              {/* ACCOUNTS SETTINGS TAB */}
              <TabsContent value="accounts" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Admin Profile */}
                  <div className="lg:col-span-1">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 sticky top-6">
                      <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Admin Security
                        </CardTitle>
                        <CardDescription>
                          Update your main administrator password
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <form onSubmit={Handle_Admin_Update_Password} className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="prev-admin-password">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="prev-admin-password"
                                type={showAdminPassword ? "text" : "password"}
                                value={adminprevPassword}
                                onChange={(e) => setadminprevPassword(e.target.value)}
                                required
                                className="pr-10 bg-slate-50"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowAdminPassword((v) => !v)}
                              >
                                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-password">New Password</Label>
                            <div className="relative">
                              <Input
                                id="admin-password"
                                type={showAdminPassword ? "text" : "password"}
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                required
                                className="pr-10 bg-slate-50"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowAdminPassword((v) => !v)}
                              >
                                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {adminPassword && (
                              <div className="text-xs pt-1">
                                <span className={`font-medium ${getPasswordStrength(adminPassword) === "Strong" ? "text-emerald-600" :
                                    getPasswordStrength(adminPassword) === "Medium" ? "text-amber-600" : "text-red-600"
                                  }`}>
                                  {getPasswordStrength(adminPassword)} Strength
                                </span>
                              </div>
                            )}
                          </div>
                          <Button type="submit" disabled={adminPasswordLoading} className="w-full">
                            {adminPasswordLoading ? "Updating..." : "Update Password"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Team Management */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <UserCog className="w-5 h-5 text-blue-600" />
                            Team Management
                          </CardTitle>
                          <CardDescription>
                            Manage receptionists account access
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                          {receptionists.length} User{receptionists.length !== 1 ? 's' : ''}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[40%]">Name</TableHead>
                                <TableHead className="w-[40%]">Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {receptionists.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                                    No receptionists found.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                receptionists.map((data) => (
                                  <TableRow key={data._id}>
                                    <TableCell className="font-medium">{data.name}</TableCell>
                                    <TableCell className="text-slate-500">{data.email}</TableCell>
                                    <TableCell className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRecep(data)}
                                        className="h-8 px-2 text-slate-500 hover:text-blue-600 hover:border-blue-200"
                                        title="Reset Password"
                                      >
                                        <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteRecep(data)}
                                        className="h-8 px-2 text-slate-500 hover:text-red-600 hover:border-red-200"
                                        title="Remove Account"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>


            {/* Update Receptionist Password Dialog */}
            <Dialog open={!!selectedRecep} onOpenChange={(open) => !open && setSelectedRecep(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Set a new password for <span className="font-medium text-slate-900">{selectedRecep?.name}</span>
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRecepPasswordUpdate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recep-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="recep-password"
                        type={showRecepPassword ? "text" : "password"}
                        value={recepPassword}
                        onChange={(e) => setRecepPassword(e.target.value)}
                        required
                        className="pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowRecepPassword((v) => !v)}
                      >
                        {showRecepPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setSelectedRecep(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={recepPasswordLoading}>
                      {recepPasswordLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Receptionist Dialog */}
            <Dialog open={!!deleteRecep} onOpenChange={(open) => !open && setDeleteRecep(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Delete Account
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete <span className="font-bold text-slate-900">{deleteRecep?.name}</span>? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2">
                  <p className="text-xs text-red-800">
                    This will permanently remove the receptionist's access to the system.
                  </p>
                </div>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setDeleteRecep(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteRecep(deleteRecep?._id)}
                  >
                    Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
  );
}
