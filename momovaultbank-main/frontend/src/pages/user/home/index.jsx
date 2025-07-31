import StudentViewCommonHeader from "@/components/user-view/header";
import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useNavigate } from "react-router-dom";

import {
  FaWallet,
  FaArrowDown,
  FaArrowUp,
  FaExchangeAlt,
  FaTachometerAlt,
  FaExclamationTriangle,
  FaLock,
  FaSpinner,
  FaInfoCircle,
  FaClock,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaChartLine,
  FaUserFriends,
} from "react-icons/fa";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [withdrawableDeposits, setWithdrawableDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const id = localStorage.getItem("userId");
        if (!id) {
          setError("No user ID found. Please log in again.");
          navigate("/auth");
          return;
        }

        // Fetch user profile, vault info, and withdrawable deposits
        const [userRes, vaultRes, withdrawableRes] = await Promise.all([
          axiosInstance.get(`/api/user/${id}`),
          axiosInstance.get("/api/vault-info").catch(() => ({ data: { success: false, data: null } })),
          axiosInstance.get("/api/withdrawable-deposits").catch(() => ({ data: { success: false, data: [] } }))
        ]);

        if (userRes.data.success) {
          setUser(userRes.data.data);
        }

        if (vaultRes.data.success) {
          setVaultInfo(vaultRes.data.data);
        }

        if (withdrawableRes.data.success) {
          setWithdrawableDeposits(withdrawableRes.data.data);
        }

      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Failed to fetch user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        // Fetch savings groups data
        const [groupsRes, publicGroupsRes] = await Promise.all([
          axiosInstance.get("/api/savings-groups/my-groups"),
          axiosInstance.get("/api/savings-groups/public")
        ]);

        // Update to handle the new response structure
        setMyGroups(groupsRes.data.data?.groups || []);
        setPublicGroups(publicGroupsRes.data.data?.groups || []);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };

    fetchUserData();
    fetchData();
  }, [navigate]);

  const goToDeposit = async () => {
    try {
      const res = await axiosInstance.post("/momo/token");
      if (res.data.data?.access_token) {
        localStorage.setItem("momoToken", res.data.data.access_token);
      }
      navigate("/deposit");
    } catch (err) {
      console.error("Failed to generate MoMo token:", err);
      setError("Failed to generate payment token. Please try again.");
    }
  };

  const goToWithdraw = () => navigate("/withdraw");

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return "E0.00";
    return `E${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <FaArrowUp className="text-green-600" />;
      case 'withdrawal': return <FaArrowDown className="text-blue-600" />;
      case 'penalty': return <FaExclamationTriangle className="text-red-600" />;
      default: return <FaExchangeAlt className="text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit': return 'border-l-green-500 bg-green-50';
      case 'withdrawal': return 'border-l-blue-500 bg-blue-50';
      case 'penalty': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getDepositStatusInfo = (deposit) => {
    const now = new Date();
    const depositTime = new Date(deposit.createdAt);
    const lockPeriodInHours = deposit.lockPeriodInDays * 24;
    
    // Calculate maturity date
    const maturityDate = new Date(depositTime);
    maturityDate.setHours(maturityDate.getHours() + lockPeriodInHours);
    
    const isMatured = now >= maturityDate;
    
    if (deposit.status !== 'locked') {
      return { 
        status: deposit.status === 'withdrawn-early' ? 'Withdrawn Early' : 'Withdrawn', 
        color: 'text-gray-600', 
        icon: FaCheckCircle,
        bgColor: 'bg-gray-100',
        canWithdraw: false
      };
    }
    
    if (isMatured) {
      return { 
        status: 'Matured - Ready', 
        color: 'text-green-600', 
        icon: FaCheckCircle,
        bgColor: 'bg-green-100',
        canWithdraw: true,
        penalty: 0
      };
    }
    
    // Early withdrawal with penalty
    const penalty = deposit.amount * 0.10; // 10% penalty
    return { 
      status: 'Early (10% penalty)', 
      color: 'text-yellow-600', 
      icon: FaExclamationTriangle,
      bgColor: 'bg-yellow-100',
      canWithdraw: true,
      penalty: penalty
    };
  };

  // Calculate comprehensive statistics
  const calculateStats = () => {
    if (!vaultInfo) return null;

    const transactions = vaultInfo.recentTransactions || [];
    const deposits = vaultInfo.lockedDeposits || [];
    
    // Transaction-based calculations
    const depositTransactions = transactions.filter(t => t.type === 'deposit');
    const withdrawalTransactions = transactions.filter(t => t.type === 'withdrawal');
    const penaltyTransactions = transactions.filter(t => t.type === 'penalty');
    
    const totalDeposited = depositTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalWithdrawn = withdrawalTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPenalties = penaltyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Active deposits calculations
    const activeDeposits = deposits.filter(d => d.status === 'locked');
    const totalLockedAmount = activeDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    // Withdrawable amount calculation
    const withdrawableAmount = withdrawableDeposits.reduce((sum, d) => sum + (d.netAmount || 0), 0);
    
    return {
      vaultBalance: vaultInfo.vault?.balance || 0,
      totalDeposited,
      totalWithdrawn,
      totalPenalties,
      totalLockedAmount,
      withdrawableAmount,
      activeDepositsCount: activeDeposits.length,
      totalDepositsCount: deposits.length,
      totalTransactions: transactions.length,
      depositTransactionsCount: depositTransactions.length,
      withdrawalTransactionsCount: withdrawalTransactions.length,
      penaltyTransactionsCount: penaltyTransactions.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your vault...</p>
        </div>
      </div>
    );
  }

  // Add to nav items
  const navItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { id: 'deposits', icon: FaLock, label: 'My Deposits' },
    { id: 'transactions', icon: FaExchangeAlt, label: 'Transactions' },
    { id: 'withdrawals', icon: FaArrowDown, label: 'Withdrawals' },
    { id: 'savings-groups', icon: FaUserFriends, label: 'Savings Groups' },
  ];

  const renderSavingsGroupsTab = () => (
    <div className="space-y-6">
      {/* My Groups */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg text-momoBlue">My Savings Groups</h3>
          <button
            onClick={() => navigate('/savings-groups/public')}
            className="bg-momoYellow text-momoBlue px-4 py-2 rounded-lg hover:brightness-110"
          >
            Join a Group
          </button>
        </div>

        {myGroups.length > 0 ? (
          <div className="grid gap-4">
            {myGroups.map(group => (
              <div key={group._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{group.name}</h4>
                    <p className="text-sm text-gray-600">{group.description}</p>
                    <div className="mt-2 flex gap-2 text-sm">
                      <span>Progress: {((group.currentAmount / group.targetAmount) * 100).toFixed(1)}%</span>
                      <span>Members: {group.currentMembers}/{group.maxMembers}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/savings-groups/${group._id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaUserFriends className="text-5xl mx-auto mb-3 opacity-50" />
            <p>You have not joined any savings groups yet</p>
            <button
              onClick={() => navigate('/savings-groups/public')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Browse Available Groups
            </button>
          </div>
        )}
      </section>

      {/* Public Groups */}
      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg text-momoBlue mb-6">Featured Groups</h3>
        <div className="grid gap-4">
          {publicGroups.slice(0, 3).map(group => (
            <div key={group._id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{group.name}</h4>
                  <p className="text-sm text-gray-600">{group.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Minimum contribution: E{group.minimumContribution}
                  </div>
                </div>
              
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <>
      <StudentViewCommonHeader />
      <div className="flex min-h-screen bg-gray-50 text-gray-800">
        {/* Sidebar */}
        <aside className="w-64 bg-momoBlue text-white p-6 space-y-6 hidden md:block">
          <div className="flex items-center gap-2 text-2xl font-bold text-momoYellow">
            <FaWallet />
            Mo Pocket
          </div>
          <nav className="space-y-2">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-white/20 text-momoYellow font-semibold'
                    : 'hover:bg-white/10 hover:text-momoYellow'
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {user?.userName || 'User'}!
              </h1>
              <p className="text-gray-600">Manage your vault and track your savings</p>
              {user?.phoneNumber && (
                <p className="text-sm text-gray-500">Phone: {user.phoneNumber}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToDeposit}
                className="bg-momoYellow text-momoBlue font-semibold px-4 py-2 rounded-lg hover:brightness-110 flex items-center gap-2 transition-all"
              >
                <FaArrowUp />
                Deposit
              </button>
              <button
                onClick={goToWithdraw}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all"
              >
                <FaArrowDown />
                Withdraw
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaTimesCircle />
              {error}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium">Total Deposited</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats?.totalDeposited)}
                      </p>
                      <p className="text-xs text-gray-400">{stats?.depositTransactionsCount || 0} deposits</p>
                    </div>
                    <FaChartLine className="text-3xl text-blue-500" />
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium">Available to Withdraw</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats?.withdrawableAmount)}
                      </p>
                      <p className="text-xs text-gray-400">After fees & penalties</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-green-500" />
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium">Active Deposits</h3>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats?.activeDepositsCount || 0}
                      </p>
                      <p className="text-xs text-gray-400">{formatCurrency(stats?.totalLockedAmount)} locked</p>
                    </div>
                    <FaLock className="text-3xl text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm text-gray-500 font-medium">Total Fees Paid</h3>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(stats?.totalPenalties)}
                      </p>
                      <p className="text-xs text-gray-400">{stats?.penaltyTransactionsCount || 0} penalty transactions</p>
                    </div>
                    <FaExclamationTriangle className="text-3xl text-red-500" />
                  </div>
                </div>
              </section>

              {/* Quick Summary */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Summary */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                  <h3 className="font-semibold text-lg text-momoBlue mb-4 flex items-center gap-2">
                    <FaWallet />
                    Account Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Deposits Made:</span>
                      <span className="font-semibold">{stats?.depositTransactionsCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Withdrawals:</span>
                      <span className="font-semibold">{stats?.withdrawalTransactionsCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Net Position:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency((stats?.totalDeposited || 0) - (stats?.totalWithdrawn || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Vault Balance:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(stats?.vaultBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Rules */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                  <h3 className="font-semibold text-lg text-momoBlue mb-4 flex items-center gap-2">
                    <FaInfoCircle />
                    Withdrawal Rules
                  </h3>
                  <div className="space-y-4">
                    <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaExclamationTriangle className="text-yellow-600" />
                        <span className="font-semibold">Early Withdrawal</span>
                      </div>
                      <p className="text-sm text-gray-600">10% penalty + E5 fee if withdrawn before maturity</p>
                    </div>
                    <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCheckCircle className="text-green-600" />
                        <span className="font-semibold">Matured Withdrawal</span>
                      </div>
                      <p className="text-sm text-gray-600">Only E5 flat fee (no penalty) after lock period</p>
                    </div>
                    <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaClock className="text-blue-600" />
                        <span className="font-semibold">24-Hour Wait</span>
                      </div>
                      <p className="text-sm text-gray-600">Wait 24 hours before withdrawal</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Deposits Tab */}
          {activeTab === 'deposits' && (
            <section className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-momoBlue">My Locked Deposits</h3>
                <span className="text-sm text-gray-500">
                  {stats?.activeDepositsCount || 0} active deposits
                </span>
              </div>
              
              {vaultInfo?.lockedDeposits?.length > 0 ? (
                <div className="space-y-4">
                  {vaultInfo.lockedDeposits.map((deposit, index) => {
                    const statusInfo = getDepositStatusInfo(deposit);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={deposit._id || index} className={`border rounded-lg p-4 hover:shadow-md transition-all ${statusInfo.bgColor}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FaMoneyBillWave className="text-green-600" />
                              <span className="font-semibold text-lg">{formatCurrency(deposit.amount)}</span>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {deposit.lockPeriodInDays} day{deposit.lockPeriodInDays !== 1 ? 's' : ''} lock
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Deposited:</strong> {formatDate(deposit.createdAt)}</p>
                              <p><strong>Matures:</strong> {formatDate(deposit.endDate)}</p>
                              {statusInfo.penalty > 0 && (
                                <p className="text-red-600">
                                  <strong>Early withdrawal penalty:</strong> {formatCurrency(statusInfo.penalty)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`flex items-center gap-1 ${statusInfo.color} font-semibold mb-2`}>
                              <StatusIcon />
                              <span className="text-sm">{statusInfo.status}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              deposit.status === 'locked' ? 'bg-yellow-200 text-yellow-800' : 
                              deposit.status === 'withdrawn-early' ? 'bg-red-200 text-red-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {deposit.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaLock className="text-6xl mx-auto mb-4 opacity-30" />
                  <h4 className="text-lg font-semibold mb-2">No deposits found</h4>
                  <p className="mb-4">Start saving today and watch your money grow!</p>
                  <button
                    onClick={goToDeposit}
                    className="bg-momoYellow text-momoBlue px-6 py-3 rounded-lg hover:brightness-110 font-semibold transition-all"
                  >
                    Make Your First Deposit
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <section className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-momoBlue">Transaction History</h3>
                <span className="text-sm text-gray-500">
                  {stats?.totalTransactions || 0} total transactions
                </span>
              </div>
              
              {vaultInfo?.recentTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {vaultInfo.recentTransactions.map((transaction, index) => (
                    <div key={transaction._id || index} className={`border-l-4 p-4 rounded-lg ${getTransactionColor(transaction.type)} hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-semibold capitalize">{transaction.type}</p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                            {transaction.momoTransactionId && (
                              <p className="text-xs text-gray-500 font-mono">
                                Ref: {transaction.momoTransactionId.substring(0, 12)}...
                              </p>
                            )}
                            {transaction.lockPeriodInDays && (
                              <p className="text-xs text-gray-500">
                                Lock period: {transaction.lockPeriodInDays} days
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-lg ${
                            transaction.type === 'deposit' ? 'text-green-600' : 
                            transaction.type === 'withdrawal' ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          {transaction.penaltyFee > 0 && (
                            <p className="text-xs text-red-600">
                              Fee: {formatCurrency(transaction.penaltyFee)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaExchangeAlt className="text-6xl mx-auto mb-4 opacity-30" />
                  <h4 className="text-lg font-semibold mb-2">No transactions found</h4>
                  <p>Your transaction history will appear here</p>
                </div>
              )}
            </section>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <section className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-momoBlue">Withdrawal History & Options</h3>
                <button
                  onClick={goToWithdraw}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all"
                >
                  <FaArrowDown />
                  New Withdrawal
                </button>
              </div>

              {/* Withdrawable Deposits Summary */}
              {withdrawableDeposits.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <FaEye />
                    Available for Withdrawal
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Deposits available:</span>
                      <span className="font-semibold ml-2">{withdrawableDeposits.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total amount:</span>
                      <span className="font-semibold ml-2">
                        {formatCurrency(withdrawableDeposits.reduce((sum, d) => sum + d.amount, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Net after fees:</span>
                      <span className="font-semibold ml-2 text-green-600">
                        {formatCurrency(withdrawableDeposits.reduce((sum, d) => sum + d.netAmount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Withdrawal History */}
              {vaultInfo?.recentTransactions?.filter(t => t.type === 'withdrawal').length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 mb-3">Recent Withdrawals</h4>
                  {vaultInfo.recentTransactions
                    .filter(t => t.type === 'withdrawal')
                    .map((withdrawal, index) => (
                      <div key={withdrawal._id || index} className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <FaArrowDown className="text-blue-600" />
                            <div>
                              <p className="font-semibold">Withdrawal</p>
                              <p className="text-sm text-gray-600">{formatDate(withdrawal.createdAt)}</p>
                              {withdrawal.momoTransactionId && (
                                <p className="text-xs text-gray-500 font-mono">
                                  Ref: {withdrawal.momoTransactionId.substring(0, 12)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-blue-600">
                              {formatCurrency(withdrawal.amount)}
                            </p>
                            {withdrawal.penaltyFee > 0 && (
                              <p className="text-xs text-red-600">
                                Total fees: {formatCurrency(withdrawal.penaltyFee)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaArrowDown className="text-6xl mx-auto mb-4 opacity-30" />
                  <h4 className="text-lg font-semibold mb-2">No withdrawals yet</h4>
                  <p className="mb-4">When you are ready, you can withdraw your deposits</p>
                  <button
                    onClick={goToWithdraw}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition-all"
                  >
                    Make a Withdrawal
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Savings Groups Tab */}
          {activeTab === 'savings-groups' && renderSavingsGroupsTab()}
        </main>
      </div>
    </>
  );
}