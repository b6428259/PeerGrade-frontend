interface CourseSelectorProps {
    courses: {
      _id: string;
      courseCode: string;
      courseName: string;
    }[];
    selectedCourse: string;
    onSelectCourse: (courseId: string) => void;
  }
  
  export default function CourseSelector({ courses, selectedCourse, onSelectCourse }: CourseSelectorProps) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-800/30">
        <h2 className="text-xl font-semibold mb-4">Select Course</h2>
        <select
          value={selectedCourse}
          onChange={(e) => onSelectCourse(e.target.value)}
          className="w-full bg-gray-700/50 border border-blue-800/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a course...</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.courseCode} - {course.courseName}
            </option>
          ))}
        </select>
      </div>
    );
  }