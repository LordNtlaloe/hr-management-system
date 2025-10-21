"use client";

import { useEffect, useState } from "react";
import {
  addEmployeeActivity,
  getEmployeeActivities,
  deleteEmployeeActivity,
} from "@/actions/employee.activities.actions";
import { getEmployeeLeaveRequests } from "@/actions/leaves.actions";
import { getEmployeeById } from "@/actions/employee.actions";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, FileText } from "lucide-react";

interface Activity {
  _id: string;
  type: string;
  description: string;
  date: string;
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
}

// Types for the leave form
interface LeaveFormData {
  employeeName: string;
  employmentNumber: string;
  employeePosition: string;
  numberOfLeaveDays: number;
  startDate: string;
  endDate: string;
  locationDuringLeave: string;
  phoneNumber: string;
  dateOfRequest: string;
  employeeSignature: string;
  leaveType: string;
  reason?: string;
}

export default function EmployeeTimeline({
  employeeId,
}: {
  employeeId: string;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [type, setType] = useState("");
  const [employeeData, setEmployeeData] = useState<any>(null);

  // Modals for different forms
  const { isOpen: isLeaveModalOpen, openModal: openLeaveModal, closeModal: closeLeaveModal } = useModal();
  const { isOpen: isConcurrencyModalOpen, openModal: openConcurrencyModal, closeModal: closeConcurrencyModal } = useModal();

  // Leave Form State - Initialize with empty values, will be populated when employee data loads
  const [leaveForm, setLeaveForm] = useState<LeaveFormData>({
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
    leaveType: "annual",
    reason: "",
  });

  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);

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

  async function loadEmployeeData() {
    try {
      const employee = await getEmployeeById(employeeId);
      if (employee) {
        setEmployeeData(employee);

        // Pre-fill employee details in leave form
        const employeeName = `${employee.first_name} ${employee.last_name}`.trim();
        const employmentNumber = employee.employment_number || "";
        const employeePosition = employee.position || "";
        const phoneNumber = employee.phone || "";

        setLeaveForm(prev => ({
          ...prev,
          employeeName,
          employmentNumber,
          employeePosition,
          phoneNumber,
        }));
      }
    } catch (error) {
      console.error("Failed to load employee data:", error);
    }
  }

  useEffect(() => {
    loadActivities();
    loadLeaveRequests();
    loadEmployeeData();
  }, [employeeId]);

  // Handle activity type change - open appropriate modal
  const handleTypeChange = async (value: string) => {
    setType(value);
    if (value === "leave") {
      await loadLeaveRequests();
      await loadEmployeeData(); // Ensure latest employee data is loaded
      openLeaveModal();
    } else if (value === "concurrency") {
      await loadEmployeeData(); // Ensure latest employee data is loaded
      openConcurrencyModal();
    }
  };

  async function handleDelete(id: string) {
    await deleteEmployeeActivity(id);
    await loadActivities();
  }

  // Handle Leave Form changes
  const handleLeaveFormChange = (field: string, value: any) => {
    setLeaveForm(prev => ({ ...prev, [field]: value }));

    // Recalculate days if dates change
    if ((field === "startDate" || field === "endDate") && leaveForm.startDate && leaveForm.endDate) {
      const numberOfDays = calculateDaysDifference(new Date(leaveForm.startDate), new Date(leaveForm.endDate));
      setLeaveForm(prev => ({ ...prev, numberOfLeaveDays: numberOfDays }));
    }
  };

  // Pre-fill leave form with selected leave request
  const handleSelectLeaveRequest = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setLeaveForm(prev => ({
      ...prev,
      startDate: new Date(request.startDate).toISOString().split('T')[0],
      endDate: new Date(request.endDate).toISOString().split('T')[0],
      numberOfLeaveDays: request.days,
      leaveType: request.leaveType,
      reason: request.reason || "",
      locationDuringLeave: request.reason || "",
    }));
  };

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Submit the leave form and create activity
  const handleLeaveFormSubmit = async () => {
    if (!leaveForm.employeeName || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.employeeSignature) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const leaveDescription = `Leave Request: ${leaveForm.leaveType} - ${leaveForm.numberOfLeaveDays} days from ${leaveForm.startDate} to ${leaveForm.endDate}. Location: ${leaveForm.locationDuringLeave}`;

      const finalDescription = selectedLeaveRequest
        ? `${leaveDescription} (Based on Leave Request: ${selectedLeaveRequest._id})`
        : leaveDescription;

      const result = await addEmployeeActivity({
        employeeId,
        type: "leave",
        description: finalDescription,
      });

      if ("success" in result) {
        // Reset form but keep employee data
        setLeaveForm(prev => ({
          ...prev,
          numberOfLeaveDays: 0,
          startDate: "",
          endDate: "",
          locationDuringLeave: "",
          dateOfRequest: new Date().toISOString().split('T')[0],
          employeeSignature: "",
          leaveType: "annual",
          reason: "",
        }));
        setSelectedLeaveRequest(null);
        setType("");
        closeLeaveModal();
        await loadActivities();
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    }
  };

  // Handle concurrency form success
  const handleConcurrencySuccess = () => {
    // Create activity record for concurrency declaration
    addEmployeeActivity({
      employeeId,
      type: "concurrency",
      description: "Concurrency declaration submitted",
    }).then(() => {
      loadActivities();
    });

    setType("");
    closeConcurrencyModal();
  };

  // Reset leave form when modal closes (but keep employee data)
  const handleLeaveModalClose = () => {
    if (employeeData) {
      const employeeName = `${employeeData.first_name} ${employeeData.last_name}`.trim();
      const employmentNumber = employeeData.employment_number || "";
      const employeePosition = employeeData.position || "";
      const phoneNumber = employeeData.phone || "";

      setLeaveForm(prev => ({
        ...prev,
        employeeName,
        employmentNumber,
        employeePosition,
        phoneNumber,
        numberOfLeaveDays: 0,
        startDate: "",
        endDate: "",
        locationDuringLeave: "",
        dateOfRequest: new Date().toISOString().split('T')[0],
        employeeSignature: "",
        leaveType: "annual",
        reason: "",
      }));
    }
    setSelectedLeaveRequest(null);
    setType("");
    closeLeaveModal();
  };

  // Render Leave Request Selection
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

  // Render Leave Form
  const renderLeaveForm = () => (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
      <h3 className="text-lg font-semibold text-gray-800">Leave Request Form</h3>
      <p className="text-sm text-gray-600">
        Employee: {employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : 'Loading...'}
      </p>

      {renderLeaveRequestSelection()}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Name *
          </label>
          <input
            type="text"
            value={leaveForm.employeeName}
            onChange={(e) => handleLeaveFormChange("employeeName", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Position *
          </label>
          <input
            type="text"
            value={leaveForm.employeePosition}
            onChange={(e) => handleLeaveFormChange("employeePosition", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Leave Type
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
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Number of Leave Days
          </label>
          <input
            type="number"
            value={leaveForm.numberOfLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Location/Address During Leave *
          </label>
          <input
            type="text"
            value={leaveForm.locationDuringLeave}
            onChange={(e) => handleLeaveFormChange("locationDuringLeave", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            required
            placeholder="Where will you be during your leave?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input
            type="tel"
            value={leaveForm.phoneNumber}
            onChange={(e) => handleLeaveFormChange("phoneNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Request
          </label>
          <input
            type="date"
            value={leaveForm.dateOfRequest}
            onChange={(e) => handleLeaveFormChange("dateOfRequest", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Reason for Leave (Optional)
          </label>
          <textarea
            value={leaveForm.reason}
            onChange={(e) => handleLeaveFormChange("reason", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            rows={3}
            placeholder="Optional reason for leave"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            placeholder="Type your full name as signature"
            required
          />
        </div>
      </div>

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
          disabled={!leaveForm.employeeName || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.employeeSignature}
        >
          Submit Leave Request
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Activities List */}
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

      {/* Timeline - Show all activities */}
      <div className="space-y-4">
        {activities.map((act) => (
          <Card key={act._id}>
            <CardContent className="flex justify-between items-center py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Date(act.date).toLocaleDateString()}
                </p>
                <p className="font-semibold capitalize">{act.type}</p>
                <p>{act.description}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(act._id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {activities.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No activities recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Use the "Add Activity" button to add new entries.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leave Form Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={handleLeaveModalClose}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        {renderLeaveForm()}
      </Modal>

      {/* Concurrency Declaration Modal */}
      <Dialog open={isConcurrencyModalOpen} onOpenChange={closeConcurrencyModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Concurrency Declaration Form
            </DialogTitle>
            <DialogDescription>
              Complete the concurrence declaration for {employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : 'this employee'}.
            </DialogDescription>
          </DialogHeader>
          <ConcurrencyForm
            employee={employeeData}
            mode="create"
            onSuccess={handleConcurrencySuccess}
            onCancel={() => {
              closeConcurrencyModal();
              setType("");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}