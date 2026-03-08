// components/JobTable.tsx
"use client"

import { useState, useEffect } from "react"
import { getAllJobs, deleteJob, updateJob } from "@/actions/job.actions"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRole } from "@/context/RoleContext"

interface Job {
    _id: string
    title: string
    company: string
    location: string
    description: string
    requirements?: string
    salary?: string
    employmentType?: string
    createdAt?: string
}

const JobTable = () => {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const { userRole } = useRole()

    // Fetch jobs
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true)
                const jobsData = await getAllJobs()
                if (jobsData && typeof jobsData === "object" && "error" in jobsData) {
                    setError(jobsData.error as string)
                } else {
                    setJobs(jobsData as Job[])
                }
            } catch (err) {
                setError("Failed to fetch jobs")
            } finally {
                setLoading(false)
            }
        }
        fetchJobs()
    }, [])

    // Delete a job
    const handleDelete = async (id: string) => {
        await deleteJob(id)
        setJobs((prev) => prev.filter((j) => j._id !== id))
    }

    // Save job update
    const handleSaveUpdate = async () => {
        if (!selectedJob) return
        await updateJob(selectedJob._id, selectedJob)
        setJobs((prev) =>
            prev.map((j) => (j._id === selectedJob._id ? selectedJob : j))
        )
        setIsEditing(false)
        setSelectedJob(null)
    }

    // Define table columns
    const columns: ColumnDef<Job>[] = [
        { accessorKey: "title", header: "Title" },
        { accessorKey: "company", header: "Company" },
        { accessorKey: "location", header: "Location" },
        { accessorKey: "employmentType", header: "Type" },
        { accessorKey: "salary", header: "Salary" },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const job = row.original
                return (
                    <div className="flex gap-2">
                        {/* View Dialog */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">View</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{job.title}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2">
                                    <p><strong>Company:</strong> {job.company}</p>
                                    <p><strong>Location:</strong> {job.location}</p>
                                    <p><strong>Description:</strong> {job.description}</p>
                                    <p><strong>Requirements:</strong> {job.requirements}</p>
                                    <p><strong>Salary:</strong> {job.salary}</p>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Edit Dialog */}
                        {userRole !== "employee" && (
                            <Dialog open={isEditing && selectedJob?._id === job._id} onOpenChange={(open) => {
                                if (!open) {
                                    setIsEditing(false)
                                    setSelectedJob(null)
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedJob(job)
                                            setIsEditing(true)
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Job</DialogTitle>
                                    </DialogHeader>
                                    {selectedJob && (
                                        <div className="space-y-2">
                                            <Input
                                                value={selectedJob.title}
                                                onChange={(e) =>
                                                    setSelectedJob({ ...selectedJob, title: e.target.value })
                                                }
                                            />
                                            <Input
                                                value={selectedJob.company}
                                                onChange={(e) =>
                                                    setSelectedJob({ ...selectedJob, company: e.target.value })
                                                }
                                            />
                                            <Input
                                                value={selectedJob.location}
                                                onChange={(e) =>
                                                    setSelectedJob({ ...selectedJob, location: e.target.value })
                                                }
                                            />
                                            <Input
                                                value={selectedJob.salary ?? ""}
                                                onChange={(e) =>
                                                    setSelectedJob({ ...selectedJob, salary: e.target.value })
                                                }
                                            />
                                            <Button onClick={handleSaveUpdate}>Save</Button>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* Delete Button */}
                        {userRole === "admin" && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(job._id)}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (loading) return <div className="p-4">Loading jobs...</div>
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>

    return (
        <div className="p-4">
            <table className="min-w-full border rounded-md">
                <thead>
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((header) => (
                                <th key={header.id} className="border px-2 py-1 text-left">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border px-2 py-1">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default JobTable
