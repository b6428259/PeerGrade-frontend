'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';

interface PendingAssessment {
  _id: string;
  title: string;
  course: {
    _id: string;
    courseCode: string;
    courseName: string;
  };
  dueDate: string;
  remainingDays: number;
  status: string;
  dueStatus: string;
  remainingMembers: {
    _id: string;
    name: string;
    firstname: string;
    lastname: string;
  }[];
}

// สร้าง axios instance สำหรับการเรียก API ไว้นอก component
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const PendingAssessmentsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingAssessments, setPendingAssessments] = useState<PendingAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // เพิ่ม state ตรวจสอบการโหลด
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูล pending assessments
  const fetchPendingAssessments = useCallback(async () => {
    if (!user || hasAttemptedLoad) return; // ป้องกันการเรียก API ซ้ำ
    
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setError('ไม่พบ token สำหรับการเข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่');
        router.push('/login');
        return;
      }

      // ตั้งค่า headers ทุกครั้งก่อนเรียก API
      const response = await axios.get('http://localhost:5000/api/assessments/my-assessments', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        // กรองเฉพาะรายการที่มีสถานะ pending
        const pendingItems = response.data.data.filter(
          (assessment: PendingAssessment) => {
            // ตรวจสอบว่ามีข้อมูลครบถ้วน
            if (!assessment || !assessment.status) {
              return false;
            }
            
            return assessment.status === 'pending' && 
                  assessment.remainingMembers && 
                  assessment.remainingMembers.length > 0;
          }
        );

        setPendingAssessments(pendingItems);
      } else {
        setError('ไม่สามารถดึงข้อมูลการประเมินได้');
      }
    } catch (error: any) {
      console.error('Error fetching pending assessments:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
      setHasAttemptedLoad(true); // หลังจากโหลดแล้วไม่ว่าสำเร็จหรือไม่ก็ตาม
    }
  }, [user, router, hasAttemptedLoad]);

  useEffect(() => {
    // ให้ดึงข้อมูลเฉพาะเมื่อ user เป็น student และยังไม่เคยดึงข้อมูลมาก่อน
    if (user && user.role === 'student' && !hasAttemptedLoad) {
      fetchPendingAssessments();
    }
    
    // ถ้าไม่มี user หรือไม่ใช่ student ก็ให้หยุดโหลด
    if ((!user || user.role !== 'student') && isLoading) {
      setIsLoading(false);
      setHasAttemptedLoad(true);
    }
  }, [user, fetchPendingAssessments, hasAttemptedLoad, isLoading]);

