import React from "react";
import { LeaveWithEmployee } from "@/types";
import LeaveCard from "./LeaveCard";

interface LeaveListProps {
  leaves: LeaveWithEmployee[];
  isAdmin: boolean;
  processing: string | null;
  onApprove: (leaveId: string) => void;
  onReject: (leaveId: string) => void;
  onMultiSectionApprove?: (leave: LeaveWithEmployee, section?: "partB" | "partC" | "partD") => void;

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
