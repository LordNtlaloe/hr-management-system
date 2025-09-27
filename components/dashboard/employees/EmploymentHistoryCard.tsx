// components/dashboard/employees/EmploymentHistoryCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmploymentEntryFormValues } from "@/schemas";

interface Props {
  employment: EmploymentEntryFormValues[];
}

export default function EmploymentHistoryCard({ employment }: Props) {
  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-blue-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Employment History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {employment.map((job, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-4">
            <p className="font-semibold">{job.employer_name}</p>
            <p className="text-sm text-gray-600">{job.employer_address}</p>
            <p className="text-gray-800 dark:text-gray-300">
              Position: {job.position}
            </p>
            <p className="text-sm text-gray-600">
              {job.employment_start} - {job.employment_end}
            </p>
            <p className="text-gray-800 dark:text-gray-300">
              Duties: {job.duties}
            </p>
            <p className="text-gray-800 dark:text-gray-300">
              Salary: ${job.salary.toLocaleString()}
            </p>
            {job.reason_for_leaving && <p>Reason: {job.reason_for_leaving}</p>}
            {job.notice_period && <p>Notice Period: {job.notice_period}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
