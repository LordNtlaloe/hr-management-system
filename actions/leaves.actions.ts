// lib/actions/leave-actions.ts
"use server";

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  PartASchema,
  PartBSchema,
  type PartAData,
  type PartBData,
} from "@/schemas";
import { LeaveRequest } from "@/types";

let dbConnection: any;
let database: any;

// 🔹 Init DB
const init = async () => {
  try {
    const connection = await connectToDB();
    dbConnection = connection;
    database = await dbConnection?.db("hr_management_db");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

// 🔹 Serialize any MongoDB document into client-safe data
const serializeDocument = (doc: any): any => {
  if (!doc) return doc;

  if (Array.isArray(doc)) {
    return doc.map(serializeDocument);
  }

  if (typeof doc === "object" && doc !== null) {
    const serialized: any = {};

    for (const [key, value] of Object.entries(doc)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (
        value &&
        typeof value === "object" &&
        value.constructor &&
        value.constructor.name === "ObjectId"
      ) {
        serialized[key] = value.toString();
      } else if (typeof value === "object") {
        serialized[key] = serializeDocument(value);
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  return doc;
};

// 🔹 Normalize ObjectId helper
const normalizeObjectId = (id: string | ObjectId): ObjectId => {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error(`Invalid ObjectId: ${id}`);
};

// 🔹 Calculate total days between two dates (inclusive)
// ✅ FIX: Made synchronous — there is no async work here.
//    The original async version meant callers got a Promise<number> instead of
//    a number whenever they forgot to await, causing MongoDB to receive
//    { used: {} } and throw "Cannot increment with non-numeric argument".
export const calculateTotalDays = async (startDate: Date, endDate: Date): Promise<number> => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  console.log("📅 Day calculation:", {
    start: start.toISOString(),
    end: end.toISOString(),
    diffTime,
    diffDays,
  });

  return diffDays;
};

// 🔹 Get Employee Leave Requests
export const getEmployeeLeaveRequests = async (
  employeeId: string,
  status?: string
) => {
  if (!dbConnection) await init();

  try {
    const collection = await database?.collection("leave_requests");

    console.log("🔍 Fetching leave requests for employeeId:", employeeId);
    console.log("📊 Status filter:", status || "all");

    const filter: any = {};

    try {
      filter.employeeId = normalizeObjectId(employeeId);
    } catch (error) {
      console.log("❌ Could not normalize as ObjectId, using string employeeId");
      filter.employeeId = employeeId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const leaves = await collection
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            employeeObjectId: {
              $cond: {
                if: { $eq: [{ $type: "$employeeId" }, "string"] },
                then: {
                  $cond: {
                    if: { $eq: [{ $strLenCP: "$employeeId" }, 24] },
                    then: { $toObjectId: "$employeeId" },
                    else: null,
                  },
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
            as: "employeeData",
          },
        },
        {
          $addFields: {
            employeeId: {
              $cond: {
                if: { $gt: [{ $size: "$employeeData" }, 0] },
                then: { $arrayElemAt: ["$employeeData", 0] },
                else: "$employeeId",
              },
            },
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
      .toArray();

    console.log(`✅ Found ${leaves.length} leave requests for employee ${employeeId}`);

    return serializeDocument(leaves);
  } catch (error: any) {
    console.error("❌ Error fetching employee leave requests:", error.message);
    return [];
  }
};

// 🔹 Create Leave Request with validation
export const createLeaveRequest = async (
  leaveData: any,
  partAData?: PartAData
) => {
  if (!dbConnection) await init();

  try {
    const collection = await database?.collection("leave_requests");
    const balanceCollection = await database?.collection("leave_balances");

    if (!leaveData.employeeId) {
      throw new Error("employeeId is required");
    }

    const employeeIdObj = normalizeObjectId(leaveData.employeeId);

    if (partAData) {
      PartASchema.parse(partAData);
    }

    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const days = await calculateTotalDays(startDate, endDate);

    console.log("📊 Leave request calculation:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      calculatedDays: days,
    });

    if (leaveData.leaveType === "Annual" || leaveData.leaveType === "annual") {
      const currentYear = new Date().getFullYear();

      const balance = await balanceCollection.findOne({
        employeeId: employeeIdObj,
        leaveType: "Annual",
        year: currentYear,
      });

      console.log("📊 Checking leave balance:", {
        employeeId: employeeIdObj.toString(),
        requestedDays: days,
        currentBalance: balance ? balance.allocated - balance.used : 0,
        allocated: balance?.allocated || 0,
        used: balance?.used || 0,
      });

      if (!balance) {
        console.log("⚠️ No balance record found, creating default...");
        await balanceCollection.insertOne({
          employeeId: employeeIdObj,
          leaveType: "Annual",
          allocated: 21,
          used: 0,
          year: currentYear,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const availableDays = balance.allocated - balance.used;
        // ✅ FIX: days is now a plain number, no await required
        if (availableDays < days) {
          throw new Error(
            `Insufficient leave balance. Available: ${availableDays} days, Requested: ${days} days`
          );
        }
      }
    }

    const leave = {
      ...leaveData,
      employeeId: employeeIdObj,
      days,
      partAData: partAData || null,
      status: "pending",
      appliedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(leave);

    console.log("✅ Leave request created:", {
      insertedId: result.insertedId.toString(),
      employeeId: employeeIdObj.toString(),
      leaveType: leaveData.leaveType,
      days,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
    });

    return { insertedId: result.insertedId.toString(), success: true };
  } catch (error: any) {
    console.error("❌ Error creating leave request:", error.message);
    return { error: error.message };
  }
};

// 🔹 Update Leave Request with Part B Data
export const updateLeaveRequestWithPartB = async (
  id: string,
  partBData: PartBData
) => {
  if (!dbConnection) await init();
  try {
    PartBSchema.parse(partBData);

    const collection = await database?.collection("leave_requests");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          partBData,
          status: "approved",
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Leave request updated with Part B:", {
      id,
      modifiedCount: result.modifiedCount,
    });

    return { modifiedCount: result.modifiedCount, success: true };
  } catch (error: any) {
    console.error("❌ Error updating leave request with Part B:", error.message);
    return { error: error.message };
  }
};

// 🔹 Get Leave Request by ID
export const getLeaveRequestById = async (id: string) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_requests");
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
      .toArray();

    return serializeDocument(leave[0] || null);
  } catch (error: any) {
    console.error("❌ Error fetching leave request:", error.message);
    return { error: error.message };
  }
};

// 🔹 Update Leave Request
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
    console.error("❌ Error updating leave request:", error.message);
    return { error: error.message };
  }
};

// 🔹 Approve Leave Request with balance deduction
export const approveLeaveRequest = async (
  id: string,
  approverId: string,
  comments?: string
) => {
  if (!dbConnection) await init();

  try {
    const collection = await database?.collection("leave_requests");
    const balanceCollection = await database?.collection("leave_balances");

    const leaveRequest = await collection.findOne({ _id: new ObjectId(id) });

    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }

    // ✅ FIX: calculateTotalDays is now sync — guaranteed number, never a Promise.
    //    Previously this was async and the missing await produced a Promise object
    //    which MongoDB rejected with "Cannot increment with non-numeric argument: {used: {}}"
    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    const days: number =
      typeof leaveRequest.days === "number" && leaveRequest.days > 0
        ? leaveRequest.days
        : await calculateTotalDays(startDate, endDate);

    console.log("📊 Approving leave:", { id, days, leaveType: leaveRequest.leaveType });

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "approved",
          approvedBy: new ObjectId(approverId),
          approvedDate: new Date(),
          approverComments: comments || "",
          updatedAt: new Date(),
          days, // ensure the field is persisted
        },
      }
    );

    if (result.modifiedCount > 0) {
      const employeeId = normalizeObjectId(leaveRequest.employeeId);

      if (
        leaveRequest.leaveType === "Annual" ||
        leaveRequest.leaveType === "annual"
      ) {
        const currentYear = new Date().getFullYear();

        const currentBalance = await balanceCollection.findOne({
          employeeId,
          leaveType: "Annual",
          year: currentYear,
        });

        if (!currentBalance) {
          await balanceCollection.insertOne({
            employeeId,
            leaveType: "Annual",
            allocated: 21,
            used: days,         // ✅ plain number
            year: currentYear,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          await balanceCollection.updateOne(
            { employeeId, leaveType: "Annual", year: currentYear },
            {
              $inc: { used: days },   // ✅ plain number — MongoDB $inc now works correctly
              $set: { updatedAt: new Date() },
            }
          );
        }

        const updatedBalance = await balanceCollection.findOne({
          employeeId,
          leaveType: "Annual",
          year: currentYear,
        });

        console.log("✅ Leave approved and balance updated:", {
          leaveId: id,
          employeeId: employeeId.toString(),
          daysDeducted: days,
          newBalance: updatedBalance
            ? {
                allocated: updatedBalance.allocated,
                used: updatedBalance.used,
                remaining: updatedBalance.allocated - updatedBalance.used,
              }
            : "No balance record",
        });
      }
    }

    return { modifiedCount: result.modifiedCount, success: true };
  } catch (error: any) {
    console.error("❌ Error approving leave request:", error.message);
    return { error: error.message };
  }
};

// 🔹 Reject Leave Request
export const rejectLeaveRequest = async (
  id: string,
  rejectedBy: string,
  reason?: string
) => {
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
          updatedAt: new Date(),
        },
      }
    );
    return { modifiedCount: result.modifiedCount, success: true };
  } catch (error: any) {
    console.error("❌ Error rejecting leave request:", error.message);
    return { error: error.message };
  }
};

