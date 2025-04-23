'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import axios from 'axios';
import { format } from 'date-fns';
import {
  BookOpenIcon,
  UsersIcon,
  LogOutIcon,
} from 'lucide-react';
import React from 'react';
import QuickActionsSection from './components/QuickActionsSection';

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  teachers: { _id: string; name: string }[];
  students: { _id: string; name: string }[];
  academicYear: string;
  semester: string;
}


const HomePage = () => {
  const { user, logout, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string | null>(null);



  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const endpoint =
        user?.role === 'admin'
          ? 'http://localhost:5000/api/courses'
          : 'http://localhost:5000/api/courses/my-courses';

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss'));
    }, 1000);

    if (user) {
      fetchCourses();
    }

    return () => clearInterval(timer);
  }, [user]);  // Trigger fetchCourses when `user` changes

  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const categorizeCourses = (courses: Course[]) => {
    if (!courses || courses.length === 0) {
      return { current: [], past: [] };
    }
    return {
      current: courses.filter(() => true), // Current courses filtering logic
      past: [],
    };
  };

  const { current: currentCourses, past: pastCourses } = categorizeCourses(courses);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <header className="bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <BookOpenIcon className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl font-bold">Peer Assessment System</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div>{currentTime || ''}</div>
                  <div className="text-sm text-blue-300">{user?.id || user?.name}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                >
                  <LogOutIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-8 border border-blue-800/30">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome, {user?.role === 'student' ? 'Student' : user?.role === 'teacher' ? 'Teacher' : 'Admin'}
                </h2>
                <p className="text-blue-200">
                  {user?.role === 'student'
                    ? 'Manage your group assessments and track your progress'
                    : 'Manage courses and student evaluations'}
                </p>
              </div>
              <div className="bg-blue-900/50 p-4 rounded-xl">
                <UsersIcon className="w-10 h-10 text-blue-400" />
              </div>
            </div>
          </section>

          {/* Conditionally render Quick Actions only when `user` is available */}
          {user && <QuickActionsSection user={user} router={router} />}

          <section>
            <CourseSection
              title="Current Courses"
              courses={currentCourses}
              isLoading={isLoading}
              router={router}
            />

            {pastCourses.length > 0 && (
              <CourseSection
                title="Past Courses"
                courses={pastCourses}
                isLoading={isLoading}
                router={router}
              />
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
};


// Course Section Component
interface CourseSectionProps {
  title: string;
  courses: Course[];
  isLoading: boolean;
  router: any;
}

const CourseSection: React.FC<CourseSectionProps> = ({ title, courses, isLoading, router }) => {
  const { user } = useAuth(); // Add this to get user information

  const handleCourseClick = async (courseId: string) => {
    if (user?.role === 'teacher') {
      try {
        // First fetch assessments for the course
        const token = localStorage.getItem('token');
        const assessmentsResponse = await axios.get(
          `http://localhost:5000/api/assessments/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (assessmentsResponse.data.success) {
          const assessments = assessmentsResponse.data.data;

          if (assessments.length === 1) {
            // If there's only one assessment, directly fetch and show its results
            const assessmentId = assessments[0]._id;
            router.push(`/results/${assessmentId}`);
          } else if (assessments.length > 1) {
            // If there are multiple assessments, navigate to assessment selection page
            router.push(`/course/${courseId}/assessments`);
          } else {
            // No assessments found
            alert('No assessments found for this course');
          }
        }
      } catch (error) {
        console.error('Error fetching assessments:', error);
        alert('Error fetching assessments');
      }
    } else {
      // For students, keep the original behavior
      router.push(`/course/${courseId}`);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-6 border border-blue-800/30">
      <h2 className="text-xl font-semibold text-white mb-6">{title}</h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : courses ? (
        courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course._id)}
                className="bg-gray-900/50 border border-blue-800/30 rounded-xl p-5 
                           hover:bg-gray-800/50 transition-all cursor-pointer backdrop-blur-lg"
              >
                <h3 className="font-semibold text-lg mb-2">{course.courseName}</h3>
                <p className="text-blue-200 text-sm mb-3">
                  {course.courseCode}
                </p>
                <div className="flex justify-between text-sm text-blue-300">
                  <span>Students: {course.students?.length || 0}</span>
                  <span>Teachers: {course.teachers?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-blue-200">No courses found</div>
        )
      ) : (
        <div className="text-center text-blue-200">Error loading courses</div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>Debug - Number of courses: {courses?.length || 0}</p>
      </div>
    </div>
  );
};

export default HomePage;