// src/app/results/[assessmentId]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  BarChart,
  ChartBar,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Components
import { ResultsHeader } from './components/ResultsHeader';
import { StatCard } from './components/StatCard';
import { CriteriaAnalysis } from './components/CriteriaAnalysis';
import { IndividualResults } from './components/IndividualResults';
import { PendingEvaluations } from './components/PendingEvaluations';

// Types
interface AssessmentInfo {
  title: string;
  status: string;
  dueDate: string;
  totalCriteria: number;
}

interface OverallStats {
  totalEvaluations: number;
  averageTotalScore: number;
  remainingEvaluationsCount: number;
}

interface CriterionStats {
  criterionTitle: string;
  maxScore: number;
  averageScore: number;
  ratingDistribution: {
    [key: string]: number;
  };
}

interface RawEvaluation {
  _id: string;
  evaluatorId: string;
  evaluator: string;
  evaluatee: string;
  groupId: string; // Keep the original groupId
  groupName: string; // Add this field to match the component's expectations
  scores: {
    criterion: string;
    rating: string;
    score: number;
  }[];
  totalScore: number;
  comment: string;
  submittedAt: string;
}

// Similarly, update the EvaluateeStats interface
interface EvaluateeStats {
  evaluationId: string;
  id: string;
  name: string;
  totalEvaluations: number;
  averageScore: number;
  scores: number[];
  groupId?: string; // Keep original field
  groupName?: string; // Add this field
}

interface AssessmentResults {
  remainingEvaluationsByGroup: any;
  assessmentInfo: AssessmentInfo;
  overallStats: OverallStats;
  criteriaStats: CriterionStats[];
  evaluateeStats: EvaluateeStats[];
  rawEvaluations: RawEvaluation[];
  remainingEvaluations: {
    evaluator: string;
    evaluatee: string;
    groupId: string;
  }[];
}

export default function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(
    format(new Date(), 'dd/MM/yyyy HH:mm:ss')
  );

  const { assessmentId } = use(params);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/evaluations/results/${assessmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        console.log('Raw Evaluations:', response.data.data.rawEvaluations); // Add this line
        setResults(response.data.data);
      } else {
        setError('Failed to fetch results');
      }
    } catch (err) {
      setError('Error fetching assessment results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (assessmentId) {
      fetchResults();
    }
  }, [assessmentId]);

  const downloadResults = async () => {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-results-${assessmentId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl">{error || 'No results found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <ResultsHeader
        title={results.assessmentInfo.title}
        dueDate={results.assessmentInfo.dueDate}
        userName={user?.name || 'b6428259'} // เพิ่มค่าเริ่มต้น
        initialTime={currentTime} currentTime={''} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-white hover:text-blue-400 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Total Evaluations"
            value={results.overallStats.totalEvaluations.toString()}
          />
          <StatCard
            icon={<BarChart className="w-6 h-6" />}
            title="Average Score"
            value={`${results.overallStats.averageTotalScore.toFixed(1)}%`}
          />
          <StatCard
            icon={<ChartBar className="w-6 h-6" />}
            title="Remaining Evaluations"
            value={results.overallStats.remainingEvaluationsCount.toString()}
          />
        </div>

        <CriteriaAnalysis
          criteriaStats={results.criteriaStats}
          onDownload={downloadResults}
        />

        <IndividualResults
          evaluateeStats={results.evaluateeStats}
          rawEvaluations={results.rawEvaluations}
          onEvaluationDeleted={fetchResults}
        />

        <PendingEvaluations
          remainingEvaluations={results.remainingEvaluationsByGroup.flatMap(
            (group: { pendingEvaluations: any; }) => group.pendingEvaluations
          )}
        />
      </main>
    </div>
  );
}