// components/dashboard/employees/EducationHistoryCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EducationEntryFormValues } from "@/schemas";

interface Props {
  education: EducationEntryFormValues[];
}

export default function EducationHistoryCard({ education }: Props) {
  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-blue-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">
          Education History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {education.map((entry, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-4">
            <p className="font-semibold">{entry.school_name}</p>
            <p className="text-sm text-gray-600">
              {entry.date_of_entry} - {entry.date_of_leaving}
            </p>
            <p className="text-gray-800 dark:text-gray-300">
              Qualification: {entry.qualification}
            </p>
            <p className="text-sm text-gray-600">
              {entry.qualification_start_date} -{" "}
              {entry.qualification_completion_date}
            </p>
            {entry.additional_skills && entry.additional_skills.length > 0 && (
              <p className="text-sm text-gray-600">
                Skills: {entry.additional_skills.join(", ")}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
