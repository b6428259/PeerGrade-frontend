import { useMemo, useState } from 'react';
import { Trash2, Search, ChevronUp, ChevronDown, Filter, Award, ChevronsDown, ChevronsUp } from 'lucide-react';
import axios from 'axios';

interface EvaluateeStats {
    evaluationId: string;
    id: string;
    name: string;
    totalEvaluations: number;
    averageScore: number;
    scores: number[];
    groupName?: string;
}

interface RawEvaluation {
    _id: string;
    evaluatorId: string;
    evaluator: string;
    evaluatee: string;
    groupName: string;
    scores: {
        criterion: string;
        rating: string;
        score: number;
    }[];
    totalScore: number;
    comment: string;
    submittedAt: string;
}

interface IndividualResultsProps {
    evaluateeStats: EvaluateeStats[];
    rawEvaluations: RawEvaluation[];
    onEvaluationDeleted: () => void;
}

interface SortConfig {
    key: 'name' | 'averageScore' | 'totalEvaluations' | 'groupName';
    direction: 'asc' | 'desc';
}

export const IndividualResults = ({
    evaluateeStats,
    rawEvaluations,
    onEvaluationDeleted
}: IndividualResultsProps) => {
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'averageScore',
        direction: 'desc'
    });
    const [expandedView, setExpandedView] = useState(false);
    const [showAllResults, setShowAllResults] = useState(false);

    const uniqueGroups = useMemo(() =>
        [...new Set(evaluateeStats.map(stat => stat.groupName).filter(Boolean))],
        [evaluateeStats]
    );

    const filteredAndSortedStats = useMemo(() => {
        return evaluateeStats
            .filter(stat =>
                stat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (groupFilter === null || stat.groupName === groupFilter)
            )
            .sort((a, b) => {
                const keys: SortConfig['key'][] = ['name', 'groupName', 'averageScore', 'totalEvaluations'];
                const key = sortConfig.key;

                if (key === 'name') {
                    return sortConfig.direction === 'asc'
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                }

                if (key === 'groupName') {
                    return sortConfig.direction === 'asc'
                        ? (a.groupName || '').localeCompare(b.groupName || '')
                        : (b.groupName || '').localeCompare(a.groupName || '');
                }

                return sortConfig.direction === 'asc'
                    ? a[key] - b[key]
                    : b[key] - a[key];
            });
    }, [evaluateeStats, searchTerm, sortConfig, groupFilter]);

    const displayedStats = showAllResults 
    ? filteredAndSortedStats 
    : filteredAndSortedStats.slice(0, 6);

    const handleSort = (key: SortConfig['key']) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    

    const handleDeleteEvaluation = async (evaluationId: string) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Deleting evaluation for:', evaluationId);

            await axios.delete(
                `http://localhost:5000/api/evaluations/${evaluationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            onEvaluationDeleted();
        } catch (error) {
            console.error('Error deleting evaluation:', error);
        }
    };

    const SortIndicator = ({ column }: { column: SortConfig['key'] }) => (
        <div className="ml-2 inline-flex flex-col">
            <ChevronUp
                className={`w-3 h-3 ${sortConfig.key === column && sortConfig.direction === 'asc'
                    ? 'text-blue-300'
                    : 'text-gray-500 opacity-50'
                    }`}
            />
            <ChevronDown
                className={`w-3 h-3 -mt-1 ${sortConfig.key === column && sortConfig.direction === 'desc'
                    ? 'text-blue-300'
                    : 'text-gray-500 opacity-50'
                    }`}
            />
        </div>
    );

    return (
        <section className="bg-gray-800/50 rounded-2xl p-6 mb-8 shadow-xl border border-blue-900/20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-blue-300 flex items-center">
                        <Award className="mr-3 w-6 h-6 text-blue-400" />
                        Individual Results
                    </h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">Groups:</span>
                        {[null, ...uniqueGroups].map((group) => (
                            <div
                                key={group || 'all'}
                                onClick={() => setGroupFilter(group ?? null)}
                                className={`
                                    px-3 py-1 rounded-md text-sm cursor-pointer transition-colors
                                    ${groupFilter === group
                                        ? 'bg-blue-800/50 text-blue-300'
                                        : 'text-gray-400 hover:bg-gray-800/50'}
                                `}
                            >
                                {group || 'All'}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2 bg-gray-900/70 border border-blue-800/30 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                    />
                </div>
            </div>

            {/* Sort Controls */}
            <div className="flex gap-4 mb-4 text-sm bg-gray-900/30 p-2 rounded-lg">
                <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Sort by:</span>
                    {['name', 'groupName', 'averageScore', 'totalEvaluations'].map((col) => (
                        <div
                            key={col}
                            onClick={() => handleSort(col as SortConfig['key'])}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors cursor-pointer ${sortConfig.key === col
                                ? 'bg-blue-800/50 text-blue-300'
                                : 'text-gray-400 hover:bg-gray-800/50'
                                }`}
                        >
                            {col.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase())}
                            <SortIndicator column={col as SortConfig['key']} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            <div className={`grid ${expandedView
                ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                {displayedStats.map((stat) => (
                    <div
                        key={stat.id}
                        className={`bg-gray-900/60 rounded-xl p-5 border cursor-pointer transition-all duration-300 group
                            ${selectedStudent === stat.id
                                ? 'border-blue-400 shadow-xl shadow-blue-900/30 scale-[1.02]'
                                : 'border-blue-800/30 hover:border-blue-600/50 hover:shadow-lg'}`}
                        onClick={() => setSelectedStudent(stat.id === selectedStudent ? null : stat.id)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-lg text-blue-300 group-hover:text-blue-200">
                                    {stat.name}
                                </h3>
                                {stat.groupName && (
                                    <span className="text-xs text-gray-400 mt-1">
                                        {stat.groupName}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span
                                    className={`px-2 py-1 rounded-md text-xs font-semibold ${stat.averageScore >= 80
                                        ? 'bg-green-800/30 text-green-300'
                                        : stat.averageScore >= 60
                                            ? 'bg-yellow-800/30 text-yellow-300'
                                            : 'bg-red-800/30 text-red-300'
                                        }`}
                                >
                                    {stat.averageScore.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div className="bg-gray-800/50 p-2 rounded-md">
                                <p className="text-gray-400 text-xs">Total Evaluations</p>
                                <p className="text-blue-300 font-semibold">
                                    {stat.totalEvaluations}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded-md">
                                <p className="text-gray-400 text-xs">Performance</p>
                                <p className={`
                                    font-semibold
                                    ${stat.averageScore >= 80
                                        ? 'text-green-300'
                                        : stat.averageScore >= 60
                                            ? 'text-yellow-300'
                                            : 'text-red-300'
                                    }`}
                                >
                                    {stat.averageScore >= 80
                                        ? 'Excellent'
                                        : stat.averageScore >= 60
                                            ? 'Good'
                                            : 'Needs Improvement'}
                                </p>
                            </div>
                        </div>

                        {/* Detailed evaluations panel */}
                        {selectedStudent === stat.id && (
                            <div className="mt-4 pt-4 border-t border-blue-800/30 space-y-3">
                                <h4 className="text-sm font-semibold mb-2 text-blue-300">
                                    Detailed Evaluations
                                </h4>
                                {rawEvaluations
                                    .filter(evaluation => evaluation.evaluatee === stat.name)
                                    .map((evaluation, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-800/50 rounded-lg p-3 relative group/eval"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <p className="text-blue-300 flex items-center">
                                                        <span className="mr-2">From:</span>
                                                        <span className="font-semibold">{evaluation.evaluator}</span>
                                                    </p>
                                                    {evaluation.groupName && (
                                                        <span className="text-xs text-gray-400 mt-1">
                                                            {evaluation.groupName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    role="button"
                                                    aria-label="Delete Evaluation"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Use stat.id (evaluatee's ID) and evaluation.evaluator
                                                        handleDeleteEvaluation(stat.evaluationId);
                                                    }}
                                                    className="text-red-400 opacity-0 group-hover/eval:opacity-100 transition-opacity hover:text-red-300 p-1 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {evaluation.scores.map((score, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between text-xs bg-gray-900/50 p-1.5 rounded"
                                                    >
                                                        <span className="text-gray-300">{score.criterion}</span>
                                                        <span className="text-blue-300">
                                                            {score.rating} ({score.score})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 text-xs space-y-1">
                                                <p className="text-gray-400">
                                                    Total Score:
                                                    <span className="ml-2 font-semibold text-blue-300">
                                                        {evaluation.totalScore}
                                                    </span>
                                                </p>
                                                {evaluation.comment && (
                                                    <p className="text-gray-300 italic">
                                                        Comment: {evaluation.comment}
                                                    </p>
                                                )}
                                                <p className="text-gray-500 text-right">
                                                    {new Date(evaluation.submittedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

               {/* Show All / Show Less Button */}
               {filteredAndSortedStats.length > 6 && (
                <div className="flex justify-center mt-6">
                    <button 
                        onClick={() => setShowAllResults(!showAllResults)}
                        className="flex items-center px-6 py-2 bg-blue-800/50 text-blue-300 rounded-lg hover:bg-blue-800/70 transition-colors"
                    >
                        {showAllResults ? (
                            <>
                                <ChevronsUp className="mr-2 w-4 h-4" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronsDown className="mr-2 w-4 h-4" />
                                Show All ({filteredAndSortedStats.length})
                            </>
                        )}
                    </button>
                </div>
            )}
            
            {filteredAndSortedStats.length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-gray-900/30 rounded-lg">
                    No results found for "{searchTerm}"
                </div>
            )}
        </section>
    );
};