"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserCircle2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import LogoutButton from './logout-button'
import { DropdownMenuLabel } from '@radix-ui/react-dropdown-menu';

export default function UserButton() {
  const user = useCurrentUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='cursor-pointer'>
        <Avatar>
          <AvatarImage
            src={user?.image || ""}
            alt={user?.name || "User avatar"}
          />
          <AvatarFallback className='bg-emerald-500'>
            <UserCircle2 className='w-6 h-6 text-white' />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-40 cursor-pointer' align='end'>
        <DropdownMenuLabel>Logout</DropdownMenuLabel>
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
