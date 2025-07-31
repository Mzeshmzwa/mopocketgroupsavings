import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaPhone,
  FaSpinner,
} from "react-icons/fa";
import StudentViewCommonHeader from "@/components/user-view/header";

export default function ContributePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [contributing, setContributing] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/savings-groups/${groupId}`);
        if (res.data.success) {
          setGroup(res.data.data);
        } else {
          setError('Failed to fetch group details');
        }
      } catch (error) { // Changed from err to error since it's used
        setError('Error fetching group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number format
      const phoneRegex = /^7[678]\d{6}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError('Invalid phone number. Must be 8 digits and start with 76, 77, or 78.');
        setLoading(false);
        return;
      }

      // Convert amount to number and validate
      const contributionAmount = parseFloat(formData.amount);
      if (isNaN(contributionAmount) || contributionAmount < group.minimumContribution) {
        setError(`Contribution must be at least E${group.minimumContribution}`);
        setLoading(false);
        return;
      }

      // Make contribution request with properly formatted amount
      const res = await axiosInstance.post(`/api/savings-groups/${groupId}/contribute`, {
        ...formData,
        amount: contributionAmount // Send as number, not string
      });
      
      if (res.data.success) {
        navigate(`/savings-groups/${groupId}`);
      } else {
        setError(res.data.message || 'Failed to make contribution');
      }
    } catch (error) { // Changed from err to error since it's used
      setError('Error processing contribution');
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <StudentViewCommonHeader />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Contribute to {group.name}
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contribution Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contribution Amount (E)
              </label>
              <div className="relative">
                <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={group.minimumContribution}
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Minimum contribution: E{group.minimumContribution}
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MoMo Phone Number
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  pattern="7[678]\d{6}"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="76123456"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter your Eswatini MoMo number
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                placeholder="Add a note for your contribution"
              />
            </div>

            {/* Group Progress */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Group Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Current Amount</span>
                  <span>E{group.currentAmount} / E{group.targetAmount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(group.currentAmount / group.targetAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={contributing}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2`}
              >
                {contributing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave />
                    Make Contribution
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}