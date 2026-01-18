import type { User } from "next-auth"

export type Section = {
  _id: string
  section_name: string
  createdAt: string
  updatedAt: string
}

export type Ministry = {
  _id: string
  ministry_name: string
  createdAt: string
  updatedAt: string
}

export type Position = {
  _id: string
  position_title: string
  departemnt_id: string
  salary_grade: string
  description: string
}

export type Employee = {
  employment_number: string
  gender: string
  section_name: string
  position_title: string
  manager_name: string
  qualifications: string
  emergency_contact: any
  banking_info: any
  additional_info: any
  _id: string
  user_id: string | User
  first_name: string
  last_name: string
  email: string
  phone: string
  image?: string
  section_id: string
  position_id: string
  manager_id?: string
  hire_date: Date
  salary: number
  status: "active" | "on-leave" | "terminated"
  skills?: string
  date_of_birth?: Date
  address?: string
  nationality?: string
  createdAt?: string
  updatedAt?: string
}

export type EmployeeInput = {
  first_name: string
  last_name: string
  email: string
  phone: string
  section_id: string
  position_id: string
  manager_id?: string
  hire_date: Date
  salary: number
  status?: "active" | "on-leave" | "terminated"
  skills?: string
  date_of_birth?: Date
  address?: string
  nationality?: string
}

export type LeaveType = {
  id: string
  title: string
  start: string
  end: string
  type: "leave" | "event" | "holiday"
  extendedProps?: {
    status?: "pending" | "approved" | "rejected"
    leaveType?: "sick" | "vacation" | "personal" | "unpaid"
    [key: string]: any
  }
}

export type EmployeeWithUser = Employee & {
  user: User & {
    role?: "User" | "Manager" | "Admin"
  }
}

export interface LeaveRequest {
  partAData: any
  partBData: any
  formData: undefined
  _id: string
  employeeId: Employee.is
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
  status: "pending" | "approved" | "rejected"
  approvedBy?: Employee
  rejectedBy?: Employee
  approvedDate?: string
  rejectedDate?: string
  rejectionReason?: string
  approverComments?: string
  appliedDate: string
  days: number
  createdAt: string
  updatedAt: string
}


export interface LeaveWithEmployee extends LeaveRequest {
  formData: any
  employeeDetails: Employee
}



// Base response type for all server actions
export interface BaseActionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface CreateConcurrencyResponse extends BaseActionResponse {
  insertedId?: string;
}

export interface UpdateConcurrencyResponse extends BaseActionResponse {
  modifiedCount?: number;
}

export interface SubmitConcurrencyResponse extends BaseActionResponse {
  modifiedCount?: number;
}

export interface ConcurrencyFormState {
  success: boolean;
  message: string;
  error?: string;
  insertedId?: string;
  modifiedCount?: number;
}