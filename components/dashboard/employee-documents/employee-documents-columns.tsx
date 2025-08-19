import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

export type EmployeeDocument = {
    id: string
    employee_id: string
    employee_name: string // Added employee name
    national_id: string
    passport_photo?: string
    academic_certificates: string[]
    police_clearance?: string
    medical_certificate?: string
    driver_license?: string
    created_at: string
    updated_at: string
}

export const documentColumns: ColumnDef<EmployeeDocument>[] = [
    {
        accessorKey: "employee_name",
        header: "Employee Name",
        cell: ({ row }) => {
            return (
                <Link href={`/employees/${row.original.employee_id}/documents`}>
                    <span className="text-blue-600 hover:underline cursor-pointer">
                        {row.getValue("employee_name")}
                    </span>
                </Link>
            )
        }
    },
    {
        accessorKey: "national_id",
        header: "National ID",
    },
    {
        accessorKey: "passport_photo",
        header: "Passport Photo",
        cell: ({ row }) => {
            const photo = row.getValue("passport_photo") as string
            return photo ? (
                <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Photo
                </a>
            ) : (
                <span className="text-gray-400">Not provided</span>
            )
        }
    },
    {
        accessorKey: "academic_certificates",
        header: "Academic Certificates",
        cell: ({ row }) => {
            const certificates = row.getValue("academic_certificates") as string[]
            return (
                <div className="flex flex-col space-y-1">
                    {certificates.map((cert, index) => (
                        <a
                            key={index}
                            href={cert}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            Certificate {index + 1}
                        </a>
                    ))}
                </div>
            )
        }
    },
    {
        accessorKey: "police_clearance",
        header: "Police Clearance",
        cell: ({ row }) => {
            const clearance = row.getValue("police_clearance") as string
            return clearance ? (
                <a href={clearance} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Clearance
                </a>
            ) : (
                <span className="text-gray-400">Not provided</span>
            )
        }
    },
    {
        accessorKey: "medical_certificate",
        header: "Medical Certificate",
        cell: ({ row }) => {
            const certificate = row.getValue("medical_certificate") as string
            return certificate ? (
                <a href={certificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Certificate
                </a>
            ) : (
                <span className="text-gray-400">Not provided</span>
            )
        }
    },
    {
        accessorKey: "driver_license",
        header: "Driver License",
        cell: ({ row }) => {
            const license = row.getValue("driver_license") as string
            return license ? (
                <a href={license} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View License
                </a>
            ) : (
                <span className="text-gray-400">Not provided</span>
            )
        }
    },
    {
        accessorKey: "created_at",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return date.toLocaleDateString()
        }
    },
]