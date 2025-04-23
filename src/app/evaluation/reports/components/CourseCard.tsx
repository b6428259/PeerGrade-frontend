import { format } from 'date-fns';
import { Calendar, Users, BookOpen, AlertTriangle } from 'lucide-react';

interface CourseCardProps {
  courseInfo: {
    courseCode: string;
    courseName: string;
    academicYear?: string;
    semester?: string;
    studentCount?: number;
    groupCount?: number;
  };
  assessmentInfo: {
    title: string;
    status: string;
    dueDate: string;
    dueStatus?: string;
    remainingDays?: number;
  };
}

export default function CourseCard({ courseInfo, assessmentInfo }: CourseCardProps) {
  const getStatusInfo = () => {
    if (assessmentInfo.status === 'closed') {
      return {
        color: 'bg-gray-500/20 text-gray-400',
        label: 'Closed'
      };
    }
    
    if (assessmentInfo.dueStatus === 'expired') {
      return {
        color: 'bg-red-500/20 text-red-400',
        label: 'Expired'
      };
    }
    
    if (assessmentInfo.dueStatus === 'urgent') {
      return {
        color: 'bg-orange-500/20 text-orange-400',
        label: `Due Soon (${assessmentInfo.remainingDays} days left)`
      };
    }
    
    return {
      color: 'bg-green-500/20 text-green-400',
      label: 'Active'
    };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-xl font-bold mb-2 text-white">{courseInfo.courseName}</h2>
          <div className="flex items-center mb-2">
            <BookOpen className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-blue-300">{courseInfo.courseCode}</span>
            {courseInfo.academicYear && courseInfo.semester && (
              <span className="ml-3 text-gray-400 text-sm">
                {courseInfo.academicYear} / Semester {courseInfo.semester}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-300">
            {courseInfo.studentCount !== undefined && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                {courseInfo.studentCount} Students
              </div>
            )}
            {courseInfo.groupCount !== undefined && courseInfo.groupCount > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 17H13V19H21V17Z" fill="currentColor" />
                  <path d="M21 13H13V15H21V13Z" fill="currentColor" />
                  <path d="M21 9H13V11H21V9Z" fill="currentColor" />
                  <path d="M7 12C9.20914 12 11 10.2091 11 8C11 5.79086 9.20914 4 7 4C4.79086 4 3 5.79086 3 8C3 10.2091 4.79086 12 7 12Z" fill="currentColor" />
                  <path d="M7 14C3.13401 14 0 17.134 0 21H14C14 17.134 10.866 14 7 14Z" fill="currentColor" />
                </svg>
                {courseInfo.groupCount} Groups
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div className="border-b border-gray-700 pb-3 mb-3">
            <h3 className="text-lg font-semibold">{assessmentInfo.title}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm flex items-center ${statusInfo.color}`}>
              {assessmentInfo.dueStatus === 'urgent' && (
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              )}
              {statusInfo.label}
            </span>
            
            <span className="text-gray-400 flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              {format(new Date(assessmentInfo.dueDate), 'dd MMM yyyy')}
            </span>
          </div>
          
          {assessmentInfo.dueStatus === 'urgent' && (
            <div className="absolute -bottom-9 right-0">
              <span className="animate-pulse inline-flex items-center bg-orange-500/20 text-orange-400 rounded-full px-3 py-1 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Due soon
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}