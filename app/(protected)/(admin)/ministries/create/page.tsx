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
import { MinistriesSchema } from "@/schemas"
import { createMinistry } from "@/actions/ministries.action"

type MinistryFormValues = z.infer<typeof MinistriesSchema>

export default function MinistryPage() {
    const router = useRouter()

    const form = useForm<MinistryFormValues>({
        resolver: zodResolver(MinistriesSchema),
    })

    async function onSubmit(values: MinistryFormValues) {
        try {
            const result = await createMinistry(values)

            if (result.success) {
                toast.success("Ministry created successfully")
                router.push("/ministries")
            } else {
                toast.error(result.error || "Failed to create ministry")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Add New Ministry</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Ministry Name */}
                        <FormField
                            control={form.control}
                            name="ministry_name"  // updated to ministry_name
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ministry Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ministry Of Agriculture" {...field} />
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
                                        <Input placeholder="Ministry focused on agriculture" {...field} />
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
                            onClick={() => router.push("/ministries")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create Ministry</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
