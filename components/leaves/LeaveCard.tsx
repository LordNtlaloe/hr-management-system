import React from "react";
import { LeaveRequest } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  getEmployeeName,
  getEmployeeEmail,
  getEmployeeInitial,
  getEmployeeImage,
  getEmployeeDetails,
  getApproverName,
  getLeaveTypeColor,
} from "@/components/leaves/LeaveUtils";
import { getStatusBadge } from "./StatusBadge";
import { Check, X, Clock, Mail, AlertCircle, Loader2, Calendar } from "lucide-react";

interface LeaveCardProps {
  leave: LeaveRequest;
  isAdmin: boolean;
  processing: string | null;
  onApprove: (leaveId: string) => void;
  onReject: (leaveId: string) => void;
}

const LeaveCard: React.FC<LeaveCardProps> = ({
  leave,
  isAdmin,
  processing,
  onApprove,
  onReject,
}) => {
  const employeeDetails = getEmployeeDetails(leave.employeeId);

  return (
    <Card key={leave._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex-1 space-y-4">
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={getEmployeeImage(leave.employeeId)} />
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
                {(employeeDetails.employment_number ||
                  employeeDetails.phone) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {employeeDetails.employment_number && (
                      <Badge variant="outline" className="text-xs">
                        #{employeeDetails.employment_number}
                      </Badge>
                    )}
                    {employeeDetails.phone && (
                      <span className="text-xs text-gray-500">
                        {employeeDetails.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

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
                  {format(new Date(leave.appliedDate), "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4 min-w-[250px]">
            {isAdmin && leave.status === "pending" && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(leave._id)}
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
                  onClick={() => onReject(leave._id)}
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

            {(leave.approvedBy || leave.rejectedBy) && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {leave.status === "approved"
                    ? "Approved by:"
                    : "Rejected by:"}
                </p>
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {getApproverName(
                        leave.approvedBy || leave.rejectedBy
                      ).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {getApproverName(leave.approvedBy || leave.rejectedBy)}
                  </span>
                </div>
                <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(
                      new Date(leave.approvedDate || leave.rejectedDate || ""),
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
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCard;
