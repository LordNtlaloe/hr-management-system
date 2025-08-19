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

// Attendance CRUD Operations
export const createAttendance = async (attendanceData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        const attendance = {
            ...attendanceData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await collection.insertOne(attendance);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating attendance:", error.message)
        return { error: error.message };
    }
}

export const clockIn = async (employeeId: string, location?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Check if already clocked in today
        const existingRecord = await collection.findOne({
            employeeId: new ObjectId(employeeId),
            date: {
                $gte: startOfDay,
                $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingRecord && existingRecord.clockIn) {
            return { error: "Already clocked in today" };
        }

        const attendanceData = {
            employeeId: new ObjectId(employeeId),
            date: startOfDay,
            clockIn: new Date(),
            location: location || "Office",
            status: "present",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(attendanceData);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error clocking in:", error.message);
        return { error: error.message };
    }
}

export const clockOut = async (employeeId: string, location?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const result = await collection.updateOne(
            {
                employeeId: new ObjectId(employeeId),
                date: {
                    $gte: startOfDay,
                    $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
                },
                clockOut: { $exists: false }
            },
            {
                $set: {
                    clockOut: new Date(),
                    clockOutLocation: location || "Office",
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return { error: "No clock-in record found for today" };
        }

        // Calculate total hours worked
        const record = await collection.findOne({
            employeeId: new ObjectId(employeeId),
            date: {
                $gte: startOfDay,
                $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (record && record.clockIn && record.clockOut) {
            const hoursWorked = (record.clockOut.getTime() - record.clockIn.getTime()) / (1000 * 60 * 60);
            await collection.updateOne(
                { _id: record._id },
                { $set: { hoursWorked: Math.round(hoursWorked * 100) / 100 } }
            );
        }

        return { success: true, modifiedCount: result.modifiedCount };
    } catch (error: any) {
        console.error("Error clocking out:", error.message);
        return { error: error.message };
    }
}

export const getAttendanceById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        const attendance = await collection.findOne({ _id: new ObjectId(id) });
        return attendance || null;
    } catch (error: any) {
        console.error("Error fetching attendance:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeAttendance = async (employeeId: string, startDate?: Date, endDate?: Date) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        let filter: any = { employeeId: new ObjectId(employeeId) };

        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        }

        return await collection.find(filter).sort({ date: -1 }).toArray();
    } catch (error: any) {
        console.error("Error fetching employee attendance:", error.message);
        return { error: error.message };
    }
}

export const getDailyAttendance = async (date: Date) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        const employeeCollection = await database?.collection("employees");

        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        const attendance = await collection.aggregate([
            {
                $match: {
                    date: { $gte: startOfDay, $lt: endOfDay }
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            {
                $unwind: "$employee"
            }
        ]).toArray();

        return attendance;
    } catch (error: any) {
        console.error("Error fetching daily attendance:", error.message);
        return { error: error.message };
    }
}

export const getAttendanceReport = async (startDate: Date, endDate: Date, departmentId?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");

        let matchCondition: any = {
            date: { $gte: startDate, $lte: endDate }
        };

        const pipeline = [
            { $match: matchCondition },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            { $unwind: "$employee" }
        ];

        if (departmentId) {
            pipeline.push({
                $match: {
                    "employee.departmentId": new ObjectId(departmentId)
                }
            } as any);
        }

        pipeline.push(
            {
                $group: {
                    _id: "$employeeId",
                    employee: { $first: "$employee" },
                    totalDays: { $sum: 1 },
                    presentDays: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "present"] }, 1, 0]
                        }
                    },
                    totalHours: { $sum: "$hoursWorked" },
                    avgHours: { $avg: "$hoursWorked" }
                }
            } as any
        );

        return await collection.aggregate(pipeline).toArray();
    } catch (error: any) {
        console.error("Error generating attendance report:", error.message);
        return { error: error.message };
    }
}

export const markAbsent = async (employeeId: string, date: Date, reason?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("attendance");
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const attendanceData = {
            employeeId: new ObjectId(employeeId),
            date: startOfDay,
            status: "absent",
            reason: reason || "Not specified",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(attendanceData);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error marking absent:", error.message);
        return { error: error.message };
    }
}