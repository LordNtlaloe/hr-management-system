"use client"
import React, { useState, useTransition } from 'react'
import CardWrapper from '@/components/general/card-wrapper'
import { useForm } from 'react-hook-form'
import FormErrors from '@/components/general/form-error'
import FormSuccess from '@/components/general/form-success'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { newPassword } from '@/actions/auth.actions'
import { NewPasswordSchema } from '@/schemas'


export default function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof NewPasswordSchema>>({
        resolver: zodResolver(NewPasswordSchema),
        defaultValues: {
            password: ""
        }
    });

    const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            newPassword(values, token).then((data) => {
                if (!data) {
                    setError("Unexpected error occurred");
                    return;
                }
                setError(data.error);
                setSuccess(data.success);
            });
        });
    }

    return (
        <div>
            <CardWrapper
                headerLabel='Enter Your New Password'
                backButtonLabel='Back To Login'
                backButtonHref="/auth/sign-in"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name='password'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder='*********'
                                                type='password'
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormErrors message={error} />
                        <FormSuccess message={success} />

                        <Button
                            type='submit'
                            className='w-full cursor-pointer'
                            disabled={isPending}
                        >
                            {isPending ? "Resetting Password..." : "Reset Your Password"}
                        </Button>
                    </form>
                </Form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Enter New Password To Reset Old Password
                    </p>
                </div>
            </CardWrapper>
        </div>
    )
}