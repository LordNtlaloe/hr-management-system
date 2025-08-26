"use client"

import { useEffect, useState } from "react"
import { getAllCandidates, deleteCandidate } from "@/actions/candidates.actions"
import CandidateForm from "@/components/candidates/candidates-form"
import { useRole } from "@/context/RoleContext"
import { Button } from "@/components/ui/button"

export default function CandidatesTable() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)
    const { userRole } = useRole()

    useEffect(() => {
        const fetchData = async () => {
            const data = await getAllCandidates()
            setCandidates(data)
        }
        fetchData()
    }, [])

    const handleDelete = async (id: string) => {
        await deleteCandidate(id)
        setCandidates(candidates.filter(c => c._id !== id))
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Candidates</h2>
                {userRole === "admin" && (
                    <CandidateForm onSaved={(newCandidate) => setCandidates([...candidates, newCandidate])} />
                )}
            </div>

            <table className="min-w-full border rounded-lg">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Email</th>
                        <th className="p-2 border">Status</th>
                        <th className="p-2 border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {candidates.map((c) => (
                        <tr key={c._id} className="border-b">
                            <td className="p-2 border">{c.name}</td>
                            <td className="p-2 border">{c.email}</td>
                            <td className="p-2 border">{c.status}</td>
                            <td className="p-2 border flex gap-2">
                                <Button onClick={() => setSelected(c)}>View</Button>
                                {userRole === "admin" && (
                                    <>
                                        <CandidateForm candidate={c} onSaved={(updated) => {
                                            setCandidates(candidates.map(x => x._id === updated._id ? updated : x))
                                        }} />
                                        <Button variant="destructive" onClick={() => handleDelete(c._id)}>
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* View Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold">Candidate Details</h3>
                        <p><b>Name:</b> {selected.name}</p>
                        <p><b>Email:</b> {selected.email}</p>
                        <p><b>Status:</b> {selected.status}</p>
                        <Button className="mt-4" onClick={() => setSelected(null)}>Close</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
