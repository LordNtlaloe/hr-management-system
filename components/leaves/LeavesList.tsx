import React from "react";
import { LeaveRequest } from "@/types";
import LeaveCard from "@/components/leaves/LeaveCard";

interface LeaveListProps {
  leaves: LeaveRequest[];
  isAdmin: boolean;
  processing: string | null;
  onApprove: (leaveId: string) => void;
  onReject: (leaveId: string) => void;
}

const LeaveList: React.FC<LeaveListProps> = ({
  leaves,
  isAdmin,
  processing,
  onApprove,
  onReject,
}) => {
  return (
    <div className="space-y-4">
      {leaves.map((leave) => (
        <LeaveCard
          key={leave._id}
          leave={leave}
          isAdmin={isAdmin}
          processing={processing}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default LeaveList;
