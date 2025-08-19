"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Settings, Info, LogOut } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";

export default function UserDropdown() {
  const user = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 rounded-full px-2 py-1"
        >
          <Image
            width={44}
            height={44}
            src={user?.image || "/images/user/owner.jpg"}
            alt={user?.name || "User"}
            className="rounded-full"
          />
          <span className="font-medium text-sm text-gray-700 dark:text-gray-400">
            {user?.name || "User"}
          </span>
          <ChevronDown className="h-4 w-4 stroke-gray-500 dark:stroke-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 p-2">
        <div className="mb-2 px-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
            {user?.name || "Full Name"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email || "user@example.com"}
          </p>
        </div>

        <DropdownMenuItem asChild>
          <Link href="/profile"> 
            <User className="mr-2 h-4 w-4" /> Edit profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account-settings">
            <Settings className="mr-2 h-4 w-4" /> Account settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/support">
            <Info className="mr-2 h-4 w-4" /> Support
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout" className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
