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
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/use-modal";

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

// Types for the multi-section form
interface PartAData {
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
  const [type, setType] = useState("leave");
  const [description, setDescription] = useState("");
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Part A State (Employee Section)
  const [partA, setPartA] = useState<PartAData>({
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

  async function loadActivities() {
    const data = await getEmployeeActivities(employeeId);
    if (!("error" in data)) setActivities(data as Activity[]);
  }

  async function loadLeaveRequests() {
    try {
      const requests = await getEmployeeLeaveRequests(employeeId);
      if (Array.isArray(requests)) {
        // Filter to only get pending or approved leave requests
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
        // Pre-fill employee details
        setPartA(prev => ({
          ...prev,
          employeeName: `${employee.first_name} ${employee.last_name}`.trim(),
          employmentNumber: employee.employment_number || "",
          employeePosition: employee.position || "",
          phoneNumber: employee.phone || "",
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

  // Handle activity type change - open leave form when "leave" is selected
  const handleTypeChange = async (value: string) => {
    setType(value);
    if (value === "leave") {
      // Load latest data before opening modal
      await loadLeaveRequests();
      await loadEmployeeData();
      openModal();
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description) return;

    const result = await addEmployeeActivity({
      employeeId,
      type: type as any,
      description,
    });

    if ("success" in result) {
      setDescription("");
      await loadActivities();
    }
  }

  async function handleDelete(id: string) {
    await deleteEmployeeActivity(id);
    await loadActivities();
  }

  // Handle Part A changes
  const handlePartAChange = (field: string, value: any) => {
    setPartA(prev => ({ ...prev, [field]: value }));

    // Recalculate days if dates change
    if ((field === "startDate" || field === "endDate") && partA.startDate && partA.endDate) {
      const numberOfDays = calculateDaysDifference(new Date(partA.startDate), new Date(partA.endDate));
      setPartA(prev => ({ ...prev, numberOfLeaveDays: numberOfDays }));
    }
  };

  // Pre-fill form with selected leave request
  const handleSelectLeaveRequest = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setPartA(prev => ({
      ...prev,
      startDate: new Date(request.startDate).toISOString().split('T')[0],
      endDate: new Date(request.endDate).toISOString().split('T')[0],
      numberOfLeaveDays: request.days,
      leaveType: request.leaveType,
      reason: request.reason || "",
      locationDuringLeave: request.reason || "", // Using reason as location for now
    }));
  };

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Submit the leave form and create activity
  const handleLeaveFormSubmit = async () => {
    if (!partA.employeeName || !partA.startDate || !partA.endDate || !partA.employeeSignature) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Create the activity with leave details
      const leaveDescription = `Leave Request: ${partA.leaveType} - ${partA.numberOfLeaveDays} days from ${partA.startDate} to ${partA.endDate}. Location: ${partA.locationDuringLeave}`;

      // Store the leave request ID in the description for reference
      const finalDescription = selectedLeaveRequest
        ? `${leaveDescription} (Based on Leave Request: ${selectedLeaveRequest._id})`
        : leaveDescription;

      const result = await addEmployeeActivity({
        employeeId,
        type: "leave",
        description: finalDescription,
      });

      if ("success" in result) {
        // Reset form and close modal
        setPartA({
          employeeName: employeeData ? `${employeeData.first_name} ${employeeData.last_name}`.trim() : "",
          employmentNumber: employeeData?.employment_number || "",
          employeePosition: employeeData?.position || "",
          numberOfLeaveDays: 0,
          startDate: "",
          endDate: "",
          locationDuringLeave: "",
          phoneNumber: employeeData?.phone || "",
          dateOfRequest: new Date().toISOString().split('T')[0],
          employeeSignature: "",
          leaveType: "annual",
          reason: "",
        });
        setSelectedLeaveRequest(null);
        closeModal();
        await loadActivities();
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    }
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
          No pending or approved leave requests found for this employee.
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

  // Render Part A Form (Employee Section)
  const renderLeaveForm = () => (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
      <h3 className="text-lg font-semibold text-gray-800">Leave Request Form - Part A</h3>
      <p className="text-sm text-gray-600">Employee Section</p>

      {/* Leave Request Selection */}
      {renderLeaveRequestSelection()}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Employee Name *
          </label>
          <input
            type="text"
            value={partA.employeeName}
            onChange={(e) => handlePartAChange("employeeName", e.target.value)}
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
            value={partA.employmentNumber}
            onChange={(e) => handlePartAChange("employmentNumber", e.target.value)}
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
            value={partA.employeePosition}
            onChange={(e) => handlePartAChange("employeePosition", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Leave Type
          </label>
          <select
            value={partA.leaveType}
            onChange={(e) => handlePartAChange("leaveType", e.target.value)}
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
            value={partA.numberOfLeaveDays}
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
            value={partA.startDate}
            onChange={(e) => handlePartAChange("startDate", e.target.value)}
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
            value={partA.endDate}
            onChange={(e) => handlePartAChange("endDate", e.target.value)}
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
            value={partA.locationDuringLeave}
            onChange={(e) => handlePartAChange("locationDuringLeave", e.target.value)}
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
            value={partA.phoneNumber}
            onChange={(e) => handlePartAChange("phoneNumber", e.target.value)}
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
            value={partA.dateOfRequest}
            onChange={(e) => handlePartAChange("dateOfRequest", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Reason for Leave (Optional)
          </label>
          <textarea
            value={partA.reason}
            onChange={(e) => handlePartAChange("reason", e.target.value)}
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
            value={partA.employeeSignature}
            onChange={(e) => handlePartAChange("employeeSignature", e.target.value)}
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
          onClick={() => {
            closeModal();
            setType(""); // Reset type when closing
            setSelectedLeaveRequest(null);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleLeaveFormSubmit}
          disabled={!partA.employeeName || !partA.startDate || !partA.endDate || !partA.employeeSignature}
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
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select onValueChange={handleTypeChange} value={type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="disciplinary">Disciplinary</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="award">Award</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {type !== "leave" && (
                <Input
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required={type !== "leave"}
                />
              )}

              {type !== "leave" && (
                <DialogFooter>
                  <Button type="submit">Save Activity</Button>
                </DialogFooter>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
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
      </div>

      {/* Leave Form Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          setType(""); // Reset type when closing
          setSelectedLeaveRequest(null);
        }}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        {renderLeaveForm()}
      </Modal>
    </div>
  );
}