'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import axios from 'axios';
import CourseSelector from './components/CourseSelector';
import GroupsList from './components/GroupsList';
import StudentManagement from './components/StudentManagement';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Course {
    _id: string;
    courseCode: string;
    courseName: string;
    teachers: { _id: string; name: string }[];
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

export default function ManageGroupsPage() {
    const router = useRouter();
    useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

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
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGroups = async (courseId: string) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/groups/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setGroups(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentAssignment = async (groupId: string, studentId: string, action: 'add' | 'remove') => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/groups/${groupId}/assign-student`,
                { studentId, action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh groups after assignment
            fetchGroups(selectedCourse);
        } catch (error) {
            console.error('Error assigning student:', error);
        }
    };

    // Add this function to get all students who are already in groups
    const getAssignedStudents = () => {

        console.log('students', courses.find(c => c._id === selectedCourse)?.students); 

        const assignedStudentIds = new Set();
        groups.forEach(group => {
            group.members.forEach(member => {
                assignedStudentIds.add(member._id);
            });
        });
        return assignedStudentIds;
    };

    const getAvailableStudents = () => {

        console.log('getAvailableStudents');
        console.log('students', courses.find(c => c._id === selectedCourse)?.students);


        const assignedStudents = getAssignedStudents();
        const currentCourse = courses.find(c => c._id === selectedCourse);
        return currentCourse?.students.filter(student => !assignedStudents.has(student._id)) || [];
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
                        Back to Dashboard
                    </button>
                </div>

                <h1 className="text-3xl font-bold mb-8">Manage Groups</h1>

                <div className="space-y-6">
                    <CourseSelector
                        courses={courses}
                        selectedCourse={selectedCourse}
                        onSelectCourse={setSelectedCourse}
                    />

                    {selectedCourse && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <GroupsList
                                courseId={selectedCourse}
                                groups={groups}
                                students={getAvailableStudents()} // Pass only available students
                                selectedGroup={selectedGroup}
                                onSelectGroup={setSelectedGroup}
                                onGroupsChange={() => fetchGroups(selectedCourse)}
                            />

                            {selectedGroup && (
                                <StudentManagement
                                    course={courses.find(c => c._id === selectedCourse)!}
                                    group={groups.find(g => g._id === selectedGroup)!}
                                    availableStudents={getAvailableStudents()} // Pass only available students
                                    onAssignStudent={handleStudentAssignment}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}