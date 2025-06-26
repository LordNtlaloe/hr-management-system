"use client"
import CardWrapper from '@/components/general/card-wrapper'
import { BeatLoader } from "react-spinners"
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { verifyEmail } from '@/actions/auth.actions'
import FormErrors from '@/components/general/form-error'
import FormSuccess from '@/components/general/form-success'

export default function VerificationForm() {
    const [error, setError] = useState<string | undefined>()
    const [success, setSuccess] = useState<string | undefined>()
    const [isLoading, setIsLoading] = useState(true)

    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const onSubmit = useCallback(async () => {
        if (!token) {
            setError("Missing verification token")
            setIsLoading(false)
            return
        }

        try {
            setError(undefined)
            setSuccess(undefined)
            
            // Use verifyEmail instead of regenerateVerificationToken
            const data = await verifyEmail(token)
            
            if (data.success) {
                setSuccess(data.success)
            } else if (data.error) {
                setError(data.error)
            }
        } catch (error) {
            setError(`${error} Something went wrong during verification`)
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useEffect(() => {
        onSubmit()
    }, [onSubmit])

    return (
        <CardWrapper
            headerLabel='Confirm Your Email'
            backButtonHref='/auth/sign-in'
            backButtonLabel='Go Back To Login'
        >
            <div className="flex items-center w-full justify-center flex-col space-y-4">
                {isLoading && (
                    <>
                        <BeatLoader />
                        <p className="text-sm text-muted-foreground">
                            Verifying your email...
                        </p>
                    </>
                )}

                {!isLoading && (
                    <>
                        <FormSuccess message={success} />
                        <FormErrors message={error} />

                        {success && (
                            <p className="text-sm text-muted-foreground text-center">
                                Your email has been verified! You can now log in to your account.
                            </p>
                        )}

                        {error && (
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Please try again or contact support if the problem persists.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Retry Verification
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </CardWrapper>
    )
}