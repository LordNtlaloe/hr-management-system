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

// Section CRUD Operations
export const createSection = async (departmentData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("sections");
        const section = {
            ...departmentData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await collection.insertOne(section);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating section:", error.message);
        return { error: error.message };
    }
}

export const getSectionById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("sections");
        const section = await collection.findOne({ _id: new ObjectId(id) });
        return section || null;
    } catch (error: any) {
        console.error("Error fetching section:", error.message);
        return { error: error.message };
    }
}

export const updateSection = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("sections");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating section:", error.message);
        return { error: error.message };
    }
}

export const deleteSection = async (id: string) => {
    if (!dbConnection) await init();
    try {
        // Check if section has employees
        const employeeCollection = await database?.collection("employees");
        const employeeCount = await employeeCollection.countDocuments({ 
            departmentId: new ObjectId(id),
            isActive: { $ne: false }
        });
        
        if (employeeCount > 0) {
            return { error: "Cannot delete section with active employees" };
        }

        const collection = await database?.collection("sections");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, deletedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting section:", error.message);
        return { error: error.message };
    }
}
export const getAllSections = async (includeInactive = false) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("sections");
        const filter = includeInactive ? {} : { isActive: { $ne: false } };
        
        const sections = await collection.find(filter).toArray();

        // Convert _id (ObjectId) to string before returning
        return sections.map((section: { _id: { toString: () => any; }; }) => ({
            ...section,
            _id: section._id.toString(),  // Convert _id to string
        }));
    } catch (error: any) {
        console.error("Error fetching sections:", error.message);
        return { error: error.message };
    }
}

export const getSectionWithEmployees = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const departmentCollection = await database?.collection("sections");
        const employeeCollection = await database?.collection("employees");
        
        const section = await departmentCollection.findOne({ _id: new ObjectId(id) });
        if (!section) return null;
        
        const employees = await employeeCollection.find({ 
            departmentId: new ObjectId(id),
            isActive: { $ne: false }
        }).toArray();
        
        return { ...section, employees };
    } catch (error: any) {
        console.error("Error fetching section with employees:", error.message);
        return { error: error.message };
    }
}

export const updateSectionEmployeeCount = async (departmentId: string) => {
    if (!dbConnection) await init();
    try {
        const employeeCollection = await database?.collection("employees");
        const departmentCollection = await database?.collection("sections");
        
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
        console.error("Error updating section employee count:", error.message);
        return { error: error.message };
    }
}