import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BankingInfo {
  bank_name?: string;
  account_number?: string;
  routing_number?: string;
  account_type?: string;
}

interface EmployeeBankingInfoCardProps {
  bankingInfo?: BankingInfo;
}

export default function EmployeeBankingInfoCard({
  bankingInfo,
}: EmployeeBankingInfoCardProps) {
  if (!bankingInfo) {
    return (
      <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
        <CardHeader className="bg-purple-50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold">
            Banking Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500 italic">
            No banking information available
          </p>
        </CardContent>
      </Card>
    );
  }

  const maskedAccountNumber = bankingInfo.account_number
    ? `${bankingInfo.account_number.slice(0, 4)}****${bankingInfo.account_number.slice(-4)}`
    : "Not specified";

  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-purple-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Banking Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Bank Name
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {bankingInfo.bank_name || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Account Number
            </label>
            <p className="text-gray-900 dark:text-gray-500 font-mono">{maskedAccountNumber}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Routing Number
            </label>
            <p className="text-gray-900 dark:text-gray-500">
              {bankingInfo.routing_number || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Account Type
            </label>
            <p className="text-gray-900 dark:text-gray-500 capitalize">
              {bankingInfo.account_type || "Not specified"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
