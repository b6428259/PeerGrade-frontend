// app/course/create/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Search, Import } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ExistingCourse {
    courseCode: string;
    courseName: string;
    description: string;
}

const CreateCoursePage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        description: '',
        academicYear: new Date().getFullYear().toString(),
        semester: '1'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingCourses, setExistingCourses] = useState<ExistingCourse[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredCourses, setFilteredCourses] = useState<ExistingCourse[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch existing courses on component mount
    useEffect(() => {
        const fetchExistingCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    'http://localhost:5000/api/courses',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setExistingCourses(response.data.data);

                console.log('Existing courses:', response.data.data);
            } catch (error) {
                console.error('Failed to fetch existing courses:', error);
            }
        };

        fetchExistingCourses();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'courseCode') {
            // Filter courses based on input
            const filtered = existingCourses.filter(course =>
                course.courseCode.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCourses(filtered);
            setShowSuggestions(true);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectCourse = (course: ExistingCourse) => {
        setFormData(prev => ({
            ...prev,
            courseCode: course.courseCode,
            courseName: course.courseName,
            description: course.description || ''
        }));
        setShowSuggestions(false);
    };

    const handleImportCourse = () => {
        // Open modal with course selection
        setShowSuggestions(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/courses',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                router.push('/');
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to create course');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
               {/* Back Button */}
          <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center text-white hover:text-blue-400 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
            <div className="max-w-2xl mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 border border-blue-800/30">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Create New Course</h1>
                        <button
                            onClick={handleImportCourse}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Import className="w-4 h-4 mr-2" />
                            Import Course
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative" ref={dropdownRef}>
                            <label htmlFor="courseCode" className="block text-sm font-medium text-blue-200">
                                Course Code*
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="courseCode"
                                    name="courseCode"
                                    required
                                    value={formData.courseCode}
                                    onChange={handleChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="mt-1 block w-full bg-gray-900/50 border border-blue-800/30 rounded-lg 
               py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && filteredCourses.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-blue-800/30 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {filteredCourses.map((course, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSelectCourse(course)}
                                            className="px-4 py-2 hover:bg-blue-600/20 cursor-pointer text-white"
                                        >
                                            <div className="font-medium">{course.courseCode}</div>
                                            <div className="text-sm text-blue-200">{course.courseName}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rest of the form fields remain the same */}
                        <div>
                            <label htmlFor="courseName" className="block text-sm font-medium text-blue-200">
                                Course Name*
                            </label>
                            <input
                                type="text"
                                id="courseName"
                                name="courseName"
                                required
                                value={formData.courseName}
                                onChange={handleChange}
                                className="mt-1 block w-full bg-gray-900/50 border border-blue-800/30 rounded-lg 
                         py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-blue-200">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 block w-full bg-gray-900/50 border border-blue-800/30 rounded-lg 
                         py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="academicYear" className="block text-sm font-medium text-blue-200">
                                    Academic Year*
                                </label>
                                <input
                                    type="text"
                                    id="academicYear"
                                    name="academicYear"
                                    required
                                    value={formData.academicYear}
                                    onChange={handleChange}
                                    className="mt-1 block w-full bg-gray-900/50 border border-blue-800/30 rounded-lg 
                           py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="semester" className="block text-sm font-medium text-blue-200">
                                    Semester*
                                </label>
                                <select
                                    id="semester"
                                    name="semester"
                                    required
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="mt-1 block w-full bg-gray-900/50 border border-blue-800/30 rounded-lg 
                           py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 border border-blue-800/30 rounded-lg text-blue-200 
                         hover:bg-blue-800/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg
                          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                          transition-colors`}
                            >
                                {isLoading ? 'Creating...' : 'Create Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateCoursePage;