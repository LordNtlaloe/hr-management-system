import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { User } from 'next-auth'

interface UserProps {
  user?: User & {
    id: string;
    role: "Employee" | "Admin";
  }
  label: string
}

export default function UserInfo({ user, label }: UserProps) {
  return (
    <Card className='w-[600px] h-[600px]'>
      <CardHeader>
        <p className='text-2xl font-semibold text-center'>{label}</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p>ID:</p>
          <p>{user?.id}</p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p>Name:</p>
          <p>{user?.first_name} {user?.last_name}</p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p>Email:</p>
          <p>{user?.email}</p>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <p>Role:</p>
          <p>{user?.role}</p>
        </div>
      </CardContent>
    </Card>
  )
}