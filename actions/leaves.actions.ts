// lib/actions/leave-actions.ts
"use server"

import { connectToDB } from "@/lib/db"
import { ObjectId } from "mongodb"

let dbConnection: any
let database: any

// 🔹 Init DB
const init = async () => {
    try {
        const connection = await connectToDB()
        dbConnection = connection
        database = await dbConnection?.db("hr_management_db")
    } catch (error) {
        console.error("Database connection failed:", error)
        throw error
    }
}

// 🔹 Serialize any MongoDB document into client-safe data
const serializeDocument = (doc: any): any => {
    if (!doc) return doc

    if (Array.isArray(doc)) {
        return doc.map(serializeDocument)
    }

    if (typeof doc === "object" && doc !== null) {
        const serialized: any = {}

        for (const [key, value] of Object.entries(doc)) {
            if (value instanceof Date) {
                serialized[key] = value.toISOString()
            } else if (
                value &&
                typeof value === "object" &&
                value.constructor &&
                value.constructor.name === "ObjectId"
            ) {
                serialized[key] = value.toString()
            } else if (typeof value === "object") {
                serialized[key] = serializeDocument(value)
            } else {
                serialized[key] = value
            }
        }

        return serialized
    }

    return doc
}

// 🔹 Normalize ObjectId helper
const normalizeObjectId = (id: string | ObjectId): ObjectId => {
    if (id instanceof ObjectId) return id
    if (typeof id === "string" && ObjectId.isValid(id)) {
        return new ObjectId(id)
    }
    throw new Error(`Invalid ObjectId: ${id}`)
}

// ===================== CRUD =====================

// 🔹 Create Leave Request
export const createLeaveRequest = async (leaveData: any) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")

        // Always convert to ObjectId, throw error if invalid
        if (!leaveData.employeeId) {
            throw new Error("employeeId is required")
        }

        const employeeIdObj = normalizeObjectId(leaveData.employeeId)

        const leave = {
            ...leaveData,
            employeeId: employeeIdObj,  // Always store as ObjectId
            status: "pending",
            appliedDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        const result = await collection.insertOne(leave)
        return { insertedId: result.insertedId.toString(), success: true }
    } catch (error: any) {
        console.error("Error creating leave request:", error.message)
        return { error: error.message }
    }
}
// 🔹 Get Leave Request by ID
export const getLeaveRequestById = async (id: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")
        const leave = await collection
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $addFields: {
                        employeeObjectId: {
                            $cond: {
                                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                                then: { $toObjectId: "$employeeId" },
                                else: "$employeeId",
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeObjectId",
                        foreignField: "_id",
                        as: "employee",
                    },
                },
                { $unwind: "$employee" },
                {
                    $lookup: {
                        from: "employees",
                        localField: "approvedBy",
                        foreignField: "_id",
                        as: "approver",
                    },
                },
                {
                    $addFields: {
                        employeeId: "$employee",
                    },
                },
                {
                    $project: {
                        employee: 0,
                        employeeObjectId: 0,
                    },
                },
            ])
            .toArray()

        return serializeDocument(leave[0] || null)
    } catch (error: any) {
        console.error("Error fetching leave request:", error.message)
        return { error: error.message }
    }
}

// 🔹 Update Leave Request
export const updateLeaveRequest = async (id: string, updateData: any) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        )
        return { modifiedCount: result.modifiedCount, success: true }
    } catch (error: any) {
        console.error("Error updating leave request:", error.message)
        return { error: error.message }
    }
}

// 🔹 Approve Leave Request
export const approveLeaveRequest = async (
    id: string,
    approverId: string,
    comments?: string
) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "approved",
                    approvedBy: new ObjectId(approverId),
                    approvedDate: new Date(),
                    approverComments: comments || "",
                    updatedAt: new Date(),
                },
            }
        )

        if (result.modifiedCount > 0) {
            const leaveRequest = await collection.findOne({ _id: new ObjectId(id) })
            if (leaveRequest) {
                const employeeId =
                    typeof leaveRequest.employeeId === "string"
                        ? new ObjectId(leaveRequest.employeeId)
                        : leaveRequest.employeeId
                await updateLeaveBalance(
                    employeeId,
                    leaveRequest.leaveType,
                    leaveRequest.days
                )
            }
        }

        return { modifiedCount: result.modifiedCount, success: true }
    } catch (error: any) {
        console.error("Error approving leave request:", error.message)
        return { error: error.message }
    }
}

