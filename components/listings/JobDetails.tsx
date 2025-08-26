// components/JobDetail.tsx
'use client'
import { useState, useEffect } from 'react';
import { getJobById, deleteJob } from '@/actions/job.actions';
import { useRole, UserRole } from '@/context/RoleContext';
import Link from 'next/link';

interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    requirements?: string;
    salary?: string;
    employmentType?: string;
    createdAt?: string;
}

interface JobDetailProps {
    jobId: string;
}

const JobDetail = ({ jobId }: JobDetailProps) => {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { userRole } = useRole();

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const jobData = await getJobById(jobId);
                if (jobData && typeof jobData === 'object' && 'error' in jobData) {
                    setError(jobData.error as string);
                } else {
                    setJob(jobData as Job);
                }
            } catch (err) {
                setError('Failed to fetch job details');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this job?')) {
            const result = await deleteJob(jobId);
            if (result && typeof result === 'object' && 'error' in result) {
                alert(`Error deleting job: ${result.error}`);
            } else {
                alert('Job deleted successfully');
                window.location.href = '/jobs';
            }
        }
    };

    if (loading) return <div className="text-center py-8">Loading job details...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    if (!job) return <div className="text-center py-8">Job not found</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
                    <p className="text-lg text-gray-600 mt-1">{job.company} - {job.location}</p>
                </div>

                {(userRole === 'admin' || userRole === 'hr') && (
                    <div className="flex space-x-2">
                        <Link
                            href={`/jobs/edit/${jobId}`}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold text-gray-700">Employment Type</h3>
                    <p className="capitalize">{job.employmentType || 'Not specified'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold text-gray-700">Salary</h3>
                    <p>{job.salary || 'Not specified'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold text-gray-700">Posted Date</h3>
                    <p>{new Date(job.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Job Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            {job.requirements && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Requirements</h2>
                    <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                    href="/jobs"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    &larr; Back to Jobs
                </Link>
            </div>
        </div>
    );
};

export default JobDetail;