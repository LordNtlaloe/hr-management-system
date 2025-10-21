"use server";

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";

let dbConnection: any;
let database: any;

const init = async () => {
    if (dbConnection) return;
    try {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};

// ----------------------
// Create Activity
// ----------------------
export const addEmployeeActivity = async (data: {
    employeeId: string;
    type: "leave" | "concurrency";
    description: string;
    date?: Date;
}) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(data.employeeId)) return { error: "Invalid employee ID" };

        const collection = await database?.collection("employee_activities");
        const activity = {
            employeeId: new ObjectId(data.employeeId),
            type: data.type,
            description: data.description,
            date: data.date || new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
        };

        const result = await collection.insertOne(activity);
        return { insertedId: result.insertedId.toString(), success: true };
    } catch (error: any) {
        console.error("Error adding employee activity:", error.message);
        return { error: error.message };
    }
};

// ----------------------
// Get Activities by Employee
// ----------------------
export const getEmployeeActivities = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(employeeId)) return { error: "Invalid employee ID" };

        const collection = await database?.collection("employee_activities");
        const activities = await collection
            .find({ employeeId: new ObjectId(employeeId), isActive: { $ne: false } })
            .sort({ date: -1 })
            .toArray();

        return activities.map((a: any) => ({
            ...a,
            _id: a._id.toString(),
            employeeId: a.employeeId.toString(),
        }));
    } catch (error: any) {
        console.error("Error fetching activities:", error.message);
        return { error: error.message };
    }
};

// ----------------------
// Soft Delete Activity
// ----------------------
export const deleteEmployeeActivity = async (id: string) => {
    if (!dbConnection) await init();
    try {
        if (!ObjectId.isValid(id)) return { error: "Invalid activity ID" };

        const collection = await database?.collection("employee_activities");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, deletedAt: new Date() } }
        );

        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting activity:", error.message);
        return { error: error.message };
    }
};
