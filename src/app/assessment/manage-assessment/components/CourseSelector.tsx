// app/assessment/manage-assessment/components/CourseSelector.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCustomToast } from '@/app/components/common/Toast';

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
}

interface CourseSelectorProps {
  onCourseSelect: (courseId: string) => void;
  selectedCourseId: string;
}

export default function CourseSelector({ onCourseSelect, selectedCourseId }: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showErrorToast } = useCustomToast();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/courses/my-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setCourses(response.data.data);
        } else {
          showErrorToast('Failed to fetch courses');
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        showErrorToast('Unable to load courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [showErrorToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center p-4 text-gray-400">
        No courses available. Please create a course first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">
        Select Course
      </label>
      <select
        value={selectedCourseId}
        onChange={(e) => onCourseSelect(e.target.value)}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
        required
      >
        <option value="">Select a course</option>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>
            {course.courseName} ({course.courseCode})
          </option>
        ))}
      </select>
    </div>
  );
}
