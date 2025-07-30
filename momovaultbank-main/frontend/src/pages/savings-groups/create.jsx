import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import StudentViewCommonHeader from "@/components/user-view/header";
import { FaCalendar, FaUsers, FaMoneyBillWave, FaClock } from 'react-icons/fa';

export default function CreateSavingsGroup() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    maxMembers: '',
    minimumContribution: '',
    contributionFrequency: 'weekly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    allowEarlyWithdrawal: false,
    penaltyPercentage: '10',
    requiresApproval: true,
    isPublic: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formattedData = {
        ...formData,
        targetAmount: Number(formData.targetAmount),
        maxMembers: Number(formData.maxMembers),
        minimumContribution: Number(formData.minimumContribution),
        penaltyPercentage: Number(formData.penaltyPercentage),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isPublic: true // Ensure groups are created as public by default
      };

      const response = await axiosInstance.post('/api/savings-groups/create', formattedData);
      if (response.data.success) {
        navigate('/savings-groups/public'); // Redirect to public groups page after creation
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
      console.error('Create group error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StudentViewCommonHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Create Savings Group</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Group Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Financial Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Amount (E)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMoneyBillWave className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Contribution (E)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMoneyBillWave className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minimumContribution}
                    onChange={(e) => setFormData({...formData, minimumContribution: e.target.value})}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Group Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Members</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUsers className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="2"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contribution Frequency</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaClock className="text-gray-400" />
                  </div>
                  <select
                    value={formData.contributionFrequency}
                    onChange={(e) => setFormData({...formData, contributionFrequency: e.target.value})}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Rules */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowEarlyWithdrawal"
                    checked={formData.allowEarlyWithdrawal}
                    onChange={(e) => setFormData({...formData, allowEarlyWithdrawal: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowEarlyWithdrawal" className="ml-2 block text-sm text-gray-700">
                    Allow Early Withdrawal
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({...formData, requiresApproval: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-700">
                    Require Admin Approval for Actions
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make Group Public
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
