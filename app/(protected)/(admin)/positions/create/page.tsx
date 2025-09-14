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
import { createPosition } from "@/actions/position.actions"
import { getAllSections } from "@/actions/section.actions"
import { PositionSchema } from "@/schemas"  // Assuming you have a Zod schema for Position
import { Section } from "@/types"

type PositionFormValues = z.infer<typeof PositionSchema>

export default function PositionPage() {
    const router = useRouter()
    const form = useForm<PositionFormValues>({
        resolver: zodResolver(PositionSchema),
    })

    const [sections, setSections] = useState<Section[]>([])

    useEffect(() => {
        const fetchSections = async () => {
            const response = await getAllSections()  // Fetch sections from your database
            setSections(response)
        }
        fetchSections()
    }, [])

    const salaryGrades = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "D3"];

    async function onSubmit(values: PositionFormValues) {
        try {
            const result = await createPosition(values)

            if (result.success) {
                toast.success("Position created successfully")
                router.push("/positions")  // Redirect after successful creation
            } else {
                toast.error(result.error || "Failed to create position")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Add New Position</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Position Title */}
                        <FormField
                            control={form.control}
                            name="position_title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Marketing Manager" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Salary Grade */}
                        <FormField
                            control={form.control}
                            name="salary_grade"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Salary Grade</FormLabel>
                                    <FormControl>
                                        {/* Custom Dropdown for Salary Grade */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full text-left">
                                                    {field.value ? field.value : "Select Salary Grade"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {salaryGrades.map((grade) => (
                                                    <DropdownMenuItem
                                                        key={grade}
                                                        onClick={() => field.onChange(grade)}  // Set the salary grade when clicked
                                                    >
                                                        {grade} {/* Display salary grade */}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Position responsible for marketing campaigns" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Section Dropdown */}
                        <FormField
                            control={form.control}
                            name="section_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section</FormLabel>
                                    <FormControl>
                                        {/* Custom Dropdown for Section */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full text-left">
                                                    {field.value ?
                                                        sections.find((dept) => dept._id === field.value)?.section_name || "Select Section"
                                                        : "Select Section"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {sections.map((dept) => (
                                                    <DropdownMenuItem
                                                        key={dept._id}
                                                        onClick={() => field.onChange(dept._id)} // Set the section ID when clicked
                                                    >
                                                        {dept.section_name} {/* Display section name */}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                            onClick={() => router.push("/positions")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create Position</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