export const getAllLeaveRequests = async () => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_requests");

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
                    else: null,
                  },
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
            "employee.0": { $exists: true },
          },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
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
        { $sort: { appliedDate: -1 } },
      ])
      .toArray();

    console.log(`✅ Found ${leaves.length} total leaves`);
    return serializeDocument(leaves);
  } catch (error: any) {
    console.error("❌ Error fetching leave requests:", error.message);
    return [];
  }
};

// 🔹 Get Pending Leave Requests
export const getPendingLeaveRequests = async () => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_requests");

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
      .toArray();

    console.log(`✅ Found ${leaves.length} pending leave requests`);
    return serializeDocument(leaves);
  } catch (error: any) {
    console.error("❌ Error fetching pending leave requests:", error.message);
    return [];
  }
};

// ===================== BALANCES =====================

export const createLeaveBalance = async (balanceData: any) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_balances");
    const balance = {
      ...balanceData,
      employeeId: normalizeObjectId(balanceData.employeeId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(balance);
    return { insertedId: result.insertedId.toString(), success: true };
  } catch (error: any) {
    console.error("❌ Error creating leave balance:", error.message);
    return { error: error.message };
  }
};

export const getEmployeeLeaveBalance = async (employeeId: string) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_balances");
    let query: any = {};

    try {
      query.employeeId = normalizeObjectId(employeeId);
    } catch (error) {
      console.error("❌ Error normalizing employeeId for balance query:", error);
      query.employeeId = employeeId;
    }

    const balances = await collection.find(query).toArray();

    const currentYear = new Date().getFullYear();
    const currentYearBalance = balances.find((b: any) => b.year === currentYear);

    if (!currentYearBalance && query.employeeId) {
      console.log("📊 Creating default balance for current year");
      const defaultBalance = {
        employeeId: normalizeObjectId(employeeId),
        leaveType: "Annual",
        allocated: 21,
        used: 0,
        year: currentYear,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await collection.insertOne(defaultBalance);
      balances.push(defaultBalance);
    }

    console.log("📊 Employee leave balances:", {
      employeeId,
      currentYear,
      balances: balances.map((b: any) => ({
        leaveType: b.leaveType,
        allocated: b.allocated,
        used: b.used,
        remaining: b.allocated - b.used,
        year: b.year,
      })),
    });

    return serializeDocument(balances);
  } catch (error: any) {
    console.error("❌ Error fetching employee leave balance:", error.message);
    return [];
  }
};

