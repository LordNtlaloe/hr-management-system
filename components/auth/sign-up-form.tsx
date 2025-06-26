"use client"
import React, { useState, useTransition } from 'react'
import CardWrapper from '../general/card-wrapper'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as z from "zod";
import { SignUpSchema } from '@/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormErrors from '../general/form-error';
import FormSuccess from '../general/form-success';
import { signup } from "@/actions/auth.actions"

export default function SignUpForm() {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof SignUpSchema>>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            phone_number: "",
            email: "",
            password: "",
            role: "Cashier"
        }
    });

    const onSubmit = (values: z.infer<typeof SignUpSchema>) => {
        setError("");
        setSuccess("");
        startTransition(() => {
            signup(values)
                .then((data) => {
                    setError(data.error);
                    setSuccess(data.success);

                    // Clear form data on successful signup
                    if (data.success && !data.error) {
                        form.reset();
                    }
                })
                .catch((err) => {
                    console.error("Signup error:", err);
                    setError("An unexpected error occurred");
                });
        });
    }

    return (
        <CardWrapper showSocial headerLabel={'Create Account'} backButtonLabel={"Already Have An Account?"} backButtonHref={'/sign-in'}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name='first_name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='John' type='text' disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='last_name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='Doe' type='text' disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='phone_number'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='+266 5800 0000' type='text' disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Added missing email field */}
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='john.doe@example.com' type='email' disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='*********' type='password' disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormErrors message={error} />
                    <FormSuccess message={success} />
                    <Button type='submit' className='w-full cursor-pointer' disabled={isPending}>
                        {isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    )
}