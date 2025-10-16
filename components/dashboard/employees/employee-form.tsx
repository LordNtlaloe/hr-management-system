"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { EmployeeSchema } from "@/schemas";
import { z } from "zod";
import { createEmployee } from "@/actions/employee.actions";
import EmployeeDetailsForm from "./EmployeeDetailsForm";
import LegalInfoForm from "./LegalInfoForm";
import EducationHistoryForm from "./EducationHistoryForm";
import EmploymentHistoryForm from "./EmploymentHistoryForm";
import ReferencesForm from "./ReferencesForm";
import ReviewForm from "./ReviewForm";

type EmployeeFormData = z.infer<typeof EmployeeSchema>;

const steps = [
  { id: 1, name: "Personal Details" },
  { id: 2, name: "Legal Information" },
  { id: 3, name: "Education History" },
  { id: 4, name: "Employment History" },
  { id: 5, name: "References" },
  { id: 6, name: "Review & Submit" },
];

export default function EmployeeFormWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const methods = useForm<EmployeeFormData>({
    defaultValues: {
      employee_details: {
        surname: "",
        other_names: "",
        current_address: "",
        date_of_birth: "",
        age: 0,
        gender: "male",
        place_of_birth: "",
        is_citizen: true,
        citizen_info: {
          chief_name: "",
          district: "",
          tax_id: ""
        },
        non_citizen_info: {
          certificate_number: "",
          date_of_issue: "",
          present_nationality: ""
        }
      },
      legal_info: {
        father_name: "",
        father_deceased: false,
        marital_status: "single",
        has_criminal_record: false,
        dismissed_from_work: false,
      },
      education_history: [],
      employment_history: [],
      references: [],
      examinations: {
        junior_certificate: "",
        junior_certificate_date: "",
        subjects_passed: ""
      },
      post_secondary: {
        institution_name: "",
        date_of_entry: "",
        date_of_leaving: "",
        qualifications_obtained: ""
      },
      // additional_qualifications: ""
    },
    mode: "onBlur",
  });

  const validateStep = (stepNumber: number, data: EmployeeFormData): boolean => {
    try {
      switch (stepNumber) {
        case 1:
          EmployeeSchema.pick({ employee_details: true }).parse({ employee_details: data.employee_details });
          break;
        case 2:
          EmployeeSchema.pick({ legal_info: true }).parse({ legal_info: data.legal_info });
          break;
        case 3:
          EmployeeSchema.pick({ education_history: true, examinations: true, post_secondary: true, additional_qualifications: true })
            .parse({
              education_history: data.education_history,
              examinations: data.examinations,
              post_secondary: data.post_secondary,
              additional_qualifications: data.additional_qualifications
            });
          break;
        case 4:
          EmployeeSchema.pick({ employment_history: true }).parse({ employment_history: data.employment_history });
          break;
        case 5:
          EmployeeSchema.pick({ references: true }).parse({ references: data.references });
          break;
      }
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          errors[path] = issue.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const validatedData = EmployeeSchema.parse(data);

      const result = await createEmployee(validatedData);
      if (result.error) {
        throw new Error(result.error);
      }

      console.log("Submission Result:", result);
      alert("Employee created successfully!");
      methods.reset();
      setCurrentStep(1);
      setValidationErrors({});
    } catch (error) {
      console.error("Submission error:", error);
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          errors[path] = issue.message;
        });
        setValidationErrors(errors);
        alert("Please fix the validation errors before submitting.");
      } else {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    const currentData = methods.getValues();
    if (validateStep(currentStep, currentData)) {
      setCurrentStep((s) => Math.min(s + 1, steps.length));
    } else {
      alert("Please fix the errors on this step before proceeding.");
    }
  };

  const prev = () => {
    setValidationErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">EMPLOYEE APPLICATION FORM</h1>
        <p className="text-center text-gray-600 mb-8">Complete all sections accurately</p>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center relative">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${step.id === currentStep
                          ? "border-blue-600 bg-blue-600 text-white"
                          : step.id < currentStep
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-300 bg-white text-gray-500"
                        }`}
                    >
                      {step.id < currentStep ? "✓" : step.id}
                    </div>
                    <span
                      className={`mt-2 text-xs text-center max-w-24 transition-colors ${step.id === currentStep
                          ? "text-blue-600 font-medium"
                          : step.id < currentStep
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                    >
                      {step.name}
                    </span>
                  </div>
                ))}
                {/* Progress line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300">
                  <div
                    className="h-full bg-green-600 transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Validation errors summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(validationErrors).map(([field, message]) => (
                    <li key={field}>• {field.replace(/\./g, ' → ')}: {message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-96">
              {currentStep === 1 && <EmployeeDetailsForm />}
              {currentStep === 2 && <LegalInfoForm />}
              {currentStep === 3 && <EducationHistoryForm />}
              {currentStep === 4 && <EmploymentHistoryForm />}
              {currentStep === 5 && <ReferencesForm />}
              {currentStep === 6 && <ReviewForm />}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prev}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${currentStep === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                ← Back
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
                <div className="flex space-x-1">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`w-2 h-2 rounded-full ${step.id <= currentStep ? "bg-blue-600" : "bg-gray-300"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${isSubmitting
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}