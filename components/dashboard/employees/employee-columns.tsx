"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EmployeeDetails = {
  _id: string;
  surname: string;
  other_names: string;
  current_address: string;
  date_of_birth: string;
  age: number;
  gender: "male" | "female";
  place_of_birth: string;
  is_citizen: boolean;
  citizen_info?: {
    chief_name: string;
    district: string;
    tax_id: string;
  };
  non_citizen_info?: {
    certificate_number: string;
    date_of_issue: string;
    present_nationality: string;
  };
};

export const columns: ColumnDef<EmployeeDetails>[] = [
  {
    accessorKey: "surname",
    header: "Surname",
  },
  {
    accessorKey: "other_names",
    header: "Other Names",
  },
  {
    accessorKey: "current_address",
    header: "Current Address",
  },
  {
    accessorKey: "date_of_birth",
    header: "Date of Birth",
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "place_of_birth",
    header: "Place of Birth",
  },
  {
    accessorKey: "is_citizen",
    header: "Citizen?",
    cell: ({ row }) => (row.original.is_citizen ? "Yes" : "No"),
  },
  {
    accessorKey: "citizen_info",
    header: "Citizen Info",
    cell: ({ row }) =>
      row.original.is_citizen && row.original.citizen_info
        ? `${row.original.citizen_info.chief_name}, ${row.original.citizen_info.district}, ${row.original.citizen_info.tax_id}`
        : "-",
  },
  {
    accessorKey: "non_citizen_info",
    header: "Non-Citizen Info",
    cell: ({ row }) =>
      !row.original.is_citizen && row.original.non_citizen_info
        ? `${row.original.non_citizen_info.certificate_number}, ${row.original.non_citizen_info.date_of_issue}, ${row.original.non_citizen_info.present_nationality}`
        : "-",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
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
              onClick={() => navigator.clipboard.writeText(employee._id)}
            >
              Copy Employee ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Edit", employee._id)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Delete", employee._id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
