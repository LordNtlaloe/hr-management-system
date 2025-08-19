// components/dashboard/users/users-table.tsx
"use client"
import UsersTable from "@/components/dashboard/users/users-table";

export default function UsersPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UsersTable />
    </div>
  );
}