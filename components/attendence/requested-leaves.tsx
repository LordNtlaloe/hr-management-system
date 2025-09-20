"use client";

import React, { useEffect, useState } from "react";
import {
  getPendingLeaveRequests,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/actions/leaves.actions";
import { getEmployeeById } from "@/actions/employee.actions";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LeaveRequest, Employee } from "@/types";
import { processLeaveRequests, getEmployeeId, getEmployeeEmail, getEmployeeName } from "@/components/leaves/LeaveUtils";
import LeaveFilters from "@/components/leaves/LeavesFilter";
import LeaveList from "@/components/leaves/LeavesList";
import RejectDialog from "@/components/leaves/RejectDialog";
import LoadingState from "@/components/leaves/LoadingState";
import EmptyState from "@/components/leaves/EmptyState";
import { Badge } from "lucide-react";

interface RequestedLeavesProps {
  showOnlyPending?: boolean;
  employeeId?: string;
}

const RequestedLeaves: React.FC<RequestedLeavesProps> = ({
  showOnlyPending = false,
  employeeId,
}) => {
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { role } = useCurrentRole();
  const user = useCurrentUser();

  const isAdmin = role === "Admin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data: LeaveRequest[] = [];

        if (showOnlyPending) {
          const response = await getPendingLeaveRequests();
          data = Array.isArray(response) ? response : [];
        } else {
          const response = await getAllLeaveRequests();
          data = Array.isArray(response) ? response : [];
        }

        if (employeeId) {
          data = data.filter((leave) => {
            const leaveEmployeeId = getEmployeeId(leave.employeeId);
            return leaveEmployeeId === employeeId;
          });
        }

        const processedData = await processLeaveRequests(data);
        setAllLeaves(processedData);
        setFilteredLeaves(processedData);
      } catch (error) {
        console.error("Failed to fetch leave requests:", error);
        setAllLeaves([]);
        setFilteredLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showOnlyPending, employeeId, isAdmin]);

  useEffect(() => {
    let filtered = allLeaves;

    if (searchTerm) {
      filtered = filtered.filter((leave) => {
        const employeeName = getEmployeeName(leave.employeeId);
        const employeeEmail = getEmployeeEmail(leave.employeeId);
        const reason = leave.reason || "";

        return (
          employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((leave) => leave.status === statusFilter);
    }

    if (leaveTypeFilter !== "all") {
      filtered = filtered.filter(
        (leave) => leave.leaveType === leaveTypeFilter
      );
    }

    setFilteredLeaves(filtered);
  }, [allLeaves, searchTerm, statusFilter, leaveTypeFilter]);

  const handleApprove = async (leaveId: string) => {
    if (!isAdmin || !user?.id) return;

    try {
      setProcessing(`approve-${leaveId}`);
      const result = await approveLeaveRequest(leaveId, user.id);

      if (result.success) {
        await refreshData();
      }
    } catch (error) {
      console.error("Failed to approve leave:", error);
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!isAdmin || !user?.id || !selectedLeaveId) return;

    try {
      setProcessing(`reject-${selectedLeaveId}`);
      const result = await rejectLeaveRequest(
        selectedLeaveId,
        user.id,
        rejectionReason
      );

      if (result.success) {
        await refreshData();
        setRejectDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to reject leave:", error);
    } finally {
      setProcessing(null);
    }
  };

  const refreshData = async () => {
    let data: LeaveRequest[] = [];

    if (showOnlyPending) {
      const response = await getPendingLeaveRequests();
      data = Array.isArray(response) ? response : [];
    } else {
      const response = await getAllLeaveRequests();
      data = Array.isArray(response) ? response : [];
    }

    if (employeeId) {
      data = data.filter((leave) => {
        const leaveEmployeeId = getEmployeeId(leave.employeeId);
        return leaveEmployeeId === employeeId;
      });
    }

    const processedData = await processLeaveRequests(data);
    setAllLeaves(processedData);
    setFilteredLeaves(processedData);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onReject={handleReject}
        processing={processing}
        selectedLeaveId={selectedLeaveId}
      />

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {showOnlyPending ? "Pending Leave Requests" : "All Leave Requests"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {employeeId
              ? "Employee leave request history"
              : isAdmin
                ? "Manage all employee leave requests"
                : "Your leave request history"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="text-sm">
            {filteredLeaves.length} request
            {filteredLeaves.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <LeaveFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        leaveTypeFilter={leaveTypeFilter}
        setLeaveTypeFilter={setLeaveTypeFilter}
      />

      {filteredLeaves.length === 0 ? (
        <EmptyState
          hasFilters={
            !!searchTerm || statusFilter !== "all" || leaveTypeFilter !== "all"
          }
          showOnlyPending={showOnlyPending}
        />
      ) : (
        <LeaveList
          leaves={filteredLeaves}
          isAdmin={isAdmin}
          processing={processing}
          onApprove={handleApprove}
          onReject={openRejectDialog}
        />
      )}
    </div>
  );
};

export default RequestedLeaves;
