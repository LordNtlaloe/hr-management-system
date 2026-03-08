"use client"
import React, { useState, useTransition } from 'react'
import CardWrapper from '../general/card-wrapper'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as z from "zod";
import { LoginSchema } from '@/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormErrors from '../general/form-error';
import FormSuccess from '../general/form-success';
import { login } from "@/actions/auth.actions"
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error") === "OAuthAccountNotLinked" ? "Email Already In Use With Different Provider" : ""
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition()
    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });
    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setSuccess("");
        startTransition(() => {
            login(values).then((data) => {
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
        <CardWrapper showSocial headerLabel={'Welcome Back'} backButtonLabel={"Don't Have An Account?"} backButtonHref={'/auth/sign-up'}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                    <div className="space-y-4">
                        <FormField control={form.control} name='email' render={({ field }) => <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder='your.name@youremail.com' type='email' disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>} />
                        <FormField control={form.control} name='password' render={({ field }) => <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder='*********' type='password' disabled={isPending} />
                            </FormControl>
                            <div>
                                <Link href="/auth/password-reset-request">
                                    <p className='text-sm py-2'>Forgot Password? Reset Here</p>
                                </Link>
                            </div>
                            <FormMessage />
                        </FormItem>} />
                    </div>
                    <FormErrors message={error || urlError} />
                    <FormSuccess message={success} />
                    <Button type='submit' className='w-full cursor-pointer' disabled={isPending}>
                        {isPending ? "Signing In..." : "Sign In"}
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    )
}
