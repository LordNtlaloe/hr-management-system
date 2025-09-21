import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface EmployeeEmergencyContactCardProps {
  emergencyContact?: EmergencyContact;
}

export default function EmployeeEmergencyContactCard({
  emergencyContact,
}: EmployeeEmergencyContactCardProps) {
  if (!emergencyContact) {
    return (
      <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
        <CardHeader className="bg-yellow-50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold">
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500 italic">
            No emergency contact information available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-yellow-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Emergency Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Contact Name
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {emergencyContact.name || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Relationship
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {emergencyContact.relationship || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Phone</label>
            <p className="text-gray-900 dark:text-gray-500">
              {emergencyContact.phone || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Email</label>
            <p className="text-gray-900 dark:text-gray-500 break-words">
              {emergencyContact.email || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Contact Address
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {emergencyContact.address || "Not specified"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
