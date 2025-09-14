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

import { createEmployee, linkEmployeeWithUser } from "@/actions/employee.actions";
import { getAllSections } from "@/actions/section.actions";
import { getAllPositions } from "@/actions/position.actions";
import { getAllEmployees } from "@/actions/employee.actions";
import { EmployeeSchema, EmployeeDetailsSchema } from "@/schemas";
import { Section, Position, Employee } from "@/types";
import { createUserForEmployee } from "@/actions/user.actions";

type EmployeeFormValues = z.infer<typeof EmployeeSchema>;
type EmployeeDetailsFormValues = z.infer<typeof EmployeeDetailsSchema>;

type Gender = "male" | "female";
type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export default function EmployeeCreationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [sections, setSections] = useState<Section[]>([]);
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
      section_id: "",
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
          getAllSections(),
          getAllPositions(),
          getAllEmployees(),
        ]);

        if (Array.isArray(deptResponse)) setSections(deptResponse);
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
    // First, let's check the current form values
    const currentValues = employeeForm.getValues();
    console.log("Current form values:", currentValues);

    // Check form state before validation
    console.log("Form state before validation:", {
      isValid: employeeForm.formState.isValid,
      errors: employeeForm.formState.errors,
      touchedFields: employeeForm.formState.touchedFields,
      dirtyFields: employeeForm.formState.dirtyFields,
    });

    // Try validating all fields first
    const isValid = await employeeForm.trigger();

    // Check form state after validation
    console.log("Form state after validation:", {
      isValid: employeeForm.formState.isValid,
      errors: employeeForm.formState.errors,
      isValidating: employeeForm.formState.isValidating,
    });

    console.log("Trigger result:", isValid);

    if (isValid) {
      setCurrentStep(2);
    } else {
      // Force a re-render to show any errors
      employeeForm.formState.errors &&
        Object.keys(employeeForm.formState.errors).forEach((key) => {
          console.log(
            `Error for ${key}:`,
            employeeForm.formState.errors[
              key as keyof typeof employeeForm.formState.errors
            ]
          );
        });
    }
  };

  const handlePreviousStep = () => setCurrentStep(1);

  // Temporary function to test step change without validation
  const handleNextStepWithoutValidation = () => {
    console.log("Skipping validation, moving to step 2");
    setCurrentStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    const employeeData = employeeForm.getValues();
    const detailsData = detailsForm.getValues();

    try {
      // Step 1: Create the employee first
      const employeeResult = await createEmployee(employeeData);
      const employeeId = employeeResult.insertedId;

      if (employeeResult.success && employeeId) {
        // Step 2: Create user account for the employee
        const userResult = await createUserForEmployee({
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          email: employeeData.email,
          phone: employeeData.phone,
          employee_id: employeeId,
        });

        if (!userResult.success) {
          toast.error("Employee created but failed to create user account");
          return;
        }

        // Step 3: Link employee with user account (optional)
        if (userResult.userId) {
          await linkEmployeeWithUser(employeeId, userResult.userId);
        }

        // Step 4: Create employee details
        const detailsResult = await createEmployeeDetails(
          employeeId,
          detailsData
        );

        if (detailsResult.success) {
          toast.success(
            "Employee, user account, and details created successfully"
          );
          router.push("/employees");
        } else {
          toast.error("Employee and user created but details failed");
        }
      } else {
        toast.error(employeeResult.error || "Failed to create employee");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Employee creation error:", error);
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
          sections={sections}
          positions={positions}
          employees={employees}
          handleNextStep={handleNextStep}
          handleNextStepWithoutValidation={handleNextStepWithoutValidation}
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
      className={`flex items-center ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
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
  sections,
  positions,
  employees,
  handleNextStep,
  handleNextStepWithoutValidation,
  router,
}: {
  employeeForm: ReturnType<typeof useForm<EmployeeFormValues>>;
  sections: Section[];
  positions: Position[];
  employees: Employee[];
  handleNextStep: () => void;
  handleNextStepWithoutValidation: () => void;
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

              {/* Employment Number */}
              <FormField
                control={employeeForm.control}
                name="employment_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., EMP001" />
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

              {/* Email */}
              <FormField
                control={employeeForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john.doe@company.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={employeeForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 (555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Section */}
              <FormField
                control={employeeForm.control}
                name="section_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((dept) => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {dept.section_name}
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

              {/* Manager */}
              <FormField
                control={employeeForm.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager (Optional)</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp._id} value={emp._id}>
                              {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hire Date */}
              <FormField
                control={employeeForm.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={employeeForm.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Salary */}
              <FormField
                control={employeeForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="50000"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={employeeForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Physical Address */}
              <FormField
                control={employeeForm.control}
                name="physical_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123 Main St, City, State"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nationality */}
              <FormField
                control={employeeForm.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., American" />
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
                type="button"
                variant="outline"
                onClick={() => router.push("/employees")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNextStepWithoutValidation}
                variant="secondary"
              >
                Next (Skip Validation)
              </Button>
              <Button type="button" onClick={handleNextStep}>
                Next: Additional Details
              </Button>
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
            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={detailsForm.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., United States" />
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
                        <Input {...field} placeholder="e.g., New York, NY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="address.postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 10001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="address.street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 123 Main St" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="address.tax_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 123-45-6789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={detailsForm.control}
                  name="emergency_contact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Jane Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="emergency_contact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Spouse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="emergency_contact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., +1 (555) 987-6543"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="emergency_contact.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="jane.doe@email.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Banking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={detailsForm.control}
                  name="banking_info.bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., First National Bank"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="banking_info.account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="banking_info.routing_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 021000021" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="banking_info.account_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Account Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={detailsForm.control}
                  name="additional_info.marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Marital Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="additional_info.children_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Children</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
              >
                Back to Basic Info
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
              >
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
