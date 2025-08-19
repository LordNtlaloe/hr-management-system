"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import { EmployeeSchema } from "@/schemas";
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

// Employee CRUD Operations
export const createEmployee = async (employeeData: z.infer<typeof EmployeeSchema>) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const employee = {
            ...employeeData,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };
        const result = await collection.insertOne(employee);
        return { insertedId: result.insertedId.toString(), success: true };
    } catch (error: any) {
        console.error("Error creating employee:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const employee = await collection.findOne({ _id: new ObjectId(id) });
        return employee ? { ...employee, _id: employee._id.toString() } : null;
    } catch (error: any) {
        console.error("Error fetching employee:", error.message);
        return { error: error.message };
    }
}

export const updateEmployee = async (id: string, updateData: Partial<z.infer<typeof EmployeeSchema>>) => {
    if (!dbConnection) await init();
    try {
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
}

export const deleteEmployee = async (id: string) => {
    if (!dbConnection) await init();
    try {
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
}

export const getAllEmployees = async (includeInactive = false) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const positionCollection = await database?.collection("positions");
        const departmentCollection = await database?.collection("departments");
        
        const filter = includeInactive ? {} : { isActive: { $ne: false } };
        const employees = await collection.find(filter).toArray();

        // Enhance employees with department and position names
        const enhancedEmployees = await Promise.all(
            employees.map(async (employee: any) => {
                // Try both field name variations to handle inconsistencies
                const positionId = employee.positionId || employee.position_id;
                const departmentId = employee.departmentId || employee.department_id;
                
                const position = positionId ? await positionCollection.findOne({ 
                    _id: new ObjectId(positionId) 
                }) : null;
                
                const department = departmentId ? await departmentCollection.findOne({ 
                    _id: new ObjectId(departmentId) 
                }) : null;
                
                return {
                    ...employee,
                    _id: employee._id.toString(),
                    // Ensure these field names match what your columns expect
                    position_title: position?.position_title || "Unknown",
                    department_name: department?.department_name || "Unknown",
                    manager_name: employee.managerId ? 
                        await getEmployeeName(employee.managerId) : null,
                    // Include the original IDs for reference
                    positionId: positionId,
                    departmentId: departmentId
                };
            })
        );

        return enhancedEmployees;
    } catch (error: any) {
        console.error("Error fetching employees:", error.message);
        return { error: error.message };
    }
}

async function getEmployeeName(employeeId: string) {
    const collection = await database?.collection("employees");
    const employee = await collection.findOne({ 
        _id: new ObjectId(employeeId) 
    });
    return employee ? `${employee.firstName} ${employee.lastName}` : null;
}

export const getEmployeesByDepartment = async (departmentId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employees");
        const employees = await collection.find({ 
            departmentId: departmentId,
            isActive: { $ne: false }
        }).toArray();
        
        return employees.map((employee: any) => ({
            ...employee,
            _id: employee._id.toString()
        }));
    } catch (error: any) {
        console.error("Error fetching department employees:", error.message);
        return { error: error.message };
    }
}

