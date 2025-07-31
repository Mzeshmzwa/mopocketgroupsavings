import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import StudentViewCommonHeader from "@/components/user-view/header";
import { 
  FaUsers, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaClock,
  FaUserCircle,
  FaSpinner 
} from 'react-icons/fa';

export default function GroupDetails() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const progress = (group.currentAmount / group.targetAmount) * 100;

  return (
    <>
      <StudentViewCommonHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
                  <p className="text-gray-600 mt-1">{group.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  group.status === 'active' ? 'bg-green-100 text-green-800' :
                  group.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {group.status}
                </span>
              </div>
            </div>

            {/* Progress and Stats */}
            <div className="p-6 border-b">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-700">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" />
                    <span className="text-sm text-gray-600">Target Amount</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">E{group.targetAmount}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaChartLine className="text-blue-600" />
                    <span className="text-sm text-gray-600">Current Amount</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">E{group.currentAmount}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-purple-600" />
                    <span className="text-sm text-gray-600">Members</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {group.currentMembers}/{group.maxMembers}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-orange-600" />
                    <span className="text-sm text-gray-600">Contribution</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    Min: E{group.minimumContribution}
                  </p>
                  <p className="text-sm text-gray-600">{group.contributionFrequency}</p>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Members</h2>
              <div className="space-y-4">
                {group.members.map((member, index) => (
                  <div
                    key={`${member.userId}-${index}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FaUserCircle className="text-2xl text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800">
                          {typeof member.userId === 'string' 
                            ? `User #${member.userId.slice(0, 8)}` 
                            : `User #${member.userId?._id?.slice(0, 8) || 'Unknown'}`
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">
                        E{member.totalContributed || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        {member.lastContribution ? 
                          `Last: ${new Date(member.lastContribution).toLocaleDateString()}` :
                          'No contributions yet'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
