"use client"

import { admin } from '@/actions/demo.actions'
import RoleGate from '@/components/auth/role-gate'
import FormSuccess from '@/components/general/form-success'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useCurrentRole } from '@/hooks/use-current-role'
import React from 'react'
import { toast } from 'sonner'

export default function Admin() {
    const role = useCurrentRole()
    const apiOnClick = () => {
        fetch("/api/admin").then((response) => {
            if (response.ok) {
                toast.success("Okay")
            }
            else {
                toast.error("Unauthorized")
            }
        })
    }
    const onServerActionClick = () => {
        admin().then((data) => {
            if (data.error) {
                toast.error("Unauthorized")
            }
            else{
                toast.success("Okay")
            }
        })
    }
    console.log(role)
    return (
        <Card className='w-[600px]'>
            <CardHeader>
                <p className='text-2xl font-semibold text-center'>Admin</p>
            </CardHeader>
            <CardContent className='space-y-4'>
                <RoleGate allowedRole={role}>
                    <FormSuccess message="Congrats You Can See This Page" />
                </RoleGate>
                <div className="flex flex-row item-center justify-between rounded-lg border p-3 shadow-md">
                    <p className="text-xl">Admin Only API</p>
                    <Button onClick={apiOnClick}>Click To Test</Button>
                </div>
                <div className="flex flex-row item-center justify-between rounded-lg border p-3 shadow-md">
                    <p className="text-xl">Admin Only Server Actions</p>
                    <Button onClick={onServerActionClick}>Click To Test</Button>
                </div>
            </CardContent>
        </Card>
    )
}
