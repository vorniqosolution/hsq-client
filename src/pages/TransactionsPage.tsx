import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTransaction, Transaction } from "@/contexts/TransactionContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftRight,
  Filter,
  Search,
  User,
  Bed,
  Calendar,
  Menu
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

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
  const { transactions, fetchTransactions, loading } = useTransaction();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [typeFilter, setTypeFilter] = useState<
    "all" | "advance" | "payment" | "refund"
  >("all");
  const [methodFilter, setMethodFilter] = useState<
    "all" | "Cash" | "Card" | "Online" | "PayAtHotel"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          {/* Mobile Toggle */}
          <div className="lg:hidden mb-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-slate-600" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Transactions Ledger</h1>
          </div>

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
                    className={`text-lg font-semibold ${summary.net >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                  >
                    {formatPKR(summary.net)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Search className="h-3 w-3" />
                    Search (Guest / Room / Note)
                  </label>
                  <Input
                    placeholder="e.g. Ali, 2002, early checkout"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Filter className="h-3 w-3" />
                    Type
                  </label>
                  <Select
                    value={typeFilter}
                    onValueChange={(val) =>
                      setTypeFilter(val as "all" | "advance" | "payment" | "refund")
                    }
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Method</label>
                  <Select
                    value={methodFilter}
                    onValueChange={(val) =>
                      setMethodFilter(
                        val as "all" | "Cash" | "Card" | "Online" | "PayAtHotel"
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="PayAtHotel">Pay At Hotel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
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
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((tx) => {
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
                                  tx.type
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionsPage;
