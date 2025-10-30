"use client";

import { useEffect, useState } from "react";
import {
  addEmployeeActivity,
  getEmployeeActivities,
  deleteEmployeeActivity,
} from "@/actions/employee.activities.actions";
import {
  getEmployeeLeaveRequests,
  createLeaveRequest,
  updateLeaveRequestWithPartB
} from "@/actions/leaves.actions";
import { getEmployeeById } from "@/actions/employee.actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useModal } from "@/hooks/use-modal";
import ConcurrencyForm from "@/components/dashboard/employees/concurrence-form";
import { Plus, FileText, AlertCircle, CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";
import { PartASchema, PartBSchema, type PartAData, type PartBData } from "@/schemas";

interface Activity {
  _id: string;
  type: string;
  description: string;
  date: string;
  partBData?: PartBData;
  status?: "pending" | "approved" | "rejected";
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
    employment_number?: string;
    position?: string;
    phone?: string;
    email?: string;
    current_address?: string;
  };
  legal_info?: any;
  education_history?: any;
  employment_history?: any;
  references?: any;
}

export default function EmployeeTimeline({
  employeeId,
}: {
  employeeId: string;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [type, setType] = useState("");
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(false);

  // FIXED: Simplified modal state - using useState instead of useModal hook
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);

  // Part B Dialog state
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isPartBDialogOpen, setIsPartBDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Leave Form state
  const [leaveForm, setLeaveForm] = useState({
    // Personal Information (from employee form)
    employeeName: "",
    employmentNumber: "",
    employeePosition: "",
    email: "",
    phoneNumber: "",
    currentAddress: "",

    // Leave Specific Information
    leaveType: "annual",
    numberOfLeaveDays: 0,
    startDate: "",
    endDate: "",
    locationDuringLeave: "",
    reason: "",

    // Dates and Signature
    dateOfRequest: new Date().toISOString().split('T')[0],
    employeeSignature: "",
  });

  // Part B Form state
  const [partBForm, setPartBForm] = useState<PartBData>({
    annualLeaveDays: 21,
    deductedDays: 0,
    remainingLeaveDays: 21,
    dateOfApproval: undefined,
    hrSignature: "",
  });

  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);

  // Initialize leave form with correct employee data structure
  const initializeLeaveFormWithEmployeeData = (employee: EmployeeData) => {
    if (!employee?.employee_details) {
      console.log("No employee details found");
      return;
    }

    const employeeDetails = employee.employee_details;
    const employeeName = `${employeeDetails.other_names || ''} ${employeeDetails.surname || ''}`.trim();
    const employmentNumber = employeeDetails.employment_number || "";
    const employeePosition = employeeDetails.position || "";
    const phoneNumber = employeeDetails.phone || "";
    const email = employeeDetails.email || "";
    const currentAddress = employeeDetails.current_address || "";

    console.log("Initializing form with employee data:", {
      employeeName,
      employmentNumber,
      employeePosition,
      phoneNumber,
      email,
      currentAddress
    });

    setLeaveForm(prev => ({
      ...prev,
      employeeName,
      employmentNumber,
      employeePosition,
      phoneNumber,
      email,
      currentAddress,
    }));
  };

  // Load data
  async function loadEmployeeData() {
    try {
      setIsLoadingEmployeeData(true);
      console.log("Loading employee data for ID:", employeeId);
      const employee = await getEmployeeById(employeeId);
      console.log("Loaded employee data:", employee);
      
      if (employee) {
        setEmployeeData(employee);
        initializeLeaveFormWithEmployeeData(employee);
      } else {
        console.error("No employee data returned");
      }
    } catch (error) {
      console.error("Failed to load employee data:", error);
    } finally {
      setIsLoadingEmployeeData(false);
    }
  }

  async function loadActivities() {
    const data = await getEmployeeActivities(employeeId);
    if (!("error" in data)) setActivities(data as Activity[]);
  }

  async function loadLeaveRequests() {
    try {
      const requests = await getEmployeeLeaveRequests(employeeId);
      if (Array.isArray(requests)) {
        const filteredRequests = requests.filter(request =>
          request.status === 'pending' || request.status === 'approved'
        );
        setLeaveRequests(filteredRequests);
      }
    } catch (error) {
      console.error("Failed to load leave requests:", error);
    }
  }

  useEffect(() => {
    loadActivities();
    loadLeaveRequests();
    loadEmployeeData();
  }, [employeeId]);

  // FIXED: Simplified handleTypeChange function
  const handleTypeChange = async (value: string) => {
    console.log("Activity type selected:", value);
    setType(value);
    
    if (value === "leave") {
      // Ensure employee data is loaded before opening the modal
      if (!employeeData) {
        console.log("Loading employee data before opening leave modal...");
        setIsLoadingEmployeeData(true);
        await loadEmployeeData();
      }
      await loadLeaveRequests();
      console.log("Opening leave modal");
      setIsLeaveModalOpen(true);
    } else if (value === "concurrency") {
      // Ensure employee data is loaded before opening the modal
      if (!employeeData) {
        setIsLoadingEmployeeData(true);
        await loadEmployeeData();
      }
      console.log("Opening concurrency modal");
      setIsConcurrencyModalOpen(true);
    }
  };

  // FIXED: Enhanced leave modal open handler to ensure data is loaded
  useEffect(() => {
    if (isLeaveModalOpen && employeeData) {
      console.log("Re-initializing form with employee data");
      // Re-initialize form with latest employee data when modal opens
      initializeLeaveFormWithEmployeeData(employeeData);
    }
  }, [isLeaveModalOpen, employeeData]);

  // FIXED: Modal close handlers
  const handleLeaveModalClose = () => {
    console.log("Closing leave modal");
    // Reset form but keep basic employee information
    if (employeeData) {
      initializeLeaveFormWithEmployeeData(employeeData);
    }

    // Only reset leave-specific fields
    setLeaveForm(prev => ({
      ...prev,
      leaveType: "annual",
      numberOfLeaveDays: 0,
      startDate: "",
      endDate: "",
      locationDuringLeave: "",
      reason: "",
      dateOfRequest: new Date().toISOString().split('T')[0],
      employeeSignature: "",
    }));

    setSelectedLeaveRequest(null);
    setValidationErrors({});
    setType("");
    setIsLeaveModalOpen(false);
  };

  const handleConcurrencyModalClose = () => {
    console.log("Closing concurrency modal");
    setType("");
    setIsConcurrencyModalOpen(false);
  };

  async function handleDelete(id: string) {
    await deleteEmployeeActivity(id);
    await loadActivities();
  }

  // Part B Functions
  const handleViewPartB = (activity: Activity) => {
    setSelectedActivity(activity);
    if (activity.partBData) {
      setPartBForm(activity.partBData);
    }
    setIsEditMode(false);
    setIsPartBDialogOpen(true);
  };

  const handleEditPartB = async (activity: Activity) => {
    setSelectedActivity(activity);

    // Find the corresponding leave request to get the actual days
    const leaveRequest = leaveRequests.find(req =>
      activity.description.includes(req._id) ||
      activity.description.includes(`Leave Request: ${req.leaveType}`)
    );

    if (activity.partBData) {
      setPartBForm(activity.partBData);
    } else {
      const extractedDays = leaveRequest?.days || extractDaysFromDescription(activity.description);
      setPartBForm({
        annualLeaveDays: 21,
        deductedDays: extractedDays,
        remainingLeaveDays: 21 - extractedDays,
        dateOfApproval: new Date(),
        hrSignature: "",
      });
    }
    setIsEditMode(true);
    setIsPartBDialogOpen(true);
  };

  const extractDaysFromDescription = (description: string): number => {
    const match = description.match(/(\d+)\s+days/);
    return match ? parseInt(match[1]) : 0;
  };

  const handlePartBFormChange = (field: keyof PartBData, value: any) => {
    setPartBForm(prev => {
      const updated = { ...prev, [field]: value };

      if (field === "deductedDays" || field === "annualLeaveDays") {
        const annual = field === "annualLeaveDays" ? value : prev.annualLeaveDays || 21;
        const deducted = field === "deductedDays" ? value : prev.deductedDays || 0;
        updated.remainingLeaveDays = annual - deducted;
      }

      return updated;
    });
  };

  const handleSavePartB = async () => {
    try {
      PartBSchema.parse(partBForm);

      // Save Part B data to the leave request
      if (selectedActivity) {
        // Find the corresponding leave request
        const leaveRequest = leaveRequests.find(req =>
          selectedActivity.description.includes(req._id)
        );

        if (leaveRequest) {
          const result = await updateLeaveRequestWithPartB(leaveRequest._id, partBForm);
          if ("success" in result) {
            // Update local state
            setActivities(prev =>
              prev.map(act =>
                act._id === selectedActivity?._id
                  ? { ...act, partBData: partBForm, status: "approved" }
                  : act
              )
            );

            // Update leave requests
            setLeaveRequests(prev =>
              prev.map(req =>
                req._id === leaveRequest._id
                  ? { ...req, partBData: partBForm, status: "approved" }
                  : req
              )
            );
          }
        }
      }

      setIsPartBDialogOpen(false);
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to save Part B:", error);
      alert("Failed to save Part B data");
    }
  };

  // Leave Form Functions
  const validateLeaveForm = (): boolean => {
    try {
      const formData: PartAData = {
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
      };

      PartASchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  const handleLeaveFormChange = (field: string, value: any) => {
    setLeaveForm(prev => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === "startDate" || field === "endDate") {
      const startDate = field === "startDate" ? value : leaveForm.startDate;
      const endDate = field === "endDate" ? value : leaveForm.endDate;

      if (startDate && endDate) {
        const numberOfDays = calculateDaysDifference(new Date(startDate), new Date(endDate));
        setLeaveForm(prev => ({ ...prev, numberOfLeaveDays: numberOfDays }));
      }
    }
  };

  const handleSelectLeaveRequest = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setLeaveForm(prev => ({
      ...prev,
      leaveType: request.leaveType,
      startDate: new Date(request.startDate).toISOString().split('T')[0],
      endDate: new Date(request.endDate).toISOString().split('T')[0],
      numberOfLeaveDays: request.days,
      reason: request.reason || "",
    }));
  };

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleLeaveFormSubmit = async () => {
    if (!validateLeaveForm()) {
      return;
    }

    try {
      // Prepare Part A data
      const partAData: PartAData = {
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
      };

      // Create leave request in the leave_requests collection
      const leaveRequestData = {
        employeeId,
        leaveType: leaveForm.leaveType,
        startDate: new Date(leaveForm.startDate),
        endDate: new Date(leaveForm.endDate),
        days: leaveForm.numberOfLeaveDays,
        reason: leaveForm.reason,
        status: "pending",
      };

      const result = await createLeaveRequest(leaveRequestData, partAData);

      if ("success" in result) {
        // Also create an activity entry for the timeline
        const leaveDescription = `Leave Request: ${leaveForm.leaveType} - ${leaveForm.numberOfLeaveDays} days from ${leaveForm.startDate} to ${leaveForm.endDate}. Location: ${leaveForm.locationDuringLeave}${leaveForm.reason ? `. Reason: ${leaveForm.reason}` : ''}`;

        await addEmployeeActivity({
          employeeId,
          type: "leave",
          description: leaveDescription,
        });

        handleLeaveModalClose();
        await loadActivities();
        await loadLeaveRequests();
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      alert("Failed to submit leave request. Please try again.");
    }
  };

  const handleConcurrencySuccess = () => {
    addEmployeeActivity({
      employeeId,
      type: "concurrency",
      description: "Concurrency declaration submitted",
    }).then(() => {
      loadActivities();
    });

    setType("");
    setIsConcurrencyModalOpen(false);
  };

  // UI Helper Functions
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const renderError = (field: string) => {
    if (validationErrors[field]) {
      return (
        <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{validationErrors[field]}</span>
        </div>
      );
    }
    return null;
  };

  // Render Components
  const renderLeaveRequestSelection = () => (
    <div className="space-y-4 mb-6">
      <h4 className="font-medium text-gray-700">Select from Existing Leave Requests</h4>
      {leaveRequests.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
          {leaveRequests.map((request) => (
            <div
              key={request._id}
              className={`p-3 border rounded cursor-pointer transition-colors ${selectedLeaveRequest?._id === request._id
                ? "bg-blue-50 border-blue-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              onClick={() => handleSelectLeaveRequest(request)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium capitalize">{request.leaveType} Leave</p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{request.days} days</p>
                  <p className={`text-xs px-2 py-1 rounded-full ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {request.status}
                  </p>
                </div>
              </div>
              {request.reason && (
                <p className="text-sm text-gray-500 mt-1">{request.reason}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No pending or approved leave requests found.
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <p className="text-sm text-gray-600 text-center">
        Fill out the form below manually
      </p>
    </div>
  );

  const renderPartBView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Part B - HR Section</h3>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-600">Annual Leave Days</label>
          <p className="text-lg font-semibold">{partBForm.annualLeaveDays}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Deducted Days</label>
          <p className="text-lg font-semibold text-red-600">{partBForm.deductedDays}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Remaining Leave Days</label>
          <p className="text-lg font-semibold text-green-600">{partBForm.remainingLeaveDays}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Date of Approval</label>
          <p className="text-lg font-semibold">
            {partBForm.dateOfApproval
              ? new Date(partBForm.dateOfApproval).toLocaleDateString()
              : "Not set"}
          </p>
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-600">HR Signature</label>
          <p className="text-lg font-semibold">{partBForm.hrSignature || "Not signed"}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsPartBDialogOpen(false)}>Close</Button>
        <Button onClick={() => setIsEditMode(true)}>Edit</Button>
      </div>
    </div>
  );

  const renderPartBEdit = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Part B - HR Section (Edit)</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Annual Leave Days *
          </label>
          <input
            type="number"
            value={partBForm.annualLeaveDays}
            onChange={(e) => handlePartBFormChange("annualLeaveDays", parseInt(e.target.value))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
            min="0"
            max="365"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Deducted Days *
          </label>
          <input
            type="number"
            value={partBForm.deductedDays}
            onChange={(e) => handlePartBFormChange("deductedDays", parseInt(e.target.value))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
            min="0"
            max="365"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Remaining Leave Days
          </label>
          <input
            type="number"
            value={partBForm.remainingLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Approval
          </label>
          <input
            type="date"
            value={partBForm.dateOfApproval ? new Date(partBForm.dateOfApproval).toISOString().split('T')[0] : ""}
            onChange={(e) => handlePartBFormChange("dateOfApproval", e.target.value ? new Date(e.target.value) : undefined)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            HR Signature
          </label>
          <input
            type="text"
            value={partBForm.hrSignature}
            onChange={(e) => handlePartBFormChange("hrSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm"
            placeholder="Enter HR signature"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          setIsEditMode(false);
          if (selectedActivity?.partBData) {
            setPartBForm(selectedActivity.partBData);
          }
        }}>Cancel</Button>
        <Button onClick={handleSavePartB}>Save Part B</Button>
      </div>
    </div>
  );

  const renderLeaveForm = () => (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
      <h3 className="text-lg font-semibold text-gray-800">Leave Request Form (Part A)</h3>

      {/* Show loading state if employee data is still loading */}
      {isLoadingEmployeeData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Loading employee information...</span>
          </div>
        </div>
      )}

      {/* Employee Information Summary */}
      {employeeData?.employee_details && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-800 mb-2">Employee Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-600">Name:</span> {leaveForm.employeeName}
            </div>
            <div>
              <span className="text-blue-600">Employment #:</span> {leaveForm.employmentNumber}
            </div>
            <div>
              <span className="text-blue-600">Position:</span> {leaveForm.employeePosition}
            </div>
            <div>
              <span className="text-blue-600">Phone:</span> {leaveForm.phoneNumber}
            </div>
            {leaveForm.email && (
              <div>
                <span className="text-blue-600">Email:</span> {leaveForm.email}
              </div>
            )}
            {leaveForm.currentAddress && (
              <div className="col-span-2">
                <span className="text-blue-600">Address:</span> {leaveForm.currentAddress}
              </div>
            )}
          </div>
        </div>
      )}

      {renderLeaveRequestSelection()}

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
            value={leaveForm.employeeName}
            onChange={(e) => handleLeaveFormChange("employeeName", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
          {renderError("employeeName")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employment Number *
          </label>
          <input
            type="text"
            value={leaveForm.employmentNumber}
            onChange={(e) => handleLeaveFormChange("employmentNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
          {renderError("employmentNumber")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Position *
          </label>
          <input
            type="text"
            value={leaveForm.employeePosition}
            onChange={(e) => handleLeaveFormChange("employeePosition", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
          {renderError("employeePosition")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input
            type="tel"
            value={leaveForm.phoneNumber}
            onChange={(e) => handleLeaveFormChange("phoneNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800"
            required
            readOnly
            placeholder={isLoadingEmployeeData ? "Loading..." : ""}
          />
          {renderError("phoneNumber")}
        </div>

        {/* Leave Specific Information */}
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            Number of Leave Days *
          </label>
          <input
            type="number"
            value={leaveForm.numberOfLeaveDays}
            className={`h-11 w-full rounded-lg border ${validationErrors.numberOfLeaveDays ? 'border-red-500' : 'border-gray-300'} bg-gray-100 px-4 py-2.5 text-sm text-gray-800`}
            disabled
          />
          {renderError("numberOfLeaveDays")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            type="date"
            value={leaveForm.startDate}
            onChange={(e) => handleLeaveFormChange("startDate", e.target.value)}
            className={`h-11 w-full rounded-lg border ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300'} bg-transparent px-4 py-2.5 text-sm text-gray-800`}
            required
          />
          {renderError("startDate")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            End Date *
          </label>
          <input
            type="date"
            value={leaveForm.endDate}
            onChange={(e) => handleLeaveFormChange("endDate", e.target.value)}
            className={`h-11 w-full rounded-lg border ${validationErrors.endDate ? 'border-red-500' : 'border-gray-300'} bg-transparent px-4 py-2.5 text-sm text-gray-800`}
            required
          />
          {renderError("endDate")}
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Location/Address During Leave *
          </label>
          <input
            type="text"
            value={leaveForm.locationDuringLeave}
            onChange={(e) => handleLeaveFormChange("locationDuringLeave", e.target.value)}
            className={`h-11 w-full rounded-lg border ${validationErrors.locationDuringLeave ? 'border-red-500' : 'border-gray-300'} bg-transparent px-4 py-2.5 text-sm text-gray-800`}
            required
            placeholder="Where will you be during your leave?"
          />
          {renderError("locationDuringLeave")}
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Reason for Leave
          </label>
          <textarea
            value={leaveForm.reason}
            onChange={(e) => handleLeaveFormChange("reason", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            rows={3}
            placeholder="Please provide a reason for your leave (optional)"
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
            value={leaveForm.dateOfRequest}
            onChange={(e) => handleLeaveFormChange("dateOfRequest", e.target.value)}
            className={`h-11 w-full rounded-lg border ${validationErrors.dateOfRequest ? 'border-red-500' : 'border-gray-300'} bg-transparent px-4 py-2.5 text-sm text-gray-800`}
          />
          {renderError("dateOfRequest")}
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Signature *
          </label>
          <input
            type="text"
            value={leaveForm.employeeSignature}
            onChange={(e) => handleLeaveFormChange("employeeSignature", e.target.value)}
            className={`h-11 w-full rounded-lg border ${validationErrors.employeeSignature ? 'border-red-500' : 'border-gray-300'} bg-transparent px-4 py-2.5 text-sm text-gray-800`}
            placeholder="Type your full name as signature"
            required
          />
          {renderError("employeeSignature")}
          <p className="text-xs text-gray-500 mt-1">
            By signing, I declare that the information provided is true and correct
          </p>
        </div>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertCircle className="h-5 w-5" />
            <span>Please fix the following errors:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleLeaveModalClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleLeaveFormSubmit}
          disabled={isLoadingEmployeeData}
        >
          {isLoadingEmployeeData ? "Loading..." : "Submit Leave Request"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Employee Timeline</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
              <DialogDescription>
                Select an activity type to open the corresponding form.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={handleTypeChange} value={type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="concurrency">Concurrency Declaration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline Activities */}
      <div className="space-y-4">
        {activities.map((act) => (
          <Card key={act._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{act.type === 'leave' ? act.description.split(' - ')[0] : 'Concurrency Declaration'}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4" />
                      <span>Submitted: {new Date(act.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {act.type === 'leave' && getStatusBadge(act.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>{act.description}</p>
                  {act.type === 'leave' && act.partBData && (
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="font-medium">Annual: {act.partBData.annualLeaveDays} days</span>
                      <span className="font-medium text-red-600">Deducted: {act.partBData.deductedDays} days</span>
                      <span className="font-medium text-green-600">Remaining: {act.partBData.remainingLeaveDays} days</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {act.type === 'leave' ? (
                    act.partBData ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPartB(act)}
                        >
                          View Part B
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEditPartB(act)}
                        >
                          Edit Part B
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleEditPartB(act)}
                      >
                        Add Part B
                      </Button>
                    )
                  ) : null}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(act._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600">No activities recorded yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Use the "Add Activity" button to add new entries
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* FIXED: Leave Form Modal - using direct state management */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={handleLeaveModalClose}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        {renderLeaveForm()}
      </Modal>

      {/* FIXED: Concurrency Declaration Modal */}
      <Dialog open={isConcurrencyModalOpen} onOpenChange={setIsConcurrencyModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Concurrency Declaration Form
            </DialogTitle>
            <DialogDescription>
              Complete the concurrence declaration for {employeeData?.employee_details ? `${employeeData.employee_details.other_names} ${employeeData.employee_details.surname}` : 'this employee'}.
            </DialogDescription>
          </DialogHeader>
          <ConcurrencyForm
            employee={employeeData}
            mode="create"
            onSuccess={handleConcurrencySuccess}
            onCancel={handleConcurrencyModalClose}
          />
        </DialogContent>
      </Dialog>

      {/* Part B Dialog */}
      <Dialog open={isPartBDialogOpen} onOpenChange={setIsPartBDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request - Part B (HR Section)</DialogTitle>
            <DialogDescription>
              {selectedActivity?.description}
            </DialogDescription>
          </DialogHeader>

          {isEditMode ? renderPartBEdit() : renderPartBView()}
        </DialogContent>
      </Dialog>
    </div>
  );
}