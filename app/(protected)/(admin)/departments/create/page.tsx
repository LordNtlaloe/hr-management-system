"use client"
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
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DepartmentSchema } from "@/schemas"
import { createDepartment } from "@/actions/department.actions"

type DepartmentFormValues = z.infer<typeof DepartmentSchema>

export default function DepartmentPage() {
    const router = useRouter()

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(DepartmentSchema),
    })

    async function onSubmit(values: DepartmentFormValues) {
        try {
            const result = await createDepartment(values)

            if (result.success) {
                toast.success("Department created successfully")
                router.push("/departments")
            } else {
                toast.error(result.error || "Failed to create department")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Add New Department</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Department Name */}
                        <FormField
                            control={form.control}
                            name="department_name"  // updated to department_name
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Marketing" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"  // updated to description
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Department focused on marketing strategies" {...field} />
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
                            onClick={() => router.push("/departments")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create Department</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
