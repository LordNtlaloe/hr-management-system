// components/EmployeeDetailsCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmployeeDetailsFormValues } from "@/schemas";
import ProfilePicture from "./ProfilePicture";

interface Props {
  details: EmployeeDetailsFormValues;
  employeeId: string;
  profilePicture?: string | null;
}

export default function EmployeeDetailsCard({
  details,
  employeeId,
  profilePicture,
}: Props) {
  // Add validation to ensure employeeId is provided
  if (!employeeId) {
    console.error("EmployeeDetailsCard: employeeId is undefined or null");
    return (
      <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
        <CardContent className="p-6">
          <p className="text-red-500 text-center">
            Error: Employee ID is missing
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log("EmployeeDetailsCard - Received employeeId:", employeeId);

  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-blue-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold text-white">
          Employee Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex flex-col md:flex-row gap-6">
        {/* Profile Picture Left */}
        <div className="flex-shrink-0">
          <ProfilePicture
            employeeId={employeeId}
            currentPhotoUrl={profilePicture}
          />
        </div>

        {/* Employee Details Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Surname
            </label>
            <p className="text-gray-900 dark:text-gray-300">
              {details.surname}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Other Names
            </label>
            <p className="text-gray-900 dark:text-gray-300">
              {details.other_names}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Address
            </label>
            <p className="text-gray-900 dark:text-gray-300">
              {details.current_address}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Date of Birth
            </label>
            <p className="text-gray-900 dark:text-gray-300">
              {details.date_of_birth}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Age
            </label>
            <p className="text-gray-900 dark:text-gray-300">{details.age}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Gender
            </label>
            <p className="text-gray-900 dark:text-gray-300 capitalize">
              {details.gender}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Place of Birth
            </label>
            <p className="text-gray-900 dark:text-gray-300">
              {details.place_of_birth}
            </p>
          </div>
          {details.is_citizen ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chief Name
                </label>
                <p className="text-gray-900 dark:text-gray-300">
                  {details.citizen_info?.chief_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  District
                </label>
                <p className="text-gray-900 dark:text-gray-300">
                  {details.citizen_info?.district}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tax ID
                </label>
                <p className="text-gray-900 dark:text-gray-300">
                  {details.citizen_info?.tax_id}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Certificate Number
                </label>
                <p className="text-gray-900 dark:text-gray-300">
                  {details.non_citizen_info?.certificate_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date of Issue
                </label>
                <p className="text-gray-900 dark:text-gray-300">
                  {details.non_citizen_info?.date_of_issue}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Present Nationality
                </label>
                <p className="text-gray-900 dark:text-gray-300">
                  {details.non_citizen_info?.present_nationality}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
