"use server"

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
let dbConnection: any;
let database: any;
export const runtime = "nodejs";

const init = async () => {
    if (!dbConnection) {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
    }
};

// Daily attendance report (who is present, absent, on leave)
export const getDailyAttendanceReport = async (date: Date) => {
    if (!dbConnection) await init();
    try {
        const employeesCollection = database.collection("employees");
        const timeCollection = database.collection("time_entries");
        const leaveCollection = database.collection("leave_requests");

        const employees = await employeesCollection.find({}).toArray();

        const timeEntries = await timeCollection.find({ date }).toArray();
        const leaveRequests = await leaveCollection.find({
            status: "approved",
            startDate: { $lte: date },
            endDate: { $gte: date }
        }).toArray();

        return employees.map((emp: any) => {
            const timeEntry = timeEntries.find((t: any) => t.employeeId.toString() === emp._id.toString());
            const leave = leaveRequests.find((l: any) => l.employeeId.toString() === emp._id.toString());
            return {
                employee: emp,
                status: leave ? "On Leave" : timeEntry ? "Present" : "Absent",
                timeEntry,
                leave
            };
        });
    } catch (error: any) {
        console.error("Error generating daily attendance report:", error.message);
        return { error: error.message };
    }
};

// Monthly summary for department or company-wide
export const getMonthlyAttendanceSummary = async (year: number, month: number, departmentId?: string) => {
    if (!dbConnection) await init();
    try {
        const employeesCollection = database.collection("employees");
        const timeCollection = database.collection("time_entries");
        const leaveCollection = database.collection("leave_requests");

        let empFilter: any = {};
        if (departmentId) empFilter.departmentId = new ObjectId(departmentId);

        const employees = await employeesCollection.find(empFilter).toArray();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const timeEntries = await timeCollection.find({
            date: { $gte: startDate, $lte: endDate }
        }).toArray();

        const leaveRequests = await leaveCollection.find({
            status: "approved",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).toArray();

        return employees.map((emp: any) => {
            const empTimeEntries = timeEntries.filter((t: any) => t.employeeId.toString() === emp._id.toString());
            const empLeaves = leaveRequests.filter((l: any) => l.employeeId.toString() === emp._id.toString());
            return {
                employee: emp,
                totalDaysWorked: empTimeEntries.length,
                totalLeaves: empLeaves.length,
                overtimeHours: empTimeEntries.reduce((sum: number, t: any) => sum + (t.overtime || 0), 0)
            };
        });
    } catch (error: any) {
        console.error("Error generating monthly attendance summary:", error.message);
        return { error: error.message };
    }
};

// Absenteeism trends (for charts/analytics)
export const getAbsenteeismTrends = async (year: number) => {
    if (!dbConnection) await init();
    try {
        const timeCollection = database.collection("time_entries");
        const leaveCollection = database.collection("leave_requests");

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const leaves = await leaveCollection.aggregate([
            {
                $match: {
                    status: "approved",
                    startDate: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: { $month: "$startDate" },
                    leaves: { $sum: 1 }
                }
            }
        ]).toArray();

        const absences = await timeCollection.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lt: endDate },
                    status: "absent"
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    absences: { $sum: 1 }
                }
            }
        ]).toArray();

        return { leaves, absences };
    } catch (error: any) {
        console.error("Error generating absenteeism trends:", error.message);
        return { error: error.message };
    }
};


export const createTimeEntry = async (timeData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database.collection("time_entries");
        const entry = {
            ...timeData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await collection.insertOne(entry);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating time entry:", error.message);
        return { error: error.message };
    }
};

// Get time entry by ID
export const getTimeEntryById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database.collection("time_entries");
        return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error: any) {
        console.error("Error fetching time entry:", error.message);
        return { error: error.message };
    }
};

// Get all time entries for employee
export const getEmployeeTimeEntries = async (employeeId: string, date?: Date) => {
    if (!dbConnection) await init();
    try {
        const collection = await database.collection("time_entries");
        let filter: any = { employeeId: new ObjectId(employeeId) };
        if (date) {
            filter.date = date;
        }
        return await collection.find(filter).sort({ date: -1 }).toArray();
    } catch (error: any) {
        console.error("Error fetching employee time entries:", error.message);
        return { error: error.message };
    }
};

// Update time entry (e.g., adjust hours, mark overtime)
export const updateTimeEntry = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database.collection("time_entries");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating time entry:", error.message);
        return { error: error.message };
    }
};

// Delete time entry
export const deleteTimeEntry = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database.collection("time_entries");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return { deletedCount: result.deletedCount, success: true };
    } catch (error: any) {
        console.error("Error deleting time entry:", error.message);
        return { error: error.message };
    }
};


export const getTimeTrackingSummary = async (from: Date, to: Date) => {
    if (!dbConnection) await init();

    try {
        const collection = await database?.collection("time_tracking");

        // Match records within the date range
        const pipeline = [
            {
                $match: {
                    date: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: "$date",
                    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
                    employeeIds: { $push: "$employeeId" }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const result = await collection.aggregate(pipeline).toArray();

        // Format date string for chart labels
        return result.map((item: any) => ({
            date: item._id.toISOString().split("T")[0], // YYYY-MM-DD
            present: item.present,
            absent: item.absent,
            late: item.late,
            employeeIds: item.employeeIds
        }));
    } catch (error: any) {
        console.error("Error fetching time tracking summary:", error.message);
        return { error: error.message };
    }
};