// 🔹 Reject Leave Request
export const rejectLeaveRequest = async (
    id: string,
    rejectedBy: string,
    reason?: string
) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "rejected",
                    rejectedBy: new ObjectId(rejectedBy),
                    rejectedDate: new Date(),
                    rejectionReason: reason || "",
                    updatedAt: new Date(),
                },
            }
        )
        return { modifiedCount: result.modifiedCount, success: true }
    } catch (error: any) {
        console.error("Error rejecting leave request:", error.message)
        return { error: error.message }
    }
}

// 🔹 Get Employee Leave Requests
export const getEmployeeLeaveRequests = async (
    employeeId: string,
    status?: string
) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")
        const filter: any = {}

        try {
            filter.employeeId = normalizeObjectId(employeeId)
        } catch (error) {
            console.error("Error normalizing employeeId:", error)
            filter.employeeId = employeeId
        }

        if (status) filter.status = status

        const leaves = await collection
            .aggregate([
                { $match: filter },
                {
                    $addFields: {
                        employeeObjectId: {
                            $cond: {
                                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                                then: { $toObjectId: "$employeeId" },
                                else: "$employeeId",
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeObjectId",
                        foreignField: "_id",
                        as: "employeeData",
                    },
                },
                {
                    $addFields: {
                        employeeId: { $arrayElemAt: ["$employeeData", 0] },
                    },
                },
                {
                    $project: {
                        employeeData: 0,
                        employeeObjectId: 0,
                    },
                },
                { $sort: { appliedDate: -1 } },
            ])
            .toArray()

        return serializeDocument(leaves)
    } catch (error: any) {
        console.error("Error fetching employee leave requests:", error.message)
        return []
    }
}

export const getAllLeaveRequests = async () => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")

        const leaves = await collection
            .aggregate([
                {
                    $addFields: {
                        employeeObjectId: {
                            $cond: {
                                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                                then: {
                                    $cond: {
                                        if: { $eq: [{ $strLenCP: "$employeeId" }, 24] },
                                        then: { $toObjectId: "$employeeId" },
                                        else: null
                                    }
                                },
                                else: "$employeeId",
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeObjectId",
                        foreignField: "_id",
                        as: "employee",
                    },
                },
                {
                    $match: {
                        "employee.0": { $exists: true }
                    }
                },
                { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } }, // Keep leaves even if no employee
                {
                    $addFields: {
                        employeeId: "$employee", // This will be null if no employee found
                    },
                },
                {
                    $project: {
                        employee: 0,
                        employeeObjectId: 0
                    },
                },
                { $sort: { appliedDate: -1 } },
            ])
            .toArray()

        console.log(`Found ${leaves.length} leaves`)
        return serializeDocument(leaves)
    } catch (error: any) {
        console.error("Error fetching leave requests:", error.message)
        return []
    }
}
// 🔹 Get Pending Leave Requests
export const getPendingLeaveRequests = async () => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")

        const leaves = await collection
            .aggregate([
                { $match: { status: "pending" } },
                {
                    $addFields: {
                        employeeObjectId: {
                            $cond: {
                                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                                then: { $toObjectId: "$employeeId" },
                                else: "$employeeId",
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeObjectId",
                        foreignField: "_id",
                        as: "employeeData",
                    },
                },
                {
                    $addFields: {
                        employeeId: { $arrayElemAt: ["$employeeData", 0] },
                    },
                },
                {
                    $project: {
                        employeeData: 0,
                        employeeObjectId: 0,
                    },
                },
                { $sort: { appliedDate: -1 } },
            ])
            .toArray()

        return serializeDocument(leaves)
    } catch (error: any) {
        console.error("Error fetching pending leave requests:", error.message)
        return []
    }
}

// ===================== BALANCES =====================

export const createLeaveBalance = async (balanceData: any) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_balances")
        const balance = {
            ...balanceData,
            employeeId: normalizeObjectId(balanceData.employeeId),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        const result = await collection.insertOne(balance)
        return { insertedId: result.insertedId.toString(), success: true }
    } catch (error: any) {
        console.error("Error creating leave balance:", error.message)
        return { error: error.message }
    }
}

export const getEmployeeLeaveBalance = async (employeeId: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_balances")
        let query: any = {}

        try {
            query.employeeId = normalizeObjectId(employeeId)
        } catch (error) {
            console.error("Error normalizing employeeId for balance query:", error)
            query.employeeId = employeeId
        }

        const balances = await collection.find(query).toArray()
        return serializeDocument(balances)
    } catch (error: any) {
        console.error("Error fetching employee leave balance:", error.message)
        return []
    }
}

