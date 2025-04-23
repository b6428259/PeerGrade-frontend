import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

interface Group {
  _id: string;
  groupName: string;
  members: { _id: string; name: string }[];
}

interface GroupsListProps {
  courseId: string;
  groups: Group[];
  students: { _id: string; name: string }[];
  selectedGroup: string;
  onSelectGroup: (groupId: string) => void;
  onGroupsChange: () => void;
}

export default function GroupsList({ 
  courseId,
  groups, 
  students,
  selectedGroup, 
  onSelectGroup,
  onGroupsChange
}: GroupsListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateGroup = async (groupName: string, memberIds: string[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupName,
          courseId,
          memberIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      onGroupsChange(); // Refresh groups list
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Groups</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Create Group
        </button>
      </div>

      <div className="space-y-4">
        {groups.length === 0 ? (
          <p className="text-gray-400">No groups found for this course.</p>
        ) : (
          groups.map((group) => (
            <button
              key={group._id}
              onClick={() => onSelectGroup(group._id)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                selectedGroup === group._id
                  ? 'bg-blue-600/30 border border-blue-500/50'
                  : 'bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{group.groupName}</h3>
                <span className="text-sm text-gray-400">
                  {group.members.length} members
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Members: {group.members.map(m => m.name).join(', ')}
              </div>
            </button>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          courseId={courseId}
          students={students}
          onClose={() => setShowCreateModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
}