import * as z from "zod";

// 🔐 Authentication Schemas
export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string({ message: "Password is required" }),
});

export const SignUpSchema = z.object({
  first_name: z.string({ message: "First name is required" }),
  last_name: z.string({ message: "Last name is required" }),
  phone_number: z.string({ message: "Phone number is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string({ message: "Password is required" }),
  role: z.string(),
});

export const PasswordResetSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const NewPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

// 📝 Leave Request Schema
// Define individual section schemas first
export const PartASchema = z
  .object({
    employeeName: z.string().min(1, "Employee name is required"),
    employmentNumber: z.string().min(1, "Employment number is required"),
    employeePosition: z.string().min(1, "Employee position is required"),
    numberOfLeaveDays: z
      .number()
      .min(0.5, "Number of leave days must be at least 0.5")
      .max(365, "Number of leave days cannot exceed 365"),
    startDate: z.date(),
    endDate: z.date(),
    locationDuringLeave: z
      .string()
      .min(1, "Location/address during leave is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    dateOfRequest: z.date().default(() => new Date()),
    employeeSignature: z.string().min(1, "Employee signature is required"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });

export const PartBSchema = z.object({
  annualLeaveDays: z.number().min(0).max(365).default(21),
  deductedDays: z.number().min(0).max(365).optional(),
  remainingLeaveDays: z.number().min(0).max(365).optional(),
  dateOfApproval: z.date().optional(),
  hrSignature: z.string().optional(),
});

const PartCSchema = z.object({
  supervisorComments: z.string().optional(),
  recommendation: z.enum(["recommend-approval", "do-not-recommend"]).optional(),
  dateOfReview: z.date().optional(),
  supervisorSignature: z.string().optional(),
});

const PartDSchema = z.object({
  finalDecision: z.enum(["approved", "rejected"]).optional(),
  dateOfDecision: z.date().optional(),
  approverSignature: z.string().optional(),
});

// Now create the main schema with refinements
export const LeaveRequestFormSchema = z
  .object({
    partA: PartASchema,
    partB: PartBSchema,
    partC: PartCSchema,
    partD: PartDSchema,
  })
  .refine(
    (data) => {
      // Only validate if partB has deducted days and partA has numberOfLeaveDays
      if (
        data.partB.deductedDays !== undefined &&
        data.partA.numberOfLeaveDays !== undefined
      ) {
        return data.partB.deductedDays === data.partA.numberOfLeaveDays;
      }
      return true;
    },
    {
      message:
        "Deducted days in HR section must match number of leave days in employee section",
      path: ["partB", "deductedDays"],
    }
  )
  .refine(
    (data) => {
      // Validate remaining leave days calculation
      if (
        data.partB.remainingLeaveDays !== undefined &&
        data.partB.annualLeaveDays !== undefined &&
        data.partB.deductedDays !== undefined
      ) {
        return (
          data.partB.remainingLeaveDays ===
          data.partB.annualLeaveDays - data.partB.deductedDays
        );
      }
      return true;
    },
    {
      message: "Remaining leave days calculation is incorrect",
      path: ["partB", "remainingLeaveDays"],
    }
  )
  .refine(
    (data) => {
      // Validate that partC review happens before partD decision if both exist
      if (data.partC.dateOfReview && data.partD.dateOfDecision) {
        return data.partC.dateOfReview <= data.partD.dateOfDecision;
      }
      return true;
    },
    {
      message: "Supervisor review date cannot be after final decision date",
      path: ["partC", "dateOfReview"],
    }
  );

// Helper types
export type LeaveRequestFormData = z.infer<typeof LeaveRequestFormSchema>;
export type PartAData = z.infer<typeof PartASchema>;
export type PartBData = z.infer<typeof PartBSchema>;
export type PartCData = z.infer<typeof PartCSchema>;
export type PartDData = z.infer<typeof PartDSchema>;

// Status helper based on the form data
export const getLeaveStatus = (data: LeaveRequestFormData): string => {
  if (data.partD.finalDecision) {
    return data.partD.finalDecision;
  }
  if (data.partC.recommendation) {
    return "under-review";
  }
  if (data.partA.employeeSignature) {
    return "submitted";
  }
  return "draft";
};

// Helper to calculate remaining leave days
export const calculateRemainingLeaveDays = (
  annualLeaveDays: number,
  deductedDays: number
): number => {
  return Math.max(0, annualLeaveDays - deductedDays);
};

// Helper to auto-calculate remaining days when deducted days change
export const updateRemainingLeaveDays = (partBData: PartBData): PartBData => {
  if (
    partBData.deductedDays !== undefined &&
    partBData.annualLeaveDays !== undefined
  ) {
    return {
      ...partBData,
      remainingLeaveDays: calculateRemainingLeaveDays(
        partBData.annualLeaveDays,
        partBData.deductedDays
      ),
    };
  }
  return partBData;
};

// 🕒 Attendance Schema
export const AttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  date: z.date(),
  status: z.enum(["present", "absent", "late", "half-day"]).default("present"),
  checkIn: z.date().optional(),
  checkOut: z.date().optional(),
  reason: z.string().optional(),
});

// 📈 Performance Review Schema
export const PerformanceReviewSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  reviewDate: z.date(),
  reviewerId: z.string().min(1, "Reviewer ID is required"),
  overallRating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  comments: z.string().optional(),
});

