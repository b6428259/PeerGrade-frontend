// components/results/StatCard.tsx
import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
}

export const StatCard = ({ icon, title, value }: StatCardProps) => (
  <div className="bg-gray-800/50 rounded-xl p-6 border border-blue-800/30">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-900/50 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);