const updateLeaveBalance = async (
  employeeId: ObjectId,
  leaveType: string,
  daysUsed: number
) => {
  try {
    const collection = await database?.collection("leave_balances");
    const currentYear = new Date().getFullYear();

    const result = await collection.updateOne(
      { employeeId, leaveType, year: currentYear },
      {
        $inc: { used: daysUsed },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    console.log("📊 Leave balance updated:", {
      employeeId: employeeId.toString(),
      leaveType,
      daysUsed,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId,
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Error updating leave balance:", error.message);
    throw error;
  }
};

export const resetLeaveBalances = async (year: number) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_balances");
    const result = await collection.updateMany(
      { year },
      { $set: { used: 0, updatedAt: new Date() } }
    );
    return { modifiedCount: result.modifiedCount, success: true };
  } catch (error: any) {
    console.error("❌ Error resetting leave balances:", error.message);
    return { error: error.message };
  }
};

// 🔹 Get remaining leave days for an employee
export const getRemainingLeaveDays = async (employeeId: string): Promise<number> => {
  try {
    const balances = await getEmployeeLeaveBalance(employeeId);
    const currentYear = new Date().getFullYear();

    const annualBalance = balances.find(
      (b: any) => b.leaveType === "Annual" && b.year === currentYear
    );

    if (annualBalance) {
      const remaining = annualBalance.allocated - annualBalance.used;
      console.log("📊 Remaining leave days:", {
        employeeId,
        allocated: annualBalance.allocated,
        used: annualBalance.used,
        remaining,
      });
      return remaining;
    }

    console.log("📊 No balance found, returning default 21 days");
    return 21;
  } catch (error) {
    console.error("❌ Error getting remaining leave days:", error);
    return 21;
  }
};

// 🔹 Check if employee has enough leave days
export const validateLeaveRequest = async (
  employeeId: string,
  startDate: Date,
  endDate: Date,
  leaveType: string
): Promise<{
  valid: boolean;
  availableDays: number;
  requestedDays: number;
  message?: string;
}> => {
  try {
    // ✅ await here — async is required by Next.js "use server", but the value is a plain number
    const requestedDays = await calculateTotalDays(startDate, endDate);

    console.log("🔍 Validating leave request:", {
      employeeId,
      startDate,
      endDate,
      leaveType,
      requestedDays,
    });

    if (leaveType === "Annual" || leaveType === "annual") {
      const remainingDays = await getRemainingLeaveDays(employeeId);

      console.log("📊 Validation result:", {
        remainingDays,
        requestedDays,
        hasEnough: remainingDays >= requestedDays,
      });

      if (remainingDays < requestedDays) {
        return {
          valid: false,
          availableDays: remainingDays,
          requestedDays,
          message: `Insufficient leave balance. Available: ${remainingDays} days, Requested: ${requestedDays} days`,
        };
      }
    }

    return {
      valid: true,
      availableDays:
        leaveType === "Annual"
          ? await getRemainingLeaveDays(employeeId)
          : -1,
      requestedDays,
    };
  } catch (error: any) {
    console.error("❌ Error validating leave request:", error);
    return {
      valid: false,
      availableDays: 0,
      requestedDays: 0,
      message: error.message,
    };
  }
};

// ===================== REPORTS =====================

export const getLeaveReport = async (
  startDate: Date,
  endDate: Date,
  departmentId?: string
) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_requests");

    const matchCondition: any = {
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
      status: "approved",
    };

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
    ];

    if (departmentId) {
      pipeline.push({
        $match: { "employee.departmentId": new ObjectId(departmentId) },
      } as any);
    }

    pipeline.push({
      $group: {
        _id: { employeeId: "$employeeObjectId", leaveType: "$leaveType" },
        employee: { $first: "$employee" },
        totalDays: { $sum: "$days" },
        requestCount: { $sum: 1 },
      },
    } as any);

    return serializeDocument(await collection.aggregate(pipeline).toArray());
  } catch (error: any) {
    console.error("❌ Error generating leave report:", error.message);
    return { error: error.message };
  }
};

