import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@/types";

interface EmployeeBasicInfoCardProps {
  employee: Employee;
}

export default function EmployeeBasicInfoCard({
  employee,
}: EmployeeBasicInfoCardProps) {
  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-blue-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Full Name
            </label>
            <p className="text-gray-900 dark:text-gray-500 font-medium">
              {employee.first_name} {employee.last_name}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Employment Number
            </label>
            <p className="text-gray-900 dark:text-gray-500 ">{employee.employment_number}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600  dark:text-gray-50">Gender</label>
            <p className="text-gray-900 dark:text-gray-500  capitalize">{employee.gender}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Date of Birth
            </label>
            <p className="text-gray-900 dark:text-gray-500 ">
              {employee.date_of_birth
                ? new Date(employee.date_of_birth).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Email</label>
            <p className="text-gray-900 dark:text-gray-500  break-words">{employee.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Phone</label>
            <p className="text-gray-900 dark:text-gray-500 ">{employee.phone}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
              Nationality
            </label>
            <p className="text-gray-900 dark:text-gray-500 ">
              {employee.nationality || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-50">Salary</label>
            <p className="text-gray-900 dark:text-gray-500 ">
              {employee.salary
                ? `$${employee.salary.toLocaleString()}`
                : "Not specified"}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-50">
            Physical Address
          </label>
          <p className="text-gray-900 dark:text-gray-500 ">
            {employee.address || "Not specified"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
