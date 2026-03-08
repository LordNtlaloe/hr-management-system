

"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createInterview, updateInterview } from "@/actions/interviews.actions"

interface InterviewFormProps {
    interview?: any
    onSuccess: () => void
}

const InterviewForm: React.FC<InterviewFormProps> = ({ interview, onSuccess }) => {
    const [formData, setFormData] = useState({
        candidateName: "",
        interviewer: "",
        date: "",
        status: "Scheduled"
    })

    useEffect(() => {
        if (interview) {
            setFormData({
                candidateName: interview.candidateName,
                interviewer: interview.interviewer,
                date: interview.date,
                status: interview.status
            })
        }
    }, [interview])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (interview?._id) {
            await updateInterview(interview._id, formData)
        } else {
            await createInterview(formData)
        }
        onSuccess()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Candidate Name" />
            <Input name="interviewer" value={formData.interviewer} onChange={handleChange} placeholder="Interviewer" />
            <Input type="date" name="date" value={formData.date} onChange={handleChange} />
            <Input name="status" value={formData.status} onChange={handleChange} placeholder="Status" />
            <Button type="submit">{interview ? "Update" : "Create"} Interview</Button>
        </form>
    )
}

export default InterviewForm