// 🏢 Section Schema
export const SectionSchema = z.object({
  section_name: z.string().min(1, "Section name is required"),
  description: z.string().optional(),
});

// 🏛️ Ministry Schema
export const MinistriesSchema = z.object({
  ministry_name: z.string().min(1, "Ministry name is required"),
  description: z.string().optional(),
});

// 📌 Position Schema
export const PositionSchema = z.object({
  position_title: z.string().min(1, "Position title is required"),
  section_id: z.string().min(1, "Section ID is required"),
  salary_grade: z.string().optional(),
  description: z.string().optional(),
});

// 💰 Payroll Schema
export const PayrollSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  salary: z.coerce.number().min(0, "Salary must be positive"),
  bonus: z.coerce.number().optional(),
  deductions: z.coerce.number().optional(),
  payDate: z.date(),
  paymentMethod: z.enum(["bank", "cash", "check"]).default("bank"),
});

// 📚 Training Schema
export const EmployeeTrainingSchema = z.object({
  trainingId: z.string().min(1, "Training ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  trainingTitle: z.string().min(1, "Training title is required"),
  trainingDate: z.date(),
  trainerId: z.string().min(1, "Trainer ID is required"),
  trainingStatus: z
    .enum(["completed", "pending", "canceled"])
    .default("pending"),
  comments: z.string().optional(),
});

// 📄 Employee Document Schema
export const EmployeeDocumentSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  national_id: z.string().min(1, "National ID is required"),
  passport_photo: z
    .string()
    .url("Valid passport photo URL is required")
    .optional(),
  academic_certificates: z
    .array(z.string().min(1, "Certificate must be a valid string"))
    .min(1, "At least one academic certificate is required"),
  police_clearance: z.string().optional(),
  medical_certificate: z.string().optional(),
  driver_license: z.string().optional(),
});

// ❌ Termination Schema
export const TerminationSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  terminationDate: z.date(),
  terminationReason: z.string().min(1, "Termination reason is required"),
  severance: z.coerce.number().min(0, "Severance must be positive").optional(),
  exitInterview: z.string().optional(),
});

// =============================================================================
// EMPLOYEE APPLICATION FORM SCHEMAS (Numbered according to document images)
// =============================================================================

// ----------------------
// Section 1-14: Personal Details Schema
// ----------------------
export const EmployeeDetailsSchema = z
  .object({
    // Section 1
    surname: z.string().min(1, "Surname is required"),
    // Section 2
    other_names: z.string().min(1, "Other names are required"),
    // Section 3
    current_address: z.string().min(1, "Current address is required"),
    // Section 4
    date_of_birth: z.string().min(1, "Date of birth is required"),
    // Section 5
    age: z.number().min(0, "Age must be positive"),
    // Section 6
    gender: z.enum(["male", "female"]),
    // Section 7
    place_of_birth: z.string().min(1, "Place of birth is required"),
    // Section 8
    is_citizen: z.boolean(),

    // Sections 9-11: Citizen Information (conditional)
    citizen_info: z
      .object({
        // Section 9
        chief_name: z.string().min(1, "Chief's name is required"),
        // Section 10
        district: z.string().min(1, "District is required"),
        // Section 11
        tax_id: z.string().min(1, "Tax Identity Number is required"),
      })
      .optional(),

    // Sections 9-11: Non-Citizen Information (conditional)
    non_citizen_info: z
      .object({
        // Section 9
        certificate_number: z.string().min(1, "Certificate number is required"),
        // Section 10
        date_of_issue: z.string().min(1, "Date of issue is required"),
        // Section 11
        present_nationality: z
          .string()
          .min(1, "Present nationality is required"),
      })
      .optional(),

    // Additional personal details (Sections 12-14)
    telephone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    emergency_contact: z.string().optional(),
    profile_picture: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.is_citizen && data.citizen_info) ||
      (!data.is_citizen && data.non_citizen_info),
    {
      message: "Citizen or non-citizen details must be provided",
      path: ["citizenship"],
    }
  );

