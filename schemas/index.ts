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
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});


// 👤 Employee Schema

// 📝 Leave Request Schema
export const LeaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  leaveType: z.enum(["sick", "vacation", "personal", "unpaid"]).default("vacation"),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(10, "Leave reason must be at least 10 characters").optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});


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
  trainingStatus: z.enum(["completed", "pending", "canceled"]).default("pending"),
  comments: z.string().optional(),
});


// 📄 Employee Document Schema
export const EmployeeDocumentSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  national_id: z.string().min(1, "National ID is required"),
  passport_photo: z.string().url("Valid passport photo URL is required").optional(),
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


// ----------------------
// Employee Details Schema
// ----------------------
export const EmployeeDetailsSchema = z.object({
  surname: z.string().min(1, "Surname is required"),
  other_names: z.string().min(1, "Other names are required"),
  current_address: z.string().min(1, "Current address is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  profile_picture: z.string().optional(),
  age: z.number().min(0, "Age must be positive"),
  gender: z.enum(["male", "female"]),
  place_of_birth: z.string().min(1, "Place of birth is required"),

  is_citizen: z.boolean(),
  citizen_info: z
    .object({
      chief_name: z.string().min(1, "Chief's name is required"),
      district: z.string().min(1, "District is required"),
      tax_id: z.string().min(1, "Tax Identity Number is required"),
    })
    .optional(),
  non_citizen_info: z
    .object({
      certificate_number: z.string().min(1, "Certificate number is required"),
      date_of_issue: z.string().min(1, "Date of issue is required"),
      present_nationality: z.string().min(1, "Present nationality is required"),
    })
    .optional(),
}).refine(
  (data) =>
    (data.is_citizen && data.citizen_info) ||
    (!data.is_citizen && data.non_citizen_info),
  {
    message: "Citizen or non-citizen details must be provided",
    path: ["citizenship"],
  }
);

// ----------------------
// Legal Information Schema
// ----------------------
export const LegalInfoSchema = z.object({
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
}).refine(
  (data) =>
    !data.has_criminal_record || (data.has_criminal_record && data.criminal_record),
  {
    message: "If criminal record is yes, offense details are required",
    path: ["criminal_record"],
  }
).refine(
  (data) => !data.dismissed_from_work || !!data.dismissal_reason,
  {
    message: "Dismissal reason is required if dismissed from work",
    path: ["dismissal_reason"],
  }
).refine(
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
// Education History Schema
// ----------------------
export const EducationEntrySchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  date_of_entry: z.string().min(1, "Date of entry is required"),
  date_of_leaving: z.string().min(1, "Date of leaving is required"),
  qualification: z.string().min(1, "Qualification is required"),
  qualification_start_date: z.string().min(1, "Start date is required"),
  qualification_completion_date: z.string().min(1, "Completion date is required"),
  additional_skills: z.array(z.string()).optional(),
});

export const EducationHistorySchema = z.array(EducationEntrySchema);

// ----------------------
// Employment History Schema
// ----------------------
export const EmploymentEntrySchema = z.object({
  employer_name: z.string().min(1, "Employer name is required"),
  employer_address: z.string().min(1, "Employer address is required"),
  position: z.string().min(1, "Position is required"),
  duties: z.string().min(1, "Duties and responsibilities are required"),
  employment_start: z.string().min(1, "Start date is required"),
  employment_end: z.string().min(1, "End date is required"),
  salary: z.number().min(0, "Salary must be a positive number"),
  reason_for_leaving: z.string().optional(),
  notice_period: z.string().optional(),
});

export const EmploymentHistorySchema = z.array(EmploymentEntrySchema);

// ----------------------
// References Schema
// ----------------------
export const ReferenceEntrySchema = z.object({
  name: z.string().min(1, "Reference name is required"),
  address: z.string().min(1, "Reference address is required"),
  occupation: z.string().min(1, "Occupation is required"),
  known_duration: z.string().min(1, "Duration of acquaintance is required"),
});

export const ReferencesSchema = z.array(ReferenceEntrySchema);

// ----------------------
// Combined Schema
// ----------------------
export const EmployeeSchema = z.object({
  employee_details: EmployeeDetailsSchema,
  legal_info: LegalInfoSchema,
  education_history: EducationHistorySchema,
  employment_history: EmploymentHistorySchema,
  references: ReferencesSchema,
});



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
export const OutsideEmploymentSchema = z.object({
  has_outside_employment: z.boolean().default(false),
  employer_names: z.string().optional(),
  nature_of_business: z.string().optional(),
  hours_per_week: z.number().min(0, "Hours must be positive").max(168, "Hours cannot exceed 168 per week").optional(),
  relationship_to_duties: z.string().optional(),
}).refine(
  (data) => !data.has_outside_employment ||
    (data.has_outside_employment && data.employer_names && data.nature_of_business),
  {
    message: "Employer names and nature of business are required when declaring outside employment",
    path: ["employer_names"],
  }
);

