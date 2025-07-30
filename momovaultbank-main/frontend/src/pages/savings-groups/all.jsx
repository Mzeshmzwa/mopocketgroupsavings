import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaMoneyBillWave, FaClock, FaEdit, FaTrash, FaCheck, FaBan } from 'react-icons/fa';

const AllGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllGroups = async () => {
      try {
        console.log('Fetching all groups...');
        const response = await axios.get('/api/savings-groups/admin/all');
        console.log('Groups response:', response.data);
        if (response.data.success && response.data.data.groups) {
          setGroups(response.data.data.groups);
        } else {
          setError('No groups data found in response');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError(err.response?.data?.message || 'Failed to fetch groups');
        setLoading(false);
      }
    };

    fetchAllGroups();
  }, []);

  const handleStatusChange = async (groupId, newStatus) => {
    try {
      await axios.patch(`/api/savings-groups/${groupId}/status`, { status: newStatus });
      setGroups(groups.map(group => 
        group._id === groupId ? { ...group, status: newStatus } : group
      ));
    } catch (err) {
      setError('Failed to update group status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Savings Groups</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group._id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{group.name}</h2>
              <div className="flex gap-2">
                <FaEdit className="text-blue-500 cursor-pointer" />
                <FaTrash className="text-red-500 cursor-pointer" />
              </div>
            </div>

            <p className="text-gray-600 mb-4">{group.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" />
                  <span className="text-sm">Target: E{group.targetAmount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-500" />
                  <span className="text-sm">Members: {group.currentMembers}/{group.maxMembers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-orange-500" />
                  <span className="text-sm">Min: E{group.minimumContribution}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Created: {new Date(group.createdAt).toLocaleDateString()}</div>
                <div className="text-sm">Type: {group.isPublic ? 'Public' : 'Private'}</div>
                <div className={`text-sm font-medium ${
                  group.status === 'active' ? 'text-green-600' : 
                  group.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  Status: {group.status}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handleStatusChange(group._id, 'active')}
                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <FaCheck /> Activate
              </button>
              <button
                onClick={() => handleStatusChange(group._id, 'suspended')}
                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <FaBan /> Suspend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllGroups;