// ----------------------
// Legal Information Schema (Sections would be numbered based on full form)
// ----------------------
export const LegalInfoSchema = z
  .object({
    father_name: z.string().min(1, "Father's name is required"),
    father_deceased: z.boolean().default(false),
    father_place_of_birth: z.string().optional(),
    father_occupation: z.string().optional(),
    father_address: z.string().optional(),

    marital_status: z.enum(["single", "married", "divorced", "widowed"]),
    spouse_nationality: z.string().optional(),

    has_criminal_record: z.boolean(),
    criminal_record: z
      .object({
        offense: z.string().min(1, "Offense is required"),
        place_committed: z.string().min(1, "Place is required"),
      })
      .optional(),

    dismissed_from_work: z.boolean(),
    dismissal_reason: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.has_criminal_record ||
      (data.has_criminal_record && data.criminal_record),
    {
      message: "If criminal record is yes, offense details are required",
      path: ["criminal_record"],
    }
  )
  .refine((data) => !data.dismissed_from_work || !!data.dismissal_reason, {
    message: "Dismissal reason is required if dismissed from work",
    path: ["dismissal_reason"],
  })
  .refine(
    (data) =>
      !data.father_deceased ||
      (data.father_deceased &&
        !data.father_place_of_birth &&
        !data.father_occupation),
    {
      message: "Father's birth place and occupation not required if deceased",
      path: ["father_info"],
    }
  );

// ----------------------
// Section 15: Education History Schema - SCHOOLS ATTENDED
// ----------------------
export const EducationEntrySchema = z.object({
  // Section 15 fields
  school_name: z.string().min(1, "School name is required"),
  date_of_entry: z.string().min(1, "Date of entry is required"),
  date_of_leaving: z.string().min(1, "Date of leaving is required"),

  // Additional education details
  qualification: z.string().min(1, "Qualification is required"),
  qualification_start_date: z.string().min(1, "Start date is required"),
  qualification_completion_date: z
    .string()
    .min(1, "Completion date is required"),
  additional_skills: z.array(z.string()).optional(),
});

export const EducationHistorySchema = z.array(EducationEntrySchema);

// ----------------------
// Section 16: EXAMINATIONS PASSED Schema
// ----------------------
export const ExaminationsSchema = z.object({
  junior_certificate: z.string().optional(),
  junior_certificate_date: z.string().optional(),
  subjects_passed: z.string().optional(),
});

// ----------------------
// Section 17: UNIVERSITY/POST SECONDARY Schema
// ----------------------
export const PostSecondarySchema = z.object({
  institution_name: z.string().optional(),
  date_of_entry: z.string().optional(),
  date_of_leaving: z.string().optional(),
  qualifications_obtained: z.string().optional(),
});

// ----------------------
// Section 18: ADDITIONAL QUALIFICATIONS Schema
// ----------------------
export const AdditionalQualificationsSchema = z.object({
  qualifications: z.string().optional(),
});

// ----------------------
// Employment History Schema (Sections 19-29)
// ----------------------
export const EmploymentEntrySchema = z.object({
  // Section 19
  employer_name: z.string().min(1, "Employer name is required"),
  // Section 20
  employer_address: z.string().min(1, "Employer address is required"),
  // Section 21
  position: z.string().min(1, "Position is required"),
  // Section 22
  salary: z.number().min(0, "Salary must be a positive number"),
  // Section 23
  employment_start: z.string().min(1, "Start date is required"),
  // Section 24
  employment_end: z.string().min(1, "End date is required"),
  // Section 25
  duties: z.string().min(1, "Duties and responsibilities are required"),
  // Section 26
  reason_for_leaving: z.string().optional(),
  // Section 27
  notice_period: z.string().optional(),
});

export const EmploymentHistorySchema = z.array(EmploymentEntrySchema);

// ----------------------
// Section 30: REFERENCES Schema
// ----------------------
export const ReferenceEntrySchema = z.object({
  name: z.string().min(1, "Reference name is required"),
  address: z.string().min(1, "Reference address is required"),
  occupation: z.string().min(1, "Occupation is required"),
  known_duration: z.string().min(1, "Duration of acquaintance is required"),
});

export const ReferencesSchema = z
  .array(ReferenceEntrySchema)
  .min(2, "At least two references are required")
  .max(2, "Maximum two references allowed");

// ----------------------
// Combined Employee Application Form Schema
// ----------------------
export const EmployeeSchema = z.object({
  // Sections 1-14
  employee_details: EmployeeDetailsSchema,

  // Legal Information (sections would be numbered based on full form)
  legal_info: LegalInfoSchema,

  // Sections 15-18: Education
  education_history: EducationHistorySchema.min(
    1,
    "At least one education entry is required"
  ),
  examinations: ExaminationsSchema.optional(),
  post_secondary: PostSecondarySchema.optional(),
  additional_qualifications: AdditionalQualificationsSchema.optional(),

  // Sections 19-29: Employment
  employment_history: EmploymentHistorySchema.min(
    1,
    "At least one employment entry is required"
  ),

  // Section 30: References
  references: ReferencesSchema,

  // Additional fields for system use
  employee_number: z.string().optional(), // Auto-generated
  email: z.string().email().optional(), // Top-level email
});

// =============================================================================
// CONCURRENCY FORM SCHEMAS
// =============================================================================

// ----------------------
// Concurrency Form Schemas
// ----------------------

// Personal Information Schema
export const ConcurrencyPersonalInfoSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  employee_id: z.string().min(1, "Employee ID is required"),
  date_of_submission: z.string().optional(),
});

