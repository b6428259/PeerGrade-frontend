import { ArrowLeft, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

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

interface EvaluationDetailsProps {
  evaluation: Evaluation;
  onBack: () => void;
}

const EvaluationDetails = ({ evaluation, onBack }: EvaluationDetailsProps) => {
  // Calculate the maximum possible score based on the highest score in any criterion
  const getScorePercentage = (score: number) => {
    // Assume maximum score per criterion is 30 (this is an approximation)
    const maxPossibleScore = evaluation.scores.length * 30;
    return (score / maxPossibleScore) * 100;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Evaluations
        </button>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{evaluation.assessmentTitle}</h2>
            <p className="text-blue-300 mt-1">
              Evaluation for: <span className="font-medium">{evaluation.evaluateeName}</span>
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Submitted on {format(new Date(evaluation.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 w-full md:w-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Overall Score</span>
              <span className={`font-bold ${
                evaluation.totalScore > 80 ? 'text-green-400' : 
                evaluation.totalScore > 60 ? 'text-blue-400' :
                evaluation.totalScore > 40 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {evaluation.totalScore} points
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div 
                className={`h-2 ${
                  evaluation.totalScore > 80 ? 'bg-green-500' : 
                  evaluation.totalScore > 60 ? 'bg-blue-500' :
                  evaluation.totalScore > 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} 
                style={{ width: `${getScorePercentage(evaluation.totalScore)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Scores by Criteria</h3>
            <div className="space-y-5">
              {evaluation.scores.map((score, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-wrap justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{score.criterionTitle}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm">{score.rating}</span>
                      <span className={`text-sm font-medium ${
                        score.score > 24 ? 'text-green-400' : 
                        score.score > 18 ? 'text-blue-400' :
                        score.score > 12 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {score.score} points
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                    <div 
                      className={`h-2 ${
                        score.score > 24 ? 'bg-green-500' : 
                        score.score > 18 ? 'bg-blue-500' :
                        score.score > 12 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} 
                      style={{ width: `${(score.score / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {evaluation.comment && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="flex items-center text-lg font-semibold text-white mb-3">
                <MessageSquare className="w-5 h-5 mr-2" />
                Comment
              </h3>
              <p className="text-gray-300 bg-gray-800/70 rounded-lg p-4 border border-gray-700">
                {evaluation.comment || "No comment provided."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetails;