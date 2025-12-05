import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner"; // Use 'sonner' directly for clarity
import { useLowStockNotifier } from "./hooks/useLowStockNotifier";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RoomProvider } from "./contexts/RoomContext";
import { GuestProvider } from "./contexts/GuestContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import { DiscountProvider } from "./contexts/DiscountContext";
import { RevenueProvider } from "./contexts/revenueContext";
import { InvoiceProvider } from "./contexts/InvoiceContext";
import { TaxProvider } from "./contexts/TaxContext";
import { ReservationProvider } from "./contexts/ReservationContext";
import { DecorProvider } from "./contexts/DecorContext";

import SessionPopup from "@/components/SessionPopup";

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
import InvoiceDetails from "./pages/InvoiceDetailsPage";
import RevenuePage from "./pages/Revenue";
import GstPage from "./pages/GstPage";
import ReservationPage from "./pages/ReservationPage";
import ReservationDetailsPage from "./pages/ReservationDetails";
import SettingsPage from "./pages/SettingsPage";
import Decor from "./pages/Decor";

const queryClient = new QueryClient();

const AppInitializer = ({ children }) => {
  useLowStockNotifier();

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <DecorProvider>
            <RoomProvider>
              <GuestProvider>
                <InventoryProvider>
                  <DiscountProvider>
                    <TaxProvider>
                      <ReservationProvider>
                        <InventoryProvider>
                          <DiscountProvider>
                            <RevenueProvider>
                              <InvoiceProvider>
                                {/* <SettingProvider> */}
                                <AppInitializer>
                                  <SessionPopup />

                                  <Routes>
                                    <Route
                                      path="/"
                                      element={<Navigate to="/login" replace />}
                                    />
                                    <Route
                                      path="/login"
                                      element={<LoginPage />}
                                    />
                                    <Route
                                      path="/dashboard"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <DashboardPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="/rooms"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <RoomsPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="/guests"
                                      element={
                                        <ProtectedRoute
                                        // roles={["admin", "receptionist"]}
                                        >
                                          <Layout>
                                            <GuestsPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="/guests/:id"
                                      element={
                                        <ProtectedRoute
                                        // roles={["admin", "receptionist"]}
                                        >
                                          <Layout>
                                            <GuestDetailPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="/reservation"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <ReservationPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="/reservation/:id"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <ReservationDetailsPage />
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
                                      path="/Gst"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <GstPage />
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
                                      path="/Invoices/:id"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <InvoiceDetails />
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
                                    <Route
                                      path="/decor"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <Decor />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route
                                      path="/settings"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <SettingsPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />
                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </AppInitializer>
                              </InvoiceProvider>
                            </RevenueProvider>
                          </DiscountProvider>
                        </InventoryProvider>
                      </ReservationProvider>
                    </TaxProvider>
                  </DiscountProvider>
                </InventoryProvider>
              </GuestProvider>
            </RoomProvider>
          </DecorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
