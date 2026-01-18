"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { getEmployeeActivities } from "@/actions/employee.activities.actions";

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
                
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {formatActivityType(activity.type)}
                        </h4>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      
                      {/* Activity details */}
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      
                      {/* Additional details for specific activity types */}
                      {activity.type === "leave" && activity.partBData && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">Days:</span>{" "}
                              {activity.partBData.numberOfLeaveDays}
                            </div>
                            {activity.partBData.annualLeaveDays && (
                              <div>
                                <span className="font-medium">Annual Leave:</span>{" "}
                                {activity.partBData.annualLeaveDays}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
              This employee has no recorded activities yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}