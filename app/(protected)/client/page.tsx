

"use client"

import React from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import UserInfo from '@/components/auth/user-info'

export default function UserClientPage() {
    const user = useCurrentUser()
    return (
        
        <UserInfo label={'User Info From Client Side'} user={user} />
    )
}
