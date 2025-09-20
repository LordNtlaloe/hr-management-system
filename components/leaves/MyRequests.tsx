// components/leaves/MyRequests.tsx
"use client";

import React, { useEffect, useState } from "react";
import { LeaveRequest } from "@/types";
import LeaveList from "@/components/leaves/LeavesList";
import { getEmployeeLeaveRequests } from "@/actions/leaves.actions";
import { useCurrentUser } from "@/hooks/use-current-user";

const MyRequests: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useCurrentUser();

  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const employeeLeaves = await getEmployeeLeaveRequests(user.id);
        setLeaves(employeeLeaves);
      } catch (error) {
        console.error("Error fetching my leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Please log in to view your requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Leave Requests</h2>
        <span className="text-sm text-gray-500">
          Total: {leaves.length} request{leaves.length !== 1 ? "s" : ""}
        </span>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-gray-500">
            You haven't submitted any leave requests yet.
          </p>
        </div>
      ) : (
        <LeaveList
          leaves={leaves}
          isAdmin={false}
          processing={null}
          onApprove={() => {}} // Not needed for employee view
          onReject={() => {}} // Not needed for employee view
        />
      )}
    </div>
  );
};

export default MyRequests;
