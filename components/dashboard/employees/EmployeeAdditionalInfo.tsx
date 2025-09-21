import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdditionalInfo {
  marital_status?: string;
  spouse_name?: string;
  children_count?: number;
  next_of_kin?: string;
  medical_conditions?: string;
  allergies?: string;
  notes?: string;
}

interface EmployeeAdditionalInfoCardProps {
  additionalInfo?: AdditionalInfo;
}

export default function EmployeeAdditionalInfoCard({
  additionalInfo,
}: EmployeeAdditionalInfoCardProps) {
  if (!additionalInfo) {
    return (
      <Card className="dark:bg-[#010101] bg-white rounded-lg shadow-md">
        <CardHeader className="bg-pink-50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold">
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500 italic">
            No additional information available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-pink-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Additional Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Marital Status
            </label>
            <p className="text-gray-900 dark:text-gray-500 capitalize">
              {additionalInfo.marital_status || "Not specified"}
            </p>
          </div>

          {additionalInfo.marital_status === "married" && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                Spouse Name
              </label>
              <p className="text-gray-900 dark:text-gray-500">
                {additionalInfo.spouse_name || "Not specified"}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Number of Children
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {additionalInfo.children_count || 0}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Next of Kin
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {additionalInfo.next_of_kin || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Medical Conditions
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {additionalInfo.medical_conditions || "None reported"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Allergies
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {additionalInfo.allergies || "None reported"}
            </p>
          </div>

          {additionalInfo.notes && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                Additional Notes
              </label>
              <p className="text-gray-900 dark:text-gray-500">{additionalInfo.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
