'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import { useState } from 'react';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
);

interface CriteriaStats {
  [key: string]: {
    totalScore: number;
    count: number;
    ratings: {
      [key: string]: number;
    };
    averageScore: string;
  };
}

interface CriteriaChartsProps {
  criteriaStats: CriteriaStats;
}

const CriteriaCharts = ({ criteriaStats }: CriteriaChartsProps) => {
  const [viewMode, setViewMode] = useState<'bar' | 'radar' | 'details'>('radar');
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);

  // Colors for the charts
  const chartColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
  ];

  // Prepare data for average scores bar chart
  const barData = {
    labels: Object.keys(criteriaStats),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(criteriaStats).map(stat => parseFloat(stat.averageScore)),
        backgroundColor: chartColors[0],
        borderColor: chartColors[0].replace('0.7', '1'),
        borderWidth: 1,
      },
    ],
  };

  // Radar chart data
  const radarData = {
    labels: Object.keys(criteriaStats),
    datasets: [
      {
        label: 'Your Average Scores',
        data: Object.values(criteriaStats).map(stat => parseFloat(stat.averageScore)),
        backgroundColor: 'rgba(54, 162, 235, 0.3)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)',
      },
    ],
  };

  // Options for bar chart
  const barOptions = {
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
          color: 'white',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'white',
        },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const criterion = Object.keys(criteriaStats)[index];
        setSelectedCriterion(criterion);
        setViewMode('details');
      }
    },
  };

  // Options for radar chart
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'white',
          font: {
            size: 11,
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].datasetIndex;
        const criterion = Object.keys(criteriaStats)[index];
        setSelectedCriterion(criterion);
        setViewMode('details');
      }
    },
  };

  // Create a doughnut chart for the selected criterion
  const createDoughnutData = (criterionName: string) => {
    const stats = criteriaStats[criterionName];
    return {
      labels: Object.keys(stats.ratings),
      datasets: [
        {
          data: Object.values(stats.ratings),
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
  };

  return (
    <div>
      {/* Chart type toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setViewMode('radar');
              setSelectedCriterion(null);
            }}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'radar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Radar
          </button>
          <button
            onClick={() => {
              setViewMode('bar');
              setSelectedCriterion(null);
            }}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Bar
          </button>
        </div>
        
        {viewMode === 'details' && selectedCriterion && (
          <button
            onClick={() => {
              setViewMode('radar');
              setSelectedCriterion(null);
            }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {/* Chart area */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-blue-800/30">
        {viewMode === 'details' && selectedCriterion ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">{selectedCriterion}</h3>
            <div className="text-sm text-gray-300 mb-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
                <div>
                  <span className="text-gray-400">Average Score:</span>{' '}
                  <span className="font-semibold text-blue-400">{criteriaStats[selectedCriterion].averageScore}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Evaluations:</span>{' '}
                  <span className="font-semibold">{criteriaStats[selectedCriterion].count}</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] flex justify-center">
              <Doughnut
                data={createDoughnutData(selectedCriterion)}
                options={doughnutOptions}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Rating Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {Object.entries(criteriaStats[selectedCriterion].ratings).map(([rating, count]) => (
                  <div key={rating} className="flex justify-between text-sm">
                    <span className="text-gray-300">{rating}</span>
                    <span className="font-medium">{count} evaluations</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'bar' ? (
          <div className="h-[350px]">
            <Bar data={barData} options={barOptions} />
          </div>
        ) : (
          <div className="h-[350px] flex justify-center">
            <div className="w-[500px] max-w-full">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-400">
        Click on any data point to see detailed information
      </div>
    </div>
  );
};

export default CriteriaCharts;