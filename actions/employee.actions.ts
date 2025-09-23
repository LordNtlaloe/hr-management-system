"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
    EmployeeDetailsSchema,
    UpdateEmployeeDetailsSchema,
    AddressSchema,
    EmergencyContactSchema,
    BankingInfoSchema,
    AdditionalInfoSchema,
    EmployeeSchema
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
}// Employee CRUD Operations
export const createEmployee = async (employeeData: z.infer<typeof EmployeeSchema>) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const employee = {
            ...employeeData,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            user_id: null
        };
        const result = await collection.insertOne(employee);
        return { insertedId: result.insertedId.toString(), success: true };
    } catch (error: any) {
        console.error("Error creating employee:", error.message);
        return { error: error.message };
    }
};

export const getEmployeeById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };
        const collection = await database?.collection("employees");
        const employee = await collection.findOne({ _id: new ObjectId(id) });
        return employee ? { ...employee, _id: employee._id.toString() } : null;
    } catch (error: any) {
        console.error("Error fetching employee:", error.message);
        return { error: error.message };
    }
};

export const getEmployeeByUserId = async (userId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const employee = ObjectId.isValid(userId)
            ? await collection.findOne({ userId: new ObjectId(userId) })
            : await collection.findOne({ userId });

        if (!employee) return null;

        const positionCollection = await database?.collection("positions");
        const departmentCollection = await database?.collection("departments");

        const position = employee.positionId && ObjectId.isValid(employee.positionId)
            ? await positionCollection.findOne({ _id: new ObjectId(employee.positionId) })
            : null;

        const section = employee.departmentId && ObjectId.isValid(employee.departmentId)
            ? await departmentCollection.findOne({ _id: new ObjectId(employee.departmentId) })
            : null;

        const managerName = employee.managerId && ObjectId.isValid(employee.managerId)
            ? await getEmployeeName(employee.managerId)
            : null;

        return {
            ...employee,
            _id: employee._id.toString(),
            position_title: position?.position_title || "Unknown",
            department_name: section?.department_name || "Unknown",
            manager_name: managerName
        };
    } catch (error: any) {
        console.error("Error fetching employee by userId:", error.message);
        return { error: error.message };
    }
};

export const updateEmployee = async (id: string, updateData: Partial<z.infer<typeof EmployeeSchema>>) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };
        const collection = await database?.collection("employees");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating employee:", error.message);
        return { error: error.message };
    }
};

export const deleteEmployee = async (id: string) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };
        const collection = await database?.collection("employees");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, deletedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting employee:", error.message);
        return { error: error.message };
    }
};

export const getAllEmployees = async (includeInactive = false) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const positionCollection = await database?.collection("positions");
        const departmentCollection = await database?.collection("departments");

        const filter = includeInactive ? {} : { isActive: { $ne: false } };
        const employees = await collection.find(filter).toArray();

        const enhancedEmployees = await Promise.all(
            employees.map(async (employee: any) => {
                const positionId = employee.positionId || employee.position_id;
                const departmentId = employee.departmentId || employee.department_id;

                const position = positionId && ObjectId.isValid(positionId)
                    ? await positionCollection.findOne({ _id: new ObjectId(positionId) })
                    : null;

                const section = departmentId && ObjectId.isValid(departmentId)
                    ? await departmentCollection.findOne({ _id: new ObjectId(departmentId) })
                    : null;

                return {
                    ...employee,
                    _id: employee._id.toString(),
                    position_title: position?.position_title || "Unknown",
                    department_name: section?.department_name || "Unknown",
                    manager_name: employee.managerId && ObjectId.isValid(employee.managerId)
                        ? await getEmployeeName(employee.managerId)
                        : null,
                    positionId,
                    departmentId
                };
            })
        );

        return enhancedEmployees;
    } catch (error: any) {
        console.error("Error fetching employees:", error.message);
        return { error: error.message };
    }
};

export const getEmployeesByDepartment = async (departmentId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const filter: any = { isActive: { $ne: false } };

        if (ObjectId.isValid(departmentId)) {
            filter.departmentId = new ObjectId(departmentId);
        } else {
            filter.departmentId = departmentId;
        }

        const employees = await collection.find(filter).toArray();

        return employees.map((employee: any) => ({
            ...employee,
            _id: employee._id.toString()
        }));
    } catch (error: any) {
        console.error("Error fetching section employees:", error.message);
        return { error: error.message };
    }
};

export const linkEmployeeWithUser = async (employeeId: string, userId: string) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(employeeId)) return { error: "Invalid employee ID" };
        const collection = await database?.collection("employees");
        const result = await collection.updateOne(
            { _id: new ObjectId(employeeId) },
            {
                $set: {
                    user_id: userId,
                    updatedAt: new Date()
                }
            }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error linking employee with user:", error.message);
        return { error: error.message };
    }
};

// --- SKIPPING unchanged EmployeeDetails CRUD (same as yours) ---


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
        // Validate the employeeId
        if (!employeeId || !ObjectId.isValid(employeeId)) {
            return { error: "Invalid employee ID" };
        }

        const collection = await database?.collection("employee_details");

        const details = await collection.findOne({
            employee_id: employeeId,
            isActive: { $ne: false }
        });

        if (!details) {
            return null;
        }

        // Transform the data to ensure consistent structure
        const transformedDetails = {
            _id: details._id.toString(),
            employee_id: details.employee_id,
            address: details.address || {},
            emergency_contact: details.emergency_contact || {},
            banking_info: details.banking_info || {},
            additional_info: details.additional_info || {},
            createdAt: details.createdAt,
            updatedAt: details.updatedAt,
            isActive: details.isActive
        };

        return transformedDetails;

    } catch (error: any) {
        console.error("Error fetching employee details:", error.message);
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
            employeeCollection.findOne({
                _id: new ObjectId(employeeId),
                isActive: { $ne: false }
            }),
            detailsCollection.findOne({
                employee_id: employeeId,
                isActive: { $ne: false }
            })
        ]);

        if (!employee) {
            return { error: "Employee not found" };
        }

        // Transform employee data
        const transformedEmployee = {
            _id: employee._id.toString(),
            first_name: employee.first_name,
            last_name: employee.last_name,
            employment_number: employee.employment_number,
            gender: employee.gender,
            email: employee.email,
            phone: employee.phone,
            section_id: employee.section_id,
            position_id: employee.position_id,
            manager_id: employee.manager_id,
            hire_date: employee.hire_date,
            date_of_birth: employee.date_of_birth,
            salary: employee.salary,
            status: employee.status,
            qualifications: employee.qualifications,
            physical_address: employee.physical_address,
            nationality: employee.nationality,
            user_id: employee.user_id,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt
        };

        // Transform details data
        const transformedDetails = details ? {
            _id: details._id.toString(),
            employee_id: details.employee_id,
            address: details.address || {},
            emergency_contact: details.emergency_contact || {},
            banking_info: details.banking_info || {},
            additional_info: details.additional_info || {},
            createdAt: details.createdAt,
            updatedAt: details.updatedAt
        } : null;

        return {
            employee: transformedEmployee,
            details: transformedDetails,
            success: true
        };

    } catch (error: any) {
        console.error("Error fetching complete employee profile:", error.message);
        return { error: error.message };
    }
}

// Helper function
async function getEmployeeName(employeeId: string) {
    const collection = await database?.collection("employees");
    const employee = await collection.findOne({
        _id: new ObjectId(employeeId)
    });
    return employee ? `${employee.first_name} ${employee.last_name}` : null;
}