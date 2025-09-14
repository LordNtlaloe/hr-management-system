"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export const columns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: any) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "employment_number", // <-- match the field in your data
    header: "Employee Number",
    cell: ({ row }) => (
      <div className="truncate max-w-[100px]">
        {row.getValue("employment_number")}
      </div>
    ),
  },

  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{`${row.original.first_name || ""} ${row.original.last_name || ""}`}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.original.email || ""}</div>,
  },
  {
    accessorKey: "department_name", // Match the key from server response
    header: "Section",
    cell: ({ row }) => (
      <div>{row.getValue("department_name") || "Unknown"}</div>
    ),
  },
  {
    accessorKey: "position_title", // Match the key from server response
    header: "Position",
    cell: ({ row }) => <div>{row.getValue("position_title") || "Unknown"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "active";
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "outline";

      if (status === "active") variant = "default";
      if (status === "on-leave") variant = "secondary";
      if (status === "terminated") variant = "destructive";
      if (status === "retired") variant = "outline"

      return (
        <Badge variant={variant}>
          {String(status).charAt(0).toUpperCase() +
            String(status).slice(1).replace("-", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "hire_date",
    header: "Hire Date",
    cell: ({ row }) => {
      const date = row.original.hire_date
        ? new Date(row.original.hire_date)
        : null;
      return <div>{date ? date.toLocaleDateString() : "N/A"}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const router = useRouter();
      const employee = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/employees/${employee._id}`)}
            >
              View/Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(employee._id)}
            >
              Copy ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
