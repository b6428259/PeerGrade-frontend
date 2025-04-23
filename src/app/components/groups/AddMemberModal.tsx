import { memo, useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCustomToast } from '@/app/components/common/Toast';

interface Student {
  _id: string;
  name: string;
  studentId?: string;
}

interface Group {
  _id: string;
  groupName: string;
  course: {
    _id: string;
    courseCode: string;
    courseName: string;
  };
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
  onMemberAdded: (groupId: string, studentId: string, student: Student) => void;
}

const AddMemberModal = memo(({
  isOpen,
  onClose,
  selectedGroup,
  onMemberAdded
}: AddMemberModalProps) => {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Fetch available students when the modal opens
  useEffect(() => {
    if (isOpen && selectedGroup) {
      fetchAvailableStudents();
    } else {
      // Reset state when modal closes
      setAvailableStudents([]);
      setFilteredStudents([]);
      setSearchQuery('');
    }
  }, [isOpen, selectedGroup]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(availableStudents);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = availableStudents.filter(student => 
      student.name.toLowerCase().includes(query) ||
      (student.studentId && student.studentId.toLowerCase().includes(query))
    );
    setFilteredStudents(filtered);
  }, [searchQuery, availableStudents]);

  // Fetch available students (students without a group in the course)
  const fetchAvailableStudents = async () => {
    if (!selectedGroup) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/groups/course/${selectedGroup.course._id}/available-students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        setAvailableStudents(response.data.data);
        setFilteredStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
      showErrorToast('Failed to load available students');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a member to group
  const handleAddMember = async (studentId: string) => {
    if (!selectedGroup) return;
    
    setIsAdding(studentId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/groups/${selectedGroup._id}/add-member`,
        { userId: studentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        const student = availableStudents.find(s => s._id === studentId);
        if (student) {
          onMemberAdded(selectedGroup._id, studentId, student);
          showSuccessToast('Member added successfully');
          
          // Remove the student from the list
          setAvailableStudents(prev => prev.filter(s => s._id !== studentId));
          setFilteredStudents(prev => prev.filter(s => s._id !== studentId));
        }
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      showErrorToast(error.response?.data?.error || 'Failed to add member');
    } finally {
      setIsAdding(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-white">Add Members</h2>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-5">
          <p className="text-gray-300 text-sm mb-1">Group:</p>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <p className="text-white">{selectedGroup?.groupName}</p>
            <p className="text-sm text-gray-400">{selectedGroup?.course.courseCode} - {selectedGroup?.course.courseName}</p>
          </div>
        </div>
        
        {/* Search Box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
        
        {/* Available Students */}
        <div className="mb-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Available Students 
            {filteredStudents.length > 0 && <span className="text-gray-400 ml-1">({filteredStudents.length})</span>}
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="space-y-2">
              {filteredStudents.map(student => (
                <div key={student._id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg transition-colors hover:bg-gray-700/70">
                  <span className="text-white text-sm">
                    {student.name}
                    {student.studentId && (
                      <span className="text-xs text-gray-400 ml-1">({student.studentId})</span>
                    )}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMember(student._id);
                    }}
                    disabled={isAdding === student._id}
                    className={`px-3 py-1 ${isAdding === student._id 
                      ? 'bg-gray-600/20 text-gray-400 cursor-wait' 
                      : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'} rounded text-sm transition-colors`}
                  >
                    {isAdding === student._id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              {searchQuery ? 'No students match your search.' : 'No available students to add.'}
            </p>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

AddMemberModal.displayName = 'AddMemberModal';

export default AddMemberModal;