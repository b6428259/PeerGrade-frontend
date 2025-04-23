// app/assessment/manage-assessment/components/AssessmentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/app/components/common/Modal';
import { useCustomToast } from '@/app/components/common/Toast';

interface RatingScale {
  label: string;
  score: number;
  percentageScore: number;
  description: string;
}

interface Criterion {
  title: string;
  description: string;
  maxScore: number;
  ratingScale: RatingScale[];
}

interface Assessment {
  _id: string;
  title: string;
  courseId: string;
  dueDate: string;
  criteria: Criterion[];
  status: 'active' | 'closed';
}

interface AssessmentFormProps {
  selectedCourseId: string;
  assessmentId?: string;
  onCriteriaLoad: (criteria: Criterion[], assessment: Assessment | null) => void;
}

export default function AssessmentForm({
  selectedCourseId,
  assessmentId,
  onCriteriaLoad
}: AssessmentFormProps) {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [existingAssessment, setExistingAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  useEffect(() => {
    if (selectedCourseId) {
      fetchExistingAssessment();
    }
  }, [selectedCourseId]);

  const fetchExistingAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/assessments/course/${selectedCourseId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data.length > 0) {
        const assessment = response.data.data[0];

        // แปลงข้อมูล criteria
        const transformedCriteria = assessment.criteria.map((criterion: { ratingScale: any[]; maxScore: number; }) => ({
          ...criterion,
          ratingScale: criterion.ratingScale.map((scale: { score: number; }) => ({
            ...scale,
            percentageScore: (scale.score / criterion.maxScore) * 100
          }))
        }));

        const transformedAssessment = {
          ...assessment,
          criteria: transformedCriteria
        };

        setExistingAssessment(transformedAssessment);
        setTitle(transformedAssessment.title);
        setDueDate(new Date(transformedAssessment.dueDate).toISOString().slice(0, 16));

        // ส่งทั้ง criteria และ assessment กลับไป
        onCriteriaLoad(transformedCriteria, transformedAssessment);
      } else {
        setExistingAssessment(null);
        setTitle('');
        setDueDate('');
        onCriteriaLoad([], null);
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = existingAssessment
        ? `http://localhost:5000/api/assessments/${existingAssessment._id}`
        : 'http://localhost:5000/api/assessments';

      const method = existingAssessment ? 'put' : 'post';
      const assessmentData = {
        title,
        courseId: selectedCourseId,
        dueDate: new Date(dueDate).toISOString(),
        status: existingAssessment?.status || 'active'
      };

      const response = await axios({
        method,
        url: endpoint,
        data: assessmentData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        showSuccessToast(`Assessment successfully ${existingAssessment ? 'updated' : 'created'}`);
        router.push('/assessment/manage-assessment');
      }
    } catch (error) {
      showErrorToast('Failed to save assessment. Please try again.');
      console.error('Error saving assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/assessments/${existingAssessment?._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showSuccessToast('Assessment successfully deleted');
      router.push('/assessment/manage-assessment');
    } catch (error) {
      showErrorToast('Failed to delete assessment. Please try again.');
      console.error('Error deleting assessment:', error);
    }
  };

  const handleClose = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/assessments/${existingAssessment?._id}/status`,
        { status: 'closed' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showSuccessToast('Assessment successfully closed');
      fetchExistingAssessment();
    } catch (error) {
      showErrorToast('Failed to close assessment. Please try again.');
      console.error('Error closing assessment:', error);
    }
  };

  if (!selectedCourseId) {
    return null;
  }



  return (
    <div className="space-y-6 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Assessment Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Due Date
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
            required
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="space-x-4">
            {existingAssessment && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                {existingAssessment.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => setIsCloseModalOpen(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Close
                  </button>
                )}
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Saving...' : existingAssessment ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
      <>
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Delete Assessment"
          description="Are you sure you want to delete this assessment? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
  
        <ConfirmationModal
          isOpen={isCloseModalOpen}
          onOpenChange={setIsCloseModalOpen}
          title="Close Assessment"
          description="Are you sure you want to close this assessment? Students will no longer be able to submit responses."
          confirmText="Close"
          variant="default"
          onConfirm={handleClose}
        />
      </>
    </div>
  );
}