// Outside Employment/Business Interests Schema
export const OutsideEmploymentSchema = z
  .object({
    has_outside_employment: z.boolean().default(false),
    employer_names: z.string().optional(),
    nature_of_business: z.string().optional(),
    hours_per_week: z
      .number()
      .min(0, "Hours must be positive")
      .max(168, "Hours cannot exceed 168 per week")
      .optional(),
    relationship_to_duties: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.has_outside_employment ||
      (data.has_outside_employment &&
        data.employer_names &&
        data.nature_of_business),
    {
      message:
        "Employer names and nature of business are required when declaring outside employment",
      path: ["employer_names"],
    }
  );

// Conflict of Interest Schema
export const ConflictOfInterestSchema = z
  .object({
    has_conflict: z.boolean().default(false),
    conflict_details: z.string().optional(),
    mitigation_measures: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.has_conflict ||
      (data.has_conflict && data.conflict_details && data.mitigation_measures),
    {
      message:
        "Conflict details and mitigation measures are required when declaring a conflict of interest",
      path: ["conflict_details"],
    }
  );

// Gifts and Benefits Schema
export const GiftsBenefitsSchema = z
  .object({
    received_gifts: z.boolean().default(false),
    gift_details: z.string().optional(),
    gift_value: z.number().min(0, "Gift value must be positive").optional(),
    donor_relationship: z
      .enum(["vendor", "client", "colleague", "other", ""])
      .optional(),
  })
  .refine(
    (data) =>
      !data.received_gifts ||
      (data.received_gifts &&
        data.gift_details &&
        data.gift_value !== undefined),
    {
      message:
        "Gift details and value are required when declaring gifts received",
      path: ["gift_details"],
    }
  );

// Declaration Schema
export const ConcurrencyDeclarationSchema = z.object({
  is_truthful: z.boolean().refine((val) => val === true, {
    message:
      "You must declare that the information provided is true and complete",
  }),
  agreed_to_terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  signature: z.string().min(1, "Signature is required"),
  date_signed: z.string().optional(),
});

// ----------------------
// Main Concurrency Form Schema
// ----------------------
export const ConcurrencyFormSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  form_type: z
    .enum([
      "concurrency_declaration",
      "conflict_of_interest",
      "annual_disclosure",
    ])
    .default("concurrency_declaration"),
  submission_date: z.string().optional(),
  status: z
    .enum([
      "draft",
      "pending",
      "submitted",
      "under_review",
      "approved",
      "rejected",
      "requires_revision",
    ])
    .default("draft"),

  // Form Sections
  personal_info: ConcurrencyPersonalInfoSchema,
  outside_employment: OutsideEmploymentSchema,
  conflict_of_interest: ConflictOfInterestSchema,
  gifts_benefits: GiftsBenefitsSchema,
  declaration: ConcurrencyDeclarationSchema,

  // Review Information (for admin use)
  review_info: z
    .object({
      reviewed_by: z.string().optional(),
      review_date: z.string().optional(),
      reviewer_notes: z.string().optional(),
      decision: z
        .enum(["approved", "rejected", "requires_revision"])
        .optional(),
      decision_date: z.string().optional(),
    })
    .optional(),

  // Metadata
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  is_active: z.boolean().default(true),
});

