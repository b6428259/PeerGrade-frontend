interface AssessmentSummaryCardProps {
    statistics: {
      submissionRate: {
        submitted: number;
        total: number;
        percentage: number;
      };
      averageTotalScore: number;
    };
    assessmentInfo: {
      numberOfCriteria: number;
      maxPossibleScore?: number;
      status: string;
      dueStatus?: string;
      remainingDays?: number;
    };
  }
  
  export default function AssessmentSummaryCard({ statistics, assessmentInfo }: AssessmentSummaryCardProps) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
        <h3 className="text-xl font-semibold mb-6">Assessment Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/70 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Average Score</p>
            <p className={`text-2xl font-bold ${statistics.averageTotalScore > 70 ? 'text-green-400' : statistics.averageTotalScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {statistics.averageTotalScore.toFixed(1)}
            </p>
            {assessmentInfo.maxPossibleScore && (
              <p className="text-xs text-gray-500">out of {assessmentInfo.maxPossibleScore}</p>
            )}
          </div>
          
          <div className="bg-gray-800/70 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Completion</p>
            <p className="text-2xl font-bold text-blue-400">
              {statistics.submissionRate.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {statistics.submissionRate.submitted} of {statistics.submissionRate.total}
            </p>
          </div>
          
          <div className="bg-gray-800/70 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Criteria</p>
            <p className="text-2xl font-bold text-purple-400">
              {assessmentInfo.numberOfCriteria}
            </p>
          </div>
          
          <div className="bg-gray-800/70 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Status</p>
            {assessmentInfo.status === 'active' ? (
              assessmentInfo.dueStatus === 'urgent' ? (
                <>
                  <p className="text-2xl font-bold text-orange-400">Urgent</p>
                  <p className="text-xs text-gray-500">
                    {assessmentInfo.remainingDays} days left
                  </p>
                </>
              ) : assessmentInfo.dueStatus === 'expired' ? (
                <p className="text-2xl font-bold text-red-400">Expired</p>
              ) : (
                <p className="text-2xl font-bold text-green-400">Active</p>
              )
            ) : (
              <p className="text-2xl font-bold text-gray-400">Closed</p>
            )}
          </div>
        </div>
      </div>
    );
  }