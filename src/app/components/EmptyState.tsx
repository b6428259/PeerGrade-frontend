import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-blue-800/30 shadow-lg p-10 text-center">
      <div className="flex justify-center mb-4">
        <FileQuestion className="w-16 h-16 text-gray-600" />
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}