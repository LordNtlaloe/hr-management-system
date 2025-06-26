
// "use client"
import React from 'react'
import { currentUser } from '@/lib/auth'
import UserInfo from '@/components/auth/user-info'

export default async function UserServerPage() {
    const user = await currentUser()
    return (
        
        <UserInfo label={'User Info From Server Side'} user={user} />
    )
}
