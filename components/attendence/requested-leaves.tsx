"use client";

import React, { useEffect, useState } from "react";
import {
  getPendingLeaveRequests,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/actions/leaves.actions";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  Loader2,
  Mail,
  Filter,
  Search,
  ChevronDown,
  AlertCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface Employee {
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  position?: string;
  section?: string;
}
interface LeaveRequest {
  _id: string;
  employeeId: Employee;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: Employee;
  rejectedBy?: Employee;
  approvedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  approverComments?: string;
  appliedDate: string;
  days: number;
  createdAt: string;
  updatedAt: string;
}

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
  const { role } = useCurrentRole();
  const user = useCurrentUser();

  // Only Admin role should have admin privileges
  const isAdmin = role === "Admin";

  // Helper function to safely get employee name
  const getEmployeeName = (employee: Employee | undefined | null): string => {
    if (!employee) return "Unknown Employee";
    return employee.name || "Unknown Employee";
  };

  // Helper function to safely get employee email
  const getEmployeeEmail = (employee: Employee | undefined | null): string => {
    if (!employee) return "unknown@example.com";
    return employee.email || "unknown@example.com";
  };

  // Helper function to safely get first letter for avatar
  const getEmployeeInitial = (
    employee: Employee | undefined | null
  ): string => {
    const name = getEmployeeName(employee);
    return name.charAt(0).toUpperCase();
  };

  // Debug logging
  useEffect(() => {
    console.log("RequestedLeaves Debug:");
    console.log("Role:", role);
    console.log("User:", user);
    console.log("Is Admin:", isAdmin);
    console.log("Show Only Pending:", showOnlyPending);
    console.log("Employee ID:", employeeId);
  }, [role, user, isAdmin, showOnlyPending, employeeId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data: LeaveRequest[] = [];

        console.log("Fetching data...");

        if (showOnlyPending) {
          console.log("Fetching pending leave requests...");
          const response = await getPendingLeaveRequests();
          console.log("Pending requests response:", response);
          data = Array.isArray(response) ? response : [];
        } else {
          console.log("Fetching all leave requests...");
          const response = await getAllLeaveRequests();
          console.log("All requests response:", response);
          data = Array.isArray(response) ? response : [];
        }

        // Only filter by employee if specified AND if not admin OR if admin but specifically wants to see one employee
        // For admin pages showing all requests, don't pass employeeId
        if (employeeId) {
          console.log("Filtering by employee ID:", employeeId);
          data = data.filter((leave) => {
            // Safe comparison handling both string and object employeeId formats
            const leaveEmployeeId =
              typeof leave.employeeId === "object"
                ? leave.employeeId._id
                : leave.employeeId;
            return leaveEmployeeId === employeeId;
          });
        }

        console.log("Final data:", data);
        setAllLeaves(data);
        setFilteredLeaves(data);
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

  // Filter leaves based on search and filters
  useEffect(() => {
    let filtered = allLeaves;

    // Search filter
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

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((leave) => leave.status === statusFilter);
    }

    // Leave type filter
    if (leaveTypeFilter !== "all") {
      filtered = filtered.filter(
        (leave) => leave.leaveType === leaveTypeFilter
      );
    }

    setFilteredLeaves(filtered);
  }, [allLeaves, searchTerm, statusFilter, leaveTypeFilter]);

  const handleApprove = async (leaveId: string) => {
    if (!isAdmin || !user?.id) {
      console.log("Cannot approve - not admin or no user ID");
      return;
    }

    try {
      setProcessing(`approve-${leaveId}`);
      console.log("Approving leave:", leaveId);
      const result = await approveLeaveRequest(leaveId, user.id);
      console.log("Approve result:", result);

      if (result.success) {
        const updatedLeaves = allLeaves.map((leave) =>
          leave._id === leaveId
            ? {
                ...leave,
                status: "approved" as const,
                approvedBy: {
                  _id: user.id,
                  name: user.name || "Admin",
                  email: user.email || "",
                  avatar: user.image || "",
                },
                approvedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : leave
        );
        setAllLeaves(updatedLeaves);
      }
    } catch (error) {
      console.error("Failed to approve leave:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (leaveId: string, reason?: string) => {
    if (!isAdmin || !user?.id) {
      console.log("Cannot reject - not admin or no user ID");
      return;
    }

    try {
      setProcessing(`reject-${leaveId}`);
      console.log("Rejecting leave:", leaveId, "Reason:", reason);
      const result = await rejectLeaveRequest(leaveId, user.id, reason);
      console.log("Reject result:", result);

      if (result.success) {
        const updatedLeaves = allLeaves.map((leave) =>
          leave._id === leaveId
            ? {
                ...leave,
                status: "rejected" as const,
                rejectedBy: {
                  _id: user.id,
                  name: user.name || "Admin",
                  email: user.email || "",
                  avatar: user.image || "",
                },
                rejectedDate: new Date().toISOString(),
                rejectionReason: reason || "",
                updatedAt: new Date().toISOString(),
              }
            : leave
        );
        setAllLeaves(updatedLeaves);
      }
    } catch (error) {
      console.error("Failed to reject leave:", error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case "annual":
        return "bg-blue-100 text-blue-800";
      case "sick":
        return "bg-purple-100 text-purple-800";
      case "personal":
        return "bg-orange-100 text-orange-800";
      case "emergency":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">Loading leave requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Badge variant="outline" className="text-sm">
            {filteredLeaves.length} request
            {filteredLeaves.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Leave Type Filter */}
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                <SelectItem value="Annual">Annual Leave</SelectItem>
                <SelectItem value="Sick">Sick Leave</SelectItem>
                <SelectItem value="Personal">Personal Leave</SelectItem>
                <SelectItem value="Emergency">Emergency Leave</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setLeaveTypeFilter("all");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      {filteredLeaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-500">
              No leave requests found
            </h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== "all" || leaveTypeFilter !== "all"
                ? "Try adjusting your filters"
                : showOnlyPending
                  ? "No pending requests at this time"
                  : "No leave requests have been submitted yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeaves.map((leave) => (
            <Card key={leave._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                  {/* Employee Info & Leave Details */}
                  <div className="flex-1 space-y-4">
                    {/* Employee Profile */}
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={leave.employeeId?.avatar} />
                        <AvatarFallback className="bg-gray-100">
                          {getEmployeeInitial(leave.employeeId)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {getEmployeeName(leave.employeeId)}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          <span>{getEmployeeEmail(leave.employeeId)}</span>
                        </div>
                        {(leave.employeeId?.position ||
                          leave.employeeId?.section) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {leave.employeeId?.section && (
                              <Badge variant="outline" className="text-xs">
                                {leave.employeeId.section}
                              </Badge>
                            )}
                            {leave.employeeId?.position && (
                              <span className="text-xs text-gray-500">
                                {leave.employeeId.position}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Leave Information */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {format(new Date(leave.startDate), "MMM d, yyyy")} -{" "}
                            {format(new Date(leave.endDate), "MMM d, yyyy")}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({leave.days} day{leave.days > 1 ? "s" : ""})
                          </span>
                        </div>
                        <Badge className={getLeaveTypeColor(leave.leaveType)}>
                          {leave.leaveType} Leave
                        </Badge>
                        {getStatusBadge(leave.status)}
                      </div>

                      {leave.reason && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Reason:
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {leave.reason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          Applied on{" "}
                          {format(
                            new Date(leave.appliedDate),
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Info */}
                  <div className="flex flex-col space-y-4 min-w-[250px]">
                    {/* Action Buttons - Only show for admins with pending requests */}
                    {isAdmin && leave.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(leave._id)}
                          disabled={!!processing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processing === `approve-${leave._id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(leave._id)}
                          disabled={!!processing}
                          className="flex-1"
                        >
                          {processing === `reject-${leave._id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Approval/Rejection Info */}
                    {(leave.approvedBy || leave.rejectedBy) && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {leave.status === "approved"
                            ? "Approved by:"
                            : "Rejected by:"}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={
                                (leave.approvedBy || leave.rejectedBy)?.avatar
                              }
                            />
                            <AvatarFallback className="text-xs">
                              {getEmployeeInitial(
                                leave.approvedBy || leave.rejectedBy
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {getEmployeeName(
                              leave.approvedBy || leave.rejectedBy
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(
                              new Date(
                                leave.approvedDate || leave.rejectedDate || ""
                              ),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>
                        {leave.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                                  Rejection Reason:
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  {leave.rejectionReason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {leave.approverComments && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                              Comments:
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {leave.approverComments}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestedLeaves;
