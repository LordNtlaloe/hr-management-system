// app/(protected)/(admin)/employees/[id]/page.tsx
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/actions/employee.actions";
import EmployeeDetailsCard from "@/components/dashboard/employees/BasicEmployeeInfo";
import LegalInfoCard from "@/components/dashboard/employees/LegalInfoCard";
import EducationHistoryCard from "@/components/dashboard/employees/EducationHistoryCard";
import EmploymentHistoryCard from "@/components/dashboard/employees/EmploymentHistoryCard";
import ReferencesCard from "@/components/dashboard/employees/ReferencesCard";

// --------------------
// Types
// --------------------
interface EmployeeProfilePageProps {
  params: Promise<{ id: string }>;
}

// --------------------
// Page Component
// --------------------
export default async function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  const { id } = await params;

  console.log("EmployeeProfilePage - ID from params:", id); // Debug log

  // Fetch employee from DB
  const employeeResult = await getEmployeeById(id);

  if (!employeeResult || !employeeResult._id) {
    console.log("EmployeeProfilePage - Employee not found for ID:", id); // Debug log
    return notFound();
  }

  console.log("EmployeeProfilePage - Employee found:", employeeResult._id); // Debug log

  // Destructure sections from employee schema
  const {
    employee_details,
    legal_info,
    education_history,
    employment_history,
    references,
    _id, // Get the actual employee ID from the result
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

      {/* Profile Sections */}
      <div className="flex flex-col space-y-6">
        {/* Top Section - Employee Details */}
        <EmployeeDetailsCard
          details={employee_details}
          employeeId={id} // ✅ FIX: Pass the actual ID from params
          profilePicture={employee_details?.profile_picture}
        />

        {/* Legal Info */}
        <LegalInfoCard legal={legal_info} />

        {/* Education & Employment History */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <EducationHistoryCard education={education_history} />
          </div>
          <div className="flex-1 space-y-6">
            <EmploymentHistoryCard employment={employment_history} />
          </div>
        </div>

        {/* References */}
        <ReferencesCard references={references} />
      </div>
    </div>
  );
}
