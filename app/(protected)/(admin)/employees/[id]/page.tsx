// app/(pages)/employees/[id]/page.tsx

import {
  getEmployeeById,
  getEmployeeDetailsById,
} from "@/actions/employee.actions";
import EmployeeBasicInfoCard from "@/components/dashboard/employees/BasicEmployeeInfo";
import EmployeeAddressCard from "@/components/dashboard/employees/EmployeeAddressCard";
import EmployeeEmergencyContactCard from "@/components/dashboard/employees/EmployeeEmergencyContact";
import EmployeeBankingInfoCard from "@/components/dashboard/employees/EmployeeBankingDetails";
import EmployeeAdditionalInfoCard from "@/components/dashboard/employees/EmployeeAdditionalInfo";
import { notFound } from "next/navigation";

// --------------------
// Types
// --------------------
interface EmployeeProfilePageProps {
  params: Promise<{ id: string }>;
}

interface EmployeeDetails {
  address?: Address;
  emergency_contact?: EmergencyContact;
  banking_info?: BankingInfo;
  additional_info?: AdditionalInfo;
}

interface Address {
  country?: string;
  city_state?: string;
  postal_code?: string;
  street_address?: string;
  tax_id?: string;
}

interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface BankingInfo {
  bank_name?: string;
  account_number?: string;
  routing_number?: string;
  account_type?: string;
}

interface AdditionalInfo {
  marital_status?: string;
  spouse_name?: string;
  children_count?: number;
  next_of_kin?: string;
  medical_conditions?: string;
  allergies?: string;
  notes?: string;
}

// --------------------
// Page Component
// --------------------
export default async function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  // Await the params promise
  const { id } = await params;

  const [employeeResult, detailsResult] = await Promise.all([
    getEmployeeById(id),
    getEmployeeDetailsById(id),
  ]);

  if (!employeeResult || !employeeResult._id) {
    return notFound();
  }

  // Safely handle possible shapes of detailsResult
  const employeeDetails: EmployeeDetails | null =
    detailsResult &&
    typeof detailsResult === "object" &&
    !("error" in detailsResult)
      ? (detailsResult as EmployeeDetails)
      : null;

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

      {/* Profile Sections - Horizontal Cards */}
      <div className="flex flex-col space-y-6">
        {/* Basic Information */}
        <div className="w-full">
          <EmployeeBasicInfoCard employee={employeeResult} />
        </div>

        {/* Two-column layout for the remaining cards */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {/* Address */}
            <EmployeeAddressCard address={employeeDetails?.address} />

            {/* Emergency Contact */}
            <EmployeeEmergencyContactCard
              emergencyContact={employeeDetails?.emergency_contact}
            />
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-6">
            {/* Banking */}
            <EmployeeBankingInfoCard
              bankingInfo={employeeDetails?.banking_info}
            />

            {/* Additional Info */}
            <EmployeeAdditionalInfoCard
              additionalInfo={employeeDetails?.additional_info}
            />
          </div>
        </div>

        {/* Employment Details - Full Width */}
        <div className="w-full">
          <div className="dark:bg-[#101010] bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Employment Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                  Qualifications
                </label>
                <p className="text-gray-900 dark:text-gray-500">
                  {employeeResult.qualifications || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                  Employment Status
                </label>
                <p className="text-gray-900 dark:text-gray-500 capitalize">
                  {employeeResult.status}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                  Hire Date
                </label>
                <p className="text-gray-900 dark:text-gray-500">
                  {employeeResult.hire_date
                    ? new Date(employeeResult.hire_date).toLocaleDateString()
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
