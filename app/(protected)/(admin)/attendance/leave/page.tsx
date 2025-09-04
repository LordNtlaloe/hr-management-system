"use client";

import React from "react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import Calendar from "@/components/calendar/Calendar";
import RequestedLeaves from "@/components/attendence/requested-leaves";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ClipboardList, Users, BarChart3 } from "lucide-react";

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

  // Employee view - show calendar with request functionality
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
            {/* Non-null assertion ensures employeeId is string */}
            <Calendar employeeId={user.id!} />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <EmployeeLeaveRequests employeeId={user.id!} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Admin/Manager view - show pending requests and management tools
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
          <RequestedLeaves />
        </TabsContent>

        <TabsContent value="all-requests" className="mt-6">
          <AllLeaveRequests />
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

// Component to show employee's own leave requests
const EmployeeLeaveRequests: React.FC<{ employeeId: string }> = ({
  employeeId,
}) => {
  if (!employeeId) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Leave Requests</h2>
      <p className="text-gray-500">
        Your leave request history will appear here.
      </p>
    </div>
  );
};

// Component to show all leave requests for admin
const AllLeaveRequests: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Leave Requests</h2>
      <p className="text-gray-500">
        All employee leave requests will appear here.
      </p>
    </div>
  );
};

// Component to show team calendar view
const TeamCalendar: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Team Calendar</h2>
      <p className="text-gray-500">Team leave calendar will appear here.</p>
    </div>
  );
};

// Component to show leave reports
const LeaveReports: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Leave Reports</h2>
      <p className="text-gray-500">
        Leave analytics and reports will appear here.
      </p>
    </div>
  );
};

export default LeavesPage;
