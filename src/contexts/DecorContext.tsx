// import React, { createContext, useContext, useState, useCallback } from "react";
// import axios, { AxiosInstance } from "axios";

// const API_BASE = import.meta.env.VITE_API_BASE_URL;
// const apiClient: AxiosInstance = axios.create({
//   baseURL: API_BASE,
//   withCredentials: true,
// });

// export interface InventoryRequirement {
//   item: string;
//   quantity: number;
// }

// export interface DecorPackage {
//   title: string;
//   description: string;
//   price: number;
//   inventoryRequirements: InventoryRequirement[];
//   images: string[];
//   isCustom?: boolean;
// }

// interface DecorContextType {
//   packages: DecorPackage[];
//   createPackage: (pkg: FormData) => Promise<void>;
//   fetchPackages: () => Promise<void>;
//   deletePackage: () => Promise<void>;
//   updatePackage: () => Promise<void>;
// }

// const DecorContext = createContext<DecorContextType | null>(null);

// export const DecorProvider = ({ children }: { children: React.ReactNode }) => {
//   const [packages, setPackages] = useState<DecorPackage[]>([]);

//   const fetchPackages = useCallback(async () => {
//     try {
//       const response = await apiClient.get<{ data: DecorPackage[] }>(
//         "/api/decor/get-packages"
//       );
//       setPackages(response.data.data);
//     } catch (error) {
//       console.error("Failed to fetch packages", error);
//       alert("Failed to fetch packages");
//     }
//   }, []);

//   const createPackage = useCallback(async (pkg: FormData) => {
//     try {
//       const response = await apiClient.post("/api/decor/create-package", pkg, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setPackages((prev) => [...prev, response.data.data]);
//       alert("Decor package added successfully!");
//     } catch (error: any) {
//       console.error("Failed to create package", error);
//       alert(error?.response?.data?.message || "Failed to create decor package");
//     }
//   }, []);
//   const deletePackage = useCallback(async (pkg: FormData) => {
//     try {
//       const response = await apiClient.post("/api/decor/create-package", pkg, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setPackages((prev) => [...prev, response.data.data]);
//       alert("Decor package added successfully!");
//     } catch (error: any) {
//       console.error("Failed to create package", error);
//       alert(error?.response?.data?.message || "Failed to create decor package");
//     }
//   }, []);
//   const updatePackage = useCallback(async (pkg: FormData) => {
//     try {
//       const response = await apiClient.post("/api/decor/create-package", pkg, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setPackages((prev) => [...prev, response.data.data]);
//       alert("Decor package added successfully!");
//     } catch (error: any) {
//       console.error("Failed to create package", error);
//       alert(error?.response?.data?.message || "Failed to create decor package");
//     }
//   }, []);

//   return (
//     <DecorContext.Provider
//       value={{
//         packages,
//         createPackage,
//         fetchPackages,
//         deletePackage,
//         updatePackage,
//       }}
//     >
//       {children}
//     </DecorContext.Provider>
//   );
// };

// export const useDecor = () => {
//   const context = useContext(DecorContext);
//   if (!context) throw new Error("useDecor must be used inside <DecorProvider>");
//   return context;
// };
import React, { createContext, useContext, useState, useCallback } from "react";
import axios, { AxiosInstance } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ================== TYPES ===================== //

export interface InventoryRequirement {
  item: string; // item _id
  quantity: number;
}

export interface DecorPackage {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  inventoryRequirements: InventoryRequirement[];
  isCustom?: boolean;
}

interface DecorContextType {
  packages: DecorPackage[];
  fetchPackages: () => Promise<void>;
  createPackage: (data: FormData) => Promise<void>;
  updatePackage: (id: string, data: FormData) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
}

// ============================================== //

const DecorContext = createContext<DecorContextType | null>(null);

export const DecorProvider = ({ children }: { children: React.ReactNode }) => {
  const [packages, setPackages] = useState<DecorPackage[]>([]);

  // ------------ GET all packages --------------- //
  const fetchPackages = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: DecorPackage[] }>(
        "/api/decor/get-packages"
      );
      setPackages(res.data.data);
    } catch (err) {
      console.error("Fetch failed", err);
      alert("Failed to load decor packages");
    }
  }, []);

  // ------------ CREATE package ---------------- //
  const createPackage = useCallback(async (data: FormData) => {
    try {
      const res = await apiClient.post("/api/decor/create-package", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPackages((prev) => [...prev, res.data.data]);

      alert("Decor package added successfully");
    } catch (err: any) {
      console.error("Create failed", err);
      alert(err?.response?.data?.message || "Failed to create package");
    }
  }, []);

  // ------------ DELETE package ---------------- //
  const deletePackage = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/decor/delete-packages/${id}`);

      setPackages((prev) => prev.filter((pkg) => pkg._id !== id));

      alert("Decor package deleted successfully");
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(err?.response?.data?.message || "Failed to delete package");
    }
  }, []);

  // ------------ UPDATE package ---------------- //
  const updatePackage = useCallback(async (id: string, data: FormData) => {
    try {
      const res = await apiClient.put(`/api/decor/edit-packages/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPackages((prev) =>
        prev.map((pkg) => (pkg._id === id ? res.data.data : pkg))
      );

      alert("Decor package updated successfully");
    } catch (err: any) {
      console.error("Update failed", err);
      alert(err?.response?.data?.message || "Failed to update package");
    }
  }, []);

  return (
    <DecorContext.Provider
      value={{
        packages,
        fetchPackages,
        createPackage,
        updatePackage,
        deletePackage,
      }}
    >
      {children}
    </DecorContext.Provider>
  );
};

export const useDecor = () => {
  const ctx = useContext(DecorContext);
  if (!ctx) throw new Error("useDecor must be used inside <DecorProvider>");
  return ctx;
};
