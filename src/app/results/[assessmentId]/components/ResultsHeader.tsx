// components/results/ResultsHeader.tsx
import { format } from 'date-fns';

interface ResultsHeaderProps {
  title: string;
  dueDate: string;
  currentTime: string;
  userName: string;
  initialTime: string;
}

export const ResultsHeader = ({ title, dueDate, currentTime, userName }: ResultsHeaderProps) => {
  return (
    <header className="bg-gray-800/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-blue-300">
              Due: {format(new Date(dueDate), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-300">{currentTime}</p>
            <p className="text-sm text-blue-300">{userName}</p>
          </div>
        </div>
      </div>
    </header>
  );
};