"use client"
import React from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import AuthHeader from './auth-header'
import Socials from '@/components/auth/socials'
import BackButton from '../auth/back-button'

interface CardWrapperProps {
    children: React.ReactNode,
    headerLabel: string,
    backButtonLabel: string,
    backButtonHref: string,
    showSocial?: boolean
}

export default function CardWrapper({ children, headerLabel, backButtonLabel, backButtonHref, showSocial }: CardWrapperProps) {
    return (
        <Card className='w-[400px] shadow-md'>
            <CardHeader>
                <AuthHeader label={headerLabel} />
            </CardHeader>
            <CardContent>{children}</CardContent>
            {showSocial && (
                <CardFooter>
                    <Socials />
                </CardFooter>
            )}
            <CardFooter>
                <BackButton label={backButtonLabel} link={backButtonHref}/>
            </CardFooter>
        </Card>
    )
}
