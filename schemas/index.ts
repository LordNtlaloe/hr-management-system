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
// Types
// ----------------------
export type EmployeeDetailsFormValues = z.infer<typeof EmployeeDetailsSchema>;
export type LegalInfoFormValues = z.infer<typeof LegalInfoSchema>;
export type EducationEntryFormValues = z.infer<typeof EducationEntrySchema>;
export type EmploymentEntryFormValues = z.infer<typeof EmploymentEntrySchema>;
export type ReferenceEntryFormValues = z.infer<typeof ReferenceEntrySchema>;
export type EmployeeFormValues = z.infer<typeof EmployeeSchema>;
