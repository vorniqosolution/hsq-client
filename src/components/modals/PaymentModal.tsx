// import React, { useState, useEffect } from "react";
// import { useTransaction } from "../../contexts/TransactionContext";

// interface PaymentModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   context: "reservation" | "guest";
//   contextId: string;
//   onSuccess: () => void;
//   defaultAmount?: number;
//   initialType?: "payment" | "refund";               // NEW
//   mode?: "both" | "payment-only" | "refund-only";   // NEW
// }

// const PaymentModal: React.FC<PaymentModalProps> = ({
//   isOpen,
//   onClose,
//   context,
//   contextId,
//   onSuccess,
//   defaultAmount = 0,
//   initialType = "payment",
//   mode = "both",
// }) => {
//   const { addTransaction, loading } = useTransaction();

//   const [amount, setAmount] = useState(
//     defaultAmount > 0 ? defaultAmount.toString() : ""
//   );
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [desc, setDesc] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [type, setType] = useState<"payment" | "refund">(initialType);

//   useEffect(() => {
//     if (!isOpen) return;
//     if (mode === "payment-only") {
//       setType("payment");
//     } else if (mode === "refund-only") {
//       setType("refund");
//     } else {
//       setType(initialType);
//     }
//   }, [initialType, mode, isOpen]);

//   // For UX: fill amount when receiving payment; clear when refund
//   useEffect(() => {
//     if (!isOpen) return;
//     if (type === "payment") {
//       setAmount(defaultAmount > 0 ? defaultAmount.toString() : "");
//     } else {
//       setAmount("");
//     }
//   }, [type, defaultAmount, isOpen]);

//   if (!isOpen) return null;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrorMsg("");

//     if (!amount || Number(amount) <= 0) {
//       setErrorMsg("Please enter a valid amount");
//       return;
//     }

//     try {
//       await addTransaction({
//         amount: Number(amount),
//         paymentMethod,
//         // 👇 LOGIC CHANGE: Check if user selected refund
//         type:
//           context === "reservation"
//             ? type === "refund"
//               ? "refund"
//               : "advance"
//             : type,
//         description: desc,
//         [context === "reservation" ? "reservationId" : "guestId"]: contextId,
//       });

//       // Reset form
//       setAmount("");
//       setDesc("");
//       onSuccess(); // Refresh parent
//       onClose(); // Close modal
//     } catch (err: any) {
//       setErrorMsg(err.message || "Transaction failed");
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
//       <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold text-gray-800">
//             {context === "reservation" ? "Add Advance" : "Settle Bill"}
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             ✕
//           </button>
//         </div>

//         {errorMsg && (
//           <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
//             {errorMsg}
//           </div>
//         )}

//          <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Transaction Type
//           </label>
//           <div className="flex gap-4">
//             {/* Receive Payment */}
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="radio"
//                 name="txType"
//                 checked={type === "payment"}
//                 onChange={() => setType("payment")}
//                 disabled={mode === "refund-only"}   // lock to refund when red
//               />
//               <span>
//                 {context === "reservation" ? "Add Advance" : "Receive Payment"}
//               </span>
//             </label>

//             {/* Issue Refund */}
//             <label className="flex items-center gap-2 cursor-pointer text-red-600">
//               <input
//                 type="radio"
//                 name="txType"
//                 checked={type === "refund"}
//                 onChange={() => setType("refund")}
//                 disabled={mode === "payment-only"}  // lock to payment when blue
//               />
//               <span>Issue Refund</span>
//             </label>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//           {/* Amount */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Amount
//             </label>
//             <input
//               type="number"
//               className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               required
//               min="1"
//             />
//           </div>

//           {/* Method */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Payment Method
//             </label>
//             <select
//               className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//             >
//               <option value="Cash">Cash</option>
//               <option value="Card">Card</option>
//               <option value="Online">Online</option>
//               <option value="PayAtHotel">Pay At Hotel</option>
//             </select>
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Note (Optional)
//             </label>
//             <input
//               type="text"
//               className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//               value={desc}
//               onChange={(e) => setDesc(e.target.value)}
//               placeholder="e.g. Final Settlement"
//             />
//           </div>

//           {/* Buttons */}
//           <div className="flex justify-end gap-2 mt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
//             >
//               {loading ? "Processing..." : "Confirm Payment"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default PaymentModal;

import React, { useState, useEffect } from "react";
import { useTransaction } from "../../contexts/TransactionContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: "reservation" | "guest";
  contextId: string;
  onSuccess: () => void;
  defaultAmount?: number;
  initialType?: "payment" | "refund";               // optional: default selection
  mode?: "both" | "payment-only" | "refund-only";   // controls which options are enabled
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  context,
  contextId,
  onSuccess,
  defaultAmount = 0,
  initialType = "payment",
  mode = "both",
}) => {
  const { addTransaction, loading } = useTransaction();

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [desc, setDesc] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [type, setType] = useState<"payment" | "refund">(initialType);

  // Lock the type based on mode + initialType
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "payment-only") {
      setType("payment");
    } else if (mode === "refund-only") {
      setType("refund");
    } else {
      setType(initialType);
    }
  }, [initialType, mode, isOpen]);

  // UX: prefill amount when receiving payment or issuing refund
  useEffect(() => {
    if (!isOpen) return;
    setAmount(defaultAmount > 0 ? defaultAmount.toString() : "");
  }, [type, defaultAmount, isOpen]);

  if (!isOpen) return null;

  const isRefund = type === "refund";

  // Context-aware title and button label
  const title =
    context === "reservation"
      ? isRefund
        ? "Refund Advance"
        : "Record Advance Payment"
      : isRefund
        ? "Issue Refund"
        : "Receive Payment";

  const subtitle =
    context === "reservation"
      ? "This will update the advance ledger for this reservation."
      : "This will update the guest’s invoice and transaction history.";

  const primaryBtnLabel = isRefund ? "Confirm Refund" : "Confirm Payment";
  const primaryBtnColor = isRefund
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    try {
      await addTransaction({
        amount: Number(amount),
        paymentMethod,
        type:
          context === "reservation"
            ? type === "refund"
              ? "refund"
              : "advance"
            : type,
        description: desc,
        [context === "reservation" ? "reservationId" : "guestId"]: contextId,
      });

      setAmount("");
      setDesc("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Transaction failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Transaction Type Toggle */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transaction Type
          </label>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              disabled={mode === "refund-only"}
              onClick={() => setType("payment")}
              className={`px-3 py-1 rounded-full transition ${type === "payment"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                } ${mode === "refund-only" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {context === "reservation" ? "Add Advance" : "Receive Payment"}
            </button>
            <button
              type="button"
              disabled={mode === "payment-only"}
              onClick={() => setType("refund")}
              className={`ml-1 px-3 py-1 rounded-full transition ${type === "refund"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-red-500 hover:text-red-600"
                } ${mode === "payment-only" ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              Issue Refund
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Amount
            </label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                PKR
              </span>
              <input
                type="number"
                min="1"
                className="w-full rounded-r-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Enter the {isRefund ? "refund" : "payment"} amount in PKR.
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Payment Method
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
              <option value="PayAtHotel">Pay At Hotel</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Note <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={isRefund ? "Reason for refund (e.g. Early checkout)" : "e.g. Final settlement at checkout"}
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${primaryBtnColor} disabled:bg-slate-300 disabled:cursor-not-allowed`}
            >
              {loading ? "Processing..." : primaryBtnLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