// Conflict of Interest Schema
export const ConflictOfInterestSchema = z.object({
  has_conflict: z.boolean().default(false),
  conflict_details: z.string().optional(),
  mitigation_measures: z.string().optional(),
}).refine(
  (data) => !data.has_conflict ||
    (data.has_conflict && data.conflict_details && data.mitigation_measures),
  {
    message: "Conflict details and mitigation measures are required when declaring a conflict of interest",
    path: ["conflict_details"],
  }
);

// Gifts and Benefits Schema
export const GiftsBenefitsSchema = z.object({
  received_gifts: z.boolean().default(false),
  gift_details: z.string().optional(),
  gift_value: z.number().min(0, "Gift value must be positive").optional(),
  donor_relationship: z.enum(["vendor", "client", "colleague", "other", ""]).optional(),
}).refine(
  (data) => !data.received_gifts ||
    (data.received_gifts && data.gift_details && data.gift_value !== undefined),
  {
    message: "Gift details and value are required when declaring gifts received",
    path: ["gift_details"],
  }
);

// Declaration Schema
export const ConcurrencyDeclarationSchema = z.object({
  is_truthful: z.boolean().refine((val) => val === true, {
    message: "You must declare that the information provided is true and complete",
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
  form_type: z.enum(["concurrency_declaration", "conflict_of_interest", "annual_disclosure"]).default("concurrency_declaration"),
  submission_date: z.string().optional(),
  status: z.enum(["draft", "pending", "submitted", "under_review", "approved", "rejected", "requires_revision"]).default("draft"),

  // Form Sections
  personal_info: ConcurrencyPersonalInfoSchema,
  outside_employment: OutsideEmploymentSchema,
  conflict_of_interest: ConflictOfInterestSchema,
  gifts_benefits: GiftsBenefitsSchema,
  declaration: ConcurrencyDeclarationSchema,

  // Review Information (for admin use)
  review_info: z.object({
    reviewed_by: z.string().optional(),
    review_date: z.string().optional(),
    reviewer_notes: z.string().optional(),
    decision: z.enum(["approved", "rejected", "requires_revision"]).optional(),
    decision_date: z.string().optional(),
  }).optional(),

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
  status: z.enum(["all", "draft", "pending", "submitted", "under_review", "approved", "rejected", "requires_revision"]).optional(),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  form_type: z.enum(["all", "concurrency_declaration", "conflict_of_interest", "annual_disclosure"]).optional(),
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
  form_ids: z.array(z.string().min(1)).min(1, "At least one form ID is required"),
  action: z.enum(["approve", "reject", "delete", "request_revision"]),
  notes: z.string().optional(),
});

// ----------------------
// Concurrency Settings Schema (for organization policies)
// ----------------------
export const ConcurrencySettingsSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required"),
  gift_threshold: z.number().min(0, "Gift threshold must be positive").default(100),
  requires_annual_disclosure: z.boolean().default(true),
  disclosure_frequency: z.enum(["annual", "biannual", "quarterly", "on_hire"]).default("annual"),
  approval_workflow: z.enum(["direct_supervisor", "hr_department", "ethics_committee", "combined"]).default("direct_supervisor"),
  auto_reminder_days: z.number().min(0).max(365).default(30),
  retention_period_years: z.number().min(1).max(30).default(7),
});

// ----------------------
// Types
// ----------------------
export type EmployeeDetailsFormValues = z.infer<typeof EmployeeDetailsSchema>;
export type LegalInfoFormValues = z.infer<typeof LegalInfoSchema>;
export type EducationEntryFormValues = z.infer<typeof EducationEntrySchema>;
export type EmploymentEntryFormValues = z.infer<typeof EmploymentEntrySchema>;
export type ReferenceEntryFormValues = z.infer<typeof ReferenceEntrySchema>;
export type EmployeeFormValues = z.infer<typeof EmployeeSchema>;

// ----------------------
// Types
// ----------------------
export type ConcurrencyPersonalInfoFormValues = z.infer<typeof ConcurrencyPersonalInfoSchema>;
export type OutsideEmploymentFormValues = z.infer<typeof OutsideEmploymentSchema>;
export type ConflictOfInterestFormValues = z.infer<typeof ConflictOfInterestSchema>;
export type GiftsBenefitsFormValues = z.infer<typeof GiftsBenefitsSchema>;
export type ConcurrencyDeclarationFormValues = z.infer<typeof ConcurrencyDeclarationSchema>;
export type ConcurrencyFormValues = z.infer<typeof ConcurrencyFormSchema>;
export type ConcurrencyReviewFormValues = z.infer<typeof ConcurrencyReviewSchema>;
export type ConcurrencyFilterFormValues = z.infer<typeof ConcurrencyFilterSchema>;
export type ConcurrencyStatsValues = z.infer<typeof ConcurrencyStatsSchema>;
export type ConcurrencyBulkActionValues = z.infer<typeof ConcurrencyBulkActionSchema>;
export type ConcurrencySettingsValues = z.infer<typeof ConcurrencySettingsSchema>;