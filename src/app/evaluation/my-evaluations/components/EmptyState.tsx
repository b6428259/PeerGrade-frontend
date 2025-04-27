import { BookOpen, ChartBar, FileQuestion } from 'lucide-react';

// แก้ไขให้ interface ตรงกับการใช้งาน
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'chart' | 'course' | 'default'; // เพิ่ม type ให้ถูกต้อง
}

const EmptyState = ({ title, description, icon = 'default' }: EmptyStateProps) => {
  const getIcon = () => {
    switch (icon) {
      case 'chart':
        return <ChartBar className="w-16 h-16 text-gray-600" />;
      case 'course':
        return <BookOpen className="w-16 h-16 text-gray-600" />;
      default:
        return <FileQuestion className="w-16 h-16 text-gray-600" />;
    }
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-blue-800/30 shadow-lg p-10 text-center">
      <div className="flex justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-xl font-medium mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default EmptyState;