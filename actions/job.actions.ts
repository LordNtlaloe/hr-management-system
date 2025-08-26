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

export const createJob = async (jobData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("jobs");
        const result = await collection.insertOne(jobData);
        return result.insertedId;
    } catch (error: any) {
        console.error("Error creating job:", error.message);
        return { error: error.message };
    }
}

export const getJobById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("jobs");
        return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error: any) {
        console.error("Error fetching job:", error.message);
        return { error: error.message };
    }
}

export const updateJob = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("jobs");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        return result.modifiedCount;
    } catch (error: any) {
        console.error("Error updating job:", error.message);
        return { error: error.message };
    }
}

export const deleteJob = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("jobs");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount;
    } catch (error: any) {
        console.error("Error deleting job:", error.message);
        return { error: error.message };
    }
}

export const getAllJobs = async () => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("jobs");
        return await collection.find().toArray();
    } catch (error: any) {
        console.error("Error fetching jobs:", error.message);
        return { error: error.message };
    }
}