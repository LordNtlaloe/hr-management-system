"use client";

import React, { useEffect, useState } from "react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ClipboardList, Users, BarChart3 } from "lucide-react";
import LeaveList from "@/components/leaves/LeavesList";
import Calendar from "@/components/calendar/Calendar";
import MyRequests from "@/components/leaves/MyRequests";
import { LeaveRequest, LeaveWithEmployee, Employee } from "@/types";
import {
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/actions/leaves.actions";
import {
  getEmployeeById,
  getEmployeeByUserId,
} from "@/actions/employee.actions";
import { toast } from "sonner";

const LeavesPage: React.FC = () => {
  const { role } = useCurrentRole();
  const user = useCurrentUser();

  const [allLeaves, setAllLeaves] = useState<LeaveWithEmployee[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);

  // 🔹 Fetch employeeId for current user (Employee view)
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.id || role !== "Employee") {
        setLoading(false);
        return;
      }

      try {
        const employee = await getEmployeeByUserId(user.id);
        if (employee?._id) {
          setEmployeeId(employee._id);
        } else {
          toast.error("Employee profile not found");
        }
      } catch (err) {
        console.error("Failed to fetch employee:", err);
        toast.error("Failed to load employee profile");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [user, role]);

  // 🔹 Fetch all leave requests (Admin/Manager) or Employee's own
  const fetchLeaves = async (targetEmployeeId?: string) => {
    setLoading(true);
    try {
      const allLeavesData: LeaveRequest[] = await getAllLeaveRequests();

      const leavesWithEmployees: LeaveWithEmployee[] = await Promise.all(
        allLeavesData.map(async (leave) => {
          let employeeData: Employee | null = null;
          let empId = "";

          if (
            leave.employeeId &&
            typeof leave.employeeId === "object" &&
            leave.employeeId._id
          ) {
            employeeData = leave.employeeId as Employee;
            empId = employeeData._id;
          } else if (leave.employeeId) {
            empId =
              typeof leave.employeeId === "string"
                ? leave.employeeId
                : leave.employeeId.toString();
            try {
              employeeData = await getEmployeeById(empId);
            } catch (err) {
              console.warn(
                `Failed to fetch employee data for ID: ${empId}`,
                err
              );
            }
          }

          const employeeDetails = {
            name: employeeData
              ? `${employeeData.first_name} ${employeeData.last_name}`.trim()
              : "Unknown Employee",
            email: employeeData?.email || "Not available",
            avatar: employeeData?.image,
            employment_number: employeeData?.employment_number || "N/A",
            phone: employeeData?.phone || "Not available",
          };

          return { ...leave, employeeDetails };
        })
      );

      leavesWithEmployees.sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
      );

      // Filter for Employee view
      const filteredLeaves = targetEmployeeId
        ? leavesWithEmployees.filter(
            (l) =>
              (typeof l.employeeId === "string" &&
                l.employeeId === targetEmployeeId) ||
              (typeof l.employeeId === "object" &&
                l.employeeId._id === targetEmployeeId)
          )
        : leavesWithEmployees;

      setAllLeaves(filteredLeaves);
      setPendingLeaves(filteredLeaves.filter((l) => l.status === "pending"));
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaves after employeeId is resolved
  useEffect(() => {
    if (role === "Employee" && employeeId) {
      fetchLeaves(employeeId);
    } else if (role !== "Employee") {
      fetchLeaves();
    }
  }, [employeeId, role]);

  const handleApprove = async (leaveId: string) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }
    setProcessing(leaveId);
    try {
      const result = await approveLeaveRequest(leaveId, user.id);
      if (result.success) {
        toast.success("Leave request approved successfully");
        fetchLeaves(employeeId);
      } else {
        toast.error(result.error || "Failed to approve leave request");
      }
    } catch (err) {
      console.error("Error approving leave:", err);
      toast.error("Failed to approve leave request");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }
    setProcessing(leaveId);
    try {
      const result = await rejectLeaveRequest(
        leaveId,
        user.id,
        "Rejected by admin"
      );
      if (result.success) {
        toast.success("Leave request rejected successfully");
        fetchLeaves(employeeId);
      } else {
        toast.error(result.error || "Failed to reject leave request");
      }
    } catch (err) {
      console.error("Error rejecting leave:", err);
      toast.error("Failed to reject leave request");
    } finally {
      setProcessing(null);
    }
  };

  // 🔹 Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 🔹 Employee view
  if (role === "Employee") {
    if (!employeeId) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
          <p className="text-gray-500">
            Could not find employee profile for this user.
          </p>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Leaves
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your leave requests and view your leave calendar
        </p>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Calendar employeeId={employeeId} />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <MyRequests />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // 🔹 Admin/Manager view
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Leave Management
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Review and manage employee leave requests
      </p>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Pending Requests (
            {pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="all-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> All Requests ({allLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Team Calendar
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingLeaves.length > 0 ? (
            <LeaveList
              leaves={pendingLeaves}
              isAdmin={true}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No pending leave requests
            </p>
          )}
        </TabsContent>

        <TabsContent value="all-requests" className="mt-6">
          {allLeaves.length > 0 ? (
            <LeaveList
              leaves={allLeaves}
              isAdmin={true}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No leave requests found
            </p>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Calendar />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <p className="text-center text-gray-500 py-8">
            Charts and analytics coming soon 🚀
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeavesPage;
