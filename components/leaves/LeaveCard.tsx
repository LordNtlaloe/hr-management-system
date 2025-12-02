import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Mail, Clock, User } from "lucide-react";

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
  employeeDetails: EmployeeDetailsFormValues
}

import { EmployeeDetailsFormValues } from "@/schemas";

interface LeaveCardProps {
  leave: LeaveWithEmployee;
  isAdmin: boolean;
  processing: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const LeaveCard: React.FC<LeaveCardProps> = ({
  leave,
  isAdmin,
  processing,
  onApprove,
  onReject,
}) => {
  const { employeeDetails } = leave;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex-1 space-y-4">
            {/* Employee Info Header */}
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                {employeeDetails.profile_picture ? (
                  <AvatarImage
                    src={employeeDetails.profile_picture}
                    alt={employeeDetails.other_names || "Employee"}
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(
                      `${employeeDetails || ""} ${employeeDetails.surname || ""}`.trim() ||
                      employeeDetails.other_names ||
                      "Unknown"
                    )}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {employeeDetails.other_names} {employeeDetails.surname}
                </h3>

                {employeeDetails.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{employeeDetails.email}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {employeeDetails.employment_number && (
                    <Badge variant="outline" className="text-xs">
                      #{employeeDetails.employment_number}
                    </Badge>
                  )}
                  {employeeDetails.telephone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {employeeDetails.telephone}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                variant={getStatusBadgeVariant(leave.status)}
                className={`${getStatusColor(leave.status)} capitalize font-medium`}
              >
                {leave.status}
              </Badge>
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

              {/* Approval/Rejection Details */}
              {(leave.status === "approved" || leave.status === "rejected") && (
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {leave.status === "approved" && leave.approvedDate && (
                    <p className="text-green-700">
                      <span className="font-medium">Approved:</span>{" "}
                      {formatDate(leave.approvedDate)}
                      {leave.approverComments && (
                        <span className="block mt-1 text-gray-600">
                          {leave.approverComments}
                        </span>
                      )}
                    </p>
                  )}

                  {leave.status === "rejected" && leave.rejectedDate && (
                    <p className="text-red-700">
                      <span className="font-medium">Rejected:</span>{" "}
                      {formatDate(leave.rejectedDate)}
                      {leave.rejectionReason && (
                        <span className="block mt-1 text-gray-600">
                          {leave.rejectionReason}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Admin Action Buttons */}
          {isAdmin && leave.status === "pending" && (
            <div className="flex flex-col space-y-2 min-w-[200px] lg:ml-4">
              <Button
                size="sm"
                onClick={() => onApprove(leave._id)}
                disabled={!!processing}
                className="w-full"
              >
                {processing === leave._id ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(leave._id)}
                disabled={!!processing}
                className="w-full"
              >
                {processing === leave._id ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCard;