import { format, formatDistanceToNow } from 'date-fns';

interface RecentEvaluationsCardProps {
  recentEvaluations: Array<{
    id: string;
    evaluatorId: string;
    evaluatorName: string;
    evaluateeId: string;
    evaluateeName: string;
    totalScore: number;
    submittedAt: string;
  }>;
}

export default function RecentEvaluationsCard({ recentEvaluations }: RecentEvaluationsCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
      <h3 className="text-xl font-semibold mb-6">Recent Evaluations</h3>
      
      <div className="space-y-4">
        {recentEvaluations.map(evaluation => {
          const submittedTime = new Date(evaluation.submittedAt);
          const timeAgo = formatDistanceToNow(submittedTime, { addSuffix: true });
          
          return (
            <div 
              key={evaluation.id} 
              className="bg-gray-800/70 rounded-lg p-4 border border-gray-700/50"
            >
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium text-blue-400">{evaluation.evaluatorName}</span>
                  <span className="text-gray-400 mx-2">evaluated</span>
                  <span className="font-medium">{evaluation.evaluateeName}</span>
                </div>
                <div className="text-gray-400 text-sm">
                  <span 
                    className={`inline-block rounded-lg px-2 py-1 ml-2
                    ${evaluation.totalScore > 80 ? 'bg-green-900/30 text-green-400' : 
                      evaluation.totalScore > 60 ? 'bg-blue-900/30 text-blue-400' :
                      evaluation.totalScore > 40 ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'}`}
                  >
                    {evaluation.totalScore} points
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span title={format(submittedTime, "yyyy-MM-dd HH:mm:ss")}>
                  {timeAgo}
                </span>
              </div>
            </div>
          );
        })}
        
        {recentEvaluations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No evaluations have been submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}