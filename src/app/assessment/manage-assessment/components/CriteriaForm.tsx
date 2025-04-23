// app/assessment/manage-assessment/components/CriteriaForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { ExclamationCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCustomToast } from '@/app/components/common/Toast';
import { ConfirmationModal } from '@/app/components/common/Modal';
import RatingScaleForm from './RatingScaleForm';

interface RatingScale {
  label: string;
  score: number;
  percentageScore: number;
  description: string;
}

interface Criterion {
  title: string;
  description: string;
  maxScore: number;
  ratingScale: RatingScale[];
}

interface CriteriaFormProps {
  selectedCourseId: string;
  assessmentId?: string;
  onCriteriaChange: (criteria: Criterion[]) => void;
  initialCriteria?: Criterion[];
}

export default function CriteriaForm({ 
  selectedCourseId, 
  assessmentId, 
  onCriteriaChange,
  initialCriteria 
}: CriteriaFormProps) {
  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria || []);
  const [totalMaxScore, setTotalMaxScore] = useState(0);
  const { showWarningToast, showErrorToast } = useCustomToast();
  const [criterionToDelete, setCriterionToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (initialCriteria) {
      setCriteria(initialCriteria);
      calculateTotalMaxScore(initialCriteria);
    } else {
      setCriteria([]);
      setTotalMaxScore(0);
    }
  }, [initialCriteria, selectedCourseId]);

  const calculateTotalMaxScore = (currentCriteria: Criterion[]) => {
    const total = currentCriteria.reduce((sum, criterion) => sum + (criterion.maxScore || 0), 0);
    setTotalMaxScore(total);
    return total;
  };

  const addCriterion = () => {
    if (totalMaxScore >= 100) {
      showWarningToast('Total maximum score cannot exceed 100%');
      return;
    }

    const newCriterion: Criterion = {
      title: '',
      description: '',
      maxScore: 0,
      ratingScale: [
        { label: 'มากที่สุด', score: 0, percentageScore: 0, description: '' },
        { label: 'มาก', score: 0, percentageScore: 0, description: '' },
        { label: 'ปานกลาง', score: 0, percentageScore: 0, description: '' },
        { label: 'น้อย', score: 0, percentageScore: 0, description: '' },
        { label: 'น้อยที่สุด', score: 0, percentageScore: 0, description: '' }
      ]
    };
    
    const newCriteria = [...criteria, newCriterion];
    setCriteria(newCriteria);
    onCriteriaChange(newCriteria);
  };

  const removeCriterion = (index: number) => {
    const newCriteria = criteria.filter((_, i) => i !== index);
    setCriteria(newCriteria);
    calculateTotalMaxScore(newCriteria);
    onCriteriaChange(newCriteria);
    setCriterionToDelete(null);
  };

    const updateCriterion = (index: number, field: keyof Criterion, value: any) => {
    const newCriteria = [...criteria];
    
    if (field === 'maxScore') {
      const currentTotal = totalMaxScore - (criteria[index].maxScore || 0);
      const newScore = Math.max(0, Number(value));
      
      if (currentTotal + newScore > 100) {
        showWarningToast(`Cannot set max score to ${newScore}. Total would exceed 100%.`);
        return;
      }

      newCriteria[index] = { 
        ...newCriteria[index], 
        maxScore: newScore,
        ratingScale: newCriteria[index].ratingScale.map(scale => ({
          ...scale,
          percentageScore: (scale.score / newScore) * 100
        }))
      };
    } else {
      newCriteria[index] = { ...newCriteria[index], [field]: value };
    }
    
    setCriteria(newCriteria);
    calculateTotalMaxScore(newCriteria);
    onCriteriaChange(newCriteria);
  };

  if (!selectedCourseId) return null;
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Assessment Criteria</h2>
            <div className="mt-1 flex items-center space-x-2">
              <div className={`text-sm ${totalMaxScore > 100 ? 'text-red-400' : 'text-blue-400'}`}>
                Total Score: {totalMaxScore}%
              </div>
              {totalMaxScore > 100 && (
                <div className="flex items-center text-red-400 text-sm">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  Exceeds maximum allowed (100%)
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={addCriterion}
            disabled={totalMaxScore >= 100}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors
                       ${totalMaxScore >= 100 
                         ? 'bg-gray-600 cursor-not-allowed' 
                         : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Criterion
          </button>
        </div>

        <div className="space-y-6">
          {criteria.map((criterion, index) => (
            <div 
              key={index}
              className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50"
            >
              
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Criterion Title
                    </label>
                    <input
                      type="text"
                      value={criterion.title}
                      onChange={(e) => updateCriterion(index, 'title', e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg 
                               px-4 py-2 text-white focus:border-blue-500 focus:ring-1 
                               focus:ring-blue-500"
                      placeholder="Enter criterion title"
                      required
                    />
                  </div>

                  {/* Max Score Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Score (%)
                    </label>
                    <input
                      type="number"
                      value={criterion.maxScore}
                      onChange={(e) => updateCriterion(index, 'maxScore', Number(e.target.value))}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg 
                               px-4 py-2 text-white focus:border-blue-500 focus:ring-1 
                               focus:ring-blue-500"
                      min="0"
                      max={100 - (totalMaxScore - criterion.maxScore)}
                      required
                    />
                  </div>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={criterion.description}
                    onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg 
                             px-4 py-2 text-white focus:border-blue-500 focus:ring-1 
                             focus:ring-blue-500"
                    rows={2}
                    placeholder="Describe the criterion"
                    required
                  />
                </div>

                {/* Rating Scale Form */}
                <RatingScaleForm
                  ratingScale={criterion.ratingScale}
                  maxScore={criterion.maxScore}
                  onUpdate={(scaleIndex, field, value) => {
                    const newCriteria = [...criteria];
                    newCriteria[index].ratingScale[scaleIndex] = {
                      ...newCriteria[index].ratingScale[scaleIndex],
                      [field]: value,
                      percentageScore: field === 'score'
                        ? (value / criterion.maxScore) * 100
                        : newCriteria[index].ratingScale[scaleIndex].percentageScore
                    };
                    setCriteria(newCriteria);
                    onCriteriaChange(newCriteria);
                  } } remainingTotalScore={0}                />
              </div>

              <button
                type="button"
                onClick={() => setCriterionToDelete(index)}
                className="ml-4 p-2 text-red-400 hover:text-red-300 
                         transition-colors rounded-lg hover:bg-red-400/10"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              </div>
            </div>
          ))}
        </div>
      </div>
       
      <ConfirmationModal
        isOpen={criterionToDelete !== null}
        onOpenChange={(open) => setCriterionToDelete(open ? criterionToDelete : null)}
        title="Delete Criterion"
        description="Are you sure you want to delete this criterion?"
        onConfirm={() => removeCriterion(criterionToDelete as number)}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}