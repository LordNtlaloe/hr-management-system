"use client";

import { useState, useTransition, useEffect } from "react";
import { createPerformance } from "@/actions/performance.actions";
import { getAllEmployees } from "@/actions/employee.actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Employee } from "@/types";

export default function PerformanceForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [score, setScore] = useState<number>(0);
  const [review, setReview] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchEmployees() {
      const data = await getAllEmployees();
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Failed to fetch employees:", data.error);
        setEmployees([]); // fallback to empty array
      }
    }
    fetchEmployees();
  }, []);

  const handleSubmit = () => {
    if (!employeeId || !score) return;
    startTransition(async () => {
      await createPerformance(employeeId, score, review);
      setEmployeeId("");
      setScore(0);
      setReview("");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-5 rounded-xl border bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold text-center">
          Add Performance Review
        </h2>

        {/* Employee Select */}
        <div className="space-y-2">
          <Label htmlFor="employee">Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.first_name}&nbsp;{emp.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Score Input */}
        <div className="space-y-2">
          <Label htmlFor="score">Score</Label>
          <Input
            id="score"
            type="number"
            placeholder="Enter score"
            value={score || ""}
            onChange={(e) => setScore(Number(e.target.value))}
          />
        </div>

        {/* Review Textarea */}
        <div className="space-y-2">
          <Label htmlFor="review">Review</Label>
          <Textarea
            id="review"
            placeholder="Write performance review..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving..." : "Save Review"}
        </Button>
      </div>
    </div>
  );
}