const updateLeaveBalance = async (
    employeeId: ObjectId,
    leaveType: string,
    daysUsed: number,
    session?: any
) => {
    try {
        const collection = await database?.collection("leave_balances")
        const result = await collection.updateOne(
            { employeeId, leaveType },
            {
                $inc: { used: daysUsed },
                $set: { updatedAt: new Date() },
            },
            { session }
        )

        if (result.modifiedCount === 0) {
            throw new Error("Leave balance not found")
        }

        return { success: true }
    } catch (error: any) {
        console.error("Error updating leave balance:", error.message)
        throw error
    }
}

export const resetLeaveBalances = async (year: number) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_balances")
        const result = await collection.updateMany(
            { year },
            {
                $set: {
                    used: 0,
                    updatedAt: new Date(),
                },
            }
        )
        return { modifiedCount: result.modifiedCount, success: true }
    } catch (error: any) {
        console.error("Error resetting leave balances:", error.message)
        return { error: error.message }
    }
}

// ===================== REPORTS =====================

// 🔹 Leave Report
export const getLeaveReport = async (
    startDate: Date,
    endDate: Date,
    departmentId?: string
) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")

        const matchCondition: any = {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate },
            status: "approved",
        }

        const pipeline: any[] = [
            { $match: matchCondition },
            {
                $addFields: {
                    employeeObjectId: {
                        $cond: {
                            if: { $eq: [{ $type: "$employeeId" }, "string"] },
                            then: { $toObjectId: "$employeeId" },
                            else: "$employeeId",
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeObjectId",
                    foreignField: "_id",
                    as: "employee",
                },
            },
            { $unwind: "$employee" },
        ]

        if (departmentId) {
            pipeline.push({
                $match: { "employee.departmentId": new ObjectId(departmentId) },
            } as any)
        }

        pipeline.push({
            $group: {
                _id: {
                    employeeId: "$employeeObjectId",
                    leaveType: "$leaveType",
                },
                employee: { $first: "$employee" },
                totalDays: { $sum: "$days" },
                requestCount: { $sum: 1 },
            },
        } as any)

        return serializeDocument(await collection.aggregate(pipeline).toArray())
    } catch (error: any) {
        console.error("Error generating leave report:", error.message)
        return { error: error.message }
    }
}

// 🔹 Employee Status Counts
export const getEmployeeStatusCounts = async () => {
    if (!dbConnection) await init()
    try {
        const employeesCollection = await database?.collection("employees")
        const leaveRequestsCollection = await database?.collection("leave_requests")

        const employees = await employeesCollection.find({}).toArray()
        const activeLeaves = await leaveRequestsCollection
            .find({
                status: "approved",
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
            })
            .toArray()

        const suspendedCount = await employeesCollection.countDocuments({
            suspended: true,
        })

        const activeCount = employees.length - suspendedCount
        const onLeaveCount = activeLeaves.length

        return {
            active: activeCount,
            suspended: suspendedCount,
            onLeave: onLeaveCount,
            total: employees.length,
        }
    } catch (error: any) {
        console.error("Error fetching employee status counts:", error.message)
        return { error: error.message }
    }
}

