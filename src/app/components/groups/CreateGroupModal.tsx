import { useState, memo } from 'react';
import axios from 'axios';
import { AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCustomToast } from '@/app/components/common/Toast';

interface Student {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourse: Course | null;
  availableStudents: Student[];
  onGroupCreated: () => void;
}

const CreateGroupModal = memo(({ 
  isOpen, 
  onClose, 
  selectedCourse, 
  availableStudents,
  onGroupCreated
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Reset state when modal opens with a new course
  if (!isOpen) return null;
  
  // Handle group creation
  const handleCreateGroup = async () => {
    if (!selectedCourse || !groupName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/groups',
        {
          groupName,
          courseId: selectedCourse._id,
          memberIds: selectedStudents
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        showSuccessToast('Group created successfully');
        setGroupName('');
        setSelectedStudents([]);
        onGroupCreated();
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      showErrorToast(error.response?.data?.error || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Close and reset modal
  const handleClose = () => {
    setGroupName('');
    setSelectedStudents([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={handleClose}>
      <div 
        className="bg-gray-800 rounded-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-white">Create Group</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-5">
          <p className="text-gray-300 text-sm mb-1">Course:</p>
          <div className="flex items-center bg-gray-700/50 p-3 rounded-lg">
            <AcademicCapIcon className="h-5 w-5 text-blue-400 mr-2" />
            <div>
              <p className="text-white">{selectedCourse?.courseCode}</p>
              <p className="text-sm text-gray-400">{selectedCourse?.courseName}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-5">
          <label htmlFor="groupName" className="block text-sm font-medium mb-2 text-gray-300">
            Group Name
          </label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Enter group name"
            autoComplete="off"
          />
        </div>
        
        {/* Available Students to Add */}
        {availableStudents?.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Invite Students
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-700/30 rounded-lg p-3">
              {availableStudents.map(student => (
                <label
                  key={student._id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-700/70 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => toggleStudentSelection(student._id)}
                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-white text-sm">{student.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isSubmitting || !groupName.trim()}
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors ${
              !groupName.trim() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
});

CreateGroupModal.displayName = 'CreateGroupModal';

export default CreateGroupModal;