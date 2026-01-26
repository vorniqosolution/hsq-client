import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTransaction, Transaction } from "@/contexts/TransactionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeftRight,
  Search,
  User,
  Bed,
  Calendar,
  Trash2,
  ArrowUpCircle,
  CheckCircle2,
  ArrowDownCircle,
  Banknote,
  CreditCard,
  Globe,
  Coins,
} from "lucide-react";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPKR = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const TransactionsPage: React.FC = () => {
  const { transactions, fetchTransactions, deleteTransaction, loading } =
    useTransaction();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 15;

  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<
    "all" | "advance" | "payment" | "refund"
  >("all");
  const [methodFilter, setMethodFilter] = useState<
    "all" | "Cash" | "Card" | "Online" | "PayAtHotel"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  // React Query handles fetching automatically
  // useEffect(() => {
  //   fetchTransactions();
  // }, [fetchTransactions]);

  const filtered = useMemo(() => {
    setCurrentPage(1); // Reset to first page on filter change
    const term = searchTerm.toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (methodFilter !== "all" && tx.paymentMethod !== methodFilter)
        return false;

      if (!term) return true;

      const guestName =
        (typeof tx.guest === "object" && tx.guest?.fullName) ||
        (typeof tx.reservation === "object" && tx.reservation?.fullName) ||
        "";

      const roomNumber =
        (typeof tx.guest === "object" && tx.guest?.room?.roomNumber) ||
        (typeof tx.reservation === "object" &&
          tx.reservation?.room?.roomNumber) ||
        "";

      return (
        guestName.toLowerCase().includes(term) ||
        roomNumber.toString().toLowerCase().includes(term) ||
        (tx.description || "").toLowerCase().includes(term)
      );
    });
  }, [transactions, typeFilter, methodFilter, searchTerm]);

  // Simple summary
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    filtered.forEach((tx) => {
      if (tx.type === "refund") {
        totalOut += tx.amount;
      } else {
        totalIn += tx.amount;
      }
    });
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filtered]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filtered.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filtered]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const getPageNumbers = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  const getTypeBadge = (type: Transaction["type"]) => {
    switch (type) {
      case "advance":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            Advance
          </Badge>
        );
      case "payment":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Payment
          </Badge>
        );
      case "refund":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            Refund
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getAmountColor = (type: Transaction["type"]) =>
    type === "refund" ? "text-red-600" : "text-emerald-700";

  const handleRowClick = (tx: Transaction) => {
    if (tx.guest && typeof tx.guest === "object" && tx.guest._id) {
      navigate(`/guests/${tx.guest._id}`);
    } else if (
      tx.reservation &&
      typeof tx.reservation === "object" &&
      tx.reservation._id
    ) {
      navigate(`/reservation/${tx.reservation._id}`);
    }
  };

  return (
    <div className="h-full">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                Transactions Ledger
              </h1>
            </div>

            {/* Summary */}
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Total In (Advances + Payments)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-emerald-700">
                    {formatPKR(summary.totalIn)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Total Out (Refunds)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-red-600">
                    {formatPKR(summary.totalOut)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Net Cash In
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-lg font-semibold ${
                      summary.net >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatPKR(summary.net)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            {/* Compact Filters Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Search - expandable input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Guest, Room, Note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Type Filter Icons */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={typeFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("all")}
                  className="h-8 px-3 text-xs"
                  title="All Types"
                >
                  All
                </Button>
                <Button
                  variant={typeFilter === "advance" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("advance")}
                  className={`h-8 px-3 ${typeFilter === "advance" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                  title="Advance"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                  Advance
                </Button>
                <Button
                  variant={typeFilter === "payment" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("payment")}
                  className={`h-8 px-3 ${typeFilter === "payment" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                  title="Payment"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Payment
                </Button>
                <Button
                  variant={typeFilter === "refund" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("refund")}
                  className={`h-8 px-3 ${typeFilter === "refund" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                  title="Refund"
                >
                  <ArrowDownCircle className="h-4 w-4 mr-1" />
                  Refund
                </Button>
              </div>

              {/* Method Filter Icons */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={methodFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMethodFilter("all")}
                  className="h-8 px-3 text-xs"
                  title="All Methods"
                >
                  All
                </Button>
                <Button
                  variant={methodFilter === "Cash" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMethodFilter("Cash")}
                  className={`h-8 px-3 ${methodFilter === "Cash" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                  title="Cash"
                >
                  <Banknote className="h-4 w-4" />
                </Button>
                <Button
                  variant={methodFilter === "Card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMethodFilter("Card")}
                  className={`h-8 px-3 ${methodFilter === "Card" ? "bg-purple-500 hover:bg-purple-600 text-white" : ""}`}
                  title="Card"
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
                <Button
                  variant={methodFilter === "Online" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMethodFilter("Online")}
                  className={`h-8 px-3 ${methodFilter === "Online" ? "bg-blue-400 hover:bg-blue-500 text-white" : ""}`}
                  title="Online"
                >
                  <Globe className="h-4 w-4" />
                </Button>
                <Button
                  variant={methodFilter === "PayAtHotel" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMethodFilter("PayAtHotel")}
                  className={`h-8 px-3 ${methodFilter === "PayAtHotel" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                  title="Pay At Hotel"
                >
                  <Coins className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transactions</CardTitle>
                <Badge variant="secondary">{filtered.length} total</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No transactions found for the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-left">Method</th>
                          <th className="px-4 py-2 text-left">Guest / Room</th>
                          <th className="px-4 py-2 text-left">Note</th>
                          <th className="px-4 py-2 text-left">Recorded By</th>
                          {isAdmin && (
                            <th className="px-4 py-2 text-center">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((tx) => {
                          const guestName =
                            (typeof tx.guest === "object" &&
                              tx.guest &&
                              tx.guest.fullName) ||
                            (typeof tx.reservation === "object" &&
                              tx.reservation &&
                              tx.reservation.fullName) ||
                            "";

                          const roomNumber =
                            (typeof tx.guest === "object" &&
                              tx.guest?.room?.roomNumber) ||
                            (typeof tx.reservation === "object" &&
                              tx.reservation?.room?.roomNumber) ||
                            "";

                          const recordedByName =
                            typeof tx.recordedBy === "object" && tx.recordedBy
                              ? tx.recordedBy.name
                              : "";

                          return (
                            <tr
                              key={tx._id}
                              className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                              onClick={() => handleRowClick(tx)}
                            >
                              <td className="px-4 py-2 align-middle text-slate-600">
                                {formatDateTime(tx.createdAt)}
                              </td>
                              <td className="px-4 py-2 align-middle">
                                {getTypeBadge(tx.type)}
                              </td>
                              <td
                                className={`px-4 py-2 align-middle text-right font-semibold ${getAmountColor(
                                  tx.type,
                                )}`}
                              >
                                {tx.type === "refund" ? "-" : "+"}{" "}
                                {formatPKR(tx.amount)}
                              </td>
                              <td className="px-4 py-2 align-middle text-slate-600">
                                {tx.paymentMethod}
                              </td>
                              <td className="px-4 py-2 align-middle text-slate-700">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-slate-400" />
                                  <span>{guestName || "—"}</span>
                                  {roomNumber && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                        <Bed className="h-3 w-3" />#{roomNumber}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 align-middle text-slate-500">
                                {tx.description || "—"}
                              </td>
                              <td className="px-4 py-2 align-middle text-slate-500">
                                {recordedByName || "—"}
                              </td>
                              {isAdmin && (
                                <td className="px-4 py-2 align-middle text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTransactionToDelete(tx);
                                    }}
                                    title="Delete Transaction"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="mt-4">
                <CardContent className="p-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers(currentPage, totalPages).map(
                        (page, index) =>
                          typeof page === "number" ? (
                            <PaginationItem key={index}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={index}>
                              <span className="px-3 py-2">...</span>
                            </PaginationItem>
                          ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            );
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction of{" "}
              <strong>
                {transactionToDelete && formatPKR(transactionToDelete.amount)}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (transactionToDelete) {
                  try {
                    await deleteTransaction(transactionToDelete._id);
                    toast({
                      title: "Success",
                      description: "Transaction deleted successfully.",
                    });
                  } catch (err) {
                    toast({
                      title: "Error",
                      description: "Failed to delete the transaction.",
                      variant: "destructive",
                    });
                  } finally {
                    setTransactionToDelete(null);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionsPage;
