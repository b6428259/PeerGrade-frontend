// src/app/results/[assessmentId]/components/PendingEvaluations.tsx
import { useState, useMemo } from 'react';
import { Search, Users, AlertCircle } from 'lucide-react';

interface PendingEvaluation {
  evaluator: string;
  evaluatee: string;
  groupId: string;
  groupName: string;
}

interface GroupedEvaluations {
  [groupName: string]: {
    groupId: string;
    evaluations: PendingEvaluation[];
  };
}

interface PendingEvaluationsProps {
  remainingEvaluations: PendingEvaluation[];
}

export const PendingEvaluations = ({ remainingEvaluations }: PendingEvaluationsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group evaluations by group name
  const groupedEvaluations = useMemo(() => {
    const grouped: GroupedEvaluations = {};
    remainingEvaluations.forEach((evaluation) => {
      if (!grouped[evaluation.groupName]) {
        grouped[evaluation.groupName] = {
          groupId: evaluation.groupId,
          evaluations: [],
        };
      }
      grouped[evaluation.groupName].evaluations.push(evaluation);
    });
    return grouped;
  }, [remainingEvaluations]);

  // Filter evaluations based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedEvaluations;

    const searchLower = searchTerm.toLowerCase();
    const filtered: GroupedEvaluations = {};

    Object.entries(groupedEvaluations).forEach(([groupName, group]) => {
      const matchingEvaluations = group.evaluations.filter(
        (evaluation) =>
            evaluation.evaluator.toLowerCase().includes(searchLower) ||
        evaluation.evaluatee.toLowerCase().includes(searchLower) ||
          groupName.toLowerCase().includes(searchLower)
      );

      if (matchingEvaluations.length > 0) {
        filtered[groupName] = {
          ...group,
          evaluations: matchingEvaluations,
        };
      }
    });

    return filtered;
  }, [groupedEvaluations, searchTerm]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((current) => {
      const newSet = new Set(current);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  if (remainingEvaluations.length === 0) return null;

  return (
    <section className="bg-gray-800/50 rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-semibold">Pending Evaluations</h2>
        </div>
        <div className="mt-4 md:mt-0 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search evaluations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-900/50 border border-blue-800/30 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
          />
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(filteredGroups).map(([groupName, group]) => (
          <div
            key={group.groupId}
            className="bg-gray-900/30 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="font-medium">{groupName}</span>
                <span className="text-sm text-gray-400">
                  ({group.evaluations.length} pending)
                </span>
              </div>
              <div className="transform transition-transform duration-200">
                {expandedGroups.has(groupName) ? (
                  <span className="text-2xl">−</span>
                ) : (
                  <span className="text-2xl">+</span>
                )}
              </div>
            </button>

            {expandedGroups.has(groupName) && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.evaluations.map((evaluation, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/30 rounded-lg p-4 border border-blue-800/20"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm">
                            <span className="text-gray-400">From:</span>{' '}
                            <span className="text-blue-300">
                              {evaluation.evaluator}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-400">To:</span>{' '}
                            <span className="text-blue-300">
                              {evaluation.evaluatee}
                            </span>
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-yellow-400/10 rounded text-yellow-400 text-xs">
                          Pending
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(filteredGroups).length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No pending evaluations found {searchTerm && `for "${searchTerm}"`}
        </div>
      )}
    </section>
  );
};