import { User } from "@/app/contexts/AuthContext";
import { ChartBarIcon, ClipboardListIcon, ClockIcon, UsersIcon, NotebookPen } from "lucide-react";
import React from "react";

// Quick Action Card Component
interface QuickActionCardProps {
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
  }
  
  const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, icon, onClick }) => (
    <div
      onClick={onClick}
      className="bg-gray-800/50 backdrop-blur-lg border border-blue-800/30 rounded-xl p-6 
                 hover:bg-gray-800/80 transition-all cursor-pointer flex items-center space-x-4"
    >
      {icon}
      <span className="text-white font-semibold">{title}</span>
    </div>
  );

 // Quick Actions Section Component
 const QuickActionsSection = React.memo(({ user, router }: { user: User | null, router: any }) => {
    if (!user) return null;

    if (user.role === 'teacher') {
      return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Manage Assessment"
            icon={<ClipboardListIcon className="w-6 h-6 text-blue-400" />}
            onClick={() => router.push('/assessment/manage-assessment')}
          />
          <QuickActionCard
            title="View Reports"
            icon={<ChartBarIcon className="w-6 h-6 text-green-400" />}
            onClick={() => router.push('evaluation/reports')}
          />
          <QuickActionCard
            title="Manage Groups"
            icon={<UsersIcon className="w-6 h-6 text-purple-400" />}
            onClick={() => router.push('/groups/manage')}
          />
        </section>
      );
    }

    if (user.role === 'student') {
    return (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <QuickActionCard
          title="Pending Assessments"
          icon={<ClockIcon className="w-6 h-6 text-yellow-400" />}
          onClick={() => router.push('/assessments/pending')}
        />
        <QuickActionCard
          title="My Evaluations"
          icon={<ChartBarIcon className="w-6 h-6 text-green-400" />}
          onClick={() => router.push('evaluation/my-evaluations')}
        />
        <QuickActionCard
          title="My Group"
          icon={<UsersIcon className="w-6 h-6 text-blue-400" />}
          onClick={() => router.push('/groups/my-group')}
        />
      </section>
   )};
     if (user.role === 'admin') {
      return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Create Course"
            icon={<NotebookPen className="w-6 h-6 text-blue-400" />}
            onClick={() => router.push('/course/create')}
          />
          <QuickActionCard
            title="View Reports"
            icon={<ChartBarIcon className="w-6 h-6 text-green-400" />}
            onClick={() => router.push('evaluation/reports')}
          />
          <QuickActionCard
            title="Manage Users"
            icon={<UsersIcon className="w-6 h-6 text-purple-400" />}
            onClick={() => router.push('/users/manage')}
          />
        </section>
      );
    }
              


  });


export default QuickActionsSection;