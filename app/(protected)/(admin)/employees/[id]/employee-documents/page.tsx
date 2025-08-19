"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import EmployeeProfileCard from "@/components/dashboard/employees/profile-card"
import { use } from "react"


export default function EmployeePage( {params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const {id} = use(params)

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Employee Documents</h1>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/employees/${id}`)}
                    >
                        Back to Employee
                    </Button>
                </div>
            </div>

            <EmployeeProfileCard employeeId={id} />
        </div>
    )
}