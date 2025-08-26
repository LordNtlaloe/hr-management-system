"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";

let dbConnection: any;
let database: any;
export const runtime = 'nodejs'

const init = async () => {
    if (!dbConnection) {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
    }
};

// CREATE
export const createCandidate = async (candidateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("candidates");
        const result = await collection.insertOne(candidateData);
        return result.insertedId;
    } catch (error: any) {
        return { error: error.message };
    }
};

// READ ALL
export const getAllCandidates = async () => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("candidates");
        return await collection.find().toArray();
    } catch (error: any) {
        return { error: error.message };
    }
};

// READ ONE
export const getCandidateById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("candidates");
        return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error: any) {
        return { error: error.message };
    }
};

// UPDATE
export const updateCandidate = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("candidates");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        return result.modifiedCount;
    } catch (error: any) {
        return { error: error.message };
    }
};

// DELETE
export const deleteCandidate = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("candidates");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount;
    } catch (error: any) {
        return { error: error.message };
    }
};
