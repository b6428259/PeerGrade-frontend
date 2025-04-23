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
  // Colors for the charts
  const chartColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
  ];

  // Prepare data for average scores bar chart
  const averageScoresData = {
    labels: Object.keys(criteriaStats),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(criteriaStats).map(stat => parseFloat(stat.averageScore)),
        backgroundColor: chartColors[0],
        borderColor: chartColors[0].replace('0.8', '1'),
        borderWidth: 1,
      },
    ],
  };

  // Options for bar chart
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: 'Average Scores by Criteria',
        color: 'white',
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
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
      },
    },
  };

  // Create a doughnut chart for each criterion
  const createDoughnutData = (criterionStats: typeof criteriaStats[string]) => ({
    labels: Object.keys(criterionStats.ratings),
    datasets: [
      {
        data: Object.values(criterionStats.ratings),
        backgroundColor: chartColors,
        borderColor: chartColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  });

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'white',
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Average Scores Bar Chart */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
        <div className="h-[400px]">
          <Bar data={averageScoresData} options={barOptions} />
        </div>
      </div>

      {/* Rating Distribution Doughnut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(criteriaStats).map(([criterion, stats]) => (
          <div
            key={criterion}
            className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30"
          >
            <h3 className="text-lg font-medium text-white mb-4 text-center">
              {criterion} - Rating Distribution
            </h3>
            <div className="h-[300px] flex justify-center">
              <Doughnut data={createDoughnutData(stats)} options={doughnutOptions} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriteriaCharts;