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
import { SectionSchema } from "@/schemas"
import { createSection } from "@/actions/section.actions"

type SectionFormValues = z.infer<typeof SectionSchema>

export default function SectionPage() {
    const router = useRouter()

    const form = useForm<SectionFormValues>({
        resolver: zodResolver(SectionSchema),
    })

    async function onSubmit(values: SectionFormValues) {
        try {
            const result = await createSection(values)

            if (result.success) {
                toast.success("Section created successfully")
                router.push("/sections")
            } else {
                toast.error(result.error || "Failed to create section")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Add New Section</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Section Name */}
                        <FormField
                            control={form.control}
                            name="section_name"  // updated to section_name
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Admin" {...field} />
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
                                        <Input placeholder="Section focused on Admin and general management" {...field} />
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
                            onClick={() => router.push("/sections")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create Section</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
