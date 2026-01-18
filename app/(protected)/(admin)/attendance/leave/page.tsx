"use client";

import React, { useEffect, useState } from "react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ClipboardList, Users, BarChart3, FileCheck } from "lucide-react";
import LeaveList from "@/components/leaves/LeavesList";
import Calendar from "@/components/calendar/Calendar";
import MyRequests from "@/components/leaves/MyRequests";
import { LeaveRequest, LeaveWithEmployee, Employee } from "@/types";
import {
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  updateLeaveRequest,
} from "@/actions/leaves.actions";
import {
  getEmployeeById,
  getEmployeeByUserId,
} from "@/actions/employee.actions";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/use-modal";

// Types for the multi-section form
interface PartBData {
  annualLeaveDays: number;
  deductedDays: number;
  remainingLeaveDays: number;
  dateOfApproval?: string;
  hrSignature?: string;
}

interface PartCData {
  supervisorComments?: string;
  recommendation?: "recommend-approval" | "do-not-recommend";
  dateOfReview?: string;
  supervisorSignature?: string;
}

interface PartDData {
  finalDecision?: "approved" | "rejected";
  dateOfDecision?: string;
  approverSignature?: string;
}

const LeavesPage: React.FC = () => {
  const { role } = useCurrentRole();
  const user = useCurrentUser();
  const { isOpen, openModal, closeModal } = useModal();

  const [allLeaves, setAllLeaves] = useState<LeaveWithEmployee[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);

  // Multi-section approval state
  const [selectedLeave, setSelectedLeave] = useState<LeaveWithEmployee | null>(null);
  const [activeSection, setActiveSection] = useState<"partB" | "partC" | "partD">("partB");
  const [partB, setPartB] = useState<PartBData>({
    annualLeaveDays: 21,
    deductedDays: 0,
    remainingLeaveDays: 21,
  });
  const [partC, setPartC] = useState<PartCData>({});
  const [partD, setPartD] = useState<PartDData>({});

  // 🔹 Fetch employeeId for current user (Employee view)
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.id || role !== "Employee") {
        setLoading(false);
        return;
      }

      try {
        const employee = await getEmployeeByUserId(user.id);
        if (employee?._id) {
          setEmployeeId(employee._id);
        } else {
          toast.error("Employee profile not found");
        }
      } catch (err) {
        console.error("Failed to fetch employee:", err);
        toast.error("Failed to load employee profile");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [user, role]);

  // 🔹 Fetch all leave requests (Admin/Manager) or Employee's own
  const fetchLeaves = async (targetEmployeeId?: string) => {
    setLoading(true);
    try {
      const allLeavesData: LeaveRequest[] = await getAllLeaveRequests();

      const leavesWithEmployees: LeaveWithEmployee[] = await Promise.all(
        allLeavesData.map(async (leave: any) => {
          let employeeData: Employee | null = null;
          let empId = "";

          if (
            leave.employeeId &&
            typeof leave.employeeId === "object" &&
            leave.employeeId._id
          ) {
            employeeData = leave.employeeId as Employee;
            empId = employeeData._id;
          } else if (leave.employeeId) {
            empId =
              typeof leave.employeeId === "string"
                ? leave.employeeId
                : leave.employeeId.toString();
            try {
              employeeData = await getEmployeeById(empId);
            } catch (err) {
              console.warn(
                `Failed to fetch employee data for ID: ${empId}`,
                err
              );
            }
          }

          const employeeDetails = {
            name: employeeData
              ? `${employeeData.first_name} ${employeeData.last_name}`.trim()
              : "Unknown Employee",
            email: employeeData?.email || "Not available",
            avatar: employeeData?.image,
            employment_number: employeeData?.employment_number || "N/A",
            phone: employeeData?.phone || "Not available",
          };

          return {
            ...leave,
            employeeDetails,
            // Include form data if it exists
            formData: leave.formData || undefined
          };
        })
      );

      leavesWithEmployees.sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
      );

      // Filter for Employee view
      const filteredLeaves = targetEmployeeId
        ? leavesWithEmployees.filter(
          (l) =>
            (typeof l.employeeId === "string" &&
              l.employeeId === targetEmployeeId) ||
            (typeof l.employeeId === "object" &&
              l.employeeId._id === targetEmployeeId)
        )
        : leavesWithEmployees;

      setAllLeaves(filteredLeaves);
      setPendingLeaves(filteredLeaves.filter((l) => l.status === "pending"));
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaves after employeeId is resolved
  useEffect(() => {
    if (role === "Employee" && employeeId) {
      fetchLeaves(employeeId);
    } else if (role !== "Employee") {
      fetchLeaves();
    }
  }, [employeeId, role]);

  // Open multi-section approval modal
  const handleOpenApproval = (leave: LeaveWithEmployee, section: "partB" | "partC" | "partD" = "partB") => {
    setSelectedLeave(leave);
    setActiveSection(section);

    // Pre-fill existing data if available
    if (leave.formData) {
      if (leave.formData.partB) setPartB(leave.formData.partB);
      if (leave.formData.partC) setPartC(leave.formData.partC);
      if (leave.formData.partD) setPartD(leave.formData.partD);
    } else {
      // Initialize with default values
      const deductedDays = leave.days || calculateDaysDifference(new Date(leave.startDate), new Date(leave.endDate));
      setPartB({
        annualLeaveDays: 21,
        deductedDays,
        remainingLeaveDays: 21 - deductedDays,
      });
      setPartC({});
      setPartD({});
    }

    openModal();
  };

  // Handle Part B changes (HR Section)
  const handlePartBChange = (field: string, value: any) => {
    const updatedPartB = { ...partB, [field]: value };

    // Auto-calculate remaining days
    if (field === "annualLeaveDays" || field === "deductedDays") {
      updatedPartB.remainingLeaveDays = updatedPartB.annualLeaveDays - updatedPartB.deductedDays;
    }

    // Auto-fill date and signature for HR
    if (field === "deductedDays" && value > 0 && !updatedPartB.dateOfApproval) {
      updatedPartB.dateOfApproval = new Date().toISOString().split('T')[0];
    }
    if (!updatedPartB.hrSignature && user?.name) {
      updatedPartB.hrSignature = user.name;
    }

    setPartB(updatedPartB);
  };

  // Handle Part C changes (Supervisor Section)
  const handlePartCChange = (field: string, value: any) => {
    const updatedPartC = { ...partC, [field]: value };

    // Auto-fill date and signature for Supervisor
    if ((field === "recommendation" || field === "supervisorComments") && !updatedPartC.dateOfReview) {
      updatedPartC.dateOfReview = new Date().toISOString().split('T')[0];
    }
    if (!updatedPartC.supervisorSignature && user?.name) {
      updatedPartC.supervisorSignature = user.name;
    }

    setPartC(updatedPartC);
  };

  // Handle Part D changes (Final Approval)
  const handlePartDChange = (field: string, value: any) => {
    const updatedPartD = { ...partD, [field]: value };

    // Auto-fill date and signature for Approver
    if (field === "finalDecision" && !updatedPartD.dateOfDecision) {
      updatedPartD.dateOfDecision = new Date().toISOString().split('T')[0];
    }
    if (!updatedPartD.approverSignature && user?.name) {
      updatedPartD.approverSignature = user.name;
    }

    setPartD(updatedPartD);
  };

  // Save section data and move to next section
  const handleSaveSection = async () => {
    if (!selectedLeave) return;

    try {
      const formData = {
        partB: activeSection === "partB" ? partB : selectedLeave.formData?.partB,
        partC: activeSection === "partC" ? partC : selectedLeave.formData?.partC,
        partD: activeSection === "partD" ? partD : selectedLeave.formData?.partD,
      };

      const result = await updateLeaveRequest(selectedLeave._id, formData);

      if (result.success) {
        toast.success("Section saved successfully");

        // Move to next section or close
        if (activeSection === "partB") setActiveSection("partC");
        else if (activeSection === "partC") setActiveSection("partD");
        else {
          closeModal();
          fetchLeaves(employeeId);
        }
      } else {
        toast.error(result.error || "Failed to save section");
      }
    } catch (err) {
      console.error("Error saving section:", err);
      toast.error("Failed to save section");
    }
  };

  // Final approval/rejection
  const handleFinalDecision = async (decision: "approved" | "rejected") => {
    if (!selectedLeave || !user?.id) return;

    setProcessing(selectedLeave._id);
    try {
      // First update the form data with final decision
      const formData = {
        partB: partB,
        partC: partC,
        partD: {
          ...partD,
          finalDecision: decision,
          dateOfDecision: new Date().toISOString().split('T')[0],
          approverSignature: user.name || "",
        },
      };

      await updateLeaveRequest(selectedLeave._id, formData);

      // Then process the approval/rejection
      if (decision === "approved") {
        const result = await approveLeaveRequest(selectedLeave._id, user.id);
        if (result.success) {
          toast.success("Leave request approved successfully");
        } else {
          toast.error(result.error || "Failed to approve leave request");
          return;
        }
      } else {
        const result = await rejectLeaveRequest(
          selectedLeave._id,
          user.id,
          partC.supervisorComments || "Rejected"
        );
        if (result.success) {
          toast.success("Leave request rejected successfully");
        } else {
          toast.error(result.error || "Failed to reject leave request");
          return;
        }
      }

      closeModal();
      fetchLeaves(employeeId);
    } catch (err) {
      console.error("Error processing decision:", err);
      toast.error("Failed to process decision");
    } finally {
      setProcessing(null);
    }
  };

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const resetApprovalModal = () => {
    setSelectedLeave(null);
    setPartB({ annualLeaveDays: 21, deductedDays: 0, remainingLeaveDays: 21 });
    setPartC({});
    setPartD({});
    setActiveSection("partB");
  };

  // Render Part B (HR Section)
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Remaining Leave Days
          </label>
          <input
            type="number"
            value={partB.remainingLeaveDays}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            disabled
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Date of Approval
          </label>
          <input
            type="date"
            value={partB.dateOfApproval || ""}
            onChange={(e) => handlePartBChange("dateOfApproval", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            HR Signature
          </label>
          <input
            type="text"
            value={partB.hrSignature || ""}
            onChange={(e) => handlePartBChange("hrSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            placeholder="HR representative signature"
          />
        </div>
      </div>
    </div>
  );

  // Render Part C (Supervisor Section)
  const renderPartC = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part C: Supervisor Review</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Comments
          </label>
          <textarea
            value={partC.supervisorComments || ""}
            onChange={(e) => handlePartCChange("supervisorComments", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            rows={3}
            placeholder="Enter comments regarding the leave request"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Recommendation
          </label>
          <select
            value={partC.recommendation || ""}
            onChange={(e) => handlePartCChange("recommendation", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            value={partC.dateOfReview || ""}
            onChange={(e) => handlePartCChange("dateOfReview", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Supervisor Signature
          </label>
          <input
            type="text"
            value={partC.supervisorSignature || ""}
            onChange={(e) => handlePartCChange("supervisorSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            placeholder="Supervisor signature"
          />
        </div>
      </div>
    </div>
  );

  // Render Part D (Final Approval)
  const renderPartD = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Part D: Final Approval</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Final Decision
          </label>
          <select
            value={partD.finalDecision || ""}
            onChange={(e) => handlePartDChange("finalDecision", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
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
            value={partD.dateOfDecision || ""}
            onChange={(e) => handlePartDChange("dateOfDecision", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Approver Signature
          </label>
          <input
            type="text"
            value={partD.approverSignature || ""}
            onChange={(e) => handlePartDChange("approverSignature", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800"
            placeholder="Approver signature"
          />
        </div>
      </div>
    </div>
  );

  // Render section navigation
  const renderSectionNavigation = () => (
    <div className="flex space-x-2 mb-6 border-b pb-4">
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
      <button
        type="button"
        onClick={() => setActiveSection("partD")}
        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === "partD"
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
      >
        Part D: Final Approval
      </button>
    </div>
  );

  // 🔹 Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 🔹 Employee view
  if (role === "Employee") {
    if (!employeeId) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
          <p className="text-gray-500">
            Could not find employee profile for this user.
          </p>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Leaves
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your leave requests and view your leave calendar
        </p>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Calendar employeeId={employeeId} />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <MyRequests />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  async function  handleApprove(leaveId: string): Promise<void> {
    if (!user?.id) return;

    setProcessing(leaveId)
    try {
      const result = await approveLeaveRequest(leaveId, user.id, `Approved By ${user.first_name}&nbsp;${user.last_name}`)
      if (result.success) {
        toast.success("Leave Approval Successful")
        fetchLeaves(employeeId)
      }
      else {
        toast.error(result.error || "Failed To Process Leave Approval")
      }
    }
    catch (err) {
      console.error("Error rejecting leave:", err);
      toast.error("Failed to reject leave request");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(leaveId: string): Promise<void> {
    if (!user?.id) return;
    setProcessing(leaveId);
    try {
      const result = await rejectLeaveRequest(leaveId, user.id, "Rejected by admin");
      if (result.success) {
        toast.success("Leave request rejected successfully");
        fetchLeaves(employeeId);
      } else {
        toast.error(result.error || "Failed to reject leave request");
      }
    } catch (err) {
      console.error("Error rejecting leave:", err);
      toast.error("Failed to reject leave request");
    } finally {
      setProcessing(null);
    }
  }
  // 🔹 Admin/Manager view
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Leave Management
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Review and manage employee leave requests
      </p>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Pending Requests (
            {pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="all-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> All Requests ({allLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Team Calendar
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Multi-Section Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingLeaves.length > 0 ? (
            <LeaveList
              leaves={pendingLeaves}
              isAdmin={true}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
              onMultiSectionApprove={handleOpenApproval}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No pending leave requests
            </p>
          )}
        </TabsContent>

        <TabsContent value="all-requests" className="mt-6">
          {allLeaves.length > 0 ? (
            <LeaveList
              leaves={allLeaves}
              isAdmin={true}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
              onMultiSectionApprove={handleOpenApproval}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No leave requests found
            </p>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Calendar />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Multi-Section Approval Process</h3>
            <p className="text-gray-600">
              Use the "Detailed Approval" button in the leave lists to start the multi-section approval process.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Multi-Section Approval Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          resetApprovalModal();
        }}
        className="max-w-4xl p-6 lg:p-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col px-2 overflow-y-auto">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 text-xl">
              Multi-Section Leave Approval
            </h5>
            <p className="text-sm text-gray-500">
              Processing leave request for {selectedLeave?.employeeDetails.first_name}
            </p>
          </div>

          {renderSectionNavigation()}

          <div className="mt-4">
            {activeSection === "partB" && renderPartB()}
            {activeSection === "partC" && renderPartC()}
            {activeSection === "partD" && renderPartD()}
          </div>

          <div className="flex items-center gap-3 mt-8 sm:justify-end">
            <button
              onClick={() => {
                closeModal();
                resetApprovalModal();
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            {activeSection === "partD" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleFinalDecision("rejected")}
                  disabled={processing === selectedLeave?._id}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {processing === selectedLeave?._id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleFinalDecision("approved")}
                  disabled={processing === selectedLeave?._id || !partD.finalDecision}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {processing === selectedLeave?._id ? 'Processing...' : 'Final Approve'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveSection}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save & Continue
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeavesPage;