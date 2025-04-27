import { format, formatDistanceToNow } from 'date-fns';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

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

interface EvaluationListProps {
  evaluations: Evaluation[];
  onSelectEvaluation: (evaluation: Evaluation) => void;
}

const EvaluationList = ({ evaluations, onSelectEvaluation }: EvaluationListProps) => {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [showFilters, setShowFilters] = useState(false);
  
  const filteredEvaluations = evaluations.filter(evaluation => 
    evaluation.assessmentTitle.toLowerCase().includes(searchText.toLowerCase()) ||
    evaluation.evaluateeName.toLowerCase().includes(searchText.toLowerCase())
  );
  
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    } else if (sortBy === 'score') {
      return b.totalScore - a.totalScore;
    } else {
      return a.evaluateeName.localeCompare(b.evaluateeName);
    }
  });
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Your Evaluations</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search evaluations..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-800/70 rounded-lg border border-gray-700 text-white w-full placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 bg-gray-700/70 hover:bg-gray-700 text-white rounded-lg flex items-center"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            <span className="text-sm">Sort</span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-700">
          <button 
            onClick={() => setSortBy('date')} 
            className={`px-3 py-1 rounded text-sm ${sortBy === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Date (newest)
          </button>
          <button 
            onClick={() => setSortBy('score')} 
            className={`px-3 py-1 rounded text-sm ${sortBy === 'score' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Highest Score
          </button>
          <button 
            onClick={() => setSortBy('name')} 
            className={`px-3 py-1 rounded text-sm ${sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Name (A-Z)
          </button>
        </div>
      )}
      
      {sortedEvaluations.length === 0 ? (
        <div className="text-center p-8 text-gray-400">
          {searchText ? 'No evaluations match your search' : 'No evaluations found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedEvaluations.map((evaluation) => {
            const submittedDate = new Date(evaluation.submittedAt);
            const timeAgo = formatDistanceToNow(submittedDate, { addSuffix: true });
            
            return (
              <div 
                key={evaluation.id}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-800/90 hover:border-blue-800/50 transition"
                onClick={() => onSelectEvaluation(evaluation)}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium text-white truncate max-w-[70%]">{evaluation.assessmentTitle}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    evaluation.totalScore > 80 ? 'bg-green-900/30 text-green-400' : 
                    evaluation.totalScore > 60 ? 'bg-blue-900/30 text-blue-400' :
                    evaluation.totalScore > 40 ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {evaluation.totalScore} points
                  </span>
                </div>
                
                <p className="text-blue-300 text-sm mt-2">
                  Evaluated: {evaluation.evaluateeName}
                </p>
                
                <div className="mt-3 text-xs text-gray-400 flex justify-between items-center">
                  <span title={format(submittedDate, "yyyy-MM-dd HH:mm:ss")}>
                    Submitted {timeAgo}
                  </span>
                  <span className="text-gray-500">
                    {evaluation.scores.length} criteria
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvaluationList;