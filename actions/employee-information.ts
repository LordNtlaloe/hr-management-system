"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
    EmployeeDetailsSchema,
    UpdateEmployeeDetailsSchema,
    AddressSchema,
    EmergencyContactSchema,
    BankingInfoSchema,
    AdditionalInfoSchema
} from "@/schemas";
import { z } from "zod";

let dbConnection: any;
let database: any;

const init = async () => {
    try {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

// Employee Details CRUD Operations
export const createEmployeeDetails = async (detailsData: z.infer<typeof EmployeeDetailsSchema>) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");

        // Check if details already exist for this employee
        const existingDetails = await collection.findOne({
            employee_id: detailsData.employee_id
        });

        if (existingDetails) {
            return { error: "Employee details already exist. Use update instead." };
        }

        const employeeDetails = {
            ...detailsData,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };

        const result = await collection.insertOne(employeeDetails);
        return { insertedId: result.insertedId.toString(), success: true };
    } catch (error: any) {
        console.error("Error creating employee details:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeDetailsById = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const details = await collection.findOne({
            employee_id: employeeId,
            isActive: { $ne: false }
        });
        return details ? { ...details, _id: details._id.toString() } : null;
    } catch (error: any) {
        console.error("Error fetching employee details:", error.message);
        return { error: error.message };
    }
}

export const updateEmployeeDetails = async (
    employeeId: string,
    updateData: z.infer<typeof UpdateEmployeeDetailsSchema>
) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");

        // Remove employee_id from update data to prevent conflicts
        const { employee_id, ...dataToUpdate } = updateData;

        const result = await collection.updateOne(
            { employee_id: employeeId },
            {
                $set: {
                    ...dataToUpdate,
                    updatedAt: new Date()
                }
            },
            { upsert: true } // Create if doesn't exist
        );

        return {
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            success: true
        };
    } catch (error: any) {
        console.error("Error updating employee details:", error.message);
        return { error: error.message };
    }
}

// Update specific sections

export const updateAddress = async (
    employeeId: string,
    address: z.infer<typeof AddressSchema>
) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const result = await collection.updateOne(
            { employee_id: employeeId },
            {
                $set: {
                    address: address,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return {
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            success: true
        };
    } catch (error: any) {
        console.error("Error updating address:", error.message);
        return { error: error.message };
    }
}

export const updateEmergencyContact = async (
    employeeId: string,
    emergencyContact: z.infer<typeof EmergencyContactSchema>
) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const result = await collection.updateOne(
            { employee_id: employeeId },
            {
                $set: {
                    emergency_contact: emergencyContact,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return {
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            success: true
        };
    } catch (error: any) {
        console.error("Error updating emergency contact:", error.message);
        return { error: error.message };
    }
}

export const updateBankingInfo = async (
    employeeId: string,
    bankingInfo: z.infer<typeof BankingInfoSchema>
) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const result = await collection.updateOne(
            { employee_id: employeeId },
            {
                $set: {
                    banking_info: bankingInfo,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return {
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            success: true
        };
    } catch (error: any) {
        console.error("Error updating banking info:", error.message);
        return { error: error.message };
    }
}

export const updateAdditionalInfo = async (
    employeeId: string,
    additionalInfo: z.infer<typeof AdditionalInfoSchema>
) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const result = await collection.updateOne(
            { employee_id: employeeId },
            {
                $set: {
                    additional_info: additionalInfo,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return {
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            success: true
        };
    } catch (error: any) {
        console.error("Error updating additional info:", error.message);
        return { error: error.message };
    }
}

export const deleteEmployeeDetails = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const result = await collection.updateOne(
            { employee_id: employeeId },
            {
                $set: {
                    isActive: false,
                    deletedAt: new Date()
                }
            }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting employee details:", error.message);
        return { error: error.message };
    }
}

export const getAllEmployeeDetails = async (includeInactive = false) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_details");
        const employeeCollection = await database?.collection("employees");

        const filter = includeInactive ? {} : { isActive: { $ne: false } };
        const allDetails = await collection.find(filter).toArray();

        // Enhance with basic employee info
        const enhancedDetails = await Promise.all(
            allDetails.map(async (details: any) => {
                const employee = await employeeCollection.findOne({
                    _id: new ObjectId(details.employee_id)
                });

                return {
                    ...details,
                    _id: details._id.toString(),
                    employee_name: employee ?
                        `${employee.first_name} ${employee.last_name}` : "Unknown",
                    employee_email: employee?.email || null,
                    employee_department: employee?.department_id || null
                };
            })
        );

        return enhancedDetails;
    } catch (error: any) {
        console.error("Error fetching all employee details:", error.message);
        return { error: error.message };
    }
}

// Helper function to get employee basic info along with details
export const getCompleteEmployeeProfile = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const employeeCollection = await database?.collection("employees");
        const detailsCollection = await database?.collection("employee_details");

        const [employee, details] = await Promise.all([
            employeeCollection.findOne({ _id: new ObjectId(employeeId) }),
            detailsCollection.findOne({
                employee_id: employeeId,
                isActive: { $ne: false }
            })
        ]);

        if (!employee) {
            return { error: "Employee not found" };
        }

        return {
            employee: { ...employee, _id: employee._id.toString() },
            details: details ? { ...details, _id: details._id.toString() } : null
        };
    } catch (error: any) {
        console.error("Error fetching complete employee profile:", error.message);
        return { error: error.message };
    }
}