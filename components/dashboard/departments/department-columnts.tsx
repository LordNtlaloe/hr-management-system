import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Department } from "@/types"

export const columns: ColumnDef<Department>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value: any) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "department_name",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Department Name
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("department_name")}</div>,
    },
    {
        accessorKey: "employee_count",
        header: () => <div className="text-right">Employee Count</div>,
        cell: ({ row }) => <div className="text-right">{row.getValue("employee_count")}</div>,
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const department = row.original
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.location.href = `/departments/edit/${department._id}`}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(department)}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function handleDelete(department: Department) {
    // Confirm delete action
    const confirmDelete = window.confirm(`Are you sure you want to delete the department: ${department.department_name}?`)
    
    if (confirmDelete) {
        // Call your delete API here and update the table
        console.log(`Deleting department: ${department.department_name}`)
        // Example: deleteDepartmentAPI(department._id).then(() => { updateTable() })
    }
}
