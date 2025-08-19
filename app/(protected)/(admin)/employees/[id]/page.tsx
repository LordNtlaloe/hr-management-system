import { Metadata } from "next";
import EmployeeProfileCard from "@/components/dashboard/employees/profile-card";
import DocumentsTableByID from "@/components/dashboard/employee-documents/employee-documents-table-by-id";
import { getEmployeeById } from "@/actions/employee.actions";
import { notFound } from "next/navigation";
import Calendar from "@/components/calendar/Calendar";

export const metadata: Metadata = {
  title: "Employee Profile",
  description: "View and manage employee profile and documents",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  // Await the params Promise
  const resolvedParams = await params;
  const employee = await getEmployeeById(resolvedParams.id);
  
  if (!employee || "error" in employee) return notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border shadow-sm bg-white p-5 dark:bg-[#0D0D0D]">
        <EmployeeProfileCard employeeId={employee._id} />
      </div>
      <div className="rounded-2xl border shadow-sm bg-white p-5 dark:border-gray-800 dark:bg-[#0D0D0D]">
        <DocumentsTableByID employeeId={employee._id} />
      </div>
      <div className="rounded-2xl border shadow-sm bg-white p-5 dark:bg-[#0D0D0D]">
        <Calendar employeeId={employee._id} />
      </div>
    </div>
  );
}