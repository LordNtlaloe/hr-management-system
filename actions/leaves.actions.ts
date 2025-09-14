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

// Leave Request CRUD Operations
export const createLeaveRequest = async (leaveData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        const leave = {
            ...leaveData,
            employeeId: new ObjectId(leaveData.employeeId), // Ensure ObjectId conversion
            status: "pending",
            appliedDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await collection.insertOne(leave);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating leave request:", error.message);
        return { error: error.message };
    }
}

export const getLeaveRequestById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        const leave = await collection.aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
                $addFields: {
                    employeeObjectId: { 
                        $cond: {
                            if: { $type: "$employeeId" },
                            then: { $toObjectId: "$employeeId" },
                            else: "$employeeId"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeObjectId",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            { $unwind: "$employee" },
            {
                $lookup: {
                    from: "employees",
                    localField: "approvedBy",
                    foreignField: "_id",
                    as: "approver"
                }
            },
            {
                $addFields: {
                    employeeId: "$employee"
                }
            },
            {
                $project: {
                    employee: 0,
                    employeeObjectId: 0
                }
            }
        ]).toArray();

        return leave[0] || null;
    } catch (error: any) {
        console.error("Error fetching leave request:", error.message);
        return { error: error.message };
    }
}

export const updateLeaveRequest = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error updating leave request:", error.message);
        return { error: error.message };
    }
}

export const approveLeaveRequest = async (id: string, approverId: string, comments?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "approved",
                    approvedBy: new ObjectId(approverId),
                    approvedDate: new Date(),
                    approverComments: comments || "",
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount > 0) {
            // Update leave balance
            const leaveRequest = await collection.findOne({ _id: new ObjectId(id) });
            if (leaveRequest) {
                // Handle both string and ObjectId employeeId formats
                const employeeId = typeof leaveRequest.employeeId === 'string' 
                    ? new ObjectId(leaveRequest.employeeId)
                    : leaveRequest.employeeId;
                await updateLeaveBalance(employeeId, leaveRequest.leaveType, leaveRequest.days);
            }
        }

        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error approving leave request:", error.message);
        return { error: error.message };
    }
}

export const rejectLeaveRequest = async (id: string, rejectedBy: string, reason?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "rejected",
                    rejectedBy: new ObjectId(rejectedBy),
                    rejectedDate: new Date(),
                    rejectionReason: reason || "",
                    updatedAt: new Date()
                }
            }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error rejecting leave request:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeLeaveRequests = async (employeeId: string, status?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        let filter: any = {};
        
        // Handle both string and ObjectId formats
        try {
            filter.employeeId = new ObjectId(employeeId);
        } catch {
            filter.employeeId = employeeId;
        }

        if (status) {
            filter.status = status;
        }

        return await collection.find(filter).sort({ appliedDate: -1 }).toArray();
    } catch (error: any) {
        console.error("Error fetching employee leave requests:", error.message);
        return [];
    }
}

