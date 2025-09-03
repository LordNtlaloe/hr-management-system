"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createEmployee } from "@/actions/employee.actions";
import { getAllDepartments } from "@/actions/department.actions";
import { getAllPositions } from "@/actions/position.actions";
import { getAllEmployees } from "@/actions/employee.actions";
import { EmployeeSchema, EmployeeDetailsSchema } from "@/schemas";
import { Department, Position, Employee } from "@/types";

type EmployeeFormValues = z.infer<typeof EmployeeSchema>;
type EmployeeDetailsFormValues = z.infer<typeof EmployeeDetailsSchema>;

type Gender = "male" | "female";
type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export default function EmployeeCreationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------- Forms --------------------
  const employeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      employment_number: "",
      gender: "male",
      email: "",
      phone: "",
      department_id: "",
      position_id: "",
      manager_id: "",
      hire_date: "", // keep as string in form
      date_of_birth: "", // keep as string in form
      salary: 0,
      status: "active",
      qualifications: "", // make sure schema has this
      physical_address: "",
      nationality: "",
    },
  });
  const detailsForm = useForm<Partial<EmployeeDetailsFormValues>>({
    defaultValues: {
      address: {
        country: "",
        city_state: "",
        postal_code: "",
        street_address: "",
        tax_id: "",
      },
      emergency_contact: {
        name: "",
        relationship: "",
        phone: "",
        email: "",
        address: "",
      },
      banking_info: {
        bank_name: "",
        account_number: "",
        routing_number: "",
        account_type: "checking",
      },
      additional_info: {
        marital_status: "" as MaritalStatus,
        spouse_name: "",
        children_count: 0,
        next_of_kin: "",
        medical_conditions: "",
        allergies: "",
        notes: "",
      },
    },
  });

  // -------------------- Fetch Data --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, posResponse, empResponse] = await Promise.all([
          getAllDepartments(),
          getAllPositions(),
          getAllEmployees(),
        ]);

        if (Array.isArray(deptResponse)) setDepartments(deptResponse);
        if (Array.isArray(posResponse)) setPositions(posResponse);
        if (Array.isArray(empResponse)) setEmployees(empResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, []);

  // -------------------- Step Handlers --------------------
  const handleNextStep = async () => {
    const isValid = await employeeForm.trigger();
    if (isValid) setCurrentStep(2);
  };

  const handlePreviousStep = () => setCurrentStep(1);

  const handleFinalSubmit = async () => {
    setLoading(true);
    const employeeData = employeeForm.getValues();
    const detailsData = detailsForm.getValues();

    try {
      const result = await createEmployee(employeeData);
      const employeeId = result.insertedId;

      if (result.success && employeeId) {
        const detailsResult = await createEmployeeDetails(
          employeeId,
          detailsData
        );

        if (detailsResult.success) {
          toast.success("Employee created successfully");
          router.push("/employees");
        } else {
          toast.error("Employee created but details failed");
        }
      } else {
        toast.error(result.error || "Failed to create employee");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Add New Employee</h1>
      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <EmployeeBasicForm
          employeeForm={employeeForm}
          departments={departments}
          positions={positions}
          employees={employees}
          handleNextStep={handleNextStep}
          router={router}
        />
      )}

      {currentStep === 2 && (
        <EmployeeDetailsForm
          detailsForm={detailsForm}
          handlePreviousStep={handlePreviousStep}
          handleFinalSubmit={handleFinalSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}

// -------------------- Step Indicator --------------------
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      <Step number={1} label="Basic Information" active={currentStep === 1} />
      <div className="w-16 h-0.5 bg-muted mx-4"></div>
      <Step number={2} label="Additional Details" active={currentStep === 2} />
    </div>
  );
}

function Step({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
          active
            ? "border-primary bg-primary text-white"
            : "border-muted-foreground"
        }`}
      >
        {number}
      </div>
      <span className="ml-2">{label}</span>
    </div>
  );
}

// -------------------- Employee Basic Form --------------------
function EmployeeBasicForm({
  employeeForm,
  departments,
  positions,
  employees,
  handleNextStep,
  router,
}: {
  employeeForm: ReturnType<typeof useForm<EmployeeFormValues>>;
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  handleNextStep: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Employee Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...employeeForm}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={employeeForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., John" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={employeeForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={employeeForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department */}
              <FormField
                control={employeeForm.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {dept.department_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Position */}
              <FormField
                control={employeeForm.control}
                name="position_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Position" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((pos) => (
                            <SelectItem key={pos._id} value={pos._id}>
                              {pos.position_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Qualifications */}
              <FormField
                control={employeeForm.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., B.Sc. Computer Science"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/employees")}
              >
                Cancel
              </Button>
              <Button onClick={handleNextStep}>Next: Additional Details</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// -------------------- Employee Details Form --------------------
function EmployeeDetailsForm({
  detailsForm,
  handlePreviousStep,
  handleFinalSubmit,
  loading,
}: {
  detailsForm: ReturnType<typeof useForm<Partial<EmployeeDetailsFormValues>>>;
  handlePreviousStep: () => void;
  handleFinalSubmit: () => void;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Employee Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...detailsForm}>
          <form className="space-y-6">
            {/* Address Example */}
            <h3 className="text-lg font-medium">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={detailsForm.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={detailsForm.control}
                name="address.city_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City/State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back to Basic Info
              </Button>
              <Button onClick={handleFinalSubmit} disabled={loading}>
                {loading ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// -------------------- API Call --------------------
async function createEmployeeDetails(
  employeeId: string,
  detailsData: Partial<EmployeeDetailsFormValues>
) {
  try {
    const response = await fetch("/api/employee-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId, ...detailsData }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating employee details:", error);
    return { success: false, error: "Failed to create employee details" };
  }
}
