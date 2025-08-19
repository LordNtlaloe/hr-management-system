"use server"

import { connectToDB } from "@/lib/db"
import { ObjectId } from "mongodb"

let database: any;
let dbConnection: any;

const init = async () => {
    try {
        dbConnection = await connectToDB();
        database = await dbConnection?.db("hr_management_db");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

export const createMinistry = async (ministryData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("ministries");
        const ministry = {
            ...ministryData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await collection.insertOne(ministry);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating ministry:", error.message);
        return { error: error.message };
    }
}

export const getMinistryById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("ministries");
        const ministry = await collection.findOne({ _id: new ObjectId(id) });
        return ministry || null;
    } catch (error: any) {
        console.error("Error fetching ministry:", error.message);
        return { error: error.message };
    }
}

export const updateMinistry = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("ministries");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating ministry:", error.message);
        return { error: error.message };
    }
}   

export const deleteMinistry = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("ministries");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return { deletedCount: result.deletedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting ministry:", error.message);
        return { error: error.message };
    }
}


export const getAllMinistries = async () => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("ministries");
        const ministries = await collection.find({}).toArray();
        return ministries;
    } catch (error: any) {
        console.error("Error fetching ministries:", error.message);
        return { error: error.message };
    }
}