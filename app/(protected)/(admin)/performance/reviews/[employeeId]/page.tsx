import { getPerformanceByEmployee } from "@/actions/performance.actions";

// Define Props type - params is now a Promise
type Props = {
  params: Promise<{
    employeeId: string; // must match folder name [employeeId]
  }>;
};

export default async function EmployeePerformancePage({ params }: Props) {
  // Await the params Promise
  const { employeeId } = await params;
  const performances = await getPerformanceByEmployee(employeeId);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Employee Performance History</h2>
      {performances.length === 0 ? (
        <p className="text-gray-500">No performance records found.</p>
      ) : (
        <ul className="space-y-3">
          {performances.map((p: any) => (
            <li
              key={p._id.toString()}
              className="border rounded-md p-4 bg-white shadow-sm"
            >
              <p className="font-semibold">Score: {p.score}</p>
              <p>{p.review}</p>
              <p className="text-sm text-gray-500">
                {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}