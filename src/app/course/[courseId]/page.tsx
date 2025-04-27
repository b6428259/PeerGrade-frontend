"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

// เพิ่มหรือแก้ไข interface เพื่อระบุ type ให้ชัดเจนขึ้น
interface Assessment {
  _id: string;
  title: string;
  criteria: Criterion[];
  dueDate: string;
  status: string;
  hasEvaluated: boolean;
  remainingDays: number;
  dueStatus: string;
  evaluationsCompleted?: number;
  totalRequiredEvaluations?: number;
  isFullyCompleted?: boolean;
  remainingMembers?: { _id: string }[];
}

interface Criterion {
  title: string;
  description: string;
  maxScore: number;
  ratingScale: RatingScale[];
}

interface RatingScale {
  label: string;
  score: number;
  description: string;
}

interface GroupMember {
  _id: string;
  name: string;
}

interface Group {
  course: { _id: string };
  members: GroupMember[];
}

interface ErrorState {
  show: boolean;
  message: string;
  title?: string;
}

const CoursePage = ({ params }: { params: Promise<{ courseId: string }> }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [evaluationScores, setEvaluationScores] = useState<{ criterionIndex: number; ratingChoice: string }[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ show: false, message: "", title: "" });

  // อ่านพารามิเตอร์ assessmentId จาก URL
  const assessmentIdParam = searchParams.get('assessmentId');

  // Unwrap params using React.use()
  const { courseId } = use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Fetch assessments
        const assessmentsResponse = await axios.get(
          `http://localhost:5000/api/assessments/my-assessments/${courseId}`,
          { headers }
        );

        // Fetch group members
        const groupsResponse = await axios.get(
          "http://localhost:5000/api/groups/my-groups",
          { headers }
        );

        if (assessmentsResponse.data.success) {
          const allAssessments = [
            ...assessmentsResponse.data.data.pending,
            ...assessmentsResponse.data.data.completed,
            ...assessmentsResponse.data.data.expired,
            ...assessmentsResponse.data.data.closed,
          ];
          setAssessments(allAssessments);
          
          // ถ้ามีการส่ง assessmentId มา ให้กรองเฉพาะ assessment นั้น
          if (assessmentIdParam) {
            const filtered = allAssessments.filter(assessment => assessment._id === assessmentIdParam);
            setFilteredAssessments(filtered);
            
            // ถ้าเจอ assessment ที่ตรงกัน ให้แสดงแบบประเมินทันที
            if (filtered.length > 0) {
              // แสดงแบบ Auto-expand
              setSelectedAssessment(filtered[0]);
            }
          } else {
            setFilteredAssessments(allAssessments);
          }
        }

        if (groupsResponse.data.success) {
          const courseGroup = groupsResponse.data.data.find(
            (group: Group) => group.course._id === courseId
          );
          if (courseGroup) {
            setGroupMembers(courseGroup.members);
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);

        // Display the error message from the API
        if (error.response) {
          // กำหนดชื่อหัวข้อ error ตามรหัส status
          let title = "เกิดข้อผิดพลาด";
          if (error.response.status === 403) {
            title = "ไม่มีสิทธิเข้าถึง";
          } else if (error.response.status === 404) {
            title = "ไม่พบข้อมูล";
          }

          setError({
            show: true,
            message:
              error.response.data.error ||
              "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง",
            title: title,
          });
        } else {
          setError({
            show: true,
            message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง",
            title: "การเชื่อมต่อล้มเหลว",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, assessmentIdParam]);

  const handleSubmitEvaluation = async () => {
    if (!selectedAssessment || !selectedMember) return;

    // ตรวจสอบว่าได้เลือกคะแนนครบทุกเกณฑ์
    if (!evaluationScores.every((score) => score.ratingChoice !== "")) {
      alert("Please complete all evaluation criteria");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/evaluations",
        {
          assessmentId: selectedAssessment._id,
          evaluateeId: selectedMember._id,
          scores: evaluationScores,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Reset form
      setSelectedAssessment(null);
      setSelectedMember(null);
      setEvaluationScores([]);
      setComment("");

      // Refresh assessments data
      const assessmentsResponse = await axios.get(
        `http://localhost:5000/api/assessments/my-assessments/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (assessmentsResponse.data.success) {
        const allAssessments = [
          ...assessmentsResponse.data.data.pending,
          ...assessmentsResponse.data.data.completed,
          ...assessmentsResponse.data.data.expired,
          ...assessmentsResponse.data.data.closed,
        ];
        setAssessments(allAssessments);
        
        if (assessmentIdParam) {
          setFilteredAssessments(allAssessments.filter(a => a._id === assessmentIdParam));
        } else {
          setFilteredAssessments(allAssessments);
        }
      }
    } catch (error: any) {
      console.error("Error submitting evaluation:", error);

      // Display the error message from the API
      if (error.response) {
        setError({
          show: true,
          message:
            error.response.data.error ||
            "ไม่สามารถส่งการประเมินได้ กรุณาลองใหม่อีกครั้ง",
          title: "การประเมินล้มเหลว",
        });
      } else {
        setError({
          show: true,
          message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง",
          title: "การเชื่อมต่อล้มเหลว",
        });
      }
    }
  };

  // เพิ่มฟังก์ชันสำหรับแสดงการประเมินทั้งหมด
  const showAllAssessments = () => {
    // เปลี่ยนไปแสดง assessment ทั้งหมด
    setFilteredAssessments(assessments);
    setSelectedAssessment(null);
    
    // ลบพารามิเตอร์ assessmentId จาก URL
    const newUrl = `/course/${courseId}`;
    window.history.pushState({}, '', newUrl);
  };

  // Function to dismiss the error message
  const dismissError = () => {
    setError({ show: false, message: "", title: "" });
  };

  // Function to go back
  const joinGroup = () => {
    dismissError();
    router.push("/groups/my-group");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If there is an error, display only the error modal
  if (error.show) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        {/* Error modal code (unchanged) */}
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl border border-blue-800/30 shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-red-800 p-4 flex items-center">
            <ExclamationTriangleIcon className="h-7 w-7 text-red-200 mr-3" />
            <h2 className="text-xl font-bold text-white">{error.title}</h2>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-200 text-lg mb-6">{error.message}</p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.back()}
                disabled={loading}
                className={`flex items-center px-4 py-2 rounded-lg text-sm 
                                  ${
                                    loading
                                      ? "bg-gray-600/20 text-gray-400 cursor-not-allowed"
                                      : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                                  }`}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Go Back
              </button>
              <button
                onClick={joinGroup}
                disabled={loading}
                className={`flex items-center px-4 py-2 rounded-lg text-sm 
                                  ${
                                    loading
                                      ? "bg-gray-600/20 text-gray-400 cursor-not-allowed"
                                      : "bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                                  }`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    My Groups
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center text-white hover:text-blue-400 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>

          {/* แสดงปุ่มสำหรับดูการประเมินทั้งหมดเมื่อมีการกรอง */}
          {assessmentIdParam && (
            <button
              onClick={showAllAssessments}
              className="text-sm px-4 py-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 rounded-lg transition-colors"
            >
              แสดงการประเมินทั้งหมด
            </button>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-8">
          {assessmentIdParam ? 'การประเมินที่เลือก' : 'การประเมินทั้งหมดในรายวิชา'}
        </h1>

        {/* Show message when there are no assessments */}
        {filteredAssessments.length === 0 && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30 text-center">
            <p className="text-lg text-gray-300">
              ไม่พบข้อมูลการประเมินในรายวิชานี้
            </p>
          </div>
        )}

        {/* Assessments List */}
        <div className="grid gap-6">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment._id}
              className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{assessment.title}</h2>
                  <p className="text-blue-300">
                    Due: {new Date(assessment.dueDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {/* แสดงความคืบหน้าการประเมิน */}
                  <p className="text-sm text-gray-400 mt-1">
                    Evaluated: {assessment.evaluationsCompleted || 0}/
                    {assessment.totalRequiredEvaluations || 0} members
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    assessment.isFullyCompleted
                      ? "bg-green-600"
                      : assessment.status === "pending"
                      ? "bg-yellow-600"
                      : assessment.status === "expired"
                      ? "bg-red-600"
                      : "bg-gray-600"
                  }`}
                >
                  {assessment.isFullyCompleted
                    ? "Completed"
                    : assessment.status}
                </span>
              </div>

              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Evaluation Progress</span>
                  <span>
                    {assessment.evaluationsCompleted || 0}/
                    {assessment.totalRequiredEvaluations || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${
                        ((assessment.evaluationsCompleted || 0) /
                          (assessment.totalRequiredEvaluations || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* แสดงปุ่มประเมินเฉพาะเมื่อยังประเมินไม่ครบและยังไม่หมดเวลา */}
              {!assessment.isFullyCompleted &&
                assessment.status === "pending" && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">
                      Group Members Evaluation Status
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {groupMembers
                        .filter((member) => {
                          const userId = secureLocalStorage.getItem("userId");
                          return member._id !== userId;
                        })
                        .map((member) => {
                          // ตรวจสอบว่าสมาชิกคนนี้ถูกประเมินแล้วหรือยัง
                          const isEvaluated =
                            !assessment.remainingMembers?.some(
                              (remainingMember: { _id: string }) =>
                                remainingMember._id === member._id
                            );

                          return (
                            <button
                              key={member._id}
                              onClick={() => {
                                if (!isEvaluated) {
                                  setSelectedAssessment(assessment);
                                  setSelectedMember(member);
                                  setEvaluationScores(
                                    assessment.criteria.map((_, index) => ({
                                      criterionIndex: index,
                                      ratingChoice: "",
                                    }))
                                  );
                                }
                              }}
                              disabled={isEvaluated}
                              className={`
                                relative flex items-center justify-center
                                px-4 py-3 rounded-lg
                                transition-all duration-200
                                ${
                                  isEvaluated
                                    ? "bg-red-500/20 border-2 border-red-500/50 text-red-200 cursor-not-allowed"
                                    : "bg-green-500/20 border-2 border-green-500/50 text-green-200 hover:bg-green-500/30 hover:border-green-400"
                                }
                            `}
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <span className="text-sm font-medium">
                                  {member.name}
                                </span>
                                <span
                                  className={`text-xs ${
                                    isEvaluated
                                      ? "text-red-300"
                                      : "text-green-300"
                                  }`}
                                >
                                  {isEvaluated ? "Evaluated" : "Pending"}
                                </span>
                              </div>
                              {isEvaluated && (
                                <div className="absolute top-2 right-2">
                                  <svg
                                    className="w-4 h-4 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Evaluation Form */}
              {selectedAssessment?._id === assessment._id && selectedMember && (
                <div className="mt-6 bg-gray-700/50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Evaluating {selectedMember.name}
                  </h3>

                  {assessment.criteria.map((criterion: Criterion, index: number) => (
                    <div key={index} className="mb-6">
                      <h4 className="font-medium mb-2">{criterion.title}</h4>
                      <p className="text-sm text-gray-300 mb-2">
                        {criterion.description}
                      </p>
                      <select
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2"
                        value={evaluationScores[index]?.ratingChoice || ""}
                        onChange={(e) => {
                          const newScores = [...evaluationScores];
                          newScores[index] = {
                            criterionIndex: index,
                            ratingChoice: e.target.value,
                          };
                          setEvaluationScores(newScores);
                        }}
                      >
                        <option value="">Select rating</option>
                        {criterion.ratingScale.map((scale: RatingScale) => (
                          <option key={scale.label} value={scale.label}>
                            {scale.label} - {scale.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div className="mb-6">
                    <label className="block mb-2">Comment</label>
                    <textarea
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSubmitEvaluation}
                      disabled={
                        !evaluationScores.every(
                          (score) => score.ratingChoice !== ""
                        )
                      }
                      className={`px-6 py-2 rounded-lg ${
                        evaluationScores.every(
                          (score) => score.ratingChoice !== ""
                        )
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Submit Evaluation
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAssessment(null);
                        setSelectedMember(null);
                        setEvaluationScores([]);
                        setComment("");
                      }}
                      className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;