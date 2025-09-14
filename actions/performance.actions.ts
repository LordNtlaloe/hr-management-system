"use server";

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Employee, Section, Position } from "@/types";

let dbConnection: any;
let database: any;

const init = async () => {
    if (!dbConnection) {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
    }
};

/**
 * Create a performance review
 */
export const createPerformance = async (
    employeeId: string,
    score: number,
    review: string
) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("performances");
        const entry = {
            employeeId: new ObjectId(employeeId),
            score,
            review,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await collection.insertOne(entry);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating performance entry:", error.message);
        return { error: error.message };
    }
};

/**
 * Get performance history for a single employee
 */
export const getPerformanceByEmployee = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("performances");
        return await collection
            .find({ employeeId: new ObjectId(employeeId) })
            .sort({ createdAt: -1 })
            .toArray();
    } catch (error: any) {
        console.error("Error fetching employee performance:", error.message);
        return { error: error.message };
    }
};

/**
 * Get all performances with joined employee, section, and position
 */
export async function getAllPerformances() {
    if (!dbConnection) await init();
    try {
        const performances = await database
            .collection("performances")
            .aggregate([
                // Join employees
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "_id",
                        as: "employee",
                    },
                },
                { $unwind: "$employee" },

                // Join sections, convert string to ObjectId if needed
                {
                    $lookup: {
                        from: "sections",
                        let: { deptId: "$employee.section_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", { $toObjectId: "$$deptId" }],
                                    },
                                },
                            },
                        ],
                        as: "section",
                    },
                },
                { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },

                // Join positions, convert string to ObjectId if needed
                {
                    $lookup: {
                        from: "positions",
                        let: { posId: "$employee.position_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", { $toObjectId: "$$posId" }],
                                    },
                                },
                            },
                        ],
                        as: "position",
                    },
                },
                { $unwind: { path: "$position", preserveNullAndEmptyArrays: true } },

                // Only select required fields
                {
                    $project: {
                        score: 1,
                        review: 1,
                        createdAt: 1,
                        "employee._id": 1,
                        "employee.first_name": 1,
                        "employee.last_name": 1,
                        "section.section_name": 1,
                        "position.position_title": 1,
                    },
                },
            ])
            .toArray();

        return performances as {
            _id: ObjectId;
            score: number;
            review: string;
            createdAt: string;
            employee: Pick<Employee, "_id" | "first_name" | "last_name">;
            section?: Pick<Section, "section_name">;
            position?: Pick<Position, "position_title">;
        }[];
    } catch (error: any) {
        console.error("Error fetching performances:", error.message);
        return { error: error.message };
    }
}

/**
 * Update a performance review
 */
export const updatePerformance = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("performances");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating performance entry:", error.message);
        return { error: error.message };
    }
};

/**
 * Delete a performance review
 */
export const deletePerformance = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = database.collection("performances");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return { deletedCount: result.deletedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting performance entry:", error.message);
        return { error: error.message };
    }
};

/**
 * Section-level performance summary (average score per section)
 */
export const getDepartmentPerformanceSummary = async (
    sectionId?: string
) => {
    if (!dbConnection) await init();
    try {
        const pipeline: any[] = [
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employee",
                },
            },
            { $unwind: "$employee" },
        ];

        if (sectionId) {
            pipeline.push({
                $match: { "employee.section_id": sectionId },
            });
        }

        pipeline.push({
            $group: {
                _id: "$employee.section_id",
                avgScore: { $avg: "$score" },
                reviews: { $sum: 1 },
            },
        });

        return await database.collection("performances").aggregate(pipeline).toArray();
    } catch (error: any) {
        console.error(
            "Error generating section performance summary:",
            error.message
        );
        return { error: error.message };
    }
};
