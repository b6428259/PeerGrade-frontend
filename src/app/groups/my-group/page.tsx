"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserPlusIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useCustomToast } from "@/app/components/common/Toast";
import { ConfirmationModal } from "@/app/components/common/Modal";
import CreateGroupModal from "@/app/components/groups/CreateGroupModal";
import JoinGroupModal from "@/app/components/groups/JoinGroupModal";
import AddMemberModal from "@/app/components/groups/AddMemberModal";
import secureLocalStorage from "react-secure-storage";

interface Group {
  _id: string;
  groupName: string;
  course: {
    _id: string;
    courseCode: string;
    courseName: string;
  };
  members: {
    _id: string;
    name: string;
  }[];
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
}

interface Student {
  _id: string;
  name: string;
}

export default function MyGroupPage() {
  // State variables
  const [groups, setGroups] = useState<Group[]>([]);
  const [availableStudents, setAvailableStudents] = useState<{
    [key: string]: Student[];
  }>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState<{
    [key: string]: boolean;
  }>({});
  const [error, setError] = useState("");
  const { user, userId } = useAuth();
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set()
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    confirmText: string;
    variant: "default" | "destructive";
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
    confirmText: "Confirm",
    variant: "default",
  });

  // Refs
  const cancelTokensRef = useRef<{ [key: string]: any }>({});

  // Fetch basic data once on mount
  useEffect(() => {
    fetchInitialData();

    // Cleanup function for aborted requests
    return () => {
      Object.values(cancelTokensRef.current).forEach(
        (source: any) =>
          source && source.cancel && source.cancel("Component unmounted")
      );
    };
  }, []);

  // Fetch initial data (user's groups and courses)
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Create cancel token source for these requests
      const groupsSource = axios.CancelToken.source();
      const coursesSource = axios.CancelToken.source();

      cancelTokensRef.current["groups"] = groupsSource;
      cancelTokensRef.current["courses"] = coursesSource;

      // Fetch user's groups and courses in parallel
      const [groupsResponse, coursesResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/groups/my-groups", {
          headers,
          cancelToken: groupsSource.token,
        }),
        axios.get("http://localhost:5000/api/courses/my-courses", {
          headers,
          cancelToken: coursesSource.token,
        }),
      ]);

      // Process responses if both were successful
      if (groupsResponse.data.success && coursesResponse.data.success) {
        const myGroups = groupsResponse.data.data;
        const myCourses = coursesResponse.data.data;

        setGroups(myGroups);
        setCourses(myCourses);

        // Auto-expand courses that have groups
        const userGroupCourseIds = new Set<string>(
          myGroups.map((group: Group) => group.course._id as string)
        );
        setExpandedCourses(userGroupCourseIds);

        // Lazy load available students info for courses where student has a group
        myGroups.forEach((group: { course: { _id: string } }) => {
          fetchAvailableStudentsForCourse(group.course._id);
        });
      } else {
        if (!groupsResponse.data.success) {
          setError("Failed to fetch your groups.");
        }
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError("Failed to load data. Please try again later.");
        console.error("Error fetching initial data:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available students for a specific course
  const fetchAvailableStudentsForCourse = useCallback(
    async (courseId: string) => {
      // Cancel any pending request for this course
      if (cancelTokensRef.current[`availableStudents-${courseId}`]) {
        cancelTokensRef.current[`availableStudents-${courseId}`].cancel(
          "New request made"
        );
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Create new cancel token
        const source = axios.CancelToken.source();
        cancelTokensRef.current[`availableStudents-${courseId}`] = source;

        console.log(`Fetching available students for course ${courseId}`); // Add logging

        const courseResponse = await axios.get(
          `http://localhost:5000/api/courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cancelToken: source.token,
          }
        );

        if (courseResponse.data.success) {
          const allStudents = courseResponse.data.data.students || [];
          console.log(`Found ${allStudents.length} students in course`); // Add logging

          const courseGroup = groups.find(
            (group) => group.course._id === courseId
          );

          if (courseGroup) {
            const groupMemberIds = new Set(
              courseGroup.members.map((member) => member._id)
            );

            // Filter out students already in the group and the current user
            const availableForInvite = allStudents
              .filter((student: { _id: any }) => student && student._id) // Filter out invalid students
              .filter(
                (student: Student) =>
                  !groupMemberIds.has(student._id) && student._id !== user?._id
              );

            console.log(
              `Found ${availableForInvite.length} available students to invite`
            ); // Add logging

            setAvailableStudents((prev) => ({
              ...prev,
              [courseId]: availableForInvite,
            }));
          }
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error(
            `Error fetching available students for course ${courseId}:`,
            err
          );
        }
      }
    },
    [groups, user?._id]
  );

  // Toggle expanded course view
  const toggleCourseExpand = useCallback((courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }, []);

  // Toggle expanded group view
  const toggleGroupExpand = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleLeaveGroup = async (group: Group) => {
    try {
      // ใช้ userId โดยตรงหรือใช้ userId จาก secureLocalStorage เป็น fallback
      const currentUserId =
        userId || user?._id || user?.id || secureLocalStorage.getItem("userId");

      if (!currentUserId) {
        showErrorToast(
          "Cannot identify your user account. Please log in again."
        );
        router.push("/login");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/groups/${group._id}/remove-member/${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        if (response.data.wasLastMember) {
          showSuccessToast(
            "You were the last member. The group has been deleted."
          );
        } else {
          showSuccessToast(`Successfully left ${group.groupName}`);
        }
        fetchInitialData();
      }
    } catch (error: any) {
      console.error("Error leaving group:", error);
      showErrorToast(error.response?.data?.error || "Failed to leave group");
    }
  };

  // แก้ไข confirmLeaveGroup function
  const confirmLeaveGroup = useCallback(
    (group: Group) => {
      // ใช้ userId โดยตรงหรือใช้ userId จาก secureLocalStorage เป็น fallback
      const currentUserId =
        userId || user?._id || user?.id || secureLocalStorage.getItem("userId");

      if (!currentUserId) {
        showErrorToast(
          "Cannot identify your user account. Please log in again."
        );
        router.push("/login");
        return;
      }

      setConfirming({
        isOpen: true,
        title: "Leave Group",
        message: `Are you sure you want to leave "${group.groupName}"?`,
        action: async () => handleLeaveGroup(group),
        confirmText: "Leave",
        variant: "destructive",
      });
    },
    [userId, user, router, showErrorToast]
  );

  const handleMemberAdded = useCallback(
    (groupId: string, studentId: string, student: Student) => {
      // Optimistic update for the UI
      setGroups((prevGroups) => {
        return prevGroups.map((g) => {
          if (g._id === groupId) {
            return {
              ...g,
              members: [...g.members, student],
            };
          }
          return g;
        });
      });

      // Update available students list
      setAvailableStudents((prev) => {
        const courseId = groups.find((g) => g._id === groupId)?.course._id;
        if (!courseId) return prev;

        return {
          ...prev,
          [courseId]: (prev[courseId] || []).filter((s) => s._id !== studentId),
        };
      });
    },
    [groups]
  );

  // Open join group modal
  const openJoinGroupModal = useCallback((course: Course) => {
    setSelectedCourse(course);
    setShowJoinModal(true);
  }, []);

  // Open create group modal
  const openCreateGroupModal = useCallback((course: Course) => {
    setSelectedCourse(course);
    setShowCreateModal(true);
  }, []);

  // Open add member modal
  const openAddMemberModal = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      setShowAddMemberModal(true);

      // เมื่อกดปุ่ม Add Members ให้ดึงข้อมูลนักศึกษาใหม่อีกครั้ง
      fetchAvailableStudentsForCourse(group.course._id);
    },
    [fetchAvailableStudentsForCourse]
  );

  // Switch from join modal to create modal
  const handleSwitchToCreateGroup = useCallback(() => {
    setShowJoinModal(false);
    setShowCreateModal(true);
  }, []);

  // Group courses by whether user has a group in them - memoized for performance
  const groupedCourses = useMemo(() => {
    if (!courses.length) return { withGroups: [], withoutGroups: [] };

    const userGroupCourseIds = new Set(groups.map((group) => group.course._id));

    return {
      withGroups: courses.filter((course) =>
        userGroupCourseIds.has(course._id)
      ),
      withoutGroups: courses.filter(
        (course) => !userGroupCourseIds.has(course._id)
      ),
    };
  }, [courses, groups]);

  // Get user's group in a specific course - memoized for performance
  const getGroupInCourse = useCallback(
    (courseId: string) => {
      return groups.find((group) => group.course._id === courseId);
    },
    [groups]
  );

  // Loading indicator
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const { withGroups, withoutGroups } = groupedCourses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-white hover:text-blue-400 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Header Section */}
        <div className="mb-8 text-center">
          <UserGroupIcon className="mx-auto h-16 w-16 text-blue-400" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            My Groups
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Manage your course groups and invitations
          </p>
          {error && (
            <div className="mt-4 flex items-center justify-center text-red-400">
              <ExclamationCircleIcon className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Courses with Groups Section */}
        {withGroups.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">
              My Course Groups
            </h2>
            <div className="space-y-4">
              {withGroups.map((course) => {
                const group = getGroupInCourse(course._id);
                const isExpanded = expandedCourses.has(course._id);
                const isGroupExpanded = group
                  ? expandedGroups.has(group._id)
                  : false;

                return (
                  <div
                    key={course._id}
                    className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 transition border border-blue-800/30"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleCourseExpand(course._id)}
                    >
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-6 w-6 text-blue-400 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {course.courseCode}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {course.courseName}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`h-6 w-6 flex items-center justify-center rounded-full transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && group && (
                      <div className="mt-4 pl-9">
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => toggleGroupExpand(group._id)}
                          >
                            <h4 className="font-medium text-white flex items-center">
                              <UserGroupIcon className="h-5 w-5 mr-2 text-blue-400" />
                              {group.groupName}
                            </h4>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-400 mr-4">
                                {group.members.length} members
                              </span>
                              <div
                                className={`h-6 w-6 flex items-center justify-center rounded-full transition-transform ${
                                  isGroupExpanded ? "rotate-180" : ""
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {isGroupExpanded && (
                            <div className="mt-4 space-y-3">
                              {/* Group Members */}
                              <div className="space-y-2">
                                {group.members.map((member) => (
                                  <div
                                    key={member._id}
                                    className="flex items-center justify-between bg-gray-700/50 p-2 rounded"
                                  >
                                    <span className="text-sm text-gray-200">
                                      {member.name}{" "}
                                      {(member._id === userId ||
                                        member._id === user?._id ||
                                        member._id === user?.id) && (
                                        <span className="text-xs text-blue-400 ml-1">
                                          (You)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Group Actions */}
                              <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t border-gray-700">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAddMemberModal(group);
                                  }}
                                  className="flex items-center px-3 py-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors text-sm"
                                >
                                  <UserPlusIcon className="h-4 w-4 mr-1" />
                                  Add Members
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmLeaveGroup(group);
                                  }}
                                  className="flex items-center px-3 py-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-sm"
                                >
                                  <UsersIcon className="h-4 w-4 mr-1" />
                                  Leave Group
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courses without Groups Section */}
        {withoutGroups.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Available Courses
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {withoutGroups.map((course) => {
                const isLoading = loadingGroups[course._id];

                return (
                  <div
                    key={course._id}
                    className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30"
                  >
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-6 w-6 text-blue-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          {course.courseCode}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {course.courseName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => openCreateGroupModal(course)}
                        className="flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Group
                      </button>

                      <button
                        onClick={() => openJoinGroupModal(course)}
                        disabled={isLoading}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm 
                          ${
                            isLoading
                              ? "bg-gray-600/20 text-gray-400 cursor-not-allowed"
                              : "bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                          }`}
                      >
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Join Group
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Groups Message */}
        {withGroups.length === 0 && withoutGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-800/50 p-8 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-600" />
            <h3 className="mt-4 text-xl font-medium text-white">
              No Courses Found
            </h3>
            <p className="mt-2 text-gray-400">
              You are not currently enrolled in any courses.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedCourse={selectedCourse}
        availableStudents={
          selectedCourse ? availableStudents[selectedCourse._id] || [] : []
        }
        onGroupCreated={fetchInitialData}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        selectedCourse={selectedCourse}
        onGroupJoined={fetchInitialData}
        onCreateGroupClick={handleSwitchToCreateGroup}
      />

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        selectedGroup={selectedGroup}
        onMemberAdded={handleMemberAdded}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirming.isOpen}
        onOpenChange={(open) => setConfirming({ ...confirming, isOpen: open })}
        title={confirming.title}
        description={confirming.message}
        onConfirm={confirming.action}
        variant={confirming.variant}
        confirmText={confirming.confirmText}
      />
    </div>
  );
}
