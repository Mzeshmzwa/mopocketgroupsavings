import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { 
  FaMoneyBillWave, 
  FaLock, 
  FaRegCreditCard, 
  FaInfoCircle,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

export default function DepositPage() {
  const [formData, setFormData] = useState({
    amount: "",
    lockDays: "",
    phoneNumber: ""
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [momoToken, setMomoToken] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);

  const lockPeriodOptions = [
    { days: 1, label: "1 Day", penalty: "10% if withdrawn early", color: "bg-yellow-100 border-yellow-300" },
    { days: 2, label: "2 Days", penalty: "10% if withdrawn early", color: "bg-orange-100 border-orange-300" },
    { days: 3, label: "3 Days", penalty: "10% if withdrawn early", color: "bg-red-100 border-red-300" },
    { days: 7, label: "1 Week", penalty: "No penalty", color: "bg-green-100 border-green-300" },
    { days: 30, label: "1 Month", penalty: "No penalty", color: "bg-blue-100 border-blue-300" },
  ];

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchMomoToken(),
        fetchVaultInfo()
      ]);
    };
    initializePage();
  }, []);

  const fetchMomoToken = async () => {
    try {
      setTokenLoading(true);
      const res = await axiosInstance.post("/momo/token");
      const token = res.data?.data?.access_token;
      if (token) {
        setMomoToken(token);
        console.log("MoMo token fetched successfully");
      } else {
        console.warn("No MoMo token returned:", res.data);
        setMessage({
          type: "error",
          text: "Failed to initialize payment system. Please refresh the page."
        });
      }
    } catch (error) {
      console.error("MoMo token fetch failed:", error);
      setMessage({
        type: "error",
        text: "Failed to connect to payment system. Please check your connection."
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const fetchVaultInfo = async () => {
    try {
      const response = await axiosInstance.get("/api/vault-info");
      setVaultInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vault info:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (message) setMessage(null);
  };

  const handleLockPeriodSelect = (days) => {
    setFormData(prev => ({
      ...prev,
      lockDays: days.toString()
    }));
    if (message) setMessage(null);
  };

  const validateForm = () => {
    const { amount, lockDays, phoneNumber } = formData;

    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount greater than 0." });
      return false;
    }

    if (parseFloat(amount) < 2) {
      setMessage({ type: "error", text: "Minimum deposit amount is E2." });
      return false;
    }

    if (!lockDays || parseInt(lockDays) <= 0) {
      setMessage({ type: "error", text: "Please select a lock period." });
      return false;
    }

    if (!phoneNumber.trim()) {
      setMessage({ type: "error", text: "Please enter your phone number." });
      return false;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setMessage({ type: "error", text: "Please enter a valid phone number." });
      return false;
    }

    return true;
  };

  const handleDeposit = async () => {
    if (!validateForm()) return;

    if (!momoToken) {
      setMessage({
        type: "error",
        text: "Payment system not ready. Please refresh the page and try again."
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const depositData = {
        userId: localStorage.getItem("userId"),
        amount: parseFloat(formData.amount),
        lockPeriodInDays: parseInt(formData.lockDays),
        phoneNumber: formData.phoneNumber.trim(),
        orderId: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log("Sending deposit request:", depositData);

      const res = await axiosInstance.post("/momo/money-collect", depositData);

      console.log("Deposit response:", res.data);

      if (res.data.status === "SUCCESSFUL" || res.data.status === "PENDING" || res.data.message) {
        setMessage({ 
          type: "success", 
          text: res.data.message || `Deposit initiated!\nAmount: E${formData.amount}\nLock Period: ${formData.lockDays} days\nReference: ${res.data.referenceId || 'N/A'}`
        });

        setFormData({
          amount: "",
          lockDays: "",
          phoneNumber: ""
        });

        setTimeout(() => {
          fetchVaultInfo();
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: res.data.error || res.data.message || "Failed to process deposit. Please try again."
        });
      }
    } catch (err) {
      console.error("Deposit error:", err);
      const errorMessage = err.response?.data?.error || 
                           err.response?.data?.message || 
                           "Deposit failed. Please check your details and try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Initializing payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <FaMoneyBillWave className="text-4xl text-blue-600 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">Make a Deposit</h2>
          <p className="text-gray-600 text-sm">Secure your funds with our vault system</p>
        </div>

        {vaultInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
              <FaInfoCircle />
              <span>Your Vault</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Balance:</span>
                <p className="font-semibold text-blue-600">E{vaultInfo.vault?.balance?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <span className="text-gray-600">Active Deposits:</span>
                <p className="font-semibold text-green-600">{vaultInfo.lockedDeposits?.length || 0}</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`text-sm whitespace-pre-line px-4 py-3 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {message.type === "success" ? (
                <FaCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <FaExclamationTriangle className="text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (E)
            </label>
            <div className="relative">
              <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                name="amount"
                placeholder="Enter amount (min. E2)"
                value={formData.amount}
                onChange={handleInputChange}
                min="2"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum deposit: E2</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Lock Period
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lockPeriodOptions.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => handleLockPeriodSelect(option.days)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.lockDays === option.days.toString()
                      ? 'border-blue-500 bg-blue-50'
                      : option.color
                  } hover:shadow-md disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{option.label}</p>
                      <p className="text-xs text-gray-600">{option.penalty}</p>
                    </div>
                    <FaLock className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Early withdrawal from 1-3 day locks incurs a 10% penalty + E5 fee
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Custom Days
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                name="lockDays"
                placeholder="Custom lock period (days)"
                value={formData.lockDays}
                onChange={handleInputChange}
                min="1"
                max="365"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaRegCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="76123456 or 26876123456"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your Eswatini mobile number (76, 78, or 79)
            </p>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || !momoToken}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              loading || !momoToken
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Processing Deposit...
              </>
            ) : (
              <>
                <FaMoneyBillWave />
                Deposit Funds
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <FaInfoCircle className="text-blue-600" />
            Important Information
          </h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Minimum deposit: E2</li>
            <li>• Funds are locked for the selected period</li>
            <li>• Early withdrawal is: 10% penalty + E5 fee</li>
            <li>• Withdrawals available 24 hours after deposit</li>
            <li>• All transactions are secured by MoMo API</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
