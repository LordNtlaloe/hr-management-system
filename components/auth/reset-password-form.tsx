"use client"
import React, { useState, useTransition } from 'react'
import CardWrapper from '../general/card-wrapper'
import { useForm } from 'react-hook-form' // Remove Form from this import
import FormErrors from '../general/form-error'
import FormSuccess from '../general/form-success'
import { Button } from '../ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form' // Import Form from ui/form instead
import { Input } from '../ui/input'
import { resetPassword } from '@/actions/auth.actions'
import { PasswordResetSchema } from '@/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'

export default function ResetPasswordForm() {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof PasswordResetSchema>>({
        resolver: zodResolver(PasswordResetSchema),
        defaultValues: {
            email: "",
        }
    });
    
    const onSubmit = (values: z.infer<typeof PasswordResetSchema>) => {
        setError("");
        setSuccess("");

        console.log(values)
        startTransition(() => {
            resetPassword(values).then((data) => {
                if (!data) {
                    setError("Unexpected error occurred");
                    return;
                }
                setError(data.error);
                setSuccess(data.success);
            });
        })
    }
    
    return (
        <div>
            <CardWrapper headerLabel='Forgot Your Password?' backButtonLabel='Back To Login' backButtonHref="/auth/sign-in">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        <div className="space-y-4">
                            <FormField 
                                control={form.control} 
                                name='email' 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='your.name@youremail.com' type='email' disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                        </div>
                        <FormErrors message={error} />
                        <FormSuccess message={success} />
                        <Button type='submit' className='w-full cursor-pointer' disabled={isPending}>
                            {isPending ? "Sending Email..." : "Send Reset Email"}
                        </Button>
                    </form>
                </Form>
            </CardWrapper>
        </div>
    )
}