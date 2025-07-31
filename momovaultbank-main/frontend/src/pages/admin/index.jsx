import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import {
  FaUsers,
  FaPiggyBank,
  FaExchangeAlt,
  FaHome,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaDownload,
  FaChartLine,
  FaMoneyBillWave,
  FaPercent,
  FaUserFriends, // Add this import for savings groups
  FaTrash,// Import trash icon for delete action
} from "react-icons/fa";
import StudentViewCommonHeader from "@/components/user-view/header";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [savingsGroups, setSavingsGroups] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get statistics first
        const statsRes = await axiosInstance.get("/api/savings-groups/admin/statistics");
        
        // Other data fetching
        const [groupsRes, userRes, txRes, vaultRes] = await Promise.all([
          axiosInstance.get("/api/savings-groups/admin/all"),
          axiosInstance.get("/api/admin/users"),
          axiosInstance.get("/api/admin/transaction"),
          axiosInstance.get("/api/admin/vault")
        ]);

        if (statsRes.data.success) {
          setRevenueData(statsRes.data.data);
        }

        setSavingsGroups(groupsRes.data.data.groups || []);
        setUsers(userRes.data.users || []);
        setTransactions(txRes.data.transaction || []);
        setVaults(vaultRes.data.vault || []);

      } catch (err) {
        console.error("Admin fetch error:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add group status change handler
  const handleGroupStatusChange = async (groupId, newStatus) => {
    try {
      await axiosInstance.put(`/api/savings-groups/${groupId}`, { status: newStatus });
      // Refresh groups after status change
      const groupsRes = await axiosInstance.get("/api/savings-groups/admin/all");
      if (groupsRes.data.success) {
        setSavingsGroups(groupsRes.data.data.groups);
      }
    } catch (err) {
      console.error("Failed to update group status:", err);
    }
  };

  // Add delete handler function near other handlers
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return;
    }
    
    try {
      await axiosInstance.delete(`/api/savings-groups/${groupId}`);
      // Refresh groups list after deletion
      const groupsRes = await axiosInstance.get("/api/savings-groups/admin/all");
      if (groupsRes.data.success) {
        setSavingsGroups(groupsRes.data.data.groups);
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
      alert('Failed to delete group. ' + (err.response?.data?.message || ''));
    }
  };

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalTransactions: transactions.length,
    totalVaults: vaults.length,
    totalDeposits: transactions.filter(t => t.type === 'deposit').length,
    totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').length,
    totalPenalties: transactions.filter(t => t.type === 'penalty').length,
    totalDepositAmount: transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    totalWithdrawalAmount: transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    totalPenaltyAmount: transactions
      .filter(t => t.type === 'penalty')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
  };

  const totalUserPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );

  // Filter transactions based on search and filter
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === "" || 
      tx.momoTransactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || tx.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      case 'deposit': return 'bg-green-50 border-green-200';
      case 'withdrawal': return 'bg-blue-50 border-blue-200';
      case 'penalty': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Add to nav items array in render
  const navItems = [
    { id: 'overview', icon: FaHome, label: 'Overview' },
    { id: 'revenue', icon: FaChartLine, label: 'Revenue' },
    { id: 'users', icon: FaUsers, label: 'Users' },
    { id: 'transactions', icon: FaExchangeAlt, label: 'Transactions' },
    { id: 'vaults', icon: FaPiggyBank, label: 'Vaults' },
    { id: 'savings-groups', icon: FaUserFriends, label: 'Savings Groups' },
  ];

  return (
    <>
      <StudentViewCommonHeader />
      <div className="min-h-screen flex bg-gray-50 text-gray-800">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-6 space-y-6 hidden md:block">
          <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
           
            Mo Pocket Admin
          </div>
          <nav className="space-y-2">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-blue-600">Admin Dashboard</h2>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <FaDownload />
              Export Data
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Users</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                    </div>
                    <FaUsers className="text-3xl text-blue-500" />
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Deposits</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalDeposits}</p>
                      <p className="text-xs text-gray-400">E{stats.totalDepositAmount.toFixed(2)}</p>
                    </div>
                    <FaArrowUp className="text-3xl text-green-500" />
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Withdrawals</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalWithdrawals}</p>
                      <p className="text-xs text-gray-400">E{stats.totalWithdrawalAmount.toFixed(2)}</p>
                    </div>
                    <FaArrowDown className="text-3xl text-blue-500" />
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">System Revenue</p>
                      <p className="text-2xl font-bold text-red-600">
                        E{revenueData?.revenueBreakdown?.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-400">Fees & Penalties</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-red-500" />
                  </div>
                </div>

                {/* New Total Savings Balance Card */}
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Savings Balance</p>
                      <p className="text-2xl font-bold text-purple-600">
                        E{(revenueData?.totalSavingsBalance || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Active Groups: {revenueData?.activeGroups || 0}
                      </p>
                    </div>
                    <FaPiggyBank className="text-3xl text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${getTransactionColor(tx.type)}`}>
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">E{tx.amount?.toFixed(2) || '0.00'}</p>
                        {tx.penaltyFee > 0 && (
                          <p className="text-xs text-red-500">Penalty: E{tx.penaltyFee.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && revenueData && (
            <div className="space-y-6">
              {/* Revenue Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total System Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        E{revenueData.revenueBreakdown.totalRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">All fees & penalties</p>
                    </div>
                    <FaChartLine className="text-3xl text-green-500" />
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Flat Fees Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">
                        E{revenueData.revenueBreakdown.flatFeesRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{revenueData.revenueBreakdown.flatFeesCount} transactions</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-blue-500" />
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Early Withdrawal Penalties</p>
                      <p className="text-2xl font-bold text-red-600">
                        E{revenueData.revenueBreakdown.earlyWithdrawalPenaltiesRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{revenueData.revenueBreakdown.earlyWithdrawalPenaltiesCount} penalties</p>
                    </div>
                    <FaPercent className="text-3xl text-red-500" />
                  </div>
                </div>
              </div>

              {/* System Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-xl font-bold text-gray-800">{revenueData.systemStats.totalUsers}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Deposits</p>
                    <p className="text-xl font-bold text-gray-800">{revenueData.systemStats.totalDeposits}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Withdrawals</p>
                    <p className="text-xl font-bold text-gray-800">{revenueData.systemStats.totalWithdrawals}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Current Locked Funds</p>
                    <p className="text-xl font-bold text-gray-800">E{revenueData.systemStats.currentLockedFunds.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Deposits Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      E{revenueData.systemStats.totalDepositsAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Withdrawals Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      E{revenueData.systemStats.totalWithdrawalsAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Net User Funds</p>
                    <p className="text-2xl font-bold text-purple-600">
                      E{revenueData.systemStats.netUserFunds.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Summary */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">System Profitability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-green-100">System Profit</p>
                    <p className="text-3xl font-bold">E{revenueData.systemStats.systemProfit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-100">Profit Margin</p>
                    <p className="text-3xl font-bold">{revenueData.summary.systemProfitMargin}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Users</h3>
              <div className="grid gap-4">
                {paginatedUsers.map((user, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{user.userName}</h4>
                        <p className="text-sm text-gray-600">{user.userEmail}</p>
                        <p className="text-sm text-gray-500">Phone: {user.phoneNumber}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {totalUserPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-700">
                    Showing {(userPage - 1) * usersPerPage + 1} to {Math.min(userPage * usersPerPage, users.length)} of {users.length} users
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserPage(userPage - 1)}
                      disabled={userPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setUserPage(page)}
                        className={`px-3 py-1 border rounded-md ${
                          userPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setUserPage(userPage + 1)}
                      disabled={userPage === totalUserPages}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="penalty">Penalties</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTransactions.map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.type)}
                            <span className="capitalize font-medium">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold">
                          E{tx.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {tx.penaltyFee > 0 ? (
                            <span className="text-red-600 font-medium">E{tx.penaltyFee.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {tx.momoTransactionId ? tx.momoTransactionId.substring(0, 8) + '...' : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 border rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vaults Tab */}
          {activeTab === 'vaults' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">User Vaults</h3>
              <div className="grid gap-4">
                {vaults.map((vault, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">Vault #{vault._id?.substring(0, 8)}</h4>
                        <p className="text-sm text-gray-600">User ID: {vault.userId?.substring(0, 8)}...</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">E{vault.balance?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-500">Balance</p>
                      </div>
                    </div>
                    
                    {vault.lockedDeposits && vault.lockedDeposits.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 mb-2">Locked Deposits:</h5>
                        <div className="space-y-2">
                          {vault.lockedDeposits.map((deposit, depositIndex) => (
                            <div key={depositIndex} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">E{deposit.amount}</p>
                                  <p className="text-sm text-gray-600">
                                    {deposit.lockPeriodInDays} days • {deposit.status}
                                  </p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <p>Start: {formatDate(deposit.startDate)}</p>
                                  <p>End: {formatDate(deposit.endDate)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Savings Groups Tab */}
          {activeTab === 'savings-groups' && (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Savings Groups</h3>
        <button 
          onClick={() => navigate("/savings-groups/create")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaUserFriends />
          Create Savings Group
        </button>
      </div>

      {savingsGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No savings groups found
        </div>
      ) : (
        <div className="grid gap-4">
          {savingsGroups.map((group) => (
            <div key={group._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{group.name}</h4>
                  <p className="text-sm text-gray-600">
                    Created by: {group.createdBy?.userName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Members: {group.currentMembers}/{group.maxMembers}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    E{group.currentAmount?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-gray-500">Current Amount</p>
                  <span className={`inline-block px-2 py-1 mt-2 rounded-full text-xs font-medium ${
                    group.status === 'active' ? 'bg-green-100 text-green-800' : 
                    group.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {group.status}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Target: E{group.targetAmount?.toFixed(2) || '0.00'}</span>
                  <span>Progress: {Math.round((group.currentAmount / group.targetAmount) * 100)}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min((group.currentAmount / group.targetAmount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Group Actions */}
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => navigate(`/savings-groups/${group._id}`)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Details
                </button>
                
              </div>
            </div>
          ))}
    </div>  
  )}    
  </div>
  )}
 </main>
      </div> 
    </>
  );
}