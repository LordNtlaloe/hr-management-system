"use client"

import { useState } from "react"
import { createCandidate, updateCandidate } from "@/actions/candidates.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CandidateForm({ candidate, onSaved }: { candidate?: any, onSaved: (data: any) => void }) {
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState(candidate || { name: "", email: "", status: "Pending" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        let saved
        if (candidate) {
            await updateCandidate(candidate._id, form)
            saved = { ...candidate, ...form }
        } else {
            const id = await createCandidate(form)
            saved = { ...form, _id: id }
        }
        onSaved(saved)
        setOpen(false)
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                {candidate ? "Edit" : "Add Candidate"}
            </Button>

            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">{candidate ? "Edit Candidate" : "New Candidate"}</h3>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <Input
                                placeholder="Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <Input
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <Input
                                placeholder="Status"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            />

                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit">{candidate ? "Update" : "Save"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
