// components/employees-table.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, SortingState, ColumnFiltersState, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { columns } from "@/components/dashboard/employees/employee-columns"
import { getAllEmployees } from "@/actions/employee.actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Upload, PlusCircle } from "lucide-react"

export default function EmployeesTable() {
    const router = useRouter()
    const [employees, setEmployees] = useState<any[]>([])
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [loading, setLoading] = useState(true)
    const [isEmpty, setIsEmpty] = useState(false)

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true)
                const response = await getAllEmployees()

                if (Array.isArray(response)) {
                    const processedEmployees = response.map(emp => ({
                        ...emp,
                        department_id: emp.department_id || null,
                        position_id: emp.position_id || null
                    }))
                    setEmployees(processedEmployees)
                    setIsEmpty(processedEmployees.length === 0)
                } else {
                    toast.error(response?.error || "Failed to fetch employees")
                    setEmployees([])
                    setIsEmpty(true)
                }
            } catch (error) {
                toast.error("Failed to fetch employees")
                console.error(error)
                setEmployees([])
                setIsEmpty(true)
            } finally {
                setLoading(false)
            }
        }
        fetchEmployees()
    }, [])

    const table = useReactTable({
        data: employees,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="w-full dark:bg-[#0D0D0D]">
            <div className="flex items-center py-4">
                {!isEmpty && (
                    <Input
                        placeholder="Filter by name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                        className="max-w-sm"
                    />
                )}
                <Button
                    variant="default"
                    className="ml-auto"
                    onClick={() => router.push("/employees/create")}
                >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Employee
                </Button>
                {!isEmpty && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-2">
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuItem
                                        key={column.id}
                                        onClick={() => column.toggleVisibility()}
                                    >
                                        {column.id}
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {isEmpty && !loading ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-12 border rounded-md">
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">No employees found</h3>
                        <p className="text-sm text-muted-foreground">
                            Get started by adding your first employee
                        </p>
                    </div>
                    <Button
                        variant="default"
                        onClick={() => router.push("/employees/new")}
                        className="mt-4"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                        Loading employees...
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                onClick={() => router.push(`/employees/${row.original._id}`)}
                                                className="cursor-pointer hover:bg-muted/50"
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(`/employees/${row.original._id}/employee-documents/create`)
                                                }}
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload Docs
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                        No results found for your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {!isEmpty && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}