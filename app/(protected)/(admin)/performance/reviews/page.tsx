import { getAllPerformances } from "@/actions/performance.actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default async function PerformanceReports() {
  const performances = await getAllPerformances();

  // Check if performances is an array
  if (!Array.isArray(performances)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Performance Reports</h1>
        <p className="text-red-500">
          Failed to load performances: {performances.error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold mb-4">Performance Reports</h1>
        <Button className="cursor-pointer">
            <Link href="/performance/reviews/create">Add Employee Performance Review</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performances.map((p) => (
              <TableRow key={p._id.toString()}>
                <TableCell>
                  {p.employee?.first_name} {p.employee?.last_name}
                </TableCell>
                <TableCell>{p.section?.section_name ?? "—"}</TableCell>
                <TableCell>{p.score}</TableCell>
                <TableCell>{p.review}</TableCell>
                <TableCell>
                  {new Date(p.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
