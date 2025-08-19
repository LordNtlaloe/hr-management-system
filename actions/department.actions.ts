"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
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

// Department CRUD Operations
export const createDepartment = async (departmentData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("departments");
        const department = {
            ...departmentData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await collection.insertOne(department);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating department:", error.message);
        return { error: error.message };
    }
}

export const getDepartmentById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("departments");
        const department = await collection.findOne({ _id: new ObjectId(id) });
        return department || null;
    } catch (error: any) {
        console.error("Error fetching department:", error.message);
        return { error: error.message };
    }
}

export const updateDepartment = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("departments");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating department:", error.message);
        return { error: error.message };
    }
}

export const deleteDepartment = async (id: string) => {
    if (!dbConnection) await init();
    try {
        // Check if department has employees
        const employeeCollection = await database?.collection("employees");
        const employeeCount = await employeeCollection.countDocuments({ 
            departmentId: new ObjectId(id),
            isActive: { $ne: false }
        });
        
        if (employeeCount > 0) {
            return { error: "Cannot delete department with active employees" };
        }

        const collection = await database?.collection("departments");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, deletedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting department:", error.message);
        return { error: error.message };
    }
}
export const getAllDepartments = async (includeInactive = false) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("departments");
        const filter = includeInactive ? {} : { isActive: { $ne: false } };
        
        const departments = await collection.find(filter).toArray();

        // Convert _id (ObjectId) to string before returning
        return departments.map((department: { _id: { toString: () => any; }; }) => ({
            ...department,
            _id: department._id.toString(),  // Convert _id to string
        }));
    } catch (error: any) {
        console.error("Error fetching departments:", error.message);
        return { error: error.message };
    }
}

export const getDepartmentWithEmployees = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const departmentCollection = await database?.collection("departments");
        const employeeCollection = await database?.collection("employees");
        
        const department = await departmentCollection.findOne({ _id: new ObjectId(id) });
        if (!department) return null;
        
        const employees = await employeeCollection.find({ 
            departmentId: new ObjectId(id),
            isActive: { $ne: false }
        }).toArray();
        
        return { ...department, employees };
    } catch (error: any) {
        console.error("Error fetching department with employees:", error.message);
        return { error: error.message };
    }
}

export const updateDepartmentEmployeeCount = async (departmentId: string) => {
    if (!dbConnection) await init();
    try {
        const employeeCollection = await database?.collection("employees");
        const departmentCollection = await database?.collection("departments");
        
        const employeeCount = await employeeCollection.countDocuments({ 
            departmentId: new ObjectId(departmentId),
            isActive: { $ne: false }
        });
        
        await departmentCollection.updateOne(
            { _id: new ObjectId(departmentId) },
            { $set: { employeeCount, updatedAt: new Date() } }
        );
        
        return { success: true, employeeCount };
    } catch (error: any) {
        console.error("Error updating department employee count:", error.message);
        return { error: error.message };
    }
}