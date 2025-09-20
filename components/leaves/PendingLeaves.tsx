"use client";

import React, { useEffect, useState } from "react";
import { LeaveRequest } from "@/types";
import LeaveList from "@/components/leaves/LeavesList";
import { getAllLeaveRequests } from "@/actions/leaves.actions";

const PendingLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      const allLeaves = await getAllLeaveRequests();
      console.log("All leaves:", allLeaves); // Debug: check all leaves

      const pendingLeaves = allLeaves.filter(
        (leave: { status: string }) => leave.status.toLowerCase() === "pending"
      );

      console.log("Pending leaves:", pendingLeaves); // Debug: check filtered results
      setLeaves(pendingLeaves);
      setLoading(false);
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
