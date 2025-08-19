"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createEmployee } from "@/actions/employee.actions"
import { getAllDepartments } from "@/actions/department.actions"
import { getAllPositions } from "@/actions/position.actions"
import { getAllEmployees } from "@/actions/employee.actions"
import { EmployeeSchema } from "@/schemas"
import { Department, Position, Employee } from "@/types"

type EmployeeFormValues = z.infer<typeof EmployeeSchema>

export default function EmployeePage() {
    const router = useRouter()
    const form = useForm({
        resolver: zodResolver(EmployeeSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            department_id: "",
            position_id: "",
            manager_id: "",
            hire_date: new Date(),
            salary: 0,
            status: "active" as const,
            skills: "",
            date_of_birth: undefined,
            address: "",
            nationality: "",
        }
    })

    const [departments, setDepartments] = useState<Department[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptResponse, posResponse, empResponse] = await Promise.all([
                    getAllDepartments(),
                    getAllPositions(),
                    getAllEmployees()
                ])

                // Handle departments response
                if (Array.isArray(deptResponse)) {
                    setDepartments(deptResponse)
                } else if (deptResponse && !deptResponse.error) {
                    setDepartments([])
                }

                // Handle positions response
                if (Array.isArray(posResponse)) {
                    setPositions(posResponse)
                } else if (posResponse && !posResponse.error) {
                    setPositions([])
                }

                // Handle employees response
                if (Array.isArray(empResponse)) {
                    setEmployees(empResponse)
                } else if (empResponse && !empResponse.error) {
                    setEmployees([])
                }
            } catch (error) {
                console.error("Error fetching data:", error)
                toast.error("Failed to load form data")
            }
        }
        fetchData()
    }, [])

    const statusOptions = ["active", "on-leave", "terminated"]

    const onSubmit = async (values: EmployeeFormValues) => {
        try {
            const result = await createEmployee(values)

            if (result.success) {
                toast.success("Employee created successfully")
                router.push("/employees")
            } else {
                toast.error(result.error || "Failed to create employee")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Add New Employee</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* First Name */}
                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., John" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Last Name */}
                        <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john.doe@company.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., +1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Department Dropdown */}
                        <FormField
                            control={form.control}
                            name="department_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <FormControl>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full text-left">
                                                    {field.value ?
                                                        departments.find((dept) => dept._id === field.value)?.department_name || "Select Department"
                                                        : "Select Department"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {departments.map((dept) => (
                                                    <DropdownMenuItem
                                                        key={dept._id}
                                                        onClick={() => field.onChange(dept._id)}
                                                    >
                                                        {dept.department_name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Position Dropdown */}
                        <FormField
                            control={form.control}
                            name="position_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full text-left">
                                                    {field.value ?
                                                        positions.find((pos) => pos._id === field.value)?.position_title || "Select Position"
                                                        : "Select Position"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {positions.map((pos) => (
                                                    <DropdownMenuItem
                                                        key={pos._id}
                                                        onClick={() => field.onChange(pos._id)}
                                                    >
                                                        {pos.position_title}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Manager Dropdown */}
                        <FormField
                            control={form.control}
                            name="manager_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manager (Optional)</FormLabel>
                                    <FormControl>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full text-left">
                                                    {field.value ?
                                                        employees.find((emp) => emp._id === field.value)?.first_name + " " + employees.find((emp) => emp._id === field.value)?.last_name || "Select Manager"
                                                        : "Select Manager"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => field.onChange("")}>
                                                    No Manager
                                                </DropdownMenuItem>
                                                {employees.map((emp) => (
                                                    <DropdownMenuItem
                                                        key={emp._id}
                                                        onClick={() => field.onChange(emp._id)}
                                                    >
                                                        {emp.first_name} {emp.last_name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Hire Date */}
                        <FormField
                            control={form.control}
                            name="hire_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hire Date</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Salary */}
                        <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Salary</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 50000"
                                            value={field.value as number} // <-- cast to number
                                            onChange={(e) => field.onChange(Number(e.target.value))} // convert string to number
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        {/* Status */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <FormControl>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full text-left">
                                                    {field.value ? field.value : "Select Status"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {statusOptions.map((status) => (
                                                    <DropdownMenuItem
                                                        key={status}
                                                        onClick={() => field.onChange(status)}
                                                    >
                                                        {status}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Skills */}
                        <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Skills (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., JavaScript, React, Node.js" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date of Birth */}
                        <FormField
                            control={form.control}
                            name="date_of_birth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Birth (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Address */}
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 123 Main St, City, State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Nationality */}
                        <FormField
                            control={form.control}
                            name="nationality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nationality (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., American" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/employees")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create Employee</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}