// components/dashboard/employees/ReferencesCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReferenceEntryFormValues } from "@/schemas";

interface Props {
  references: ReferenceEntryFormValues[];
}

export default function ReferencesCard({ references }: Props) {
  return (
    <Card className="dark:bg-[#101010] bg-white rounded-lg shadow-md">
      <CardHeader className="bg-blue-500 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">References</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {references.map((ref, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-4">
            <p className="font-semibold">{ref.name}</p>
            <p className="text-sm text-gray-600">{ref.address}</p>
            <p className="text-gray-800 dark:text-gray-300">
              Occupation: {ref.occupation}
            </p>
            <p className="text-sm text-gray-600">Known: {ref.known_duration}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
