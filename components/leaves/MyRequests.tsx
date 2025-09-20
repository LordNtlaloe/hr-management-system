"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LeaveRequest } from "@/types";

const MyRequests: React.FC = () => {
  const user = useCurrentUser();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyLeaves = async () => {
      setLoading(true);

      // Use type assertion to access employee_id
      const employeeId = (user as any)?.employee_id;
      if (!employeeId) {
        setLeaves([]);
        setLoading(false);
        return;
      }

      try {
        const allLeaves: LeaveRequest[] = await fetch(
          `/api/leaves?employeeId=${employeeId}`
        ).then((res) => res.json());

        setLeaves(allLeaves);
      } catch (err) {
        console.error("Failed to fetch leaves", err);
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyLeaves();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return <p className="text-gray-500">No leave requests found.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Leave Requests</h2>
      <div className="space-y-3">
        {leaves.map((leave) => (
          <div
            key={leave._id}
            className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800"
          >
            <p>
              <strong>Type:</strong> {leave.leaveType}
            </p>
            <p>
              <strong>Start:</strong>{" "}
              {new Date(leave.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>End:</strong>{" "}
              {new Date(leave.endDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Days:</strong> {leave.days}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`${
                  leave.status === "pending"
                    ? "text-yellow-500"
                    : leave.status === "approved"
                      ? "text-green-500"
                      : "text-red-500"
                } font-semibold`}
              >
                {leave.status}
              </span>
            </p>
            {leave.reason && (
              <p>
                <strong>Reason:</strong> {leave.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRequests;
