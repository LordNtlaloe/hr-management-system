"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  DateSpanApi,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/use-modal";
import { Modal } from "@/components/ui/modal";
import {
  getEmployeeLeaveRequests,
  createLeaveRequest,
} from "@/actions/leaves.actions";
import { getEmployeeByUserId } from "@/actions/employee.actions";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";

export enum LeaveType {
  ANNUAL = "Annual",
  SICK = "Sick",
  PERSONAL = "Personal",
  UNPAID = "Unpaid",
}

interface LeaveEvent extends EventInput {
  extendedProps: {
    status: string;
    leaveType: LeaveType;
    leaveId: string;
  };
}

interface CalendarProps {
  employeeId?: string;
}

const Calendar: React.FC<CalendarProps> = ({ employeeId: propEmployeeId }) => {
  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(propEmployeeId || null);
  const [activeSection, setActiveSection] = useState<"partA" | "partB" | "partC" | "partD">("partA");

  // Part A: Employee Section
  const [partA, setPartA] = useState({
    employeeName: "",
    employmentNumber: "",
    employeePosition: "",
    numberOfLeaveDays: 0,
    startDate: "",
    endDate: "",
    locationDuringLeave: "",
    phoneNumber: "",
    dateOfRequest: new Date().toISOString().split('T')[0],
    employeeSignature: "",
  });

  // Part B: HR Section
  const [partB, setPartB] = useState({
    annualLeaveDays: 21,
    deductedDays: 0,
    remainingLeaveDays: 21,
    dateOfApproval: "",
    hrSignature: "",
  });

  // Part C: Supervisor Section
  const [partC, setPartC] = useState({
    supervisorComments: "",
    recommendation: "" as "recommend-approval" | "do-not-recommend" | "",
    dateOfReview: "",
    supervisorSignature: "",
  });

  // Part D: Final Approval Section
  const [partD, setPartD] = useState({
    finalDecision: "" as "approved" | "rejected" | "",
    dateOfDecision: "",
    approverSignature: "",
  });

  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { role } = useCurrentRole();
  const user = useCurrentUser();
  const isEmployee = role === "Employee";
  const isHR = role === "HR";
  const isSupervisor = role === "Manager";
  const isAdmin = role === "Admin";

  // Resolve employeeId from userId (only if employee view)
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!propEmployeeId && user?.id && isEmployee) {
        const employee = await getEmployeeByUserId(user.id);
        if (employee && employee._id) {
          setEmployeeId(employee._id);
          // Pre-fill employee details in Part A
          setPartA(prev => ({
            ...prev,
            employeeName: employee.name || "",
            employmentNumber: employee.employeeId || "",
            employeePosition: employee.position || "",
            phoneNumber: employee.phone || "",
          }));
        }
      }
    };
    fetchEmployee();
  }, [user, propEmployeeId, isEmployee]);

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveEvents = async () => {
      try {
        if (!employeeId && !isEmployee) return;
        const targetEmployeeId = employeeId;
        if (!targetEmployeeId) return;

        const response = await getEmployeeLeaveRequests(targetEmployeeId);

        if (Array.isArray(response)) {
          const formattedEvents: LeaveEvent[] = response.map((leave: any) => ({
            id: leave._id,
            title: `${leave.leaveType.toUpperCase()} Leave`,
            start: new Date(leave.startDate),
            end: new Date(leave.endDate),
            allDay: true,
            extendedProps: {
              status: leave.status,
              leaveType: leave.leaveType,
              leaveId: leave._id,
            },
          }));
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("Failed to fetch leave events", error);
      }
    };

    fetchLeaveEvents();
  }, [employeeId, isEmployee]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!isEmployee) return;
    resetModalFields();

    const startDateStr = selectInfo.startStr;
    const endDateStr = selectInfo.endStr ? new Date(selectInfo.endStr).toISOString().split('T')[0] : startDateStr;
    const numberOfDays = calculateDaysDifference(new Date(startDateStr), new Date(endDateStr));

    setPartA(prev => ({
      ...prev,
      startDate: startDateStr,
      endDate: endDateStr,
      numberOfLeaveDays: numberOfDays,
    }));

    // Auto-update Part B deducted days
    setPartB(prev => ({
      ...prev,
      deductedDays: numberOfDays,
      remainingLeaveDays: prev.annualLeaveDays - numberOfDays,
    }));

    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedLeave(event as unknown as LeaveEvent);

    // In a real app, you would fetch the full leave details here
    // For now, we'll just show the basic info
    openModal();
    setActiveSection("partA");
  };

  const handlePartAChange = (field: string, value: any) => {
    setPartA(prev => ({ ...prev, [field]: value }));

    // Recalculate days if dates change
    if ((field === "startDate" || field === "endDate") && partA.startDate && partA.endDate) {
      const numberOfDays = calculateDaysDifference(new Date(partA.startDate), new Date(partA.endDate));
      setPartA(prev => ({ ...prev, numberOfLeaveDays: numberOfDays }));

      // Update Part B
      setPartB(prev => ({
        ...prev,
        deductedDays: numberOfDays,
        remainingLeaveDays: prev.annualLeaveDays - numberOfDays,
      }));
    }
  };

  const handlePartBChange = (field: string, value: any) => {
    const updatedPartB = { ...partB, [field]: value };

    // Auto-calculate remaining days
    if (field === "annualLeaveDays" || field === "deductedDays") {
      updatedPartB.remainingLeaveDays = updatedPartB.annualLeaveDays - updatedPartB.deductedDays;
    }

    setPartB(updatedPartB);
  };

  const handleSubmitLeaveRequest = async () => {
    if (!employeeId) {
      console.error("No employeeId found for user");
      return;
    }

    try {
      const leaveData = {
        employeeId,
        leaveType: partA.numberOfLeaveDays > partB.annualLeaveDays ? LeaveType.UNPAID : LeaveType.ANNUAL,
        startDate: new Date(partA.startDate),
        endDate: new Date(partA.endDate),
        reason: partA.locationDuringLeave, // Using location as reason for now
        days: partA.numberOfLeaveDays,
        // Include the form data for the new schema
        formData: {
          partA,
          partB,
          partC,
          partD,
        }
      };

      const result = await createLeaveRequest(leaveData);

      if (result.success) {
        const newEvent: LeaveEvent = {
          id: result.insertedId,
          title: `${leaveData.leaveType} Leave`,
          start: leaveData.startDate,
          end: leaveData.endDate,
          allDay: true,
          extendedProps: {
            status: "pending",
            leaveType: leaveData.leaveType,
            leaveId: result.insertedId,
          },
        };
        setEvents((prev) => [...prev, newEvent]);
        closeModal();
        resetModalFields();
      } else {
        console.error("Failed to create leave request:", result.error);
      }
    } catch (error) {
      console.error("Failed to submit leave request", error);
    }
  };

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const resetModalFields = () => {
    setPartA({
      employeeName: "",
      employmentNumber: "",
      employeePosition: "",
      numberOfLeaveDays: 0,
      startDate: "",
      endDate: "",
      locationDuringLeave: "",
      phoneNumber: "",
      dateOfRequest: new Date().toISOString().split('T')[0],
      employeeSignature: "",
    });
    setPartB({
      annualLeaveDays: 21,
      deductedDays: 0,
      remainingLeaveDays: 21,
      dateOfApproval: "",
      hrSignature: "",
    });
    setPartC({
      supervisorComments: "",
      recommendation: "",
      dateOfReview: "",
      supervisorSignature: "",
    });
    setPartD({
      finalDecision: "",
      dateOfDecision: "",
      approverSignature: "",
    });
    setSelectedLeave(null);
    setActiveSection("partA");
  };

  const isSelectable = (span: DateSpanApi) => {
    const today = new Date(new Date().toDateString());
    const start = new Date(span.start);
    const end = new Date(span.end);

    if (start < today) return false;

    for (let event of events) {
      const eventStart = new Date(event.start as string);
      const eventEnd = new Date(event.end as string);

      if (
        (start >= eventStart && start < eventEnd) ||
        (end > eventStart && end <= eventEnd) ||
        (start <= eventStart && end >= eventEnd)
      ) {
        return false;
      }
    }
    return true;
  };

  const renderSectionNavigation = () => (
    <div className="flex space-x-2 mb-6 border-b pb-4">
      <button
        type="button"
        onClick={() => setActiveSection("partA")}
        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === "partA"
            ? "bg-blue-100 text-blue-700 border border-blue-300"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
      >
        Part A: Employee
      </button>
      {(isHR || isAdmin) && (
        <button
          type="button"
          onClick={() => setActiveSection("partB")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === "partB"
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          Part B: HR
        </button>
      )}
      {(isSupervisor || isAdmin) && (
        <button
          type="button"
          onClick={() => setActiveSection("partC")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === "partC"
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          Part C: Supervisor
        </button>
      )}
      {(isAdmin || isHR) && (
        <button
          type="button"
          onClick={() => setActiveSection("partD")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === "partD"
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          Part D: Approval
        </button>
      )}
    </div>
  );

  const renderPartA = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part A: Employee Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Name
          </label>
          <input
            type="text"
            value={partA.employeeName}
            onChange={(e) => handlePartAChange("employeeName", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employment Number
          </label>
          <input
            type="text"
            value={partA.employmentNumber}
            onChange={(e) => handlePartAChange("employmentNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Position
          </label>
          <input
            type="text"
            value={partA.employeePosition}
            onChange={(e) => handlePartAChange("employeePosition", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Number of Leave Days
          </label>
          <input
            type="number"
            value={partA.numberOfLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={partA.startDate}
            onChange={(e) => handlePartAChange("startDate", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            value={partA.endDate}
            onChange={(e) => handlePartAChange("endDate", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Location/Address During Leave
          </label>
          <input
            type="text"
            value={partA.locationDuringLeave}
            onChange={(e) => handlePartAChange("locationDuringLeave", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={partA.phoneNumber}
            onChange={(e) => handlePartAChange("phoneNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Request
          </label>
          <input
            type="date"
            value={partA.dateOfRequest}
            onChange={(e) => handlePartAChange("dateOfRequest", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            required
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Signature
          </label>
          <input
            type="text"
            value={partA.employeeSignature}
            onChange={(e) => handlePartAChange("employeeSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            placeholder="Type your full name as signature"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderPartB = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part B: HR Section</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Annual Leave Days
          </label>
          <input
            type="number"
            value={partB.annualLeaveDays}
            onChange={(e) => handlePartBChange("annualLeaveDays", parseInt(e.target.value))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Deducted Days
          </label>
          <input
            type="number"
            value={partB.deductedDays}
            onChange={(e) => handlePartBChange("deductedDays", parseInt(e.target.value))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Remaining Leave Days
          </label>
          <input
            type="number"
            value={partB.remainingLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Approval
          </label>
          <input
            type="date"
            value={partB.dateOfApproval}
            onChange={(e) => handlePartBChange("dateOfApproval", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            HR Signature
          </label>
          <input
            type="text"
            value={partB.hrSignature}
            onChange={(e) => handlePartBChange("hrSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            placeholder="HR representative signature"
          />
        </div>
      </div>
    </div>
  );

  const renderPartC = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part C: Supervisor Review</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Comments
          </label>
          <textarea
            value={partC.supervisorComments}
            onChange={(e) => setPartC(prev => ({ ...prev, supervisorComments: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            rows={3}
            disabled={!!selectedLeave}
            placeholder="Enter comments regarding the leave request"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Recommendation
          </label>
          <select
            value={partC.recommendation}
            onChange={(e) => setPartC(prev => ({ ...prev, recommendation: e.target.value as any }))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          >
            <option value="">Select recommendation</option>
            <option value="recommend-approval">Recommend Approval</option>
            <option value="do-not-recommend">Do Not Recommend</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Review
          </label>
          <input
            type="date"
            value={partC.dateOfReview}
            onChange={(e) => setPartC(prev => ({ ...prev, dateOfReview: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Supervisor Signature
          </label>
          <input
            type="text"
            value={partC.supervisorSignature}
            onChange={(e) => setPartC(prev => ({ ...prev, supervisorSignature: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            placeholder="Supervisor signature"
          />
        </div>
      </div>
    </div>
  );

  const renderPartD = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part D: Final Approval</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Final Decision
          </label>
          <select
            value={partD.finalDecision}
            onChange={(e) => setPartD(prev => ({ ...prev, finalDecision: e.target.value as any }))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          >
            <option value="">Select decision</option>
            <option value="approved">Approve</option>
            <option value="rejected">Reject</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Decision
          </label>
          <input
            type="date"
            value={partD.dateOfDecision}
            onChange={(e) => setPartD(prev => ({ ...prev, dateOfDecision: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Approver Signature
          </label>
          <input
            type="text"
            value={partD.approverSignature}
            onChange={(e) => setPartD(prev => ({ ...prev, approverSignature: e.target.value }))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            disabled={!!selectedLeave}
            placeholder="Approver signature"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case "partA":
        return renderPartA();
      case "partB":
        return renderPartB();
      case "partC":
        return renderPartC();
      case "partD":
        return renderPartD();
      default:
        return renderPartA();
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next" + (isEmployee ? " requestLeaveButton" : ""),
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={isEmployee}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          selectAllow={isSelectable}
          customButtons={
            isEmployee
              ? {
                requestLeaveButton: {
                  text: "Request Leave +",
                  click: openModal,
                },
              }
              : undefined
          }
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedLeave ? "Leave Request Details" : "Leave Request Form"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedLeave
                ? "View leave request details across all sections"
                : "Complete the leave request form section by section"}
            </p>
          </div>

          {renderSectionNavigation()}

          <div className="mt-4">
            {renderCurrentSection()}
          </div>

          <div className="flex items-center gap-3 mt-8 sm:justify-end">
            <button
              onClick={closeModal}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>

            {!selectedLeave && isEmployee && activeSection === "partA" && (
              <button
                onClick={handleSubmitLeaveRequest}
                className="rounded-lg bg-slate-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                disabled={!partA.employeeName || !partA.startDate || !partA.endDate || !partA.employeeSignature}
              >
                Submit Request
              </button>
            )}

            {(isHR || isAdmin || isSupervisor) && !selectedLeave && (
              <button
                onClick={() => {
                  // Save current section and move to next or submit
                  if (activeSection === "partA") setActiveSection("partB");
                  else if (activeSection === "partB") setActiveSection("partC");
                  else if (activeSection === "partC") setActiveSection("partD");
                  else handleSubmitLeaveRequest();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {activeSection === "partD" ? "Complete Review" : "Save & Continue"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const status = eventInfo.event.extendedProps.status;
  const colorClass =
    status === "approved"
      ? "success"
      : status === "rejected"
        ? "danger"
        : "warning";

  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
      {eventInfo.event.extendedProps.status === "pending" && (
        <div className="fc-event-status">(Pending)</div>
      )}
    </div>
  );
};

export default Calendar;