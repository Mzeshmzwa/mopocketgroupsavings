import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import StudentViewCommonHeader from "@/components/user-view/header";
import { FaUsers, FaMoneyBillWave, FaInfoCircle, FaSpinner } from 'react-icons/fa';

export default function JoinGroup() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const { groupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await axiosInstance.get(`/api/savings-groups/${groupId}`);
        setGroup(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      await axiosInstance.post(`/api/savings-groups/${groupId}/join`);
      navigate(`/savings-groups/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <>
        <StudentViewCommonHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
        </div>
      </>
    );
  }

  if (error || !group) {
    return (
      <>
        <StudentViewCommonHeader />
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
            <p className="text-red-600">{error || 'Group not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentViewCommonHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Join Savings Group</h1>

            <div className="space-y-6">
              {/* Group Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{group.name}</h2>
                <p className="text-gray-600 mt-1">{group.description}</p>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" />
                    <span className="text-sm text-gray-600">Minimum Contribution</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">E{group.minimumContribution}</p>
                  <p className="text-sm text-gray-600">{group.contributionFrequency}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-blue-600" />
                    <span className="text-sm text-gray-600">Group Size</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {group.currentMembers}/{group.maxMembers} members
                  </p>
                </div>
              </div>

              {/* Rules and Requirements */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Rules</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium">Contribution Requirements</p>
                      <p className="text-sm text-gray-600">
                        Members must contribute at least E{group.minimumContribution} {group.contributionFrequency}
                      </p>
                    </div>
                  </div>

                  {group.rules.allowEarlyWithdrawal ? (
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="text-yellow-600 mt-1" />
                      <div>
                        <p className="font-medium">Early Withdrawal</p>
                        <p className="text-sm text-gray-600">
                          Allowed with {group.rules.penaltyPercentage}% penalty
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="text-red-600 mt-1" />
                      <div>
                        <p className="font-medium">Early Withdrawal</p>
                        <p className="text-sm text-gray-600">Not allowed</p>
                      </div>
                    </div>
                  )}

                  {group.rules.requiresApproval && (
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="text-purple-600 mt-1" />
                      <div>
                        <p className="font-medium">Admin Approval</p>
                        <p className="text-sm text-gray-600">
                          Required for major actions
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
