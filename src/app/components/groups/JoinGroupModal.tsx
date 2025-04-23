import { useState, useEffect, memo, useCallback, useRef } from 'react';
import axios from 'axios';
import { AcademicCapIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCustomToast } from '@/app/components/common/Toast';

interface Group {
  _id: string;
  groupName: string;
  course: {
    _id: string;
    courseCode: string;
    courseName: string;
  };
  members: {
    _id: string;
    name: string;
  }[];
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
}

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourse: Course | null;
  onGroupJoined: () => void;
  onCreateGroupClick?: () => void;
}

const JoinGroupModal = memo(({
  isOpen,
  onClose,
  selectedCourse,
  onGroupJoined,
  onCreateGroupClick
}: JoinGroupModalProps) => {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const cancelTokenRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Fetch available groups when modal opens
  useEffect(() => {
    if (isOpen && selectedCourse) {
      fetchAvailableGroups();
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setAvailableGroups([]);
      setFilteredGroups([]);
    }
  }, [isOpen, selectedCourse]);
  
  // Filter groups when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(availableGroups);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = availableGroups.filter(group => 
      group.groupName.toLowerCase().includes(query)
    );
    setFilteredGroups(filtered);
  }, [searchQuery, availableGroups]);

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (selectedCourse && value.trim() !== '') {
      searchTimeoutRef.current = setTimeout(() => {
        fetchAvailableGroups(value);
      }, 300); // 300ms debounce delay
    }
  };

  // Fetch available groups
  const fetchAvailableGroups = useCallback(async (search: string = '') => {
    if (!selectedCourse) return;
    
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New request made');
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const source = axios.CancelToken.source();
      cancelTokenRef.current = source;
      
      const url = search 
        ? `http://localhost:5000/api/groups/available/${selectedCourse._id}?search=${encodeURIComponent(search)}`
        : `http://localhost:5000/api/groups/available/${selectedCourse._id}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cancelToken: source.token
      });

      if (response.data.success && !response.data.studentGroup) {
        setAvailableGroups(response.data.data);
        setFilteredGroups(response.data.data);
      } else if (response.data.studentGroup) {
        // User already has a group in this course
        setAvailableGroups([]);
        setFilteredGroups([]);
        showErrorToast('You already have a group in this course');
        onClose();
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Error fetching available groups:', err);
        showErrorToast('Failed to fetch available groups');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse, showErrorToast, onClose]);

  // Join a group
  const handleJoinGroup = async (group: Group) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/groups/${group._id}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        showSuccessToast(`Successfully joined ${group.groupName}`);
        onGroupJoined();
        onClose();
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      showErrorToast(error.response?.data?.error || 'Failed to join group');
    }
  };

  // Close the modal
  const handleClose = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Modal closed');
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onClose();
  }, [onClose]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={handleClose}>
      <div 
        className="bg-gray-800 rounded-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-white">Join a Group</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
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
        
        {/* Search Box */}
        <div className="mb-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              autoComplete="off"
            />
          </div>
        </div>
        
        {/* Available Groups */}
        <div className="mb-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Available Groups</h3>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {filteredGroups?.length > 0 ? (
                <div className="space-y-3">
                  {filteredGroups.map(group => (
                    <div key={group._id} className="bg-gray-700/50 p-4 rounded-lg transition-colors hover:bg-gray-700/70">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-medium">{group.groupName}</h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group)}
                          className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-sm transition-colors"
                        >
                          Join
                        </button>
                      </div>
                      {group.members.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-600">
                          <p className="text-xs text-gray-400 mb-1">Members:</p>
                          <p className="text-xs text-gray-300">
                            {group.members.map(m => m.name).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-700/30 rounded-lg">
                  <p className="text-gray-400">
                    {searchQuery ? 'No groups match your search.' : 'No groups available to join.'}
                  </p>
                  {onCreateGroupClick && (
                    <button
                      onClick={onCreateGroupClick}
                      className="mt-3 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm transition-colors"
                    >
                      Create a New Group
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

JoinGroupModal.displayName = 'JoinGroupModal';

export default JoinGroupModal;