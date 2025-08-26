// components/JobList.tsx
'use client'
import { useState, useEffect } from 'react';
import { getAllJobs } from '@/actions/job.actions';
import JobCard from '@/components/listings/JobCard';
import { useRole } from '@/context/RoleContext';

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

const JobList = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { userRole } = useRole();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const jobsData = await getAllJobs();
                if (jobsData && typeof jobsData === 'object' && 'error' in jobsData) {
                    setError(jobsData.error as string);
                } else {
                    setJobs(jobsData as Job[]);
                }
            } catch (err) {
                setError('Failed to fetch jobs');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) return <div className="text-center py-8">Loading jobs...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
                <JobCard key={job._id} job={job} userRole={userRole} />
            ))}
        </div>
    );
};

export default JobList;