'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import axios from 'axios';
import { format } from 'date-fns';
import {
  BookOpenIcon,
  UsersIcon,
  LogOutIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AlertCircleIcon,
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
  assessments?: Assessment[];
}

interface Assessment {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
  hasCompletedFullAssessment: boolean;
}

// ย้ายข้อมูลนี้ไปอยู่นอก component เพื่อไม่ต้องสร้างใหม่ทุกครั้งที่ render
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const HomePage = () => {
  const { user, logout, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // ย้าย useMemo มาก่อน useCallback เพื่อให้ลำดับการใช้ hooks เหมือนเดิมในทุก render
  // ใช้ useMemo ตรงนี้เพื่อให้มีอยู่ในทุก render แม้จะยังไม่มีข้อมูล courses
  const { current: currentCourses, past: pastCourses } = useMemo(() => {
    if (!courses || courses.length === 0) {
      return { current: [], past: [] };
    }
    return {
      current: courses.filter(() => true), // Current courses filtering logic
      past: [],
    };
  }, [courses]);

  const fetchCourses = useCallback(async () => {
    if (!user || hasLoadedData) return; // ป้องกันการเรียกซ้ำ
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        return;
      }
      
      // ปรับปรุง headers ให้ใส่ token เฉพาะเมื่อเรียก API
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const endpoint = user.role === 'admin' ? '/courses' : '/courses/my-courses';

      const response = await axiosInstance.get(endpoint);

      if (response.data.success) {
        const coursesData = response.data.data;
        
        // เฉพาะกรณี student เท่านั้น จึงจะดึงข้อมูล assessments
        if (user.role === 'student') {
          try {
            // ดึงข้อมูล assessments
            const assessmentsResponse = await axiosInstance.get('/assessments/my-assessments');
            
            if (assessmentsResponse.data.success) {
              const assessmentsData = assessmentsResponse.data.data;
              
              // นับจำนวน assessment ที่มีสถานะ pending และมีสมาชิกที่ยังไม่ได้ประเมิน
              const pendingItems = assessmentsData.filter(
                (assessment: any) => 
                  assessment.status === 'pending' && 
                  assessment.remainingMembers && 
                  assessment.remainingMembers.length > 0
              );
              
              // กำหนดจำนวน pending assessments
              setPendingCount(pendingItems.length);
              
              // สร้าง map เพื่อการค้นหาที่รวดเร็วขึ้น
              const assessmentsByCourse = assessmentsData.reduce((acc: any, assessment: any) => {
                const courseId = assessment.course._id;
                if (!acc[courseId]) {
                  acc[courseId] = [];
                }
                acc[courseId].push(assessment);
                return acc;
              }, {});
              
              // จัด assessment เข้าคู่กับ course ที่เกี่ยวข้อง (ใช้ map แทนการวนลูปซ้อน)
              const coursesWithAssessments = coursesData.map((course: Course) => ({
                ...course,
                assessments: assessmentsByCourse[course._id] || []
              }));
              
              setCourses(coursesWithAssessments);
            } else {
              setCourses(coursesData);
            }
          } catch (assessmentError) {
            console.error('Error fetching assessments:', assessmentError);
            setCourses(coursesData);
          }
        } else {
          // กรณีไม่ใช่ student ให้ใช้ข้อมูล courses ปกติ
          setCourses(coursesData);
        }
        
        setHasLoadedData(true);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, hasLoadedData]);

  useEffect(() => {
    // ใช้ requestAnimationFrame เพื่อลดการ re-render
    const updateTime = () => {
      setCurrentTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss'));
    };
    
    // อัปเดตเวลาทุก 1 วินาที แต่ไม่ให้ re-render ทั้งหน้า
    const timerID = setInterval(updateTime, 1000);
    
    return () => clearInterval(timerID);
  }, []);

  // แยกการดึงข้อมูลออกจาก effect ของเวลา
  useEffect(() => {
    if (user && !hasLoadedData) {
      fetchCourses();
    }
  }, [user, fetchCourses, hasLoadedData]);

  // แสดง loading screen ระหว่าง authentication
  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

          {/* ส่ง pendingCount เป็น prop ไปให้ QuickActionsSection */}
          {user && <QuickActionsSection user={user} router={router} pendingCount={pendingCount} />}

          <section>
            <CourseSection
              title="Current Courses"
              courses={currentCourses}
              isLoading={isLoading}
              router={router}
              userRole={user?.role}
            />

            {pastCourses.length > 0 && (
              <CourseSection
                title="Past Courses"
                courses={pastCourses}
                isLoading={isLoading}
                router={router}
                userRole={user?.role}
              />
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
};

// ย้าย AssessmentStatusIndicator ออกมาเป็น memo component
const AssessmentStatusIndicator = React.memo(({ assessment }: { assessment: Assessment }) => {
  // คำนวณ status ตามเงื่อนไขที่กำหนดในโค้ดเดิม
  const currentDate = new Date();
  const dueDate = new Date(assessment.dueDate);
  const isFullyCompleted = assessment.hasCompletedFullAssessment;

  let status;
  if (isFullyCompleted) {
    status = 'completed';
  } else if (assessment.status === 'closed') {
    status = 'closed';
  } else if (dueDate < currentDate) {
    status = 'expired';
  } else {
    status = 'pending';
  }

  // กำหนดสีและไอคอนตาม status
  const getStatusDetails = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
          tooltip: "ประเมินเสร็จสมบูรณ์แล้ว",
          bgColor: "bg-green-900/30",
        };
      case 'closed':
        return {
          icon: <XCircleIcon className="w-5 h-5 text-red-400" />,
          tooltip: "การประเมินถูกปิด",
          bgColor: "bg-red-900/30",
        };
      case 'expired':
        return {
          icon: <AlertCircleIcon className="w-5 h-5 text-yellow-400" />,
          tooltip: "หมดเวลาการประเมิน",
          bgColor: "bg-yellow-900/30",
        };
      case 'pending':
        return {
          icon: <ClockIcon className="w-5 h-5 text-blue-400" />,
          tooltip: "รอการประเมิน",
          bgColor: "bg-blue-900/30",
        };
      default:
        return {
          icon: <ClockIcon className="w-5 h-5 text-gray-400" />,
          tooltip: "ไม่มีข้อมูล",
          bgColor: "bg-gray-900/30",
        };
    }
  };

  const { icon, tooltip, bgColor } = getStatusDetails();

  // แสดงไอคอนพร้อม tooltip
  return (
    <div className="relative group">
      <div className={`p-2 rounded-full ${bgColor} cursor-help`}>
        {icon}
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        {tooltip}
      </div>
    </div>
  );
});

AssessmentStatusIndicator.displayName = 'AssessmentStatusIndicator';

// ปรับปรุง CourseSection ให้เป็น memo component
const CourseSection = React.memo(({ title, courses, isLoading, router, userRole }: CourseSectionProps) => {
  const { user } = useAuth();

  const handleCourseClick = useCallback(async (courseId: string) => {
    if (user?.role === 'teacher') {
      try {
        // First fetch assessments for the course
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No token found');
          return;
        }
        
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
  }, [user?.role, router]);

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
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{course.courseName}</h3>
                    <p className="text-blue-200 text-sm mb-3">
                      {course.courseCode}
                    </p>
                  </div>
                  
                  {/* แสดง Status Indicator เฉพาะสำหรับนักศึกษา และเมื่อมีข้อมูล assessments */}
                  {userRole === 'student' && course.assessments && course.assessments.length > 0 && (
                    <div>
                      <AssessmentStatusIndicator assessment={course.assessments[0]} />
                    </div>
                  )}
                </div>

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
    </div>
  );
});

interface CourseSectionProps {
  title: string;
  courses: Course[];
  isLoading: boolean;
  router: any;
  userRole?: string;
}

CourseSection.displayName = 'CourseSection';

export default HomePage;