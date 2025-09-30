// app/(protected)/(admin)/employees/[id]/page.tsx
"use client";

import { notFound } from "next/navigation";
import { getEmployeeById } from "@/actions/employee.actions";
import EmployeeDetailsCard from "@/components/dashboard/employees/BasicEmployeeInfo";
import LegalInfoCard from "@/components/dashboard/employees/LegalInfoCard";
import EducationHistoryCard from "@/components/dashboard/employees/EducationHistoryCard";
import EmploymentHistoryCard from "@/components/dashboard/employees/EmploymentHistoryCard";
import ReferencesCard from "@/components/dashboard/employees/ReferencesCard";
import EmployeeTimeline from "@/components/dashboard/employees/employee-timeline";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmployeeProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  const { id } = await params;

  const employeeResult = await getEmployeeById(id);
  if (!employeeResult || !employeeResult._id) {
    return notFound();
  }

  const {
    employee_details,
    legal_info,
    education_history,
    employment_history,
    references,
  } = employeeResult;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Profile</h1>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Edit Profile
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            Back to List
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="employment">Employment Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Employee Details */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <EmployeeDetailsCard
            details={employee_details}
            employeeId={id}
            profilePicture={employee_details?.profile_picture}
          />
          <LegalInfoCard legal={legal_info} />
        </TabsContent>

        {/* Employment Details */}
        <TabsContent value="employment" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <EducationHistoryCard education={education_history} />
            </div>
            <div className="flex-1 space-y-6">
              <EmploymentHistoryCard employment={employment_history} />
            </div>
          </div>
          <ReferencesCard references={references} />
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-6">
          <EmployeeTimeline employeeId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
