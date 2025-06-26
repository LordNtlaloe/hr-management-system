"use client"
import React from 'react'
import { FcGoogle } from "react-icons/fc"
import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'

export default function Socials() {
  const handleClick = (provider: "google") => {
    signIn(provider, {
      callBackUrl: DEFAULT_LOGIN_REDIRECT
    })

  }
  return (
    <div className='flex items-center w-full gap-x-2'>
      <Button size="lg" className='w-full cursor-pointer' variant={'outline'} onClick={() => handleClick("google")}>
        <FcGoogle className='h-5 w-5' />
        <p className='text-lg'>Sign In With Google</p>
      </Button>
    </div>
  )
}