// FIXED: Main issue was here - incorrect lookup configuration for string employeeIds
export const getPendingLeaveRequests = async (managerId?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        
        // Try the aggregation approach first
        try {
            let pipeline: any[] = [
                { $match: { status: "pending" } },
                {
                    $addFields: {
                        employeeObjectId: {
                            $cond: {
                                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                                then: { $toObjectId: "$employeeId" },
                                else: "$employeeId"
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeObjectId",
                        foreignField: "_id",
                        as: "employeeData"
                    }
                },
                { $unwind: "$employeeData" },
                {
                    $addFields: {
                        employeeId: "$employeeData"
                    }
                },
                {
                    $project: {
                        employeeData: 0,
                        employeeObjectId: 0
                    }
                },
                { $sort: { appliedDate: 1 } }
            ];

            const result = await collection.aggregate(pipeline).toArray();
            console.log("Aggregation result:", result);
            
            if (result.length > 0) {
                return result;
            }
        } catch (aggregationError) {
            console.log("Aggregation failed, trying fallback approach:", aggregationError);
        }

        // Fallback to manual approach
        const leaveCollection = await database?.collection("leave_requests");
        const employeeCollection = await database?.collection("employees");
        
        // Get pending leave requests
        const pendingLeaves = await leaveCollection.find({ status: "pending" }).sort({ appliedDate: 1 }).toArray();
        console.log("Pending leaves from DB:", pendingLeaves);
        
        if (pendingLeaves.length === 0) {
            return [];
        }
        
        // Get all employees
        const employees = await employeeCollection.find({}).toArray();
        console.log("Employees from DB:", employees.length);
        
        // Create employee lookup map
        const employeeMap = new Map();
        employees.forEach((emp: { _id: { toString: () => any; }; }) => {
            employeeMap.set(emp._id.toString(), emp);
        });
        
        // Populate employee data
        const populatedLeaves = pendingLeaves.map((leave: { employeeId: any; }) => {
            const employeeData = employeeMap.get(leave.employeeId);
            console.log("Looking for employee:", leave.employeeId, "Found:", !!employeeData);
            
            return {
                ...leave,
                employeeId: employeeData || {
                    _id: leave.employeeId,
                    name: "Unknown Employee",
                    email: "unknown@example.com"
                }
            };
        });
        
        console.log("Final populated leaves:", populatedLeaves);
        return populatedLeaves;
        
    } catch (error: any) {
        console.error("Error fetching pending leave requests:", error.message);
        return [];
    }
}

// Get all leave requests (for admin view) - FIXED
export const getAllLeaveRequests = async (status?: string, departmentId?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");
        
        // Try aggregation approach first
        try {
            let pipeline: any[] = [];
            
            // Add status filter if provided
            if (status) {
                pipeline.push({ $match: { status: status } });
            }
            
            pipeline.push(
                {
                    $addFields: {
                        employeeObjectId: {
                            $cond: {
                                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                                then: { $toObjectId: "$employeeId" },
                                else: "$employeeId"
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeObjectId",
                        foreignField: "_id",
                        as: "employeeData"
                    }
                },
                { $unwind: "$employeeData" },
                {
                    $addFields: {
                        employeeId: "$employeeData"
                    }
                }
            );

            // Add section filter if provided
            if (departmentId) {
                pipeline.push({
                    $match: {
                        "employeeId.departmentId": new ObjectId(departmentId)
                    }
                });
            }

            // Add approver information for approved/rejected requests
            pipeline.push(
                {
                    $lookup: {
                        from: "employees",
                        localField: "approvedBy",
                        foreignField: "_id",
                        as: "approver"
                    }
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "rejectedBy",
                        foreignField: "_id",
                        as: "rejector"
                    }
                },
                {
                    $project: {
                        employeeData: 0,
                        employeeObjectId: 0
                    }
                },
                { $sort: { appliedDate: -1 } }
            );

            const result = await collection.aggregate(pipeline).toArray();
            console.log("All leaves aggregation result:", result);
            
            if (result.length > 0) {
                return result;
            }
        } catch (aggregationError) {
            console.log("Aggregation failed, trying fallback approach:", aggregationError);
        }

        // Fallback to manual approach
        const leaveCollection = await database?.collection("leave_requests");
        const employeeCollection = await database?.collection("employees");
        
        // Build query
        let query: any = {};
        if (status) {
            query.status = status;
        }
        
        // Get leave requests
        const leaves = await leaveCollection.find(query).sort({ appliedDate: -1 }).toArray();
        console.log("All leaves from DB:", leaves);
        
        if (leaves.length === 0) {
            return [];
        }
        
        // Get all employees
        const employees = await employeeCollection.find({}).toArray();
        
        // Create employee lookup map
        const employeeMap = new Map();
        employees.forEach((emp: { _id: { toString: () => any; }; }) => {
            employeeMap.set(emp._id.toString(), emp);
        });
        
        // Populate employee data
        const populatedLeaves = leaves.map((leave: { employeeId: any; }) => ({
            ...leave,
            employeeId: employeeMap.get(leave.employeeId) || {
                _id: leave.employeeId,
                name: "Unknown Employee",
                email: "unknown@example.com"
            }
        }));
        
        console.log("Final populated all leaves:", populatedLeaves);
        return populatedLeaves;
        
    } catch (error: any) {
        console.error("Error fetching all leave requests:", error.message);
        return [];
    }
}

// Leave Balance Operations
export const createLeaveBalance = async (balanceData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_balances");
        const balance = {
            ...balanceData,
            employeeId: new ObjectId(balanceData.employeeId),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await collection.insertOne(balance);
        return { insertedId: result.insertedId, success: true };
    } catch (error: any) {
        console.error("Error creating leave balance:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeLeaveBalance = async (employeeId: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_balances");
        let query: any = {};
        
        // Handle both string and ObjectId formats
        try {
            query.employeeId = new ObjectId(employeeId);
        } catch {
            query.employeeId = employeeId;
        }
        
        return await collection.find(query).toArray();
    } catch (error: any) {
        console.error("Error fetching employee leave balance:", error.message);
        return [];
    }
}

const updateLeaveBalance = async (
    employeeId: ObjectId,
    leaveType: string,
    daysUsed: number,
    session?: any
) => {
    try {
        const collection = await database?.collection("leave_balances");
        const result = await collection.updateOne(
            {
                employeeId: employeeId,
                leaveType: leaveType
            },
            {
                $inc: { used: daysUsed },
                $set: { updatedAt: new Date() }
            },
            { session }
        );

        if (result.modifiedCount === 0) {
            throw new Error("Leave balance not found");
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error updating leave balance:", error.message);
        throw error;
    }
}

export const resetLeaveBalances = async (year: number) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_balances");
        const result = await collection.updateMany(
            { year: year },
            {
                $set: {
                    used: 0,
                    updatedAt: new Date()
                }
            }
        );
        return { modifiedCount: result.modifiedCount, success: true };
    } catch (error: any) {
        console.error("Error resetting leave balances:", error.message);
        return { error: error.message };
    }
}