// ฟังก์ชันเริ่มทำการประเมิน
const handleStartAssessment = (assessmentId: string, courseId: string) => {
    router.push(`/course/${courseId}?assessmentId=${assessmentId}`);
  };

  // คำนวณสีพื้นหลังตามจำนวนวันที่เหลือ
  const getBubbleStyle = (remainingDays: number, dueStatus: string) => {
    if (dueStatus === 'urgent' || remainingDays <= 3) {
      return 'bg-gradient-to-br from-red-500/20 to-red-800/40 border-red-500/50 hover:from-red-500/30 hover:to-red-800/50';
    } else if (remainingDays <= 7) {
      return 'bg-gradient-to-br from-yellow-500/20 to-yellow-800/40 border-yellow-500/50 hover:from-yellow-500/30 hover:to-yellow-800/50';
    } else {
      return 'bg-gradient-to-br from-blue-500/20 to-blue-800/40 border-blue-500/50 hover:from-blue-500/30 hover:to-blue-800/50';
    }
  };
  
  // ฟังก์ชันสำหรับรายชื่อสมาชิกที่รอประเมิน
  const renderMembersList = (members: {
      firstname: any;
      lastname: any; name: string; _id: string 
}[]) => {
    if (!members || members.length === 0) return null;
    
    // แสดงสูงสุด 3 คนและบวกตัวเลขที่เหลือ
    const displayCount = Math.min(members.length, 3);
    const hasMore = members.length > 3;
    
    return (
      <div className="mt-4">
        <h4 className="text-xs text-white/70 mb-2 flex items-center">
          <UserIcon className="w-3 h-3 mr-1" /> สมาชิกที่รอการประเมิน
        </h4>
        <div className="flex flex-wrap gap-1">
          {members.slice(0, displayCount).map(member => (
            <span 
              key={member._id} 
              className="inline-block px-2 py-1 rounded-full bg-white/10 text-xs">
              {member.name || `${member.firstname} ${member.lastname}`}
            </span>
          ))}
          {hasMore && (
            <span className="inline-block px-2 py-1 rounded-full bg-white/10 text-xs">
              +{members.length - displayCount} คน
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back button */}
          <div className="mb-8 flex items-center">
            <button 
              onClick={() => router.back()} 
              className="mr-4 p-2 rounded-full bg-blue-800/30 hover:bg-blue-700/50 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-yellow-400" />
                รายการประเมินที่รอดำเนินการ
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                แสดงรายการประเมินที่คุณยังไม่ได้ทำการประเมินเพื่อนร่วมทีม
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-red-900/20 inline-block p-6 rounded-full mb-6">
                <AlertCircleIcon className="w-16 h-16 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-blue-200 max-w-md mx-auto mb-6">
                {error}
              </p>
              <button 
                onClick={() => {
                  setHasAttemptedLoad(false);
                  fetchPendingAssessments();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ลองใหม่
              </button>
            </div>
          ) : pendingAssessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingAssessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className={`bubble-card relative overflow-hidden backdrop-blur-lg border rounded-2xl p-6 shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer ${getBubbleStyle(assessment.remainingDays, assessment.dueStatus)}`}
                  onClick={() => handleStartAssessment(assessment._id, assessment.course._id)}
                >
                  {/* Status Badge */}
                  <div className="absolute top-0 right-0 p-3">
                    {assessment.dueStatus === 'urgent' ? (
                      <div className="flex items-center text-xs bg-red-500/60 px-2 py-1 rounded-full">
                        <AlertCircleIcon className="w-3 h-3 mr-1" />
                        ด่วน
                      </div>
                    ) : (
                      <div className="flex items-center text-xs bg-blue-500/60 px-2 py-1 rounded-full">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        รอดำเนินการ
                      </div>
                    )}
                  </div>
                  
                  {/* Course Info */}
                  <div className="mb-3">
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full inline-block mb-2">
                      {assessment.course.courseCode}
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      {assessment.title}
                    </h2>
                    <p className="text-sm text-blue-200 truncate mt-1">
                      {assessment.course.courseName}
                    </p>
                  </div>
                  
                  {/* Due Date Info */}
                  <div className="flex items-center text-sm mt-4">
                    <CalendarDaysIcon className="w-4 h-4 mr-2 text-blue-300" />
                    <div>
                      <p className="text-blue-200">
                        วันหมดเวลา: <span className="text-white">
                          {new Date(assessment.dueDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                      <p className={`text-sm ${assessment.remainingDays <= 3 ? 'text-red-300' : assessment.remainingDays <= 7 ? 'text-yellow-300' : 'text-green-300'}`}>
                        เหลือเวลาอีก {assessment.remainingDays} วัน
                      </p>
                    </div>
                  </div>
                  
                  {/* Members to evaluate */}
                  {renderMembersList(assessment.remainingMembers)}
                  
                  {/* Action button */}
                  <div className="mt-6">
                    <button className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      ทำการประเมิน
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-blue-900/20 inline-block p-6 rounded-full mb-6">
                <CheckCircleIcon className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">ไม่มีการประเมินที่รอดำเนินการ</h2>
              <p className="text-blue-200 max-w-md mx-auto">
                คุณได้ทำการประเมินเพื่อนร่วมทีมทั้งหมดเรียบร้อยแล้ว หรือยังไม่มีการประเมินที่เปิดให้ดำเนินการ
              </p>
            </div>
          )}
        </div>

        {/* Effect Orbs - เพิ่มลูกบอลเรืองแสง */}
        <div className="fixed top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl opacity-20 z-0"></div>
        <div className="fixed bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl opacity-20 z-0"></div>
      </div>
    </ProtectedRoute>
  );
};

export default PendingAssessmentsPage;