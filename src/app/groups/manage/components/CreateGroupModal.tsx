import { useState } from 'react';
import { X } from 'lucide-react';

interface Student {
    _id: string;
    name: string;
}

interface CreateGroupModalProps {
    courseId: string;
    students: Student[]; // This will now receive only available students
    onClose: () => void;
    onCreateGroup: (groupName: string, memberIds: string[]) => Promise<void>;
}

export default function CreateGroupModal({ courseId, students, onClose, onCreateGroup }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim() || selectedStudents.length === 0) return;

        setIsSubmitting(true);
        try {
            await onCreateGroup(groupName, selectedStudents);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-6">Create New Group</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium mb-2">
                            Group Name
                        </label>
                        <input
                            type="text"
                            id="groupName"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter group name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Select Students {students.length === 0 && '(No available students)'}
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {students.length === 0 ? (
                                <p className="text-gray-400 text-sm">All students are already assigned to groups</p>
                            ) : (
                                students.map((student) => (
                                    <label
                                        key={student._id}
                                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student._id)}
                                            onChange={() => toggleStudent(student._id)}
                                            className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                                        />
                                        <span>{student.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>


                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-600 hover:bg-gray-700/50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !groupName.trim() || selectedStudents.length === 0}
                            className="px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}