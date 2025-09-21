import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Address {
  country?: string;
  city_state?: string;
  postal_code?: string;
  street_address?: string;
  tax_id?: string;
}

interface EmployeeAddressCardProps {
  address?: Address;
}

export default function EmployeeAddressCard({
  address,
}: EmployeeAddressCardProps) {
  if (!address) {
    return (
      <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
        <CardHeader className="bg-green-50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold">
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500 italic">
            No address information available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-green-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Street Address
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {address.street_address || "Not specified"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                City/State
              </label>
              <p className="text-gray-900 dark:text-gray-500">
                {address.city_state || "Not specified"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
                Postal Code
              </label>
              <p className="text-gray-900 dark:text-gray-500">
                {address.postal_code || "Not specified"}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Country</label>
            <p className="text-gray-900 dark:text-gray-500">
              {address.country || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Tax ID</label>
            <p className="text-gray-900 dark:text-gray-500">{address.tax_id || "Not specified"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
