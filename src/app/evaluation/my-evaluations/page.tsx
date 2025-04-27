'use client';

import { Key, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CriteriaCharts from './components/CriteriaCharts';
import EvaluationList from './components/EvaluationList';
import { ArrowLeftRight, BookOpen, RefreshCcw, User } from 'lucide-react';
import { format } from 'date-fns';
import ProgressRing from './components/ProgressRing';
import EvaluationDetails from './components/EvaluationDetails';
import EmptyState from '@/app/components/EmptyState';

interface Course {
  _id: Key | null | undefined;
  id: string;
  courseCode: string;
  courseName: string;
}

interface EvaluationStats {
  courseInfo: {
    id: string;
    courseCode: string;
    courseName: string;
  };
  evaluationProgress: {
    completed: number;
    total: number;
    percentage: string;
  };
  criteriaStats: {
    [key: string]: {
      totalScore: number;
      count: number;
      ratings: {
        [key: string]: number;
      };
      averageScore: string;
    };
  };
  evaluationDetails: Array<{
    assessmentTitle: string;
    dueDate: string;
    evaluatee: {
      id: string;
      name: string;
    };
    scores: Array<{
      criterion: string;
      ratingChoice: string;
      score: number;
    }>;
    totalScore: number;
    comment: string;
    submittedAt: string;
  }>;
  summary: {
    totalEvaluations: number;
    averageTotalScore: string;
    remainingToEvaluate: number;
  };
}

interface Evaluation {
  id: string;
  assessmentTitle: string;
  evaluateeName: string;
  scores: Array<{
    criterionTitle: string;
    rating: string;
    score: number;
  }>;
  totalScore: number;
  comment: string;
  submittedAt: string;
}

const MyEvaluations = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStats | null>(null);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluations'>('overview');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAllEvaluations();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoadingAll(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courses/my-courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const fetchAllEvaluations = async () => {
    try {
      setIsLoadingAll(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/evaluations/my-evaluations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setMyEvaluations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const fetchEvaluationStats = async (courseId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/evaluations/my-evaluated/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setEvaluationStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching evaluation stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      fetchEvaluationStats(courseId);
      setActiveTab('overview');
    } else {
      setEvaluationStats(null);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAllEvaluations(),
      selectedCourseId ? fetchEvaluationStats(selectedCourseId) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  if (isLoadingAll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Loading your evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Evaluations</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:bg-blue-800"
            >
              <RefreshCcw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        
        {/* Tabs: All Evaluations vs Course Stats */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-blue-800/30 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'evaluations' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}
                onClick={() => setActiveTab('evaluations')}
              >
                <User className="inline-block w-4 h-4 mr-1.5" /> My Evaluations
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}
                onClick={() => {
                  setActiveTab('overview');
                  setSelectedEvaluation(null);
                }}
                disabled={!selectedCourseId}
              >
                <ArrowLeftRight className="inline-block w-4 h-4 mr-1.5" /> Course Statistics
              </button>
            </div>
            
            <div className="flex-grow max-w-md">
              <div className="flex items-center bg-gray-700/50 rounded-lg border border-gray-700">
                <BookOpen className="w-4 h-4 ml-3 text-gray-400" />
                <select
                  className="w-full py-2 px-2 bg-transparent text-white border-none focus:ring-0 focus:outline-none"
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  <option value="" className="bg-gray-800">All courses / Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={String(course._id)} className="bg-gray-800">
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Show different views based on active tab */}
        {activeTab === 'evaluations' ? (
          selectedEvaluation ? (
            <div className="animate-fadeIn">
              <EvaluationDetails 
                evaluation={selectedEvaluation} 
                onBack={() => setSelectedEvaluation(null)} 
              />
            </div>
          ) : (
            <div className="animate-fadeIn">
              <EvaluationList 
                evaluations={myEvaluations} 
                onSelectEvaluation={setSelectedEvaluation} 
              />
            </div>
          )
        ) : (
          // Show stats overview
          isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : evaluationStats ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Progress Card */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-gray-400 text-sm">Completion</h2>
                      <p className="text-2xl font-bold text-white mt-1">
                        {evaluationStats.evaluationProgress.percentage}%
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {evaluationStats.evaluationProgress.completed} of {evaluationStats.evaluationProgress.total} complete
                      </p>
                    </div>
                    <div className="w-16 h-16">
                      <ProgressRing 
                        progress={parseFloat(evaluationStats.evaluationProgress.percentage)} 
                        size={64}
                        strokeWidth={5}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Average Score Card */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
                  <h2 className="text-gray-400 text-sm">Average Score</h2>
                  <div className="flex items-end mt-1">
                    <p className={`text-2xl font-bold ${
                      parseFloat(evaluationStats.summary.averageTotalScore) > 80 ? 'text-green-400' : 
                      parseFloat(evaluationStats.summary.averageTotalScore) > 60 ? 'text-blue-400' : 
                      parseFloat(evaluationStats.summary.averageTotalScore) > 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {evaluationStats.summary.averageTotalScore}
                    </p>
                    <p className="text-gray-500 text-sm ml-1 mb-1">points</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Based on {evaluationStats.summary.totalEvaluations} evaluations
                  </p>
                </div>
                
                {/* Evaluations Card */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
                  <h2 className="text-gray-400 text-sm">Total Evaluations</h2>
                  <p className="text-2xl font-bold text-white mt-1">
                    {evaluationStats.summary.totalEvaluations}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {evaluationStats.summary.remainingToEvaluate > 0 ? 
                      `${evaluationStats.summary.remainingToEvaluate} evaluations remaining` :
                      'All evaluations complete!'
                    }
                  </p>
                </div>
                
                {/* Course Info Card */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
                  <h2 className="text-gray-400 text-sm mb-2">Course</h2>
                  <h3 className="text-lg font-semibold text-white">{evaluationStats.courseInfo.courseName}</h3>
                  <p className="text-sm text-blue-400">{evaluationStats.courseInfo.courseCode}</p>
                </div>
              </div>
              
              {/* Criteria Statistics */}
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
                <h2 className="text-xl font-semibold text-white mb-6">Criteria Analysis</h2>
                <CriteriaCharts criteriaStats={evaluationStats.criteriaStats} />
              </div>
              
              {/* Recent Evaluations Table */}
              {evaluationStats.evaluationDetails && evaluationStats.evaluationDetails.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
                  <h2 className="text-xl font-semibold text-white mb-4">Your Recent Evaluations</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="text-left py-3 px-4">Assessment</th>
                          <th className="text-left py-3 px-4">Evaluatee</th>
                          <th className="text-left py-3 px-4">Score</th>
                          <th className="text-left py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluationStats.evaluationDetails.slice(0, 5).map((evalItem, index) => (
                          <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                            <td className="py-3 px-4">{evalItem.assessmentTitle}</td>
                            <td className="py-3 px-4">{evalItem.evaluatee.name}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                evalItem.totalScore > 80 ? 'bg-green-900/30 text-green-400' : 
                                evalItem.totalScore > 60 ? 'bg-blue-900/30 text-blue-400' :
                                evalItem.totalScore > 40 ? 'bg-yellow-900/30 text-yellow-400' :
                                'bg-red-900/30 text-red-400'
                              }`}>
                                {evalItem.totalScore} points
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              {format(new Date(evalItem.submittedAt), 'dd MMM yyyy')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState 
              title={selectedCourseId ? "No data available" : "Select a course"}
              description={selectedCourseId ? 
                "There are no evaluations for this course yet." : 
                "Please select a course to view detailed statistics."
              }
              iconType={selectedCourseId ? "chart" : "course"}
            />
          )
        )}
      </div>
    </div>
  );
};

export default MyEvaluations;