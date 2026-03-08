// components/EditJobForm.tsx
'use client'
import { useState, useEffect } from 'react';
import { getJobById, updateJob } from '@/actions/job.actions';
import { useRole } from '@/context/RoleContext';

interface JobFormData {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string;
    salary: string;
    employmentType: string;
}

interface EditJobFormProps {
    jobId: string;
}

const EditJobForm = ({ jobId }: EditJobFormProps) => {
    const [formData, setFormData] = useState<JobFormData>({
        title: '',
        company: '',
        location: '',
        description: '',
        requirements: '',
        salary: '',
        employmentType: 'full-time'
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const { userRole } = useRole();

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const jobData = await getJobById(jobId);
                if (jobData && typeof jobData === 'object' && 'error' in jobData) {
                    setError(jobData.error as string);
                } else {
                    setFormData({
                        title: jobData.title || '',
                        company: jobData.company || '',
                        location: jobData.location || '',
                        description: jobData.description || '',
                        requirements: jobData.requirements || '',
                        salary: jobData.salary || '',
                        employmentType: jobData.employmentType || 'full-time'
                    } as JobFormData);
                }
            } catch (err) {
                setError('Failed to fetch job details');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    // Check if user has permission to edit jobs
    if (userRole !== 'admin' && userRole !== 'hr') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Job</h2>
                <p className="text-red-500">You don't have permission to edit jobs.</p>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);

        try {
            const result = await updateJob(jobId, formData);
            if (result && typeof result === 'object' && 'error' in result) {
                setError(result.error as string);
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            setError('Failed to update job');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading job details...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Job</h2>

            {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                    Job updated successfully!
                </div>
            )}

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    Error: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="title">
                        Job Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="company">
                            Company *
                        </label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="location">
                            Location *
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="description">
                        Description *
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </label>
                </div>

                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="requirements">
                        Requirements
                        <textarea
                            id="requirements"
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="salary">
                            Salary
                            <input
                                type="text"
                                id="salary"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </label>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="employmentType">
                            Employment Type
                            <select
                                id="employmentType"
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="full-time">Full Time</option>
                                <option value="part-time">Part Time</option>
                                <option value="contract">Contract</option>
                                <option value="freelance">Freelance</option>
                                <option value="internship">Internship</option>
                            </select>
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {updating ? 'Updating Job...' : 'Update Job'}
                </button>
            </form>
        </div>
    );
};

export default EditJobForm;