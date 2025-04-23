// app/assessment/manage-assessment/components/RatingScaleForm.tsx
'use client';

import { useState } from 'react';
import { useCustomToast } from '@/app/components/common/Toast';

interface RatingScale {
  label: string;
  score: number;
  percentageScore: number;
  description: string;
}

interface RatingScaleFormProps {
  ratingScale: RatingScale[];
  maxScore: number;
  remainingTotalScore: number;
  onUpdate: (index: number, field: keyof RatingScale, value: any) => void;
}

export default function RatingScaleForm({ 
  ratingScale, 
  maxScore,
  remainingTotalScore,
  onUpdate 
}: RatingScaleFormProps) {
  const { showWarningToast } = useCustomToast();
  const [inputMode, setInputMode] = useState<'score' | 'percentage'>('score');

  const handleScoreUpdate = (index: number, value: number, type: 'score' | 'percentage') => {
    if (value < 0) {
      showWarningToast('Value cannot be negative');
      return;
    }

    if (type === 'score') {
      if (value > maxScore) {
        showWarningToast(`Score cannot exceed the maximum score of ${maxScore}`);
        return;
      }
      const percentageScore = (value / maxScore) * 100;
      onUpdate(index, 'score', value);
      onUpdate(index, 'percentageScore', percentageScore);
    } else {
      if (value > 100) {
        showWarningToast('Percentage cannot exceed 100%');
        return;
      }
      const score = (value / 100) * maxScore;
      onUpdate(index, 'score', score);
      onUpdate(index, 'percentageScore', value);
    }
  };

  return (
    <div className="mt-6 bg-gray-800/40 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Rating Scales</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Input Mode:</label>
            <select
              value={inputMode}
              onChange={(e) => setInputMode(e.target.value as 'score' | 'percentage')}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-1 
                       text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="score">Score</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Max Score: </span>
              <span className="text-white font-medium">{maxScore}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Remaining: </span>
              <span className={`font-medium ${remainingTotalScore < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {remainingTotalScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {ratingScale.map((scale, index) => (
          <div key={index} 
               className="grid grid-cols-12 gap-4 items-center bg-gray-700/30 p-3 rounded-lg
                          hover:bg-gray-700/40 transition-colors">
            {/* Label */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Label</label>
              <input
                type="text"
                value={scale.label}
                onChange={(e) => onUpdate(index, 'label', e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 
                         text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Label"
                required
              />
            </div>

            {/* Score/Percentage Input */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">
                {inputMode === 'score' ? 'Score' : 'Percentage'}
              </label>
              <input
                type="number"
                value={inputMode === 'score' ? scale.score : scale.percentageScore}
                onChange={(e) => handleScoreUpdate(
                  index, 
                  Number(e.target.value), 
                  inputMode
                )}
                min="0"
                max={inputMode === 'score' ? maxScore : 100}
                step={inputMode === 'percentage' ? "0.1" : "0.5"}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 
                         text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={inputMode === 'score' ? "Score" : "Percentage"}
                required
              />
            </div>

            {/* Display corresponding value */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">
                {inputMode === 'score' ? 'Percentage' : 'Score'}
              </label>
              <div className="flex items-center h-[34px] px-3 bg-gray-700/30 rounded-lg">
                <span className="text-sm text-gray-300">
                  {inputMode === 'score' 
                    ? `${scale.percentageScore.toFixed(1)}%`
                    : scale.score.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="col-span-6">
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={scale.description}
                onChange={(e) => onUpdate(index, 'description', e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 
                         text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Description"
                required
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}