export const getEmployeeStatusCounts = async () => {
  if (!dbConnection) await init();
  try {
    const employeesCollection = await database?.collection("employees");
    const leaveRequestsCollection = await database?.collection("leave_requests");

    const employees = await employeesCollection.find({}).toArray();
    const activeLeaves = await leaveRequestsCollection
      .find({
        status: "approved",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      })
      .toArray();

    const suspendedCount = await employeesCollection.countDocuments({
      suspended: true,
    });

    const activeCount = employees.length - suspendedCount;
    const onLeaveCount = activeLeaves.length;

    return {
      active: activeCount,
      suspended: suspendedCount,
      onLeave: onLeaveCount,
      total: employees.length,
    };
  } catch (error: any) {
    console.error("❌ Error fetching employee status counts:", error.message);
    return { error: error.message };
  }
};

export const getMonthlyLeaveRequests = async (year: number) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("leave_requests");

    const pipeline = [
      {
        $match: {
          appliedDate: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
        },
      },
      { $group: { _id: { $month: "$appliedDate" }, count: { $sum: 1 } } },
      { $project: { month: "$_id", count: 1, _id: 0 } },
      { $sort: { month: 1 } },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    const monthlyData = Array(12).fill(0);
    result.forEach((item: { month: number; count: number }) => {
      monthlyData[item.month - 1] = item.count;
    });

    return monthlyData;
  } catch (error: any) {
    console.error("❌ Error fetching monthly leave requests:", error.message);
    return { error: error.message };
  }
};

