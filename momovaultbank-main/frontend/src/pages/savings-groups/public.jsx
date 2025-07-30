import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { FaUsers, FaMoneyBillWave, FaClock, FaArrowRight } from 'react-icons/fa';

const PublicGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const [publicGroupsRes, myGroupsRes] = await Promise.all([
          axiosInstance.get('/api/savings-groups/public'),
          axiosInstance.get('/api/savings-groups/my-groups')
        ]);
        
        setGroups(publicGroupsRes.data.data.groups);
        setUserGroups(myGroupsRes.data.data.groups.map(g => g._id));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError(err?.response?.data?.message || 'Failed to fetch groups');
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await axiosInstance.post(`/api/savings-groups/${groupId}/join`);
      if (response.data.success) {
        navigate('/savings-groups/my-groups');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join group');
    }
  };

  const isUserMember = (groupId) => {
    return userGroups.includes(groupId);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Savings Groups</h1>
        <button
          onClick={() => navigate('/savings-groups/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaUsers className="mx-auto text-5xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Public Groups Available</h2>
          <p className="text-gray-500 mb-4">Be the first to create a savings group!</p>
          <button
            onClick={() => navigate('/savings-groups/create')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create a Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{group.name}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {group.status}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{group.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <FaMoneyBillWave className="text-green-500" />
                  <span>Target: E{group.targetAmount}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaUsers className="text-blue-500" />
                  <span>Members: {group.currentMembers}/{group.maxMembers}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaClock className="text-orange-500" />
                  <span>Minimum: E{group.minimumContribution}</span>
                </div>
              </div>

              <div className="flex justify-end">
                {isUserMember(group._id) ? (
                  <button
                    onClick={() => navigate(`/savings-groups/${group._id}/contribute`)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaMoneyBillWave /> Contribute
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinGroup(group._id)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join Group <FaArrowRight />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicGroups;
