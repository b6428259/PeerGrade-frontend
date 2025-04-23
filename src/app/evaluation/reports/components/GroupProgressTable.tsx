import { useState } from 'react';
import { ChevronDown, ChevronUp, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface GroupProgressTableProps {
  groupStatistics: Array<{
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
}

export default function GroupProgressTable({ groupStatistics }: GroupProgressTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Group Progress</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="py-3 px-4">Group</th>
              <th className="py-3 px-4">Members</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupStatistics.map(group => (
              <>
                <tr key={group.groupId} className="hover:bg-gray-800/30">
                  <td className="py-3 px-4">{group.groupName}</td>
                  <td className="py-3 px-4">{group.memberCount}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${
                            group.completionPercentage === 100
                              ? 'bg-green-500'
                              : group.completionPercentage > 75
                              ? 'bg-blue-500'
                              : group.completionPercentage > 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${group.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm whitespace-nowrap">
                        {group.completionPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {group.completionPercentage === 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </span>
                    ) : group.completionPercentage === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Started
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        In Progress
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleGroup(group.groupId)}
                      className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
                    >
                      {expandedGroups[group.groupId] ? (
                        <>
                          Hide Details
                          <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Show Details
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedGroups[group.groupId] && (
                  <tr key={`${group.groupId}-details`}>
                    <td colSpan={5} className="bg-gray-900/50 border-t border-gray-800">
                      <div className="p-4">
                        <h4 className="font-medium text-blue-400 mb-3 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Student Progress
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {group.studentCompletionStatus.map(student => (
                            <div
                              key={student.id}
                              className="bg-gray-800/70 rounded p-3 border border-gray-700/50"
                            >
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">{student.name}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    student.completed
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}
                                >
                                  {student.completed ? 'Completed' : 'In Progress'}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    student.completionPercentage === 100
                                      ? 'bg-green-500'
                                      : student.completionPercentage > 50
                                      ? 'bg-blue-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${student.completionPercentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>{student.evaluationsDone} of {student.totalNeeded} evaluations</span>
                                <span>{student.completionPercentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}