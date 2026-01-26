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
  validateLeaveRequest,
  getRemainingLeaveDays,
} from "@/actions/leaves.actions";
import { getEmployeeByUserId, getEmployeeById } from "@/actions/employee.actions";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AlertCircle, CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { PartAData, PartBData } from "@/schemas";
import { toast } from "sonner"; // Import Sonner toast

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

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  employeeId?: any;
  partAData?: PartAData;
  partBData?: PartBData;
}

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
  employee_number?: any
}

interface CalendarProps {
  employeeId?: string;
}

const Calendar: React.FC<CalendarProps> = ({ employeeId: propEmployeeId }) => {
  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(propEmployeeId || null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(false);
  const [activeSection, setActiveSection] = useState<"partA" | "partB" | "partC" | "partD">("partA");
  const [remainingLeaveDays, setRemainingLeaveDays] = useState<number>(21);
  const [validationError, setValidationError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Part A: Employee Section - Pre-filled with employee data
  const [partA, setPartA] = useState({
    employeeName: "",
    employmentNumber: "",
    employeePosition: "",
    numberOfLeaveDays: 0,
    startDate: "",
    endDate: "",
    locationDuringLeave: "",
    phoneNumber: "",
    email: "",
    currentAddress: "",
    dateOfRequest: getCurrentDate(), // Always current date
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

  // Load remaining leave days
  const loadRemainingLeaveDays = async (targetEmployeeId: string) => {
    try {
      const remaining = await getRemainingLeaveDays(targetEmployeeId);
      setRemainingLeaveDays(remaining);
      
      // Update Part B with current balance
      setPartB(prev => ({
        ...prev,
        annualLeaveDays: 21, // Default allocation
        remainingLeaveDays: remaining
      }));
      
      console.log("📊 Loaded remaining leave days:", remaining);
    } catch (error) {
      console.error("Failed to load remaining leave days:", error);
    }
  };

  // Initialize leave form with employee data
  const initializeLeaveFormWithEmployeeData = (employee: EmployeeData) => {
    if (!employee?.employee_details) {
      console.log("No employee details found in calendar");
      return;
    }

    const employeeDetails = employee.employee_details;
    const employeeName = `${employeeDetails.other_names || ''} ${employeeDetails.surname || ''}`.trim();
    const employmentNumber = employee.employee_number || "";
    const employeePosition = employeeDetails.position || "";
    const phoneNumber = employeeDetails.telephone || "";
    const email = employeeDetails.email || "";
    const currentAddress = employeeDetails.current_address || "";

    console.log("Calendar: Initializing form with employee data:", {
      employeeName,
      employmentNumber,
      employeePosition,
      phoneNumber,
      email,
      currentAddress
    });

    setPartA(prev => ({
      ...prev,
      employeeName,
      employmentNumber,
      employeePosition,
      phoneNumber,
      email,
      currentAddress,
      dateOfRequest: getCurrentDate(), // Always current date
    }));
  };

  // Load employee data
  const loadEmployeeData = async (targetEmployeeId: string) => {
    try {
      setIsLoadingEmployeeData(true);
      console.log("Calendar: Loading employee data for ID:", targetEmployeeId);
      const employee = await getEmployeeById(targetEmployeeId);
      console.log("Calendar: Loaded employee data:", employee);

      if (employee) {
        setEmployeeData(employee);
        initializeLeaveFormWithEmployeeData(employee);
        await loadRemainingLeaveDays(targetEmployeeId);
      } else {
        console.error("Calendar: No employee data returned");
      }
    } catch (error) {
      console.error("Calendar: Failed to load employee data:", error);
    } finally {
      setIsLoadingEmployeeData(false);
    }
  };

  // Resolve employeeId from userId (only if employee view)
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!propEmployeeId && user?.id && isEmployee) {
        const employee = await getEmployeeByUserId(user.id);
        if (employee && employee._id) {
          const targetEmployeeId = employee._id;
          setEmployeeId(targetEmployeeId);
          await loadEmployeeData(targetEmployeeId);
        }
      } else if (propEmployeeId) {
        // If employeeId is provided as prop, load that employee's data
        await loadEmployeeData(propEmployeeId);
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
        toast.error("Failed to load leave requests", {
          description: "Please try again later.",
          duration: 4000,
        });
      }
    };

    fetchLeaveEvents();
  }, [employeeId, isEmployee]);

  const calculateDaysDifference = (start: Date, end: Date) => {
    // Reset time portions to compare only dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    
    // Convert to days and add 1 to include both start and end dates
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    console.log("📅 Calendar day calculation:", {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      diffDays
    });
    
    return diffDays;
  };

  const validateLeaveDates = async (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr || !employeeId) return;

    setIsValidating(true);
    setValidationError("");

    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      // Basic date validation
      if (startDate > endDate) {
        const errorMsg = "Start date cannot be after end date";
        setValidationError(errorMsg);
        toast.error("Date Error", {
          description: errorMsg,
          duration: 4000,
        });
        return;
      }

      const validation = await validateLeaveRequest(
        employeeId,
        startDate,
        endDate,
        "Annual"
      );

      if (!validation.valid) {
        setValidationError(validation.message || "Invalid leave request");
        if (validation.message) {
          toast.error("Leave Balance Insufficient", {
            description: validation.message,
            duration: 5000,
          });
        }
      } else {
        setValidationError("");
        // Update remaining days display
        setRemainingLeaveDays(validation.availableDays);
      }
    } catch (error: any) {
      const errorMsg = error.message || "Validation failed";
      setValidationError(errorMsg);
      toast.error("Validation Error", {
        description: errorMsg,
        duration: 4000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDateSelect = async (selectInfo: DateSelectArg) => {
    if (!isEmployee) return;

    // Ensure employee data is loaded before opening modal
    if (!employeeData && employeeId) {
      console.log("Calendar: Loading employee data before opening modal...");
      setIsLoadingEmployeeData(true);
      await loadEmployeeData(employeeId);
    }

    resetModalFields();

    const startDateStr = selectInfo.startStr;
    const endDateStr = selectInfo.endStr ? 
      new Date(new Date(selectInfo.endStr).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
      startDateStr;
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const numberOfDays = calculateDaysDifference(startDate, endDate);

    console.log("📅 Date selection:", {
      startDateStr,
      endDateStr,
      numberOfDays
    });

    setPartA(prev => ({
      ...prev,
      startDate: startDateStr,
      endDate: endDateStr,
      numberOfLeaveDays: numberOfDays,
      dateOfRequest: getCurrentDate(), // Always current date
    }));

    // Auto-update Part B deducted days
    setPartB(prev => ({
      ...prev,
      deductedDays: numberOfDays,
      remainingLeaveDays: prev.annualLeaveDays - numberOfDays,
    }));

    // Validate leave request
    await validateLeaveDates(startDateStr, endDateStr);

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

  const handlePartAChange = async (field: string, value: any) => {
    const updatedPartA = { ...partA, [field]: value };
    setPartA(updatedPartA);

    // Recalculate days if dates change
    if ((field === "startDate" || field === "endDate") && 
        updatedPartA.startDate && updatedPartA.endDate) {
      
      const startDate = new Date(updatedPartA.startDate);
      const endDate = new Date(updatedPartA.endDate);
      const numberOfDays = calculateDaysDifference(startDate, endDate);
      
      setPartA(prev => ({ 
        ...prev, 
        [field]: value,
        numberOfLeaveDays: numberOfDays 
      }));

      // Update Part B
      setPartB(prev => ({
        ...prev,
        deductedDays: numberOfDays,
        remainingLeaveDays: prev.annualLeaveDays - numberOfDays,
      }));

      // Validate leave request
      await validateLeaveDates(updatedPartA.startDate, updatedPartA.endDate);
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
      toast.error("Submission Failed", {
        description: "Employee information not found. Please refresh the page.",
        duration: 5000,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Show loading toast
      const loadingToastId = toast.loading("Submitting leave request...", {
        description: "Please wait while we process your request.",
      });

      // Final validation before submission
      const startDate = new Date(partA.startDate);
      const endDate = new Date(partA.endDate);
      const validation = await validateLeaveRequest(employeeId, startDate, endDate, "Annual");
      
      if (!validation.valid) {
        setValidationError(validation.message || "Invalid leave request");
        toast.dismiss(loadingToastId);
        toast.error("Submission Failed", {
          description: validation.message || "Invalid leave request",
          duration: 5000,
        });
        setIsSubmitting(false);
        return;
      }

      const leaveData = {
        employeeId,
        leaveType: partA.numberOfLeaveDays > remainingLeaveDays ? LeaveType.UNPAID : LeaveType.ANNUAL,
        startDate: startDate,
        endDate: endDate,
        reason: partA.locationDuringLeave || "Annual leave request",
        days: partA.numberOfLeaveDays,
        // Include the form data for the new schema
        formData: {
          partA,
          partB,
          partC,
          partD,
        }
      };

      console.log("📤 Submitting leave request:", leaveData);

      const result = await createLeaveRequest(leaveData);

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

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
        
        // Show success toast
        toast.success("Leave Request Submitted Successfully!", {
          description: `Your ${leaveData.leaveType} leave request for ${partA.numberOfLeaveDays} days has been submitted. Request ID: ${result.insertedId?.substring(0, 8)}...`,
          duration: 6000,
          action: {
            label: "View",
            onClick: () => {
              // You could add navigation here if needed
              console.log("View leave request clicked");
            },
          },
        });
        
        closeModal();
        resetModalFields();
        
        // Refresh remaining leave days
        await loadRemainingLeaveDays(employeeId);
      } else {
        console.error("Failed to create leave request:", result.error);
        setValidationError(result.error || "Failed to submit leave request");
        
        // Show error toast
        toast.error("Submission Failed", {
          description: result.error || "Failed to submit leave request. Please try again.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Failed to submit leave request", error);
      setValidationError(error.message || "An error occurred");
      
      // Show error toast
      toast.error("Unexpected Error", {
        description: error.message || "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModalFields = () => {
    // Reset only leave-specific fields, keep employee information
    if (employeeData) {
      initializeLeaveFormWithEmployeeData(employeeData);
    }

    setPartA(prev => ({
      ...prev,
      numberOfLeaveDays: 0,
      startDate: "",
      endDate: "",
      locationDuringLeave: "",
      dateOfRequest: getCurrentDate(), // Always current date
      employeeSignature: "",
    }));

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

    setValidationError("");
    setIsValidating(false);
    setSelectedLeave(null);
    setActiveSection("partA");
  };

  const handleModalClose = () => {
    console.log("Calendar: Closing leave modal");
    resetModalFields();
    closeModal();
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

  const renderEventContent = (eventInfo: EventContentArg) => {
    const status = eventInfo.event.extendedProps.status;
    const bgColor = status === "approved" ? "bg-green-100" : 
                    status === "pending" ? "bg-yellow-100" : 
                    status === "rejected" ? "bg-red-100" : "bg-blue-100";
    
    const textColor = status === "approved" ? "text-green-800" : 
                     status === "pending" ? "text-yellow-800" : 
                     status === "rejected" ? "text-red-800" : "text-blue-800";
    
    return (
      <div className={`${bgColor} ${textColor} p-1 rounded text-xs`}>
        <strong>{eventInfo.event.title}</strong>
        <div>{status}</div>
      </div>
    );
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

  const renderLeaveBalanceInfo = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-blue-800 mb-1">Leave Balance Information</h4>
          <p className="text-sm text-blue-600">
            Annual Leave: {remainingLeaveDays} days remaining out of 21
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isValidating ? (
            <div className="flex items-center text-blue-600">
              <Clock className="h-4 w-4 animate-spin mr-1" />
              <span className="text-sm">Validating...</span>
            </div>
          ) : validationError ? (
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{validationError}</span>
            </div>
          ) : partA.startDate && partA.endDate ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {partA.numberOfLeaveDays} days selected. {remainingLeaveDays - partA.numberOfLeaveDays} days will remain.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderEmployeeInformationSummary = () => (
    employeeData?.employee_details && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-green-800 mb-2">Employee Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-green-600">Name:</span> {partA.employeeName}
          </div>
          <div>
            <span className="text-green-600">Employment #:</span> {partA.employmentNumber}
          </div>
          <div>
            <span className="text-green-600">Position:</span> {partA.employeePosition}
          </div>
          <div>
            <span className="text-green-600">Phone:</span> {partA.phoneNumber}
          </div>
          {partA.email && (
            <div>
              <span className="text-green-600">Email:</span> {partA.email}
            </div>
          )}
          {partA.currentAddress && (
            <div className="col-span-2">
              <span className="text-green-600">Address:</span> {partA.currentAddress}
            </div>
          )}
          <div className="col-span-2 mt-2 pt-2 border-t border-green-200">
            <span className="text-green-600">Date of Request:</span> {partA.dateOfRequest}
          </div>
        </div>
      </div>
    )
  );

  const renderPartA = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part A: Employee Information</h3>

      {/* Show loading state if employee data is still loading */}
      {isLoadingEmployeeData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Loading employee information...</span>
          </div>
        </div>
      )}

      {renderLeaveBalanceInfo()}
      {renderEmployeeInformationSummary()}

      <div className="grid grid-cols-2 gap-4">
        {/* Personal Information Section - Auto-filled and read-only */}
        <div className="col-span-2">
          <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Personal Information</h4>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Name *
          </label>
          <input
            type="text"
            value={partA.employeeName}
            onChange={(e) => handlePartAChange("employeeName", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employment Number *
          </label>
          <input
            type="text"
            value={partA.employmentNumber}
            onChange={(e) => handlePartAChange("employmentNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Position *
          </label>
          <input
            type="text"
            value={partA.employeePosition}
            onChange={(e) => handlePartAChange("employeePosition", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input
            type="tel"
            value={partA.phoneNumber}
            onChange={(e) => handlePartAChange("phoneNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
        </div>

        {/* Leave Specific Information */}
        <div className="col-span-2">
          <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Leave Details</h4>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            type="date"
            value={partA.startDate}
            onChange={(e) => handlePartAChange("startDate", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            End Date *
          </label>
          <input
            type="date"
            value={partA.endDate}
            onChange={(e) => handlePartAChange("endDate", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            required
            min={partA.startDate || new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Number of Leave Days *
          </label>
          <input
            type="number"
            value={partA.numberOfLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            disabled
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">
            Calculated automatically from dates
          </p>
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Location/Address During Leave *
          </label>
          <input
            type="text"
            value={partA.locationDuringLeave}
            onChange={(e) => handlePartAChange("locationDuringLeave", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            required
            placeholder="Where will you be during your leave?"
          />
        </div>

        {/* Signature Section */}
        <div className="col-span-2">
          <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Declaration</h4>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Request
          </label>
          <input
            type="date"
            value={partA.dateOfRequest}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            readOnly
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            Automatically set to today's date
          </p>
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Signature *
          </label>
          <input
            type="text"
            value={partA.employeeSignature}
            onChange={(e) => handlePartAChange("employeeSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            placeholder="Type your full name as signature"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            By signing, I declare that the information provided is true and correct
          </p>
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
            onChange={(e) => handlePartBChange("annualLeaveDays", parseInt(e.target.value) || 0)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            min="0"
            max="365"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Deducted Days
          </label>
          <input
            type="number"
            value={partB.deductedDays}
            onChange={(e) => handlePartBChange("deductedDays", parseInt(e.target.value) || 0)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            min="0"
            max={partB.annualLeaveDays}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Remaining Leave Days
          </label>
          <input
            type="number"
            value={partB.remainingLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
            disabled
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">
            {partB.remainingLeaveDays < 0 ? 
              "⚠️ Negative balance! Employee will go into leave debt." : 
              "Calculated automatically"}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Approval
          </label>
          <input
            type="date"
            value={partB.dateOfApproval}
            onChange={(e) => handlePartBChange("dateOfApproval", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            max={new Date().toISOString().split('T')[0]}
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            max={new Date().toISOString().split('T')[0]}
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled={!!selectedLeave}
            max={new Date().toISOString().split('T')[0]}
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Leave Calendar</h2>
          {isEmployee && (
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-blue-600">
                  Remaining Annual Leave: <strong>{remainingLeaveDays}</strong> days
                </span>
              </div>
              <button
                onClick={openModal}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                disabled={isSubmitting}
              >
                Request Leave +
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="custom-calendar p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={isEmployee && !isSubmitting}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          selectAllow={isSelectable}
          height="auto"
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col px-2 overflow-y-auto">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 text-xl lg:text-2xl">
              {selectedLeave ? "Leave Request Details" : "Leave Request Form"}
            </h5>
            <p className="text-sm text-gray-500">
              {selectedLeave
                ? "View leave request details across all sections"
                : "Complete the leave request form section by section"}
            </p>
          </div>

          {renderSectionNavigation()}

          <div className="mt-4">
            {renderCurrentSection()}
          </div>

          {validationError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{validationError}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8 sm:justify-end">
            <button
              onClick={handleModalClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Close
            </button>

            {!selectedLeave && isEmployee && activeSection === "partA" && (
              <button
                onClick={handleSubmitLeaveRequest}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  !partA.employeeName || 
                  !partA.startDate || 
                  !partA.endDate || 
                  !partA.employeeSignature || 
                  isLoadingEmployeeData || 
                  isValidating ||
                  !!validationError ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </span>
                ) : isLoadingEmployeeData ? "Loading..." : isValidating ? "Validating..." : "Submit Request"}
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
                disabled={isValidating || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : activeSection === "partD" ? "Complete Review" : "Save & Continue"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;