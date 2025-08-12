import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
type Receptionist = {
  _id: string;
  name: string;
  email: string;
  role: string;
  message: string;
};

type UpdatePassword = {
  message: string;
};
const dummyReceptionists: Receptionist[] = [
  // { id: "1", name: "Amit Sharma", email: "amit@clinic.com" },
  // { id: "2", name: "Priya Singh", email: "priya@clinic.com" },
];
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
export default function SettingsPage() {
  // Admin password
  const [adminPassword, setAdminPassword] = useState("");
  const [adminprevPassword, setadminprevPassword] = useState("");
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  //show Receptionist
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);

  const [error, setError] = useState<string | null>(null);
  useState<Receptionist | null>(null);
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
      setError(null);
      try {
        const response = await axios.get(
          `${BASE_URL}/api/admin/viewrecepcient`,
          { withCredentials: true }
        );
        setReceptionists(response.data.data);
      } catch (err: any) {
        setError("Failed to fetch receptionists");
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
          description: "Please enter complete details",
        });
        return;
      }
      const response = await axios.post(
        `${BASE_URL}/api/admin/updatepassword`,
        {
          prevpassword: adminprevPassword,
          newpassword: adminPassword,
        },
        { withCredentials: true }
      );
      console.log("response", response.data.message);
      toast({
        title: "Update Password",
        description: response.data.message,
      });

      setAdminPassword("");
      setadminprevPassword("");
    } catch (err: any) {
      setError(err.response.data.message);
      toast({
        description: err.response.data.message,
      });
      setAdminPassword("");
      setadminprevPassword("");
    }
  };

  // console.log("recep", receptionists.data[0].name);
  useState<Receptionist[]>(dummyReceptionists);

  // Handle Adminpassword
  const handleAdminPasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordLoading(true);
    setTimeout(() => {
      setAdminPasswordLoading(false);
      setAdminPassword("");
      toast({
        title: "Password Updated",
        description: "Your password has been updated.",
      });
    }, 1200);
  };
  // HandleRecepPassword
  const handleRecepPasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setRecepPasswordLoading(true);
    setTimeout(() => {
      setRecepPasswordLoading(false);
      setRecepPassword("");
      setSelectedRecep(null);
      toast({
        title: "Receptionist Password Updated",
        description: "Password updated successfully.",
      });
    }, 1200);
  };

  // HandleDeleteRecep
  const handleDeleteRecep = () => {
    if (deleteRecep) {
      // setReceptionists((prev) => prev.filter((r) => r.id !== deleteRecep.id));
      setDeleteRecep(null);
      toast({
        title: "Receptionist Deleted",
        description: "Receptionist has been removed.",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Responsive 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar: Admin Settings */}
        <div className="md:col-span-1">
          <Card className="shadow-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-primary" />
                Update Your Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={Handle_Admin_Update_Password}
                className="flex flex-col gap-4"
              >
                {/* PREVIOUS PASSWORD INPUT-FIELD */}
                <Label htmlFor="prev-admin-password" className="font-semibold">
                  Prev Password
                </Label>
                <div className="relative">
                  <Input
                    id="prev-admin-password"
                    type={showAdminPassword ? "text" : "password"}
                    value={adminprevPassword}
                    onChange={(e) => setadminprevPassword(e.target.value)}
                    required
                    placeholder="Enter previous password"
                    className="pr-10 pl-10"
                  />
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowAdminPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* NEW PASSWORD INPUT-FIELD */}
                <Label htmlFor="admin-password" className="font-semibold">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="pr-10 pl-10"
                  />
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowAdminPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {adminPassword && (
                  <div className="text-xs mt-1">
                    <span
                      className={`font-medium ${
                        getPasswordStrength(adminPassword) === "Strong"
                          ? "text-green-600"
                          : getPasswordStrength(adminPassword) === "Medium"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {getPasswordStrength(adminPassword)} password
                    </span>
                  </div>
                )}
                <Button type="submit" disabled={adminPasswordLoading}>
                  {adminPasswordLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 mr-1 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Main Content: Receptionists Table */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Receptionists</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptionists.map((data) => (
                    <TableRow key={data._id}>
                      <TableCell>{data.name}</TableCell>
                      <TableCell>{data.email}</TableCell>
                      <TableCell className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          // onClick={() => setSelectedRecep(data)}
                          title="Update Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          // onClick={() => setDeleteRecep(data)}
                          title="Delete Receptionist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Receptionist Password Dialog */}
      <Dialog
        open={!!selectedRecep}
        onOpenChange={() => setSelectedRecep(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password for {selectedRecep?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleRecepPasswordUpdate}
            className="flex flex-col gap-4"
          >
            <Label htmlFor="recep-password" className="font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="recep-password"
                type={showRecepPassword ? "text" : "password"}
                value={recepPassword}
                onChange={(e) => setRecepPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="pr-10 pl-10"
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowRecepPassword((v) => !v)}
                tabIndex={-1}
              >
                {showRecepPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRecep(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recepPasswordLoading}>
                {recepPasswordLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 mr-1 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  "Update"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Receptionist Dialog */}
      <Dialog open={!!deleteRecep} onOpenChange={() => setDeleteRecep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Receptionist</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleteRecep?.name}</span>? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteRecep(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteRecep}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
