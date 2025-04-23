'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ScoreDistributionProps {
  scoreDistribution: {
    min: number;
    max: number;
    average: number;
  };
  submissionRate: {
    submitted: number;
    total: number;
    percentage: number;
  };
}

export default function ScoreDistributionChart({ scoreDistribution, submissionRate }: ScoreDistributionProps) {
  const barData = {
    labels: ['Minimum', 'Average', 'Maximum'],
    datasets: [
      {
        label: 'Score Distribution',
        data: [scoreDistribution.min, scoreDistribution.average, scoreDistribution.max],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',   // red
          'rgba(59, 130, 246, 0.5)',  // blue
          'rgba(34, 197, 94, 0.5)',   // green
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Submitted', 'Pending'],
    datasets: [
      {
        data: [submissionRate.submitted, Math.max(0, submissionRate.total - submissionRate.submitted)],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',  // green
          'rgba(239, 68, 68, 0.5)',  // red
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 shadow-lg">
      <h3 className="text-xl font-semibold mb-6">Score Distribution & Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Bar
            data={barData}
            options={{
              responsive: true,
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
        <div>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-[180px]">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {submissionRate.percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">
                {submissionRate.submitted} / {submissionRate.total} completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}