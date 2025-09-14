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

// Position CRUD Operations
export const createPosition = async (positionData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("positions");
        const position = {
            ...positionData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await collection.insertOne(position);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating position:", error.message);
        return { error: error.message };
    }
}

export const getPositionById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("positions");
        const position = await collection.findOne({ _id: new ObjectId(id) });
        return position || null;
    } catch (error: any) {
        console.error("Error fetching position:", error.message);
        return { error: error.message };
    }
}

export const updatePosition = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("positions");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating position:", error.message);
        return { error: error.message };
    }
}

export const deletePosition = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("positions");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return { deletedCount: result.deletedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting position:", error.message);
        return { error: error.message };
    }
}

export const getAllPositions = async (includeInactive = false) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("positions");
        const departmentCollection = await database?.collection("departments");
        const filter = includeInactive ? {} : { isActive: { $ne: false } };

        const positions = await collection.find(filter).toArray();

        // Fetch section names for each position
        const positionsWithDepartments = await Promise.all(
            positions.map(async (position: any) => {
                if (position.department_id) {
                    const section = await departmentCollection.findOne({
                        _id: new ObjectId(position.department_id)
                    });
                    return {
                        ...position,
                        _id: position._id.toString(),
                        department_name: section?.department_name || "No Section"
                    };
                }
                return {
                    ...position,
                    _id: position._id.toString(),
                    department_name: "No Section"
                };
            })
        );

        return positionsWithDepartments;
    } catch (error: any) {
        console.error("Error fetching positions:", error.message);
        return { error: error.message };
    }
}

export const getPositionWithDepartment = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const positionCollection = await database?.collection("positions");
        const departmentCollection = await database?.collection("departments");

        const position = await positionCollection.findOne({ _id: new ObjectId(id) });
        if (!position) return null;

        const section = await departmentCollection.findOne({ _id: new ObjectId(position.departemnt_id) });

        return { ...position, section };
    } catch (error: any) {
        console.error("Error fetching position with section:", error.message);
        return { error: error.message };
    }
}

export const updatePositionDepartment = async (positionId: string, newDepartmentId: string) => {
    if (!dbConnection) await init();
    try {
        const positionCollection = await database?.collection("positions");
        const result = await positionCollection.updateOne(
            { _id: new ObjectId(positionId) },
            { $set: { departemnt_id: newDepartmentId, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating position section:", error.message);
        return { error: error.message };
    }
}
