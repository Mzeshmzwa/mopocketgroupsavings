import { useEffect, useState } from 'react';
import axiosInstance from "@/api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { FaUserFriends, FaSpinner } from "react-icons/fa";
import StudentViewCommonHeader from "@/components/user-view/header";

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axiosInstance.get("/api/savings-groups/my-groups");
        setGroups(response.data.data.groups || []);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <StudentViewCommonHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Savings Groups</h1>
       
        </div>

        {groups.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <div key={group._id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                <p className="text-gray-600 mb-4">{group.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Target Amount:</span>
                    <span className="font-medium">E{group.targetAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <span className="font-medium">{group.currentMembers}/{group.maxMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contribution:</span>
                    <span className="font-medium">E{group.minimumContribution}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => navigate(`/savings-groups/${group._id}`)}
                    className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUserFriends className="text-6xl mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">No Groups Found</h2>
            <p className="text-gray-600 mb-4">You have not joined any savings groups yet.</p>
            <button
              onClick={() => navigate('/api/savings-groups/public')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Browse Available Groups
            </button>
          </div>
        )}
      </div>
    </>
  );
}
