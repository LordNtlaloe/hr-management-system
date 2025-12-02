"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";
import ConcurrencyForm from "@/components/dashboard/employees/concurrence-form";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileText,
  AlertCircle,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Mail
} from "lucide-react";
import {
  getAllLeaveRequests,
  updateLeaveRequest,
  createLeaveRequest,
  updateLeaveRequestWithPartB,
} from "@/actions/leaves.actions";
import {
  addEmployeeActivity,
  getEmployeeActivities,
  deleteEmployeeActivity,
} from "@/actions/employee.activities.actions";
import { getEmployeeById } from "@/actions/employee.actions";
import { toast } from "sonner";

interface LeaveWithEmployee {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  appliedDate: string;
  approvedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  approverComments?: string;
  employeeId: string;
  employeeDetails: {
    name?: string;
    email?: string;
    avatar?: string;
    employment_number?: string;
    phone?: string;
    surname?: string;
    other_names?: string;
    position?: string;
  };
}

interface Activity {
  _id: string;
  type: string;
  description: string;
  date: string;
  partBData?: any;
  status?: "pending" | "approved" | "rejected";
}

interface PartAData {
  employeeName: string;
  employmentNumber: string;
  employeePosition: string;
  numberOfLeaveDays: number;
  startDate: Date;
  endDate: Date;
  locationDuringLeave: string;
  phoneNumber: string;
  dateOfRequest: Date;
  employeeSignature: string;
}

interface PartBData {
  annualLeaveDays: number;
  deductedDays: number;
  remainingLeaveDays: number;
  dateOfApproval?: Date;
  hrSignature: string;
}

