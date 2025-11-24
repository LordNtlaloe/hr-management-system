"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getEmployeeLeaveRequests } from "@/actions/leaves.actions";
import { getEmployeeByUserId, getEmployeeById } from "@/actions/employee.actions";
import { LeaveRequest } from "@/types";
import { AlertCircle, CalendarDays, Clock, FileText, CheckCircle, XCircle } from "lucide-react";

interface EmployeeData {
  employee_details?: {
    surname: string;
    other_names: string;
    employee_number?: string;
    position?: string;
    telephone?: string;
    email?: string;
    current_address?: string;
  };
  legal_info?: any;
  education_history?: any;
  employment_history?: any;
  references?: any;
  employee_number?: any;
}

const MyRequests: React.FC = () => {
  const user = useCurrentUser();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load employee data
  const loadEmployeeData = async (targetEmployeeId: string) => {
    try {
      setIsLoadingEmployeeData(true);
      console.log("MyRequests: Loading employee data for ID:", targetEmployeeId);
      const employee = await getEmployeeById(targetEmployeeId);
      console.log("MyRequests: Loaded employee data:", employee);

      if (employee) {
        setEmployeeData(employee);
      } else {
        console.error("MyRequests: No employee data returned");
      }
    } catch (error) {
      console.error("MyRequests: Failed to load employee data:", error);
    } finally {
      setIsLoadingEmployeeData(false);
    }
  };

  useEffect(() => {
    const fetchMyLeaves = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, get the employee ID from the user
        let employeeId: string | null = null;

        if (user?.id) {
          console.log("🔄 MyRequests: Fetching employee data for user:", user.id);
          const employee = await getEmployeeByUserId(user.id);
          if (employee && employee._id) {
            employeeId = employee._id;
            await loadEmployeeData(employeeId as string);
          }
        }

        // Use type assertion to access employee_id as fallback
        if (!employeeId) {
          employeeId = (user as any)?.employee_id;
          if (employeeId) {
            await loadEmployeeData(employeeId);
          }
        }

        console.log("🔄 MyRequests: Fetching leaves for employee:", employeeId);

        if (!employeeId) {
          console.log("❌ No employee ID found for user");
          setLeaves([]);
          setLoading(false);
          return;
        }

        // Fetch leave requests without status filter to get all leaves
        const fetchLeaves = await getEmployeeLeaveRequests(employeeId);
        console.log("✅ MyRequests: Received leaves:", fetchLeaves);

        if (Array.isArray(fetchLeaves)) {
          setLeaves(fetchLeaves);
        } else {
          console.error("❌ Expected array but got:", typeof fetchLeaves);
          setError("Failed to load leave requests");
        }
      } catch (err) {
        console.error("❌ Failed to fetch leaves", err);
        setError("Error loading leave requests");
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyLeaves();
    } else {
      setLoading(false);
    }
  }, [user]);

  // UI Helper Functions
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </div>
        );
      case "pending":
      default:
        return (
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        );
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getCardBorderColor = (status: string) => {
    const borderColors = {
      pending: "border-yellow-200",
      approved: "border-green-200",
      rejected: "border-red-200",
    };
    return borderColors[status as keyof typeof borderColors] || "border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-center">
          <p className="text-gray-600 font-medium">Loading your leave requests...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Leave Requests</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          You haven't submitted any leave requests yet. When you do, they will appear here.
        </p>
      </div>
    );
  }

  // Sort leaves by date (newest first)
  const sortedLeaves = [...leaves].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
          <p className="text-gray-600 mt-1">Track and manage your leave applications</p>
        </div>

        {/* Summary Statistics */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{leaves.length}</div>
            <div className="text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {leaves.filter(l => l.status === 'pending').length}
            </div>
            <div className="text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {leaves.filter(l => l.status === 'approved').length}
            </div>
            <div className="text-gray-500">Approved</div>
          </div>
        </div>
      </div>

      {/* Show loading state if employee data is still loading */}
      {isLoadingEmployeeData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Loading employee information...</span>
          </div>
        </div>
      )}

      {/* Employee Information Summary */}
      {employeeData?.employee_details && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Employee Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Name:</span>
              <div className="text-blue-800">
                {employeeData.employee_details.other_names} {employeeData.employee_details.surname}
              </div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Employee #:</span>
              <div className="text-blue-800">{employeeData.employee_number}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Position:</span>
              <div className="text-blue-800">{employeeData.employee_details.position}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Phone:</span>
              <div className="text-blue-800">{employeeData.employee_details.telephone}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {sortedLeaves.map((leave) => (
          <div
            key={leave._id}
            className={`p-6 border-2 rounded-xl bg-white hover:shadow-md transition-all duration-200 ${getCardBorderColor(leave.status)}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* Left Section - Leave Details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(leave.status)}
                    <div>
                      <h3 className="font-bold text-lg capitalize text-gray-900">
                        {leave.leaveType} Leave
                      </h3>
                      <p className="text-sm text-gray-500">
                        {leave.days} day{leave.days !== 1 ? 's' : ''} • Applied on {new Date(leave.appliedDate || leave.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="lg:hidden">
                    {getStatusBadge(leave.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm">
                    <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <span className="font-medium text-gray-700">Start Date:</span>
                      <div className="text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <span className="font-medium text-gray-700">End Date:</span>
                      <div className="text-gray-900">
                        {new Date(leave.endDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {leave.reason && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Reason:</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                      {leave.reason}
                    </p>
                  </div>
                )}

                {/* Part A Data */}
                {leave.partAData && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Location during leave:</span>
                        <p className="text-gray-800">{leave.partAData.locationDuringLeave}</p>
                      </div>
                      {leave.partAData.phoneNumber && (
                        <div>
                          <span className="font-medium text-gray-600">Contact number:</span>
                          <p className="text-gray-800">{leave.partAData.phoneNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Part B Data - HR Section */}
                {leave.partBData && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">HR Approval Details:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Annual Days:</span>
                        <p className="text-gray-800">{leave.partBData.annualLeaveDays}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Deducted:</span>
                        <p className="text-red-600 font-medium">{leave.partBData.deductedDays}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Remaining:</span>
                        <p className="text-green-600 font-medium">{leave.partBData.remainingLeaveDays}</p>
                      </div>
                      {leave.partBData.dateOfApproval && (
                        <div>
                          <span className="font-medium text-gray-600">Approved on:</span>
                          <p className="text-gray-800">
                            {new Date(leave.partBData.dateOfApproval).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Section - Status and Actions */}
              <div className="lg:text-right space-y-4">
                <div className="hidden lg:block">
                  {getStatusBadge(leave.status)}
                </div>

                {/* Status Timeline */}
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center justify-between lg:justify-end gap-2">
                    <span>Applied:</span>
                    <span className="font-medium">
                      {new Date(leave.appliedDate || leave.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  {leave.partBData?.dateOfApproval && (
                    <div className="flex items-center justify-between lg:justify-end gap-2">
                      <span>Approved:</span>
                      <span className="font-medium">
                        {new Date(leave.partBData.dateOfApproval).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {leave.status === 'pending' && (
                  <div className="flex lg:justify-end gap-2">
                    <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
                      View Details
                    </button>
                    <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{leaves.length}</span> leave request{leaves.length !== 1 ? 's' : ''}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Pending: {leaves.filter(l => l.status === 'pending').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Approved: {leaves.filter(l => l.status === 'approved').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Rejected: {leaves.filter(l => l.status === 'rejected').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequests;