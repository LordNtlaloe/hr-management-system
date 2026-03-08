// components/JobCard.tsx
'use client'
import Link from 'next/link';
import { deleteJob } from '@/actions/job.actions';
import { UserRole } from '@/context/RoleContext';


interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    requirements?: string;
    salary?: string;
    employmentType?: string;
}

interface JobCardProps {
    job: Job;
    userRole: UserRole;
}

const JobCard = ({ job, userRole }: JobCardProps) => {
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this job?')) {
            const result = await deleteJob(job._id);
            if (result && typeof result === 'object' && 'error' in result) {
                alert(`Error deleting job: ${result.error}`);
            } else {
                alert('Job deleted successfully');
                window.location.reload();
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
            <p className="text-gray-600 mt-2">{job.company}</p>
            <p className="text-gray-600">{job.location}</p>
            <p className="text-gray-700 mt-4">{job.description?.substring(0, 100)}...</p>

            <div className="mt-4 flex justify-between items-center">
                <Link
                    href={`/jobs/${job._id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    View Details
                </Link>

                {(userRole === 'admin' || userRole === 'hr') && (
                    <div className="flex space-x-2">
                        <Link
                            href={`/jobs/edit/${job._id}`}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobCard;