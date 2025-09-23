"use client";

import React, { useEffect, useState } from "react";
import { LeaveRequest, LeaveWithEmployee, Employee } from "@/types";
import LeaveList from "@/components/leaves/LeavesList";
import { getAllLeaveRequests } from "@/actions/leaves.actions";
import { getEmployeeById } from "@/actions/employee.actions";

const PendingLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const allLeaves: LeaveRequest[] = await getAllLeaveRequests();

        // Filter only pending leaves
        const pendingLeaves = allLeaves.filter(
          (leave) => leave.status.toLowerCase() === "pending"
        );

        // Transform to LeaveWithEmployee[]
        const leavesWithDetails: LeaveWithEmployee[] = await Promise.all(
          pendingLeaves.map(async (leave) => {
            let employee: Employee | null = null;

            if (leave.employeeId && typeof leave.employeeId !== "string") {
              employee = leave.employeeId;
            } else if (leave.employeeId) {
              employee = await getEmployeeById(leave.employeeId as string);
            }

            return {
              ...leave,
              employeeId: employee!, // full Employee object
              employeeDetails: {
                name: employee
                  ? `${employee.first_name} ${employee.last_name}`.trim()
                  : "Unknown Employee",
                email: employee?.email || "Not available",
                avatar: employee?.image || undefined,
                employment_number: employee?.employment_number,
                phone: employee?.phone,
              },
            } as LeaveWithEmployee;
          })
        );

        setLeaves(leavesWithDetails);
      } catch (error) {
        console.error("Failed to fetch pending leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingLeaves();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Leave Requests</h2>
      {leaves.length === 0 ? (
        <p className="text-gray-500">No pending leave requests found.</p>
      ) : (
        <LeaveList
          leaves={leaves}
          isAdmin={true}
          processing={null}
          onApprove={(id) => console.log("Approve", id)}
          onReject={(id) => console.log("Reject", id)}
        />
      )}
    </div>
  );
};

export default PendingLeaves;
