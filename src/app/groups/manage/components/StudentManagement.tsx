import React, { useState } from 'react';
import { ConfirmationModal } from '@/app/components/common/Modal';
import { useCustomToast } from '@/app/components/common/Toast';

interface Student {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  students: Student[];
}

interface Group {
  _id: string;
  groupName: string;
  members: Student[];
}

interface StudentManagementProps {
  course: Course;
  group: Group;
  availableStudents: Student[];
  onAssignStudent: (groupId: string, studentId: string, action: 'add' | 'remove') => Promise<void>;
}

export default function StudentManagement({ 
  group, 
  availableStudents, 
  onAssignStudent 
}: StudentManagementProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    student?: Student;
    action?: 'add' | 'remove';
  }>({ isOpen: false });

  const handleStudentAssignment = async () => {
    if (modalState.student && modalState.action) {
      try {
        await onAssignStudent(
          group._id, 
          modalState.student._id, 
          modalState.action
        );

        const actionText = modalState.action === 'add' 
          ? 'added to' 
          : 'removed from';
        
        showSuccessToast(`${modalState.student.name} was ${actionText} ${group.groupName}`);
      } catch (error) {
        showErrorToast(`Failed to ${modalState.action} student`);
      } finally {
        // Close the modal
        setModalState({ isOpen: false });
      }
    }
  };

  const openModal = (student: Student, action: 'add' | 'remove') => {
    setModalState({ 
      isOpen: true, 
      student, 
      action 
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onOpenChange={(open) => setModalState(prev => ({ ...prev, isOpen: open }))}
        title={modalState.action === 'add' ? 'Add Student to Group' : 'Remove Student from Group'}
        description={`Are you sure you want to ${modalState.action} ${modalState.student?.name} from the group "${group.groupName}"?`}
        onConfirm={handleStudentAssignment}
        variant={modalState.action === 'add' ? 'default' : 'destructive'}
        confirmText={modalState.action === 'add' ? 'Add' : 'Remove'}
      />

      <h2 className="text-xl font-semibold mb-4">Manage {group.groupName}</h2>
      
      <div className="space-y-6">
        {/* Current Members */}
        <div>
          <h3 className="text-lg font-medium mb-3">Current Members</h3>
          <div className="space-y-2">
            {group.members.length === 0 ? (
              <p className="text-gray-400">No members in this group</p>
            ) : (
              group.members.map((student) => (
                <div
                  key={student._id}
                  className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                >
                  <span>{student.name}</span>
                  <button
                    onClick={() => openModal(student, 'remove')}
                    className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Students */}
        <div>
          <h3 className="text-lg font-medium mb-3">Available Students</h3>
          <div className="space-y-2">
            {availableStudents.length === 0 ? (
              <p className="text-gray-400">No available students</p>
            ) : (
              availableStudents.map((student) => (
                <div
                  key={student._id}
                  className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                >
                  <span>{student.name}</span>
                  <button
                    onClick={() => openModal(student, 'add')}
                    className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}