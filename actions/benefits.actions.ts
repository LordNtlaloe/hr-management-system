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

export const createBenefit = async (benefitData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("benefits");
        const result = await collection.insertOne(benefitData);
        return result.insertedId;
    } catch (error: any) {
        console.error("Error creating benefit:", error.message);
        return { error: error.message };
    }
}

export const getBenefitById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("benefits");
        return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error: any) {
        console.error("Error fetching benefit:", error.message);
        return { error: error.message };
    }
}

export const updateBenefit = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("benefits");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        return result.modifiedCount;
    } catch (error: any) {
        console.error("Error updating benefit:", error.message);
        return { error: error.message };
    }
}

export const deleteBenefit = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("benefits");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount;
    } catch (error: any) {
        console.error("Error deleting benefit:", error.message);
        return { error: error.message };
    }
}

export const getAllBenefits = async () => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("benefits");
        return await collection.find().toArray();
    } catch (error: any) {
        console.error("Error fetching benefits:", error.message);
        return { error: error.message };
    }
}

// Employee-Benefits junction operations
export const enrollEmployeeInBenefit = async (employeeId: string, benefitId: string, enrollmentData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_benefits");
        const result = await collection.insertOne({
            employee_id: employeeId,
            benefit_id: benefitId,
            ...enrollmentData
        });
        return result.insertedId;
    } catch (error: any) {
        console.error("Error enrolling employee in benefit:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeBenefits = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("employee_benefits");
        return await collection.find({ employee_id: employeeId }).toArray();
    } catch (error: any) {
        console.error("Error fetching employee benefits:", error.message);
        return { error: error.message };
    }
}