// 🔹 Monthly Leave Requests
export const getMonthlyLeaveRequests = async (year: number) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("leave_requests")

        const pipeline = [
            {
                $match: {
                    appliedDate: {
                        $gte: new Date(year, 0, 1),
                        $lt: new Date(year + 1, 0, 1),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$appliedDate" },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    month: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
            { $sort: { month: 1 } },
        ]

        const result = await collection.aggregate(pipeline).toArray()
        const monthlyData = Array(12).fill(0)

        result.forEach((item: { month: number; count: number }) => {
            monthlyData[item.month - 1] = item.count
        })

        return monthlyData
    } catch (error: any) {
        console.error("Error fetching monthly leave requests:", error.message)
        return { error: error.message }
    }
}

// 🔹 Employee Leave Utilization
// 🔹 Employee Leave Utilization
export const getEmployeeLeaveUtilization = async (employeeId: string, year?: number) => {
    if (!dbConnection) await init()
    try {
        const currentYear = year || new Date().getFullYear()
        const collection = await database?.collection("leave_requests")

        let queryEmployeeId
        try {
            queryEmployeeId = normalizeObjectId(employeeId)
        } catch (error) {
            console.error("Error normalizing employeeId:", error)
            queryEmployeeId = employeeId
        }

        const pipeline = [
            {
                $match: {
                    employeeId: queryEmployeeId,
                    status: "approved",
                    startDate: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: "$leaveType",
                    totalDays: { $sum: "$days" },
                    requestCount: { $sum: 1 },
                    averageDays: { $avg: "$days" }
                }
            },
            {
                $project: {
                    leaveType: "$_id",
                    totalDays: 1,
                    requestCount: 1,
                    averageDays: { $round: ["$averageDays", 2] },
                    _id: 0
                }
            },
            {
                $lookup: {
                    from: "leave_balances",
                    let: {
                        empId: queryEmployeeId,
                        lType: "$leaveType",
                        year: currentYear
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$employeeId", "$$empId"] },
                                        { $eq: ["$leaveType", "$$lType"] },
                                        { $eq: ["$year", "$$year"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "balanceInfo"
                }
            },
            {
                $addFields: {
                    allocated: { $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 0] },
                    used: { $ifNull: [{ $arrayElemAt: ["$balanceInfo.used", 0] }, 0] },
                    remaining: {
                        $subtract: [
                            { $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 0] },
                            { $ifNull: [{ $arrayElemAt: ["$balanceInfo.used", 0] }, 0] }
                        ]
                    },
                    utilizationRate: {
                        $cond: {
                            if: { $gt: [{ $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 1] }, 0] },
                            then: {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $ifNull: [{ $arrayElemAt: ["$balanceInfo.used", 0] }, 0] },
                                            { $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 1] }
                                        ]
                                    },
                                    100
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $project: {
                    leaveType: 1,
                    totalDays: 1,
                    requestCount: 1,
                    averageDays: 1,
                    allocated: 1,
                    used: 1,
                    remaining: 1,
                    utilizationRate: { $round: ["$utilizationRate", 2] },
                    balanceInfo: 0
                }
            },
            { $sort: { leaveType: 1 } }
        ]

        const utilization = await collection.aggregate(pipeline).toArray()

        // Get overall summary
        const summaryPipeline = [
            {
                $match: {
                    employeeId: queryEmployeeId,
                    status: "approved",
                    startDate: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDaysUsed: { $sum: "$days" },
                    totalRequests: { $sum: 1 }
                }
            }
        ]

        const summaryResult = await collection.aggregate(summaryPipeline).toArray()
        const summary = summaryResult[0] || { totalDaysUsed: 0, totalRequests: 0 }

        return serializeDocument({
            employeeId: employeeId,
            year: currentYear,
            utilizationByType: utilization,
            summary: {
                totalDaysUsed: summary.totalDaysUsed,
                totalRequests: summary.totalRequests,
                averageDaysPerRequest: summary.totalRequests > 0
                    ? parseFloat((summary.totalDaysUsed / summary.totalRequests).toFixed(2))
                    : 0
            }
        })
    } catch (error: any) {
        console.error("Error fetching employee leave utilization:", error.message)
        return { error: error.message }
    }
}

export const getAllLeaveRequestsAlternative = async () => {
    if (!dbConnection) await init()
    try {
        const leavesCollection = await database?.collection("leave_requests")
        const employeesCollection = await database?.collection("employees")

        // Get all leaves
        const leaves = await leavesCollection
            .find({})
            .sort({ appliedDate: -1 })
            .toArray()

        console.log(`Found ${leaves.length} total leave requests`)

        // Get all employees and create a lookup map
        const employees = await employeesCollection.find({}).toArray()
        const employeeMap = new Map()

        employees.forEach((emp: any) => {
            // Store both string and ObjectId versions for lookup
            employeeMap.set(emp._id.toString(), emp)
            employeeMap.set(emp._id, emp) // Also store the ObjectId as key
        })

        console.log(`Found ${employees.length} employees`)

        // Manually join the data with better ID matching
        const leavesWithEmployees = leaves.map((leave: any) => {
            let employeeIdStr: string

            // Convert employeeId to string for consistent lookup
            if (typeof leave.employeeId === 'string') {
                employeeIdStr = leave.employeeId
            } else if (leave.employeeId && typeof leave.employeeId === 'object') {
                employeeIdStr = leave.employeeId.toString()
            } else {
                console.warn(`Invalid employeeId format for leave ${leave._id}:`, leave.employeeId)
                employeeIdStr = ''
            }

            const employee = employeeMap.get(employeeIdStr) || employeeMap.get(leave.employeeId)

            if (employee) {
                return {
                    ...leave,
                    employeeId: employee  // Replace the ID with the full employee object
                }
            } else {
                console.warn(`No employee found for ID: ${employeeIdStr} in leave ${leave._id}`)
                // Still return the leave but with null employee data
                return {
                    ...leave,
                    employeeId: null
                }
            }
        })

        console.log(`Successfully matched ${leavesWithEmployees.filter((l: { employeeId: null }) => l.employeeId !== null).length} leaves with employees`)
        return serializeDocument(leavesWithEmployees)
    } catch (error: any) {
        console.error("Error fetching leave requests (alternative):", error.message)
        return []
    }
}