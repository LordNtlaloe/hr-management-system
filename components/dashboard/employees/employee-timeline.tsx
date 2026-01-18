"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { getEmployeeActivities } from "@/actions/leaves.actions";

interface EmployeeTimelineProps {
  employeeId: string;
}

interface Activity {
  _id: string;
  type: string;
  description: string;
  date: string;
  partBData?: any;
  status?: "pending" | "approved" | "rejected";
  leaveDetails?: {
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
    appliedDate: string;
    approvedDate?: string;
    rejectedDate?: string;
    approverComments?: string;
    rejectionReason?: string;
  };
}

export default function EmployeeTimeline({ employeeId }: EmployeeTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const data = await getEmployeeActivities(employeeId);
        if (Array.isArray(data)) {
          setActivities(data);
        }
      } catch (error) {
        console.error("Failed to load activities:", error);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [employeeId]);

  function getStatusBadge(status?: string) {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  }

  function getLeaveTypeBadge(leaveType: string) {
    const colors: Record<string, string> = {
      annual: "bg-blue-100 text-blue-800",
      sick: "bg-purple-100 text-purple-800",
      maternity: "bg-pink-100 text-pink-800",
      paternity: "bg-indigo-100 text-indigo-800",
      casual: "bg-gray-100 text-gray-800",
      unpaid: "bg-orange-100 text-orange-800",
    };

    const colorClass = colors[leaveType.toLowerCase()] || "bg-gray-100 text-gray-800";

    return (
      <Badge className={`${colorClass} hover:${colorClass}`}>
        {leaveType}
      </Badge>
    );
  }

  function formatActivityType(type: string): string {
    switch (type) {
      case "leave":
        return "Leave Request";
      case "concurrency":
        return "Concurrency Declaration";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatShortDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-lg text-gray-500">Loading timeline...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          Employee Activity Timeline ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {activities.map((activity, index) => (
              <div key={activity._id} className="relative pl-10 pb-6">
                {/* Timeline dot */}
                <div className={`absolute left-3 w-3 h-3 rounded-full border-2 border-white ${
                  activity.status === "approved" ? "bg-green-500" :
                  activity.status === "rejected" ? "bg-red-500" :
                  "bg-yellow-500"
                }`}></div>
                
                <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium text-gray-900">
                          {formatActivityType(activity.type)}
                        </h4>
                        {activity.leaveDetails && getLeaveTypeBadge(activity.leaveDetails.leaveType)}
                        {getStatusBadge(activity.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      
                      {/* Leave Details */}
                      {activity.leaveDetails && (
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500">Period:</span>
                                <p className="font-medium">
                                  {formatShortDate(activity.leaveDetails.startDate)} - {formatShortDate(activity.leaveDetails.endDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <p className="font-medium">{activity.leaveDetails.days} day(s)</p>
                              </div>
                            </div>
                          </div>

                          {/* Reason */}
                          {activity.leaveDetails.reason && (
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium text-gray-700">Reason: </span>
                              <span className="text-gray-600">{activity.leaveDetails.reason}</span>
                            </div>
                          )}

                          {/* Approval/Rejection Comments */}
                          {activity.status === "approved" && activity.leaveDetails.approverComments && (
                            <div className="p-2 bg-green-50 rounded text-sm border border-green-200">
                              <span className="font-medium text-green-800">Approver Comments: </span>
                              <span className="text-green-700">{activity.leaveDetails.approverComments}</span>
                            </div>
                          )}

                          {activity.status === "rejected" && activity.leaveDetails.rejectionReason && (
                            <div className="p-2 bg-red-50 rounded text-sm border border-red-200">
                              <span className="font-medium text-red-800">Rejection Reason: </span>
                              <span className="text-red-700">{activity.leaveDetails.rejectionReason}</span>
                            </div>
                          )}

                          {/* Part B Data */}
                          {activity.partBData && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900 text-sm">Part B Details</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {activity.partBData.numberOfLeaveDays && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Leave Days:</span>{" "}
                                    <span className="text-blue-600">{activity.partBData.numberOfLeaveDays}</span>
                                  </div>
                                )}
                                {activity.partBData.annualLeaveDays && (
                                  <div>
                                    <span className="text-blue-700 font-medium">Annual Leave Days:</span>{" "}
                                    <span className="text-blue-600">{activity.partBData.annualLeaveDays}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Applied Date */}
                      <div className="flex items-center text-xs text-gray-500 mt-3 pt-2 border-t">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Applied on {formatDate(activity.date)}</span>
                        {activity.status === "approved" && activity.leaveDetails?.approvedDate && (
                          <span className="ml-3">
                            • Approved on {formatDate(activity.leaveDetails.approvedDate)}
                          </span>
                        )}
                        {activity.status === "rejected" && activity.leaveDetails?.rejectedDate && (
                          <span className="ml-3">
                            • Rejected on {formatDate(activity.leaveDetails.rejectedDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-600">No activities found</p>
            <p className="text-sm text-gray-500">
              This employee has no recorded leave activities yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}