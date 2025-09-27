// components/dashboard/employees/LegalInfoCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LegalInfoFormValues } from "@/schemas";

interface Props {
  legal: LegalInfoFormValues;
}

export default function LegalInfoCard({ legal }: Props) {
  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-blue-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">Legal Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Father's Name</label>
          <p className="text-gray-900 dark:text-gray-300">{legal.father_name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Father Deceased</label>
          <p className="text-gray-900 dark:text-gray-300">{legal.father_deceased ? "Yes" : "No"}</p>
        </div>
        {!legal.father_deceased && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Father Place of Birth</label>
              <p className="text-gray-900 dark:text-gray-300">{legal.father_place_of_birth || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Father Occupation</label>
              <p className="text-gray-900 dark:text-gray-300">{legal.father_occupation || "Not specified"}</p>
            </div>
          </>
        )}
        <div>
          <label className="text-sm font-medium text-gray-600">Marital Status</label>
          <p className="text-gray-900 dark:text-gray-300 capitalize">{legal.marital_status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Spouse Nationality</label>
          <p className="text-gray-900 dark:text-gray-300">{legal.spouse_nationality || "Not specified"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Criminal Record</label>
          <p className="text-gray-900 dark:text-gray-300">{legal.has_criminal_record ? "Yes" : "No"}</p>
        </div>
        {legal.has_criminal_record && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Offense</label>
              <p className="text-gray-900 dark:text-gray-300">{legal.criminal_record?.offense}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Place Committed</label>
              <p className="text-gray-900 dark:text-gray-300">{legal.criminal_record?.place_committed}</p>
            </div>
          </>
        )}
        <div>
          <label className="text-sm font-medium text-gray-600">Dismissed From Work</label>
          <p className="text-gray-900 dark:text-gray-300">{legal.dismissed_from_work ? "Yes" : "No"}</p>
        </div>
        {legal.dismissed_from_work && (
          <div>
            <label className="text-sm font-medium text-gray-600">Dismissal Reason</label>
            <p className="text-gray-900 dark:text-gray-300">{legal.dismissal_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