export default function LeaveManagementPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "HR" || userRole === "Admin";

  const [processing, setProcessing] = useState<string | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveWithEmployee[]>([]);
  const [approvedLeaves, setApprovedLeaves] = useState<LeaveWithEmployee[]>([]);
  const [rejectedLeaves, setRejectedLeaves] = useState<LeaveWithEmployee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // State for modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<LeaveWithEmployee | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // State for forms
  const [type, setType] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    employeeName: "",
    employmentNumber: "",
    employeePosition: "",
    email: "",
    phoneNumber: "",
    currentAddress: "",
    leaveType: "annual",
    numberOfLeaveDays: 0,
    startDate: "",
    endDate: "",
    locationDuringLeave: "",
    reason: "",
    dateOfRequest: new Date().toISOString().split('T')[0],
    employeeSignature: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load all leaves
  async function loadLeaves() {
    try {
      const leaves = await getAllLeaveRequests();
      if (Array.isArray(leaves)) {
        const pending = leaves.filter(leave => leave.status === 'pending');
        const approved = leaves.filter(leave => leave.status === 'approved');
        const rejected = leaves.filter(leave => leave.status === 'rejected');

        setPendingLeaves(pending);
        setApprovedLeaves(approved);
        setRejectedLeaves(rejected);
      }
    } catch (e) {
      console.error("Failed to load leaves:", e);
      toast("Error", {
        description: "Failed to load leave requests",
      });
    }
  }

  // Load activities
  async function loadActivities() {
    try {
      const data = await getEmployeeActivities("all"); // Or specific employee ID
      if (Array.isArray(data)) {
        setActivities(data);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    }
  }

  // Handle approve leave
  async function handleApprove(leaveId: string): Promise<void> {
    try {
      setProcessing(leaveId);

      const result = await updateLeaveRequest(leaveId, 'approved');

      if (result.success) {
        // Move the leave from pending to approved
        const approvedLeave = pendingLeaves.find(leave => leave._id === leaveId);
        if (approvedLeave) {
          setPendingLeaves(prev => prev.filter(leave => leave._id !== leaveId));
          setApprovedLeaves(prev => [...prev, {
            ...approvedLeave,
            status: 'approved',
            approvedDate: new Date().toISOString()
          }]);

          toast("Success", {
            description: "Leave request approved successfully",
          });
        }
      } else {
        toast("Error", {
          description: result.error || "Failed to approve leave request",
        });
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      toast("Error", {
        description: "An error occurred while approving the leave",
      });
    } finally {
      setProcessing(null);
    }
  }

  // Handle reject leave with modal
  function handleOpenRejectionModal(leave: LeaveWithEmployee) {
    setSelectedRequestForAction(leave);
    setRejectionReason("");
    setIsRejectionModalOpen(true);
  }

  async function handleRejectRequest(): Promise<void> {
    if (!selectedRequestForAction) return;

    try {
      setProcessing(selectedRequestForAction._id);

      const result = await updateLeaveRequest(
        selectedRequestForAction._id,
        'rejected',
      );

      if (result.success) {
        const rejectedLeave = pendingLeaves.find(leave => leave._id === selectedRequestForAction._id);
        if (rejectedLeave) {
          setPendingLeaves(prev => prev.filter(leave => leave._id !== selectedRequestForAction._id));
          setRejectedLeaves(prev => [...prev, {
            ...rejectedLeave,
            status: 'rejected',
            rejectionReason,
            rejectedDate: new Date().toISOString()
          }]);

          toast("Success", {
            description: "Leave request rejected successfully",
          });

          setRejectionReason("");
          setSelectedRequestForAction(null);
          setIsRejectionModalOpen(false);
        }
      } else {
        toast("Error", {
          description: result.error || "Failed to reject leave request",
        });
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast("Error", {
        description: "An error occurred while rejecting the leave",
      });
    } finally {
      setProcessing(null);
    }
  }

  // Handle type selection for new request
  function handleTypeChange(value: string) {
    setType(value);
    if (value === "leave") {
      setIsLeaveModalOpen(true);
    } else if (value === "concurrency") {
      setIsConcurrencyModalOpen(true);
    }
  }

  // Handle leave form changes
  function handleLeaveFormChange(field: string, value: any) {
    setLeaveForm(prev => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Calculate days if dates change
    if (field === "startDate" || field === "endDate") {
      const startDate = field === "startDate" ? value : leaveForm.startDate;
      const endDate = field === "endDate" ? value : leaveForm.endDate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setLeaveForm(prev => ({ ...prev, numberOfLeaveDays: days }));
      }
    }
  }

  // Handle leave form submission
  async function handleLeaveFormSubmit() {
    try {
      // Basic validation
      if (!leaveForm.employeeName || !leaveForm.startDate || !leaveForm.endDate) {
        toast("Error",{
          description: "Please fill in all required fields",
        });
        return;
      }

      const leaveRequestData = {
        employeeId: session?.user?.id || "",
        leaveType: leaveForm.leaveType,
        startDate: new Date(leaveForm.startDate),
        endDate: new Date(leaveForm.endDate),
        days: leaveForm.numberOfLeaveDays,
        reason: leaveForm.reason,
        locationDuringLeave: leaveForm.locationDuringLeave,
        status: "pending",
      };

      const result = await createLeaveRequest(leaveRequestData, {
        employeeName: leaveForm.employeeName,
        employmentNumber: leaveForm.employmentNumber,
        employeePosition: leaveForm.employeePosition,
        numberOfLeaveDays: leaveForm.numberOfLeaveDays,
        startDate: new Date(leaveForm.startDate),
        endDate: new Date(leaveForm.endDate),
        locationDuringLeave: leaveForm.locationDuringLeave,
        phoneNumber: leaveForm.phoneNumber,
        dateOfRequest: new Date(leaveForm.dateOfRequest),
        employeeSignature: leaveForm.employeeSignature,
      });

      if ("success" in result && result.success) {
        toast("Success",{
          description: "Leave request submitted successfully",
        });

        // Reset form
        setLeaveForm({
          employeeName: "",
          employmentNumber: "",
          employeePosition: "",
          email: "",
          phoneNumber: "",
          currentAddress: "",
          leaveType: "annual",
          numberOfLeaveDays: 0,
          startDate: "",
          endDate: "",
          locationDuringLeave: "",
          reason: "",
          dateOfRequest: new Date().toISOString().split('T')[0],
          employeeSignature: "",
        });

        setIsLeaveModalOpen(false);
        loadLeaves();
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      toast("Error",{
        description: "Failed to submit leave request",
      });
    }
  }

  // Get status badge
  function getStatusBadge(status?: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  }

  // Get initials for avatar
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Load data on mount
  useEffect(() => {
    loadLeaves();
    loadActivities();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Leave Request</DialogTitle>
              <DialogDescription>
                Select an option to create a new leave request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={handleTypeChange} value={type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave Request</SelectItem>
                  <SelectItem value="concurrency">Concurrency Declaration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Leaves Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Leave Requests ({pendingLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingLeaves.length > 0 ? (
            pendingLeaves.map((leave) => (
              <Card key={leave._id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                    <div className="flex-1 space-y-4">
                      {/* Employee Info Header */}
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(leave.employeeDetails.name || "Unknown")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {leave.employeeDetails.other_names} {leave.employeeDetails.surname}
                          </h3>

                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{leave.employeeDetails.email}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2">
                            {leave.employeeDetails.employment_number && (
                              <Badge variant="outline" className="text-xs">
                                #{leave.employeeDetails.employment_number}
                              </Badge>
                            )}
                            {leave.employeeDetails.phone && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {leave.employeeDetails.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {getStatusBadge(leave.status)}
                      </div>

                      {/* Leave Details */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div className="text-sm">
                              <span className="font-medium">
                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                              </span>
                              <span className="text-gray-500 ml-2">
                                ({leave.days} day{leave.days !== 1 ? "s" : ""})
                              </span>
                            </div>
                          </div>

                          <Badge variant="outline" className="capitalize">
                            {leave.leaveType} Leave
                          </Badge>
                        </div>

                        {/* Applied Date */}
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Applied on {formatDate(leave.appliedDate)}</span>
                        </div>

                        {/* Reason */}
                        {leave.reason && leave.reason.trim() && (
                          <div className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Reason:</span> {leave.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    {isAdmin && leave.status === "pending" && (
                      <div className="flex flex-col space-y-2 min-w-[200px] lg:ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(leave._id)}
                          disabled={!!processing}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {processing === leave._id ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenRejectionModal(leave)}
                          disabled={!!processing}
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {processing === leave._id ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600">No pending leave requests</p>
              <p className="text-sm text-gray-500">All leave requests have been processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Leaves Section */}
      {approvedLeaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approved Leave Requests ({approvedLeaves.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvedLeaves.map((leave) => (
              <div key={leave._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg capitalize">{leave.leaveType} Leave</h4>
                    <p className="text-sm text-gray-600">
                      {leave.employeeDetails.other_names} {leave.employeeDetails.surname}
                    </p>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Dates</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-gray-600">{leave.days} days</p>
                    </div>
                  </div>

                  {leave.approvedDate && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Approved On</p>
                      <p className="text-sm text-gray-600">{formatDate(leave.approvedDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rejected Leaves Section */}
      {rejectedLeaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejected Leave Requests ({rejectedLeaves.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejectedLeaves.map((leave) => (
              <div key={leave._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg capitalize">{leave.leaveType} Leave</h4>
                    <p className="text-sm text-gray-600">
                      {leave.employeeDetails.other_names} {leave.employeeDetails.surname}
                    </p>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Dates</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-gray-600">{leave.days} days</p>
                    </div>
                  </div>

                  {leave.rejectionReason && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                      <p className="text-sm text-red-600">{leave.rejectionReason}</p>
                    </div>
                  )}

                  {leave.rejectedDate && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Rejected On</p>
                      <p className="text-sm text-gray-600">{formatDate(leave.rejectedDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Activity Timeline ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((act) => (
              <div key={act._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{act.type === 'leave' ? 'Leave Request' : 'Concurrency Declaration'}</h4>
                    <p className="text-sm text-gray-600">{act.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(act.date).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(act.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Leave Form Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
          <h3 className="text-lg font-semibold text-gray-800">Leave Request Form</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Personal Information */}
            <div className="col-span-2">
              <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Personal Information</h4>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Employee Name *
              </label>
              <input
                type="text"
                value={leaveForm.employeeName}
                onChange={(e) => handleLeaveFormChange("employeeName", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Employment Number *
              </label>
              <input
                type="text"
                value={leaveForm.employmentNumber}
                onChange={(e) => handleLeaveFormChange("employmentNumber", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                required
              />
            </div>

            {/* Leave Details */}
            <div className="col-span-2">
              <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Leave Details</h4>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Leave Type *
              </label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => handleLeaveFormChange("leaveType", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="compassionate">Compassionate Leave</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Number of Days
              </label>
              <input
                type="number"
                value={leaveForm.numberOfLeaveDays}
                className="h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm"
                disabled
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => handleLeaveFormChange("startDate", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => handleLeaveFormChange("endDate", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Location During Leave
              </label>
              <input
                type="text"
                value={leaveForm.locationDuringLeave}
                onChange={(e) => handleLeaveFormChange("locationDuringLeave", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                placeholder="Where will you be during your leave?"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason for Leave
              </label>
              <textarea
                value={leaveForm.reason}
                onChange={(e) => handleLeaveFormChange("reason", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                rows={3}
                placeholder="Please provide a reason for your leave"
              />
            </div>

            {/* Declaration */}
            <div className="col-span-2">
              <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Declaration</h4>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date of Request
              </label>
              <input
                type="date"
                value={leaveForm.dateOfRequest}
                onChange={(e) => handleLeaveFormChange("dateOfRequest", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Employee Signature *
              </label>
              <input
                type="text"
                value={leaveForm.employeeSignature}
                onChange={(e) => handleLeaveFormChange("employeeSignature", e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
                placeholder="Type your full name as signature"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                By signing, I declare that the information provided is true and correct
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleLeaveFormSubmit}
            >
              Submit Leave Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Leave Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this leave request
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForAction && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-medium">Request Details:</p>
                <p className="text-sm">
                  {selectedRequestForAction.leaveType} Leave - {selectedRequestForAction.days} days
                </p>
                <p className="text-sm">
                  {formatDate(selectedRequestForAction.startDate)} to {formatDate(selectedRequestForAction.endDate)}
                </p>
                <p className="text-sm">
                  Employee: {selectedRequestForAction.employeeDetails.other_names} {selectedRequestForAction.employeeDetails.surname}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejecting this leave request..."
                  className="min-h-[100px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be visible to the employee
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsRejectionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectRequest}
                  disabled={!rejectionReason.trim() || !!processing}
                >
                  {processing === selectedRequestForAction._id ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Concurrency Form Modal */}
      <Dialog open={isConcurrencyModalOpen} onOpenChange={setIsConcurrencyModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Concurrency Declaration Form
            </DialogTitle>
            <DialogDescription>
              Complete the concurrence declaration for employees.
            </DialogDescription>
          </DialogHeader>
          <ConcurrencyForm
            onSuccess={() => {
              setIsConcurrencyModalOpen(false);
              toast("Success",{
                description: "Concurrency declaration submitted successfully",
              });
            }}
            onCancel={() => setIsConcurrencyModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}