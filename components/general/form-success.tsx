import React from 'react'
import { CheckCircledIcon } from "@radix-ui/react-icons"

interface FormSuccessProps {
    message?: string
}

export default function FormSuccess({ message }: FormSuccessProps) {
    if(!message) return null;
    return (
        <div className='bg-green-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-green-500'>
            <CheckCircledIcon className='h-4 w-4'/>
            <p>{message}</p>
        </div>
    )
}
