"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { useCurrentUser } from '@/hooks/use-current-user'
import { signOut } from 'next-auth/react'
export default function Settings() {
    const user = useCurrentUser()
    const onClick = () => {
        signOut()
    }
    return (
        <div>
            <h1>Settings Page</h1>
            {user ? (
                <div>
                    <p>Welcome, {user.name}!</p>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>
            ) : (
                <p>You are not signed in.</p>
            )}
            <form>
                <Button className="cursor-pointer" type='submit' onClick={onClick}>Sign Out</Button>
            </form>
        </div>
    )
}