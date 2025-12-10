import React, { useState, useEffect } from "react";
import { useTransaction } from "../../contexts/TransactionContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: "reservation" | "guest";
  contextId: string;
  onSuccess: () => void; // Trigger a reload of parent data
  defaultAmount?: number; // 👈 ADD THIS NEW PROP
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  context,
  contextId,
  onSuccess,
  defaultAmount = 0, // 👈 Set default
}) => {
  const { addTransaction, loading } = useTransaction();

  const [amount, setAmount] = useState(
    defaultAmount > 0 ? defaultAmount.toString() : ""
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [desc, setDesc] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [type, setType] = useState<"payment" | "refund">("payment");

  useEffect(() => {
    if (!isOpen) return;

    if (type === "payment") {
      // prefill with balance due (for guest) or blank (for reservation)
      setAmount(defaultAmount > 0 ? defaultAmount.toString() : "");
    } else {
      // refund: user types exact amount to refund
      setAmount("");
    }
  }, [isOpen, type, defaultAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    try {
      await addTransaction({
        amount: Number(amount),
        paymentMethod,
        // 👇 LOGIC CHANGE: Check if user selected refund
        type:
          context === "reservation"
            ? type === "refund"
              ? "refund"
              : "advance"
            : type,
        description: desc,
        [context === "reservation" ? "reservationId" : "guestId"]: contextId,
      });

      // Reset form
      setAmount("");
      setDesc("");
      onSuccess(); // Refresh parent
      onClose(); // Close modal
    } catch (err: any) {
      setErrorMsg(err.message || "Transaction failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {context === "reservation" ? "Add Advance" : "Settle Bill"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            {errorMsg}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="txType"
                checked={type === "payment"}
                onChange={() => setType("payment")}
              />
              <span>
                {context === "reservation" ? "Add Advance" : "Receive Payment"}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-red-600">
              <input
                type="radio"
                name="txType"
                checked={type === "refund"}
                onChange={() => setType("refund")}
              />
              <span>Issue Refund</span>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
            />
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
              <option value="PayAtHotel">Pay At Hotel</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Final Settlement"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
