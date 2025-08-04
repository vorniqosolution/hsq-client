import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RoomProvider } from "./contexts/RoomContext";
import { GuestProvider } from "./contexts/GuestContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import { DiscountProvider } from "./contexts/DiscountContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RoomsPage from "./pages/RoomsPage";
import GuestsPage from "./pages/GuestsPage";
import GuestDetailPage from "./pages/GuestDetailPage";
import DiscountPage from "./pages/Discount";
import InventoryPage from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import HomeRedirect from "./components/HomeRedirect";
import InvoicesPage from "./pages/Invoices";
import RevenuePage from "./pages/Revenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoomProvider>
            <GuestProvider>
              <InventoryProvider>
                <DiscountProvider>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/login" replace />}
                    />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <Layout>
                            <DashboardPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/rooms"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <Layout>
                            <RoomsPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/guests"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <GuestsPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/guests/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <GuestDetailPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/Discount"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DiscountPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/Inventory"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InventoryPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/Invoices"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InvoicesPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/Revenue"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <RevenuePage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DiscountProvider>
              </InventoryProvider>
            </GuestProvider>
          </RoomProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
