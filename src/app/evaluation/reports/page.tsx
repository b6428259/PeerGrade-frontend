'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import CourseCard from './components/CourseCard';
import ScoreDistributionChart from './components/ScoreDistributionChart';
import CriteriaAnalysisChart from './components/CriteriaAnalysisChart';
import GroupProgressTable from './components/GroupProgressTable';
import RecentEvaluationsCard from './components/RecentEvaluationsCard';
import AssessmentSummaryCard from './components/AssessmentSummaryCard';
import { ArrowLeft, Filter, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/app/components/EmptyState';
import { format } from 'date-fns';

interface ReportData {
  courseInfo: {
    id: string;
    courseCode: string;
    courseName: string;
    academicYear?: string;
    semester?: string;
    studentCount?: number;
    groupCount?: number;
  };
  assessmentInfo: {
    id: string;
    title: string;
    status: string;
    dueDate: string;
    dueStatus?: string;
    remainingDays?: number;
    numberOfCriteria: number;
    maxPossibleScore?: number;
    createdAt?: string;
  };
  statistics: {
    submissionRate: {
      submitted: number;
      total: number;
      percentage: number;
    };
    averageTotalScore: number;
    criteriaStatistics: Array<{
      criterionTitle: string;
      description?: string;
      averageScore: number;
      maxPossibleScore: number;
      ratingDistribution: Record<string, number>;
    }>;
    scoreDistribution: {
      min: number;
      max: number;
      average: number;
    };
    groupStatistics?: Array<{
      groupId: string;
      groupName: string;
      memberCount: number;
      totalEvaluationsNeeded: number;
      completedEvaluations: number;
      completionPercentage: number;
      studentCompletionStatus: Array<{
        id: string;
        name: string;
        evaluationsDone: number;
        totalNeeded: number;
        completed: boolean;
        completionPercentage: number;
      }>;
    }>;
  };
  recentEvaluations?: Array<{
    id: string;
    evaluatorId: string;
    evaluatorName: string;
    evaluateeId: string;
    evaluateeName: string;
    totalScore: number;
    submittedAt: string;
  }>;
  lastUpdated: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const fetchReportData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/evaluations/teacher-all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const getFilteredData = () => {
    if (filterStatus === 'all') return reportData;
    
    return reportData.filter(report => {
      if (filterStatus === 'urgent' && report.assessmentInfo.dueStatus === 'urgent') {
        return true;
      }
      if (filterStatus === 'upcoming' && report.assessmentInfo.dueStatus === 'upcoming') {
        return true;
      }
      if (filterStatus === 'expired' && report.assessmentInfo.dueStatus === 'expired') {
        return true;
      }
      if (filterStatus === 'incomplete' && 
          report.statistics.submissionRate.percentage < 100 && 
          report.assessmentInfo.status === 'active') {
        return true;
      }
      return false;
    });
  };

  const filteredData = getFilteredData();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold">Assessment Reports</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-800/70 rounded-lg p-1">
              <Filter className="w-4 h-4 mx-2 text-gray-400" />
              <select 
                className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none text-gray-200"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all" className="bg-gray-800">All Assessments</option>
                <option value="urgent" className="bg-gray-800">Urgent (Due Soon)</option>
                <option value="upcoming" className="bg-gray-800">Upcoming</option>
                <option value="expired" className="bg-gray-800">Expired</option>
                <option value="incomplete" className="bg-gray-800">Incomplete</option>
              </select>
            </div>
            
            <button
              onClick={fetchReportData}
              disabled={refreshing}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:bg-blue-800"
            >
              <RefreshCcw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            title="No assessments found"
            description={filterStatus !== 'all' ? 
              "No assessments match your current filter. Try changing your filter selection." : 
              "You haven't created any assessments yet."}
          />
        ) : (
          <div className="space-y-12">
            {filteredData.map((report, index) => (
              <div key={index} className="space-y-6 animate-fadeIn">
                <CourseCard 
                  courseInfo={report.courseInfo} 
                  assessmentInfo={report.assessmentInfo}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AssessmentSummaryCard 
                    statistics={report.statistics}
                    assessmentInfo={report.assessmentInfo}
                  />
                  <ScoreDistributionChart 
                    scoreDistribution={report.statistics.scoreDistribution}
                    submissionRate={report.statistics.submissionRate}
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CriteriaAnalysisChart 
                    criteriaStatistics={report.statistics.criteriaStatistics}
                  />
                  {report.recentEvaluations && report.recentEvaluations.length > 0 && (
                    <RecentEvaluationsCard 
                      recentEvaluations={report.recentEvaluations} 
                    />
                  )}
                </div>
                
                {report.statistics.groupStatistics && report.statistics.groupStatistics.length > 0 && (
                  <GroupProgressTable 
                    groupStatistics={report.statistics.groupStatistics} 
                  />
                )}
                
                <div className="text-right text-xs text-gray-400">
                  Last updated: {format(new Date(report.lastUpdated), "yyyy-MM-dd HH:mm:ss")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}