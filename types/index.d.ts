import { User } from "next-auth";

export type Section = {
    _id: string;
    section_name: string;
    createdAt: string;
    updatedAt: string;
};

export type Ministry = {
    _id: string;
    ministry_name: string;
    createdAt: string;
    updatedAt: string;
};


export type Position = {
    _id: string;
    position_title: string;
    departemnt_id: string;
    salary_grade: string;
    description: string;
}

import { User } from "next-auth";

export type Employee = {
    employment_number: string;
    gender: string;
    section_name: string;
    position_title: string;
    manager_name: string;
    qualifications: string;
    emergency_contact: any;
    banking_info: any;
    additional_info: any;
    _id: string;
    user_id: string | User; // Can be either user ID string or User object
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    image?: string;
    section_id: string;
    position_id: string;
    manager_id?: string;
    hire_date: Date;
    salary: number;
    status: "active" | "on-leave" | "terminated";
    skills?: string;
    date_of_birth?: Date;
    address?: string;
    nationality?: string;
    createdAt?: string; // Optional, might come from database
    updatedAt?: string; // Optional, might come from database
};

// You might also want to create an input type for creating/updating employees
export type EmployeeInput = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    section_id: string;
    position_id: string;
    manager_id?: string;
    hire_date: Date;
    salary: number;
    status?: "active" | "on-leave" | "terminated";
    skills?: string;
    date_of_birth?: Date;
    address?: string;
    nationality?: string;
};

export type LeaveType = {
    id: string;
    title: string;
    start: string;
    end: string;
    type: "leave" | "event" | "holiday"; // ✅ here
    extendedProps?: {
        status?: "pending" | "approved" | "rejected";
        leaveType?: "sick" | "vacation" | "personal" | "unpaid";
        [key: string]: any;
    };
};


// And a type that combines both User and Employee info
export type EmployeeWithUser = Employee & {
    user: User & {
        role?: "User" | "Manager" | "Admin";
    };
};