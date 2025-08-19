"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

export default function NotificationDropdown() {
  const [notifying, setNotifying] = React.useState(true);

  const handleOpen = () => setNotifying(false);

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
          {notifying && (
            <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
              <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
            </span>
          )}
          <Bell className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="mt-2 w-[350px] max-h-[480px] overflow-y-auto rounded-2xl shadow-lg p-3"
      >
        <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b">
          <span className="font-semibold">Notifications</span>
        </DropdownMenuLabel>

        {/* Example notifications */}
        <DropdownMenuItem className="flex gap-3 items-start p-3 hover:bg-muted rounded-lg cursor-pointer">
          <Image
            src="/images/user/user-02.jpg"
            width={40}
            height={40}
            alt="User"
            className="rounded-full"
          />
          <div className="flex flex-col text-sm">
            <span>
              <span className="font-medium">Terry Franci</span> requests
              permission to change <span className="font-medium">Project - Nganter App</span>
            </span>
            <span className="text-xs text-gray-500">5 min ago</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex gap-3 items-start p-3 hover:bg-muted rounded-lg cursor-pointer">
          <Image
            src="/images/user/user-03.jpg"
            width={40}
            height={40}
            alt="User"
            className="rounded-full"
          />
          <div className="flex flex-col text-sm">
            <span>
              <span className="font-medium">Alena Franci</span> requests
              permission to change <span className="font-medium">Project - Nganter App</span>
            </span>
            <span className="text-xs text-gray-500">8 min ago</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/"
            className="w-full text-center py-2 font-medium text-sm hover:underline"
          >
            View All Notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
