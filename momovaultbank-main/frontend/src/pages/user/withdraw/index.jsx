import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { 
  FaArrowCircleDown, 
  FaInfoCircle, 
  FaSpinner, 
  FaCheckSquare, 
  FaSquare,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaClock
} from "react-icons/fa";

export default function WithdrawPage() {
  const [loading, setLoading] = useState(false);
  const [loadingVaultInfo, setLoadingVaultInfo] = useState(true);
  const [message, setMessage] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [withdrawableDeposits, setWithdrawableDeposits] = useState([]);
  const [selectedDeposits, setSelectedDeposits] = useState([]);
  const [formData, setFormData] = useState({
    phoneNumber: ""
  });

  // Fetch vault information and withdrawable deposits on component mount
  useEffect(() => {
    fetchVaultInfo();
    fetchWithdrawableDeposits();
  }, []);

  const fetchVaultInfo = async () => {
    try {
      setLoadingVaultInfo(true);
      const response = await axiosInstance.get("/api/vault-info");
      setVaultInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vault info:", error);
      setMessage({
        type: "error",
        text: "Failed to load vault information. Please refresh the page."
      });
    } finally {
      setLoadingVaultInfo(false);
    }
  };

  const fetchWithdrawableDeposits = async () => {
    try {
      const response = await axiosInstance.get("/api/withdrawable-deposits");
      setWithdrawableDeposits(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch withdrawable deposits:", error);
      setMessage({
        type: "error",
        text: "Failed to load withdrawable deposits. Please refresh the page."
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  };

  const handleDepositSelection = (depositId) => {
    setSelectedDeposits(prev => {
      if (prev.includes(depositId)) {
        return prev.filter(id => id !== depositId);
      } else {
        return [...prev, depositId];
      }
    });
    // Clear message when selection changes
    if (message) setMessage(null);
  };

  const selectAllDeposits = () => {
    const allDepositIds = withdrawableDeposits
      .filter(deposit => deposit.canWithdraw)
      .map(deposit => deposit.depositId);
    setSelectedDeposits(allDepositIds);
  };

  const clearAllSelections = () => {
    setSelectedDeposits([]);
  };

  const calculateTotals = () => {
    const selectedDepositData = withdrawableDeposits.filter(deposit => 
      selectedDeposits.includes(deposit.depositId)
    );

    const totalOriginal = selectedDepositData.reduce((sum, deposit) => sum + deposit.amount, 0);
    const totalFees = selectedDepositData.length * 5; // E5 per deposit
    const totalPenalties = selectedDepositData.reduce((sum, deposit) => sum + deposit.penalty, 0);
    const totalNet = selectedDepositData.reduce((sum, deposit) => sum + deposit.netAmount, 0);

    return {
      totalOriginal,
      totalFees,
      totalPenalties,
      totalNet,
      depositsCount: selectedDepositData.length
    };
  };

  const validateForm = () => {
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: "error", text: "Phone number is required" });
      return false;
    }
    
    if (selectedDeposits.length === 0) {
      setMessage({ type: "error", text: "Please select at least one deposit to withdraw" });
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);

    try {
      // Process individual deposit withdrawal
      const response = await axiosInstance.post("/api/withdraw", {
        phoneNumber: formData.phoneNumber,
        depositIds: selectedDeposits
      });

      if (response.data.success) {
        const { data } = response.data;
        setMessage({
          type: "success",
          text: `Individual deposit withdrawals processed successfully!\n` +
                `Total Withdrawn: E${data.totalWithdrawn}\n` +
                `Total Fees: E${data.totalFees}\n` +
                `Total Penalties: E${data.totalPenalties}\n` +
                `Deposits Processed: ${data.depositsProcessed}\n` +
                `Reference ID: ${data.referenceId}`
        });

        // Reset form and refresh data
        setFormData({ phoneNumber: "" });
        setSelectedDeposits([]);
        fetchVaultInfo();
        fetchWithdrawableDeposits();
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Withdrawal failed. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (loadingVaultInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <FaSpinner className="animate-spin" />
          <span>Loading vault information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl w-full space-y-6">
        <h2 className="text-2xl font-bold text-blue-600 text-center">
          Individual Deposit Withdrawal
        </h2>

        {/* Vault Information Display */}
        {vaultInfo && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <FaInfoCircle />
              <span>Vault Summary</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Total Locked:</span>
                <span className="font-semibold ml-2">E{vaultInfo.depositSummary?.totalLockedAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Deposits:</span>
                <span className="font-semibold ml-2">{vaultInfo.depositSummary?.totalDeposits || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Withdrawable:</span>
                <span className="font-semibold ml-2 text-green-600">{vaultInfo.depositSummary?.withdrawableDepositsCount || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Vault Balance:</span>
                <span className="font-semibold ml-2">E{vaultInfo.vault?.balance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Input */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="76123456 or 26876123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter Eswatini MTN number (76 or 78 prefix)
          </p>
        </div>

        {/* Deposit Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Select Deposits to Withdraw</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllDeposits}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                Select All
              </button>
              <button
                onClick={clearAllSelections}
                className="text-sm text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Clear All
              </button>
            </div>
          </div>

          {withdrawableDeposits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaExclamationTriangle className="text-4xl mx-auto mb-2" />
              <p>No withdrawable deposits found</p>
              <p className="text-sm">Make a deposit first or wait for the lock period to mature</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {withdrawableDeposits.map((deposit) => (
                <div
                  key={deposit.depositId}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDeposits.includes(deposit.depositId)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!deposit.canWithdraw ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => deposit.canWithdraw && handleDepositSelection(deposit.depositId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {deposit.canWithdraw ? (
                        selectedDeposits.includes(deposit.depositId) ? (
                          <FaCheckSquare className="text-blue-600" />
                        ) : (
                          <FaSquare className="text-gray-400" />
                        )
                      ) : (
                        <FaClock className="text-gray-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <FaMoneyBillWave className="text-green-600" />
                          <span className="font-semibold">E{deposit.amount.toFixed(2)}</span>
                          <span className="text-sm text-gray-500">
                            ({deposit.lockPeriodInDays} day{deposit.lockPeriodInDays !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Deposited: {new Date(deposit.depositDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">E{deposit.netAmount.toFixed(2)}</p>
                      <div className="text-xs text-gray-500">
                        {deposit.penalty > 0 && (
                          <p className="text-red-600">Penalty: E{deposit.penalty.toFixed(2)}</p>
                        )}
                        <p>Fee: E{deposit.flatFee}</p>
                        {deposit.isEarlyWithdrawal && (
                          <p className="text-orange-600">Early withdrawal</p>
                        )}
                        {deposit.hoursUntilMaturity > 0 && (
                          <p>Matures in: {deposit.hoursUntilMaturity}h</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {selectedDeposits.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Withdrawal Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Deposits Selected:</span>
                <p className="font-semibold">{totals.depositsCount}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Original:</span>
                <p className="font-semibold">E{totals.totalOriginal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Fees:</span>
                <p className="font-semibold text-red-600">-E{totals.totalFees.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Penalties:</span>
                <p className="font-semibold text-red-600">-E{totals.totalPenalties.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-green-800">You will receive:</span>
                <span className="text-xl font-bold text-green-600">E{totals.totalNet.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`text-sm whitespace-pre-line px-4 py-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Withdrawal Button */}
        <button
          onClick={handleWithdraw}
          disabled={loading || selectedDeposits.length === 0}
          className={`w-full py-3 rounded-md text-white font-semibold flex items-center justify-center gap-2 transition-colors ${
            loading || selectedDeposits.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Processing Individual Withdrawals...
            </>
          ) : (
            <>
              <FaArrowCircleDown />
              Withdraw Selected Deposits ({selectedDeposits.length})
            </>
          )}
        </button>

        {/* Updated Fee Information */}
        <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
          <p><strong>Individual Deposit Withdrawal System:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Each deposit is processed individually with its own fees</li>
            <li>Flat fee: E5 per deposit withdrawal</li>
            <li>Early withdrawal penalty: 10% of deposit amount (for all lock periods)</li>
            
            <li>Select specific deposits you want to withdraw from</li>
          </ul>
        </div>
      </div>
    </div>
  );
}