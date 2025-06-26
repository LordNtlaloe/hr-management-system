"use client"
import { useCurrentRole } from '@/hooks/use-current-role'
import React from 'react'
import FormErrors from '../general/form-error'


interface RoleGateProps {
    children: React.ReactNode,
    allowedRole: "Admin" | "Manager" | "Cashier" | undefined
}

export default function RoleGate({ children, allowedRole }: RoleGateProps) {
    const role = useCurrentRole()
    
    if (!allowedRole || (allowedRole !== "Admin" && allowedRole !== "Manager")) {
        return(
            <FormErrors message='You Are Not Authorized To Access This Page' />
        )
    }
    
    if(role !== allowedRole){
        return(
            <FormErrors message='You Are Not Authorized To Access This Page' />
        )
    }
    
    return (
        <div>
            {children}
        </div>
    )
}