// app/(protected)/(admin)/employees/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface EmployeeData {
  _id: string;
  employee_details?: any;
  legal_info?: any;
  education_history?: any;
  employment_history?: any;
  references?: any;
}

export default function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  // Resolve params and fetch employee data
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params;
        setResolvedParams(resolved);

        const result = await getEmployeeById(resolved.id);
        if (!result || !result._id) {
          setError("Employee not found");
          return;
        }
        setEmployeeData(result);
      } catch (err) {
        setError("Failed to load employee data");
        console.error("Error loading employee:", err);
      } finally {
        setLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  // Handle navigation
  const handleBackToList = () => {
    router.push("/dashboard/employees");
  };

  const handleEditProfile = () => {
    if (resolvedParams?.id) {
      router.push(`/dashboard/employees/${resolvedParams.id}/edit`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading employee data...</div>
        </div>
      </div>
    );
  }

  // Error state or not found
  if (error || !employeeData || !resolvedParams) {
    notFound();
  }

  const {
    employee_details,
    legal_info,
    education_history,
    employment_history,
    references,
  } = employeeData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Profile</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleEditProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
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
            employeeId={resolvedParams.id}
            profilePicture={employee_details?.profile_picture}
          />
          <LegalInfoCard legal={legal_info} />
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

        {/* Employment Details */}
        <TabsContent value="employment" className="space-y-6 mt-6">
          <EmployeeTimeline employeeId={resolvedParams.id} />
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-6">
          <h1>Time Activities</h1>
        </TabsContent>
      </Tabs>
    </div>
  );
}
