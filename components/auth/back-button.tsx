"use client"

import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'

interface BackButtonProps{
    label: string,
    link: string
}

export default function BackButton({label, link}:BackButtonProps) {
  return (
    <Button variant="link" className='font-normal' size="sm" asChild>
      <Link href={link}>{label}</Link>
    </Button>
  )
}
