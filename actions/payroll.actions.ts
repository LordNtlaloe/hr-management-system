"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
let dbConnection: any;
let database: any;
export const runtime = 'nodejs'

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

export const createPayroll = async (payrollData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("payrolls");
        const result = await collection.insertOne(payrollData);
        return result.insertedId;
    } catch (error: any) {
        console.error("Error creating payroll:", error.message);
        return { error: error.message };
    }
}

export const getPayrollById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("payrolls");
        return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error: any) {
        console.error("Error fetching payroll:", error.message);
        return { error: error.message };
    }
}

export const getPayrollsByEmployee = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("payrolls");
        return await collection.find({ employee_id: employeeId }).toArray();
    } catch (error: any) {
        console.error("Error fetching employee payrolls:", error.message);
        return { error: error.message };
    }
}

export const updatePayroll = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("payrolls");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        return result.modifiedCount;
    } catch (error: any) {
        console.error("Error updating payroll:", error.message);
        return { error: error.message };
    }
}

export const deletePayroll = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("payrolls");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount;
    } catch (error: any) {
        console.error("Error deleting payroll:", error.message);
        return { error: error.message };
    }
}