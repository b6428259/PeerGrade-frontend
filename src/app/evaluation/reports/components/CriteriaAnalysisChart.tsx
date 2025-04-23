'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CriteriaAnalysisProps {
  criteriaStatistics: Array<{
    criterionTitle: string;
    description?: string;
    averageScore: number;
    maxPossibleScore: number;
    ratingDistribution: Record<string, number>;
  }>;
}

export default function CriteriaAnalysisChart({ criteriaStatistics }: CriteriaAnalysisProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<number | null>(null);
  
  const data = {
    labels: criteriaStatistics.map(stat => stat.criterionTitle),
    datasets: [
      {
        label: 'Average Score',
        data: criteriaStatistics.map(stat => stat.averageScore),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Maximum Possible Score',
        data: criteriaStatistics.map(stat => stat.maxPossibleScore),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  // For selected criterion rating distribution
  const getRatingDistributionData = () => {
    if (selectedCriterion === null) return null;
    
    const criterion = criteriaStatistics[selectedCriterion];
    if (!criterion) return null;
    
    const labels = Object.keys(criterion.ratingDistribution);
    const values = Object.values(criterion.ratingDistribution);
    
    return {
      labels,
      datasets: [
        {
          label: 'Rating Distribution',
          data: values,
          backgroundColor: labels.map((_, i) => {
            const hue = (i * 30) % 360;
            return `hsla(${hue}, 70%, 60%, 0.5)`;
          }),
          borderColor: labels.map((_, i) => {
            const hue = (i * 30) % 360;
            return `hsl(${hue}, 70%, 60%)`;
          }),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
      <h3 className="text-xl font-semibold mb-2">Criteria Analysis</h3>
      
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-400">
          {selectedCriterion !== null ? (
            <span className="cursor-pointer text-blue-400 hover:text-blue-300" onClick={() => setSelectedCriterion(null)}>
              ← Back to All Criteria
            </span>
          ) : 'Click on a criterion to see detailed rating distribution'}
        </p>
      </div>
      
      {selectedCriterion !== null ? (
        <div>
          <h4 className="font-medium text-blue-300 mb-2">
            {criteriaStatistics[selectedCriterion]?.criterionTitle}
          </h4>
          
          {criteriaStatistics[selectedCriterion]?.description && (
            <p className="text-sm text-gray-400 mb-4">
              {criteriaStatistics[selectedCriterion].description}
            </p>
          )}
          
          <div className="h-[250px] mt-6">
            <Bar
              data={getRatingDistributionData()!}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <div className="h-[250px]">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                },
              },
              onClick: (event, elements) => {
                if (elements && elements.length > 0) {
                  setSelectedCriterion(elements[0].index);
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}