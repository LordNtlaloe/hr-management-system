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
  getPendingLeaveRequests,
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
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // 🔹 Fetch employeeId for current user
  useEffect(() => {
    const fetchEmployee = async () => {
      if (user?.id) {
        try {
          const employee = await getEmployeeByUserId(user.id);
          if (employee && employee._id) {
            setEmployeeId(employee._id);
          }
        } catch (err) {
          console.error("Failed to fetch employee for user", err);
        }
      }
    };
    fetchEmployee();
  }, [user]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const allLeavesData: LeaveRequest[] = await getAllLeaveRequests();

      const leavesWithEmployees: LeaveWithEmployee[] = await Promise.all(
        allLeavesData.map(async (leave) => {
          let employeeData: Employee | null = null;
          let empId: string = "";

          if (
            leave.employeeId &&
            typeof leave.employeeId === "object" &&
            leave.employeeId._id
          ) {
            employeeData = leave.employeeId as Employee;
            empId = employeeData._id;
          } else if (leave.employeeId) {
            try {
              empId =
                typeof leave.employeeId === "string"
                  ? leave.employeeId
                  : leave.employeeId.toString();

              employeeData = await getEmployeeById(empId);
            } catch (error) {
              console.warn(
                `Failed to fetch employee data for ID: ${empId}`,
                error
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

      setAllLeaves(leavesWithEmployees);
      setPendingLeaves(
        leavesWithEmployees.filter((l) => l.status === "pending")
      );
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

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
        await fetchLeaves();
      } else {
        toast.error(result.error || "Failed to approve leave request");
      }
    } catch (error) {
      console.error("Error approving leave:", error);
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
        await fetchLeaves();
      } else {
        toast.error(result.error || "Failed to reject leave request");
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast.error("Failed to reject leave request");
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  if (!user || !role || loading || (role === "Employee" && !employeeId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 🔹 Employee view
  if (role === "Employee") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Leaves
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your leave requests and view your leave calendar
            </p>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Calendar employeeId={employeeId!} /> {/* ✅ fixed */}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Leave Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and manage employee leave requests
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Pending Requests ({pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="all-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Requests ({allLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Team Calendar
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
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
            <div className="text-center py-8">
              <p className="text-gray-500">No pending leave requests</p>
            </div>
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
            <div className="text-center py-8">
              <p className="text-gray-500">No leave requests found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Calendar employeeId={employeeId!} /> {/* show all employees */}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Charts and analytics coming soon 🚀</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeavesPage;
