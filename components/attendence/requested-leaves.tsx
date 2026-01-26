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
import { LeaveRequest, LeaveWithEmployee, Employee } from "@/types";
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

/**
 * Converts raw leave requests into LeaveWithEmployee
 */
export const processLeaveRequests = async (
  leaves: LeaveRequest[]
): Promise<LeaveWithEmployee[]> => {
  const processed = await Promise.all(
    leaves.map(async (leave) => {
      let employee: Employee | null = null;

      if (leave.employeeId && typeof leave.employeeId !== "string") {
        employee = leave.employeeId as Employee;
      } else if (leave.employeeId) {
        // fetch employee by ID
        employee = await getEmployeeById(leave.employeeId as string);
      }

      return {
        ...leave,
        employeeId: employee!, // ✅ full Employee object
        employeeDetails: {
          name: employee
            ? `${employee.first_name} ${employee.last_name}`.trim()
            : "Unknown Employee",
          email: employee?.email || "Not available",
          avatar: employee?.image || undefined,
          employment_number: employee?.employment_number,
          phone: employee?.phone,
        },
      } as unknown as LeaveWithEmployee;
    })
  );

  return processed;
};

const RequestedLeaves: React.FC<RequestedLeavesProps> = ({
  showOnlyPending = false,
  employeeId,
}) => {
  const [allLeaves, setAllLeaves] = useState<LeaveWithEmployee[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveWithEmployee[]>([]);
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

  // Fetch leaves
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
          const leaveEmpId =
            typeof leave.employeeId === "string"
              ? leave.employeeId
              : (leave.employeeId as Employee)?._id;
          return leaveEmpId === employeeId;
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

  useEffect(() => {
    fetchData();
  }, [showOnlyPending, employeeId, isAdmin]);

  // Filters
  useEffect(() => {
    let filtered = allLeaves;

    if (searchTerm) {
      filtered = filtered.filter((leave) => {
        const name = leave.employeeDetails.first_name || "";
        const email = leave.employeeDetails.email || "";
        const reason = leave.reason || "";

        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Approve
  const handleApprove = async (leaveId: string) => {
    if (!isAdmin || !user?.id) {
      console.error("Unauthorized: User must be admin");
      return;
    }

    // Prevent multiple simultaneous actions
    if (processing) {
      console.log("Another action is in progress, please wait");
      return;
    }

    try {
      console.log("Starting approval process for leave:", leaveId);
      setProcessing(`approve-${leaveId}`);

      const result = await approveLeaveRequest(leaveId, user.id);

      if (result.success) {
        console.log("Leave approved successfully");
        await fetchData();
      } else {
        console.error("Failed to approve leave:", result.error);
        alert("Failed to approve leave request. Please try again.");
      }
    } catch (error) {
      console.error("Failed to approve leave:", error);
      alert("An error occurred while approving the leave request.");
    } finally {
      setProcessing(null);
    }
  };

  // Reject
  const openRejectDialog = (leaveId: string) => {
    // Prevent opening dialog if another action is in progress
    if (processing) {
      console.log("Another action is in progress, please wait");
      return;
    }

    console.log("Opening reject dialog for leave:", leaveId);
    setSelectedLeaveId(leaveId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!isAdmin || !user?.id || !selectedLeaveId) {
      console.error("Cannot reject: missing admin status, user ID, or leave ID");
      return;
    }

    try {
      console.log("Starting rejection process for leave:", selectedLeaveId);
      setProcessing(`reject-${selectedLeaveId}`);

      const result = await rejectLeaveRequest(
        selectedLeaveId,
        user.id,
        rejectionReason
      );

      if (result.success) {
        console.log("Leave rejected successfully");
        await fetchData();
        setRejectDialogOpen(false);
        setSelectedLeaveId(null);
        setRejectionReason("");
      } else {
        console.error("Failed to reject leave:", result.error);
        alert("Failed to reject leave request. Please try again.");
      }
    } catch (error) {
      console.error("Failed to reject leave:", error);
      alert("An error occurred while rejecting the leave request.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <LoadingState />;

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