export const getEmployeeLeaveUtilization = async (
  employeeId: string,
  year?: number
) => {
  if (!dbConnection) await init();
  try {
    const currentYear = year || new Date().getFullYear();
    const collection = await database?.collection("leave_requests");

    let queryEmployeeId;
    try {
      queryEmployeeId = normalizeObjectId(employeeId);
    } catch (error) {
      console.error("❌ Error normalizing employeeId:", error);
      queryEmployeeId = employeeId;
    }

    const pipeline = [
      {
        $match: {
          employeeId: queryEmployeeId,
          status: "approved",
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: "$leaveType",
          totalDays: { $sum: "$days" },
          requestCount: { $sum: 1 },
          averageDays: { $avg: "$days" },
        },
      },
      {
        $project: {
          leaveType: "$_id",
          totalDays: 1,
          requestCount: 1,
          averageDays: { $round: ["$averageDays", 2] },
          _id: 0,
        },
      },
      {
        $lookup: {
          from: "leave_balances",
          let: { empId: queryEmployeeId, lType: "$leaveType", year: currentYear },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employeeId", "$$empId"] },
                    { $eq: ["$leaveType", "$$lType"] },
                    { $eq: ["$year", "$$year"] },
                  ],
                },
              },
            },
          ],
          as: "balanceInfo",
        },
      },
      {
        $addFields: {
          allocated: { $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 0] },
          used: { $ifNull: [{ $arrayElemAt: ["$balanceInfo.used", 0] }, 0] },
          remaining: {
            $subtract: [
              { $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$balanceInfo.used", 0] }, 0] },
            ],
          },
          utilizationRate: {
            $cond: {
              if: { $gt: [{ $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 1] }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $ifNull: [{ $arrayElemAt: ["$balanceInfo.used", 0] }, 0] },
                      { $ifNull: [{ $arrayElemAt: ["$balanceInfo.allocated", 0] }, 1] },
                    ],
                  },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
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
          balanceInfo: 0,
        },
      },
      { $sort: { leaveType: 1 } },
    ];

    const utilization = await collection.aggregate(pipeline).toArray();

    const summaryPipeline = [
      {
        $match: {
          employeeId: queryEmployeeId,
          status: "approved",
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDaysUsed: { $sum: "$days" },
          totalRequests: { $sum: 1 },
        },
      },
    ];

    const summaryResult = await collection.aggregate(summaryPipeline).toArray();
    const summary = summaryResult[0] || { totalDaysUsed: 0, totalRequests: 0 };

    return serializeDocument({
      employeeId,
      year: currentYear,
      utilizationByType: utilization,
      summary: {
        totalDaysUsed: summary.totalDaysUsed,
        totalRequests: summary.totalRequests,
        averageDaysPerRequest:
          summary.totalRequests > 0
            ? parseFloat((summary.totalDaysUsed / summary.totalRequests).toFixed(2))
            : 0,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching employee leave utilization:", error.message);
    return { error: error.message };
  }
};

export const getEmployeeActivities = async (employeeId: string) => {
  if (!dbConnection) await init();

  try {
    const collection = await database?.collection("leave_requests");

    console.log("🔍 Fetching activities for employeeId:", employeeId);

    const filter: any = {};
    try {
      filter.employeeId = normalizeObjectId(employeeId);
    } catch (error) {
      filter.employeeId = employeeId;
    }

    const leaves = await collection
      .find(filter)
      .sort({ appliedDate: -1 })
      .toArray();

    console.log(`✅ Found ${leaves.length} leave activities for employee ${employeeId}`);

    const activities = leaves.map((leave: LeaveRequest) => ({
      _id: leave._id,
      type: "leave",
      description: `${leave.leaveType} leave request for ${leave.days} day(s) from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`,
      date: leave.appliedDate || leave.createdAt,
      status: leave.status,
      partBData: leave.partBData || null,
      leaveDetails: {
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        reason: leave.reason,
        appliedDate: leave.appliedDate,
        approvedDate: leave.approvedDate,
        rejectedDate: leave.rejectedDate,
        approverComments: leave.approverComments,
        rejectionReason: leave.rejectionReason,
      },
    }));

    return serializeDocument(activities);
  } catch (error: any) {
    console.error("❌ Error fetching employee activities:", error.message);
    return [];
  }
};