// ----------------------
// Concurrency Review Schema (for admin actions)
// ----------------------
export const ConcurrencyReviewSchema = z.object({
  form_id: z.string().min(1, "Form ID is required"),
  decision: z.enum(["approved", "rejected", "requires_revision"]),
  reviewer_notes: z.string().optional(),
});

// ----------------------
// Concurrency Filter Schema (for queries)
// ----------------------
export const ConcurrencyFilterSchema = z.object({
  status: z
    .enum([
      "all",
      "draft",
      "pending",
      "submitted",
      "under_review",
      "approved",
      "rejected",
      "requires_revision",
    ])
    .optional(),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  form_type: z
    .enum([
      "all",
      "concurrency_declaration",
      "conflict_of_interest",
      "annual_disclosure",
    ])
    .optional(),
});

// ----------------------
// Concurrency Stats Schema
// ----------------------
export const ConcurrencyStatsSchema = z.object({
  total: z.number().min(0),
  draft: z.number().min(0),
  pending: z.number().min(0),
  submitted: z.number().min(0),
  under_review: z.number().min(0),
  approved: z.number().min(0),
  rejected: z.number().min(0),
  requires_revision: z.number().min(0),
});

// ----------------------
// Concurrency Bulk Action Schema
// ----------------------
export const ConcurrencyBulkActionSchema = z.object({
  form_ids: z
    .array(z.string().min(1))
    .min(1, "At least one form ID is required"),
  action: z.enum(["approve", "reject", "delete", "request_revision"]),
  notes: z.string().optional(),
});

// ----------------------
// Concurrency Settings Schema (for organization policies)
// ----------------------
export const ConcurrencySettingsSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required"),
  gift_threshold: z
    .number()
    .min(0, "Gift threshold must be positive")
    .default(100),
  requires_annual_disclosure: z.boolean().default(true),
  disclosure_frequency: z
    .enum(["annual", "biannual", "quarterly", "on_hire"])
    .default("annual"),
  approval_workflow: z
    .enum([
      "direct_supervisor",
      "hr_department",
      "ethics_committee",
      "combined",
    ])
    .default("direct_supervisor"),
  auto_reminder_days: z.number().min(0).max(365).default(30),
  retention_period_years: z.number().min(1).max(30).default(7),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Employee Application Form Types
export type EmployeeDetailsFormValues = z.infer<typeof EmployeeDetailsSchema>;
export type LegalInfoFormValues = z.infer<typeof LegalInfoSchema>;
export type EducationEntryFormValues = z.infer<typeof EducationEntrySchema>;
export type EmploymentEntryFormValues = z.infer<typeof EmploymentEntrySchema>;
export type ReferenceEntryFormValues = z.infer<typeof ReferenceEntrySchema>;
export type ExaminationsFormValues = z.infer<typeof ExaminationsSchema>;
export type PostSecondaryFormValues = z.infer<typeof PostSecondarySchema>;
export type AdditionalQualificationsFormValues = z.infer<
  typeof AdditionalQualificationsSchema
>;
export type EmployeeFormValues = z.infer<typeof EmployeeSchema>;

// Concurrency Form Types
export type ConcurrencyPersonalInfoFormValues = z.infer<
  typeof ConcurrencyPersonalInfoSchema
>;
export type OutsideEmploymentFormValues = z.infer<
  typeof OutsideEmploymentSchema
>;
export type ConflictOfInterestFormValues = z.infer<
  typeof ConflictOfInterestSchema
>;
export type GiftsBenefitsFormValues = z.infer<typeof GiftsBenefitsSchema>;
export type ConcurrencyDeclarationFormValues = z.infer<
  typeof ConcurrencyDeclarationSchema
>;
export type ConcurrencyFormValues = z.infer<typeof ConcurrencyFormSchema>;
export type ConcurrencyReviewFormValues = z.infer<
  typeof ConcurrencyReviewSchema
>;
export type ConcurrencyFilterFormValues = z.infer<
  typeof ConcurrencyFilterSchema
>;
export type ConcurrencyStatsValues = z.infer<typeof ConcurrencyStatsSchema>;
export type ConcurrencyBulkActionValues = z.infer<
  typeof ConcurrencyBulkActionSchema
>;
export type ConcurrencySettingsValues = z.infer<
  typeof ConcurrencySettingsSchema
>;
