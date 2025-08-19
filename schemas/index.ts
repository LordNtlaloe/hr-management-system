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
export const EmployeeSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    department_id: z.string().min(1, "Department is required"),
    position_id: z.string().min(1, "Position is required"),
    manager_id: z.string().optional(),
    hire_date: z.date(),
    salary: z.coerce.number().min(0, "Salary must be positive"),
    status: z.enum(["active", "on-leave", "terminated"]).default("active"),
    skills: z.string().optional(),
    date_of_birth: z.date().optional(),
    address: z.string().optional(),
    nationality: z.string().optional(),
});


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


// 🏢 Department Schema
export const DepartmentSchema = z.object({
    department_name: z.string().min(1, "Department name is required"),
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
    department_id: z.string().min(1, "Department ID is required"),
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