export const getLeaveReport = async (startDate: Date, endDate: Date, departmentId?: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");

        let matchCondition: any = {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate },
            status: "approved"
        };

        const pipeline = [
            { $match: matchCondition },
            {
                $addFields: {
                    employeeObjectId: {
                        $cond: {
                            if: { $eq: [{ $type: "$employeeId" }, "string"] },
                            then: { $toObjectId: "$employeeId" },
                            else: "$employeeId"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeObjectId",
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
                    _id: {
                        employeeId: "$employeeObjectId",
                        leaveType: "$leaveType"
                    },
                    employee: { $first: "$employee" },
                    totalDays: { $sum: "$days" },
                    requestCount: { $sum: 1 }
                }
            } as any
        );

        return await collection.aggregate(pipeline).toArray();
    }
    catch (error: any) {
        console.error("Error generating leave report:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeStatusCounts = async () => {
    if (!dbConnection) await init();
    try {
        const employeesCollection = await database?.collection("employees");
        const leaveRequestsCollection = await database?.collection("leave_requests");

        // Get all employees
        const employees = await employeesCollection.find({}).toArray();

        // Get active leave requests
        const activeLeaves = await leaveRequestsCollection.find({
            status: "approved",
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        }).toArray();

        // Count suspended employees (assuming there's a 'suspended' field)
        const suspendedCount = await employeesCollection.countDocuments({
            suspended: true
        });

        const activeCount = employees.length - suspendedCount;
        const onLeaveCount = activeLeaves.length;

        return {
            active: activeCount,
            suspended: suspendedCount,
            onLeave: onLeaveCount,
            total: employees.length
        };
    } catch (error: any) {
        console.error("Error fetching employee status counts:", error.message);
        return { error: error.message };
    }
}

export const getMonthlyLeaveRequests = async (year: number) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_requests");

        const pipeline = [
            {
                $match: {
                    appliedDate: {
                        $gte: new Date(year, 0, 1),
                        $lt: new Date(year + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$appliedDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    month: "$_id",
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { month: 1 }
            }
        ];

        const result = await collection.aggregate(pipeline).toArray();

        // Initialize array with 12 months (0 counts)
        const monthlyData = Array(12).fill(0);

        // Fill in the counts from the query results
        result.forEach((item: { month: number; count: any; }) => {
            monthlyData[item.month - 1] = item.count;
        });

        return monthlyData;
    } catch (error: any) {
        console.error("Error fetching monthly leave requests:", error.message);
        return { error: error.message };
    }
}

export const getEmployeeLeaveUtilization = async (timeframe: 'month' | 'quarter' | 'year') => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("leave_balances");
        const leaveRequestsCollection = await database?.collection("leave_requests");

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate: Date;

        if (timeframe === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (timeframe === 'quarter') {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
        } else { // year
            startDate = new Date(now.getFullYear(), 0, 1);
        }

        // Get leave balances
        const balances = await collection.find({}).toArray();
        const totalAllocated = balances.reduce((sum: any, balance: { allocated: any; }) => sum + balance.allocated, 0);

        // Get used leave days in timeframe
        const usedLeaves = await leaveRequestsCollection.aggregate([
            {
                $match: {
                    status: "approved",
                    startDate: { $gte: startDate, $lte: now }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: "$days" }
                }
            }
        ]).toArray();

        const totalUsed = usedLeaves[0]?.totalDays || 0;

        // Get previous period for trend calculation
        let prevStartDate: Date;
        if (timeframe === 'month') {
            prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        } else if (timeframe === 'quarter') {
            const quarter = Math.floor(now.getMonth() / 3);
            prevStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        } else { // year
            prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        }

        const prevUsedLeaves = await leaveRequestsCollection.aggregate([
            {
                $match: {
                    status: "approved",
                    startDate: { $gte: prevStartDate, $lt: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: "$days" }
                }
            }
        ]).toArray();

        const prevUsed = prevUsedLeaves[0]?.totalDays || 0;
        const trend = prevUsed > 0
            ? Math.round(((totalUsed - prevUsed) / prevUsed) * 100)
            : 0;

        return {
            usedDays: totalUsed,
            allocatedDays: totalAllocated,
            trend
        };
    } catch (error: any) {
        console.error("Error fetching leave utilization:", error.message);
        return { error: error.message };
    }
}