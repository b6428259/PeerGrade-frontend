// src/app/results/[assessmentId]/components/CriteriaAnalysis.tsx
import { Download } from 'lucide-react';

interface CriterionStats {
  criterionTitle: string;
  maxScore: number;
  averageScore: number;
  ratingDistribution: {
    [key: string]: number;
  };
}

interface CriteriaAnalysisProps {
  criteriaStats: CriterionStats[];
  onDownload: () => void;
}

export const CriteriaAnalysis = ({ criteriaStats, onDownload }: CriteriaAnalysisProps) => {
  return (
    <section className="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Criteria Analysis</h2>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Results
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {criteriaStats.map((criterion, index) => (
          <div
            key={index}
            className="bg-gray-900/50 rounded-lg p-4 border border-blue-800/30"
          >
            <h3 className="font-semibold mb-2">{criterion.criterionTitle}</h3>
            <div className="text-sm space-y-1">
              <p>
                Average Score:{' '}
                <span className="text-blue-300">
                  {criterion.averageScore.toFixed(1)}/{criterion.maxScore}
                </span>
              </p>
              <div className="space-y-1 mt-2">
                <p className="text-xs text-gray-400">Rating Distribution:</p>
                {Object.entries(criterion.ratingDistribution).map(
                  ([rating, count]) => (
                    <div
                      key={rating}
                      className="flex justify-between text-xs"
                    >
                      <span>{rating}:</span>
                      <span className="text-blue-300">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};