"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllInterviews, deleteInterview } from "@/actions/interviews.actions"
import InterviewForm from "@/components/interviews/interview-form"

const InterviewsTable = () => {
    const [interviews, setInterviews] = useState<any[]>([])
    const [selectedInterview, setSelectedInterview] = useState<any | null>(null)
    const [open, setOpen] = useState(false)

    const fetchInterviews = async () => {
        const data = await getAllInterviews()
        setInterviews(data)
    }

    useEffect(() => {
        fetchInterviews()
    }, [])

    const handleDelete = async (id: string) => {
        await deleteInterview(id)
        fetchInterviews()
    }

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">Interviews</h2>
                <Button onClick={() => { setSelectedInterview(null); setOpen(true) }}>Add Interview</Button>
            </div>

            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2">Candidate</th>
                        <th className="p-2">Interviewer</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {interviews.map((interview) => (
                        <tr key={interview._id} className="border-t">
                            <td className="p-2">{interview.candidateName}</td>
                            <td className="p-2">{interview.interviewer}</td>
                            <td className="p-2">{interview.date}</td>
                            <td className="p-2">{interview.status}</td>
                            <td className="p-2 flex gap-2">
                                <Button size="sm" onClick={() => { setSelectedInterview(interview); setOpen(true) }}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(interview._id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedInterview ? "Edit Interview" : "Add Interview"}</DialogTitle>
                    </DialogHeader>
                    <InterviewForm
                        interview={selectedInterview}
                        onSuccess={() => {
                            setOpen(false)
                            fetchInterviews()
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default InterviewsTable
