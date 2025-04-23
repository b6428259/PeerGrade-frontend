'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import axios from 'axios';
import CourseSelector from '../manage/components/CourseSelector';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { ArrowLeft, UserPlus, UserMinus, Users, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/app/components/common/Toast';
import { ConfirmationModal } from '@/app/components/common/Modal';

interface Course {
    _id: string;
    courseCode: string;
    courseName: string;
    students: { _id: string; name: string }[];
}

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

interface Student {
    _id: string;
    name: string;
}

export default function StudentManageGroupsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
    const [myGroup, setMyGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    
    // Modal states
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Confirmation modal states
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: () => Promise<void>;
        variant: 'default' | 'destructive';
        confirmText: string;
    }>({
        isOpen: false,
        title: '',
        description: '',
        action: async () => {},
        variant: 'default',
        confirmText: 'Confirm',
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchGroups(selectedCourse);
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/courses/my-courses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setCourses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            showErrorToast('Failed to fetch courses');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGroups = async (courseId: string) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            
            // Get all groups in the course
            const groupsResponse = await axios.get(`http://localhost:5000/api/groups/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            // Get available groups (those the student can join)
            const availableGroupsResponse = await axios.get(`http://localhost:5000/api/groups/available/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (groupsResponse.data.success) {
                setGroups(groupsResponse.data.data);
                
                // Check if the student is already in a group
                const studentId = user?._id;
                const studentGroup = groupsResponse.data.data.find(
                    (group: Group) => group.members.some(member => member._id === studentId)
                );
                
                if (studentGroup) {
                    setMyGroup(studentGroup);
                } else {
                    setMyGroup(null);
                }
            }
            
            if (availableGroupsResponse.data.success) {
                if (availableGroupsResponse.data.studentGroup) {
                    // Student already has a group
                    setAvailableGroups([]);
                } else {
                    // Student can join these groups
                    setAvailableGroups(availableGroupsResponse.data.data);
                }
            }
            
            // Get available students for adding to the group
            fetchAvailableStudents(courseId);
            
        } catch (error) {
            console.error('Error fetching groups:', error);
            showErrorToast('Failed to fetch groups');
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchAvailableStudents = async (courseId: string) => {
        try {
            const token = localStorage.getItem('token');
            
            // Get all students in the course
            const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (courseResponse.data.success) {
                const allStudents = courseResponse.data.data.students;
                
                // Get all students already in groups
                const assignedStudentIds = new Set<string>();
                groups.forEach(group => {
                    group.members.forEach(member => {
                        assignedStudentIds.add(member._id);
                    });
                });
                
                // Filter out students that are already in groups
                const available = allStudents.filter(
                    (student: Student) => !assignedStudentIds.has(student._id) && student._id !== user?._id
                );
                
                setAvailableStudents(available);
            }
        } catch (error) {
            console.error('Error fetching available students:', error);
        }
    };
    
    const handleCreateGroup = async () => {
        if (!groupName.trim()) return;
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/groups',
                {
                    groupName,
                    courseId: selectedCourse,
                    memberIds: selectedStudents
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            if (response.data.success) {
                showSuccessToast('Group created successfully');
                setShowCreateGroupModal(false);
                setGroupName('');
                setSelectedStudents([]);
                fetchGroups(selectedCourse);
            } else {
                showErrorToast('Failed to create group');
            }
        } catch (error: any) {
            console.error('Error creating group:', error);
            showErrorToast(error.response?.data?.error || 'Failed to create group');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleJoinGroup = async (groupId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/groups/${groupId}/join`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            if (response.data.success) {
                showSuccessToast('Successfully joined the group');
                fetchGroups(selectedCourse);
            }
        } catch (error: any) {
            console.error('Error joining group:', error);
            showErrorToast(error.response?.data?.error || 'Failed to join group');
        }
    };
    
    const handleLeaveGroup = async () => {
        if (!myGroup) return;
        
        try {
            const token = localStorage.getItem('token');
            const userId = user?._id;
            
            const response = await axios.delete(
                `http://localhost:5000/api/groups/${myGroup._id}/remove-member/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            if (response.data.success) {
                showSuccessToast('Successfully left the group');
                setMyGroup(null);
                fetchGroups(selectedCourse);
            }
        } catch (error: any) {
            console.error('Error leaving group:', error);
            showErrorToast(error.response?.data?.error || 'Failed to leave group');
        }
    };
    
    const handleAddMember = async (studentId: string) => {
        if (!myGroup) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/groups/${myGroup._id}/add-member`,
                { userId: studentId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            if (response.data.success) {
                showSuccessToast('Member added successfully');
                fetchGroups(selectedCourse);
            }
        } catch (error: any) {
            console.error('Error adding member:', error);
            showErrorToast(error.response?.data?.error || 'Failed to add member');
        }
    };

    const confirmLeaveGroup = () => {
        if (!myGroup) return;
        
        setConfirmModal({
            isOpen: true,
            title: 'Leave Group',
            description: `Are you sure you want to leave "${myGroup.groupName}"? You'll need to join again or create a new group after leaving.`,
            action: handleLeaveGroup,
            variant: 'destructive',
            confirmText: 'Leave Group',
        });
    };
    
    const confirmAddMember = (student: Student) => {
        if (!myGroup) return;
        
        setConfirmModal({
            isOpen: true,
            title: 'Add Member',
            description: `Would you like to add ${student.name} to your group "${myGroup.groupName}"?`,
            action: async () => handleAddMember(student._id),
            variant: 'default',
            confirmText: 'Add Member',
        });
    };
    
    const confirmJoinGroup = (group: Group) => {
        setConfirmModal({
            isOpen: true,
            title: 'Join Group',
            description: `Would you like to join "${group.groupName}"?`,
            action: async () => handleJoinGroup(group._id),
            variant: 'default',
            confirmText: 'Join Group',
        });
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>
                </div>

                <h1 className="text-3xl font-bold mb-8">Student Group Management</h1>

                <div className="space-y-6">
                    <CourseSelector
                        courses={courses}
                        selectedCourse={selectedCourse}
                        onSelectCourse={setSelectedCourse}
                    />

                    {selectedCourse && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* My Group Section */}
                            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">My Group</h2>
                                    {!myGroup && (
                                        <button
                                            onClick={() => setShowCreateGroupModal(true)}
                                            className="flex items-center px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                                        >
                                            <UserPlus size={18} className="mr-2" />
                                            Create Group
                                        </button>
                                    )}
                                </div>

                                {myGroup ? (
                                    <div className="space-y-4">
                                        <div className="bg-gray-700/30 rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold text-lg">{myGroup.groupName}</h3>
                                                <button
                                                    onClick={confirmLeaveGroup}
                                                    className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                                                >
                                                    Leave Group
                                                </button>
                                            </div>
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-400 mb-2">Members ({myGroup.members.length})</h4>
                                                <div className="space-y-2">
                                                    {myGroup.members.map((member) => (
                                                        <div
                                                            key={member._id}
                                                            className="flex justify-between items-center p-2 rounded-lg bg-gray-700/50"
                                                        >
                                                            <div className="flex items-center">
                                                                <UserCircle className="h-5 w-5 mr-2 text-gray-400" />
                                                                <span className="text-sm">
                                                                    {member.name} {member._id === user?._id && "(You)"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                                        <p className="text-gray-400">You are not a member of any group in this course.</p>
                                        <p className="text-gray-500 text-sm mt-2">Create a new group or join an existing one.</p>
                                    </div>
                                )}
                            </div>

                            {/* Available Actions Section */}
                            <div>
                                {myGroup ? (
                                    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
                                        <h2 className="text-xl font-semibold mb-4">Add Members</h2>
                                        {availableStudents.length > 0 ? (
                                            <div className="space-y-2">
                                                {availableStudents.map((student) => (
                                                    <div
                                                        key={student._id}
                                                        className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                                                    >
                                                        <span>{student.name}</span>
                                                        <button
                                                            onClick={() => confirmAddMember(student)}
                                                            className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                                                        >
                                                            Add to Group
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-center py-4">No available students to add to your group.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
                                        <h2 className="text-xl font-semibold mb-4">Available Groups</h2>
                                        {availableGroups.length > 0 ? (
                                            <div className="space-y-3">
                                                {availableGroups.map((group) => (
                                                    <div
                                                        key={group._id}
                                                        className="p-4 bg-gray-700/30 rounded-lg"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="font-semibold">{group.groupName}</h3>
                                                            <button
                                                                onClick={() => confirmJoinGroup(group)}
                                                                className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors"
                                                            >
                                                                Join
                                                            </button>
                                                        </div>
                                                        <div className="mt-2">
                                                            <h4 className="text-xs text-gray-400">Members ({group.members.length})</h4>
                                                            <p className="text-sm text-gray-300 mt-1">
                                                                {group.members.map(m => m.name).join(', ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-center py-4">No groups available to join. Create a new group!</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
                        <button
                            onClick={() => setShowCreateGroupModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-semibold mb-6">Create New Group</h2>

                        <div className="space-y-6">
                            <div>
                                <label htmlFor="groupName" className="block text-sm font-medium mb-2">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    id="groupName"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter group name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Select Students to Invite {availableStudents.length === 0 && '(No available students)'}
                                </label>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {availableStudents.length === 0 ? (
                                        <p className="text-gray-400 text-sm">All students are already assigned to groups</p>
                                    ) : (
                                        availableStudents.map((student) => (
                                            <label
                                                key={student._id}
                                                className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student._id)}
                                                    onChange={() => {
                                                        setSelectedStudents(prev =>
                                                            prev.includes(student._id)
                                                                ? prev.filter(id => id !== student._id)
                                                                : [...prev, student._id]
                                                        );
                                                    }}
                                                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                                                />
                                                <span>{student.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateGroupModal(false);
                                        setGroupName('');
                                        setSelectedStudents([]);
                                    }}
                                    className="px-4 py-2 text-sm rounded-lg border border-gray-600 hover:bg-gray-700/50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={isSubmitting || !groupName.trim()}
                                    className="px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onOpenChange={(open) => setConfirmModal({...confirmModal, isOpen: open})}
                title={confirmModal.title}
                description={confirmModal.description}
                onConfirm={confirmModal.action}
                variant={confirmModal.variant}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}