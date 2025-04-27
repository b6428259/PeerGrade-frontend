'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCustomToast } from '@/app/components/common/Toast';
import { ConfirmationModal } from '@/app/components/common/Modal';

import CourseSelector from './components/CourseSelector';
import AssessmentForm from './components/AssessmentForm';
import CriteriaForm from './components/CriteriaForm';

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
  _id?: string;
  title: string;
  courseId: string;
  dueDate: string;
  criteria: Criterion[];
  status: 'active' | 'closed';
}

export default function ManageAssessment() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast, showWarningToast } = useCustomToast();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAssessment, setExistingAssessment] = useState<Assessment | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [, setNavigationPath] = useState('');

  useEffect(() => {
    // Handle beforeunload event for unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [criteria]);

  const hasUnsavedChanges = () => {
    // Add logic to check for unsaved changes
    return criteria.length > 0 && !isSubmitting;
  };

  const handleCourseSelect = (courseId: string) => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      setNavigationPath('course-change');
      return;
    }
    setSelectedCourseId(courseId);
    setExistingAssessment(null);
  };

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      setNavigationPath(path);
      return;
    }
    router.push(path);
  };

  const handleCriteriaChange = (newCriteria: Criterion[]) => {
    setCriteria(newCriteria);
  };

  const handleCriteriaLoad = (loadedCriteria: Criterion[], assessment: Assessment | null) => {
    setCriteria(loadedCriteria);
    setExistingAssessment(assessment);
  };
  

  const handleSubmit = async () => {
    if (!selectedCourseId || criteria.length === 0) {
      showWarningToast('Please select a course and add at least one criterion');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = existingAssessment 
        ? `http://localhost:5000/api/assessments/${existingAssessment._id}`
        : 'http://localhost:5000/api/assessments';
      
      // Validate criteria data
      const isValid = criteria.every(criterion => 
        criterion.title && 
        criterion.description && 
        criterion.maxScore > 0 && 
        criterion.ratingScale.every(scale => 
          scale.label && 
          scale.description && 
          scale.score >= 0
        )
      );

      if (!isValid) {
        showErrorToast('Please fill in all required fields for criteria and rating scales');
        return;
      }

      const response = await fetch(endpoint, {
        method: existingAssessment ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          criteria: criteria.map(criterion => ({
            ...criterion,
            ratingScale: criterion.ratingScale.map(scale => ({
              ...scale,
              score: Number(scale.score)
            }))
          })),
          status: existingAssessment?.status || 'active'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${existingAssessment ? 'update' : 'create'} assessment`);
      }

      showSuccessToast(`Assessment successfully ${existingAssessment ? 'updated' : 'created'}`);
      router.push('/assessment/manage-assessment');
    } catch (error) {
      console.error('Error saving assessment:', error);
      showErrorToast(`Failed to ${existingAssessment ? 'update' : 'create'} assessment. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => handleNavigation('/home')}
            className="mb-6 flex items-center text-white hover:text-blue-400 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>

        <div className="space-y-8">
          {/* Header */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
          <h1 className="text-2xl font-bold text-white mb-6">
              {existingAssessment ? 'Update Assessment' : 'Create Assessment'}
            </h1>

            {/* Course Selector */}
            <CourseSelector 
              onCourseSelect={handleCourseSelect}
              selectedCourseId={selectedCourseId}
            />
          </div>

          {selectedCourseId && (
            <>
              {/* Assessment Form */}
              <AssessmentForm
                selectedCourseId={selectedCourseId}
                onCriteriaLoad={handleCriteriaLoad}
              />

               {/* Criteria Form */}
              <CriteriaForm
                selectedCourseId={selectedCourseId}
                assessmentId={existingAssessment?._id}
                onCriteriaChange={handleCriteriaChange}
                initialCriteria={criteria}
              />

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                            transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting 
                    ? 'Saving...' 
                    : existingAssessment 
                      ? 'Update Assessment'
                      : 'Create Assessment'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
        
        {/* Unsaved Changes Modal */}
        <ConfirmationModal
        isOpen={showUnsavedChangesModal}
        onOpenChange={setShowUnsavedChangesModal}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave?"
        confirmText="Leave"
        cancelText="Stay"
        variant="destructive"
        onConfirm={() => {
          setShowUnsavedChangesModal(false);
          // Always navigate to home page when user clicks "Leave"
          router.push('/home');
        }}
        />
      </div>
    </>
  );
}