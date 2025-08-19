"use client"

import { useParams } from "next/navigation"
import DocumentsTable from "@/components/dashboard/employee-documents/documents-table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function EmployeeDocumentsPage() {
    const router = useRouter()
    const params = useParams()
    const employeeId = params.id as string

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Employee Documents</h1>
                <div className="space-x-2">
                    <Button variant="outline" onClick={() => router.push(`/employees/${employeeId}`)}>
                        Back to Employee
                    </Button>
                </div>
            </div>
            
            <DocumentsTable />
        </div>
    )
}