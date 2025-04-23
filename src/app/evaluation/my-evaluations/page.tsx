'use client';

import { Key, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CriteriaCharts from './components/CriteriaCharts';

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
  summary: {
    totalEvaluations: number;
    averageTotalScore: string;
    remainingToEvaluate: number;
  };
}

const MyEvaluations = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
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
    fetchEvaluationStats(courseId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Evaluation Statistics</h1>
        
        {/* Course Selection */}
        <div className="mb-8">
          <select
            className="w-full max-w-md p-3 rounded-lg bg-gray-800 text-white border border-blue-800"
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course._id} value={String(course._id)}>
                {course.courseCode} - {course.courseName}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : evaluationStats ? (
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
              <h2 className="text-xl font-semibold text-white mb-4">Evaluation Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-blue-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">{evaluationStats.evaluationProgress.completed}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{evaluationStats.evaluationProgress.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 text-sm">Progress</p>
                  <p className="text-2xl font-bold text-white">{evaluationStats.evaluationProgress.percentage}%</p>
                </div>
              </div>
            </div>

            {/* Criteria Statistics */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
              <h2 className="text-xl font-semibold text-white mb-4">Criteria Statistics</h2>

              {/* <CriteriaCharts criteriaStats={evaluationStats.criteriaStats} /> */}

              <div className="space-y-4">
                {Object.entries(evaluationStats.criteriaStats).map(([criterion, stats]) => (
                  <div key={criterion} className="border-b border-blue-800/30 pb-4">
                    <h3 className="text-lg font-medium text-white mb-2">{criterion}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-blue-400 text-sm">Average Score</p>
                        <p className="text-xl font-bold text-white">{stats.averageScore}</p>
                      </div>
                      <div>
                        <p className="text-blue-400 text-sm">Total Evaluations</p>
                        <p className="text-xl font-bold text-white">{stats.count}</p>
                      </div>
                      <div>
                        <p className="text-blue-400 text-sm">Ratings Distribution</p>
                        <div className="text-sm text-white">
                          {Object.entries(stats.ratings).map(([rating, count]) => (
                            <div key={rating} className="flex justify-between">
                              <span>{rating}:</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
              <h2 className="text-xl font-semibold text-white mb-4">Overall Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-blue-400 text-sm">Total Evaluations</p>
                  <p className="text-2xl font-bold text-white">{evaluationStats.summary.totalEvaluations}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 text-sm">Average Total Score</p>
                  <p className="text-2xl font-bold text-white">{evaluationStats.summary.averageTotalScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 text-sm">Remaining to Evaluate</p>
                  <p className="text-2xl font-bold text-white">{evaluationStats.summary.remainingToEvaluate}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-white">
            {selectedCourseId ? 'No evaluation data available' : 'Please select a course to view statistics'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvaluations;