"use client";

import React, { useEffect, useState } from "react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import Calendar from "@/components/calendar/Calendar";
import RequestedLeaves from "@/components/attendence/requested-leaves";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ClipboardList, Users, BarChart3 } from "lucide-react";
import LeaveList from "@/components/leaves/LeavesList";
import {
  getAllLeaveRequests,
  getEmployeeLeaveRequests,
} from "@/actions/leaves.actions"; // 🔑 you’ll implement these
import { LeaveRequest } from "@/types";
import PendingLeaves from "@/components/leaves/PendingLeaves";
import MyRequests from "@/components/leaves/MyRequests";

const LeavesPage: React.FC = () => {
  const { role } = useCurrentRole();
  const user = useCurrentUser();

  if (!user || !role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Employee view
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
            <Calendar employeeId={user.id!} />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <MyRequests />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Admin/Manager view
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
            Pending Requests
          </TabsTrigger>
          <TabsTrigger value="all-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Requests
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
          <PendingLeaves />
        </TabsContent>

        <TabsContent value="all-requests" className="mt-6">
          <RequestedLeaves />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <TeamCalendar />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <LeaveReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Employee’s own requests
const EmployeeLeaveRequests: React.FC<{ employeeId: string }> = ({
  employeeId,
}) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    getEmployeeLeaveRequests(employeeId).then(setLeaves);
  }, [employeeId]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Leave Requests</h2>
      <LeaveList
        leaves={leaves}
        isAdmin={false}
        processing={null}
        onApprove={() => {}}
        onReject={() => {}}
      />
    </div>
  );
};

// Admin view - all requests
const AllLeaveRequests: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    getAllLeaveRequests().then(setLeaves);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Leave Requests</h2>
      <LeaveList
        leaves={leaves}
        isAdmin={true}
        processing={null}
        onApprove={(id) => console.log("Approve", id)}
        onReject={(id) => console.log("Reject", id)}
      />
    </div>
  );
};

// Team calendar view
const TeamCalendar: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Team Calendar</h2>
      <Calendar employeeId="" /> {/* show all employees */}
    </div>
  );
};

// Reports tab
const LeaveReports: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Leave Reports</h2>
      <p className="text-gray-500">Charts and analytics coming soon 🚀</p>
    </div>
  );
};

export default LeavesPage;
