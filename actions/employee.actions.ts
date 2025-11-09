"use server";

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import { EmployeeSchema } from "@/schemas";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { createUserForEmployee } from "@/actions/user.actions";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

let dbConnection: any;
let database: any;

const init = async () => {
  if (dbConnection) return;
  try {
    const connection = await connectToDB();
    dbConnection = connection;
    database = await dbConnection?.db("hr_management_db");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

// Generate employee number
const generateEmployeeNumber = async (): Promise<string> => {
  if (!dbConnection) await init();
  const collection = await database?.collection("employees");

  // Find the highest employee number
  const lastEmployee = await collection
    .find({ employee_number: { $regex: /^EMP-/ } })
    .sort({ employee_number: -1 })
    .limit(1)
    .toArray();

  let nextNumber = 1;
  if (lastEmployee.length > 0 && lastEmployee[0].employee_number) {
    const lastNumber = parseInt(lastEmployee[0].employee_number.split("-")[1]);
    nextNumber = lastNumber + 1;
  }

  return `EMP-${nextNumber.toString().padStart(4, "0")}`;
};

// ----------------------
// Employee CRUD
// ----------------------
export const createEmployee = async (
  employeeData: z.infer<typeof EmployeeSchema>
) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("employees");
    const parsed = EmployeeSchema.parse(employeeData);

    // Generate employee number
    const employeeNumber = await generateEmployeeNumber();

    const employee = {
      ...parsed,
      employee_number: employeeNumber,
      email: employeeData.employee_details?.email, // Save email at top level
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      user_id: null,
    };

    const result = await collection.insertOne(employee);

    // Create user account for the employee
    if (result.insertedId && employeeData.employee_details?.email) {
      const userData = {
        first_name:
          employeeData.employee_details.other_names?.split(" ")[0] || "",
        last_name: employeeData.employee_details.surname || "",
        email: employeeData.employee_details.email,
        phone: employeeData.employee_details.telephone || "",
        employee_id: result.insertedId.toString(),
      };

      const userResult = await createUserForEmployee(userData);

      if (userResult.success) {
        // Update employee with user_id
        await collection.updateOne(
          { _id: result.insertedId },
          { $set: { user_id: userResult.userId } }
        );

        console.log(
          `User account created for employee: ${employeeData.employee_details.email}`
        );

        return {
          insertedId: result.insertedId.toString(),
          employee_number: employeeNumber,
          user_id: userResult.userId,
          success: true,
          message: "Employee created successfully with user account",
        };
      } else {
        console.warn(
          `Employee created but user account creation failed: ${userResult.error}`
        );
        return {
          insertedId: result.insertedId.toString(),
          employee_number: employeeNumber,
          success: true,
          warning: `Employee created but user account creation failed: ${userResult.error}`,
        };
      }
    }

    return {
      insertedId: result.insertedId.toString(),
      employee_number: employeeNumber,
      success: true,
      warning: "Employee created but no email provided for user account",
    };
  } catch (error: any) {
    console.error("Error creating employee:", error.message);
    return { error: error.message };
  }
};

export const getEmployeeById = async (id: string) => {
  if (!dbConnection) await init();
  try {
    if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };
    const collection = await database?.collection("employees");
    const employee = await collection.findOne({ _id: new ObjectId(id) });
    return employee
      ? {
          ...employee,
          _id: employee._id.toString(),
          email: employee.email || employee.employee_details?.email, // Ensure email is returned
        }
      : null;
  } catch (error: any) {
    console.error("Error fetching employee:", error.message);
    return { error: error.message };
  }
};

export const updateEmployee = async (
  id: string,
  updateData: Partial<z.infer<typeof EmployeeSchema>>
) => {
  if (!dbConnection) await init();
  try {
    if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };
    const collection = await database?.collection("employees");

    // If updating email in employee_details, also update top-level email
    const updatePayload = { ...updateData, updatedAt: new Date() };
    if (updateData.employee_details?.email) {
      updatePayload.email = updateData.employee_details.email;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    return { modifiedCount: result.modifiedCount, success: true };
  } catch (error: any) {
    console.error("Error updating employee:", error.message);
    return { error: error.message };
  }
};

export const deleteEmployee = async (id: string) => {
  if (!dbConnection) await init();
  try {
    if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };
    const collection = await database?.collection("employees");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, deletedAt: new Date() } }
    );
    return { modifiedCount: result.modifiedCount, success: true };
  } catch (error: any) {
    console.error("Error deleting employee:", error.message);
    return { error: error.message };
  }
};

export const getAllEmployees = async (includeInactive = false) => {
  if (!dbConnection) await init();
  try {
    const collection = await database?.collection("employees");
    const filter = includeInactive ? {} : { isActive: { $ne: false } };
    const employees = await collection.find(filter).toArray();

    return employees.map((e: any) => ({
      ...e,
      _id: e._id.toString(),
      email: e.email || e.employee_details?.email, // Ensure email is included
    }));
  } catch (error: any) {
    console.error("Error fetching employees:", error.message);
    return { error: error.message };
  }
};

// ----------------------
// Section Updates
// ----------------------
type EmployeeSectionKeys =
  | keyof z.infer<typeof EmployeeSchema>
  | "employee_details.profile_picture";

export const updateEmployeeSection = async (
  id: string,
  section: EmployeeSectionKeys,
  data: any
) => {
  if (!dbConnection) await init();
  if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };

  const collection = await database?.collection("employees");

  const updateQuery = section.includes(".")
    ? { $set: { [section]: data, updatedAt: new Date() } } // nested
    : { $set: { [section]: data, updatedAt: new Date() } }; // top-level

  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    updateQuery
  );

  return { modifiedCount: result.modifiedCount, success: true };
};

// ----------------------
// Dedicated Section Actions
// ----------------------
export const updateEmployeeDetails = async (id: string, details: any) =>
  updateEmployeeSection(id, "employee_details", details);

export const updateLegalInfo = async (id: string, legal: any) =>
  updateEmployeeSection(id, "legal_info", legal);

export const updateEducationHistory = async (id: string, education: any[]) =>
  updateEmployeeSection(id, "education_history", education);

export const updateEmploymentHistory = async (id: string, employment: any[]) =>
  updateEmployeeSection(id, "employment_history", employment);

export const updateReferences = async (id: string, refs: any[]) =>
  updateEmployeeSection(id, "references", refs);

// ----------------------
// Helper
// ----------------------
async function getEmployeeName(employeeId: string) {
  const collection = await database?.collection("employees");
  const employee = await collection.findOne({
    _id: new ObjectId(employeeId),
  });
  return employee
    ? `${employee.employee_details?.surname ?? ""} ${employee.employee_details?.other_names ?? ""}`.trim()
    : null;
}

export const getEmployeeDetailsById = async (id: string) => {
  if (!dbConnection) await init();
  try {
    if (!ObjectId.isValid(id)) return { error: "Invalid employee ID" };

    const collection = await database?.collection("employees");
    const employee = await collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { employee_details: 1 } } // only return details
    );

    return employee
      ? { _id: employee._id.toString(), ...employee.employee_details }
      : null;
  } catch (error: any) {
    console.error("Error fetching employee details:", error.message);
    return { error: error.message };
  }
};

export const uploadProfilePicture = async (employeeId: string, file: File) => {
  try {
    console.log("=== UPLOAD PROFILE PICTURE DEBUG ===");
    console.log("1. Received employeeId:", employeeId);
    console.log("2. Type of employeeId:", typeof employeeId);
    console.log("3. employeeId length:", employeeId?.length);
    console.log("4. File name:", file.name);
    console.log("5. File size:", file.size);

    await init();

    if (!employeeId || typeof employeeId !== "string") {
      throw new Error("Employee ID is required and must be a string");
    }

    const id = employeeId.trim();
    console.log("6. Trimmed ID:", id);
    console.log("7. Is valid ObjectId?", ObjectId.isValid(id));

    // Test if this specific ID can be converted to ObjectId
    try {
      const testObjectId = new ObjectId(id);
      console.log("8. Successfully created ObjectId:", testObjectId.toString());
    } catch (error) {
      console.log("8. Failed to create ObjectId:", error);
    }

    if (!ObjectId.isValid(id)) {
      throw new Error(
        `Invalid employee ID format: ${id}. Length: ${id.length}`
      );
    }

    // Check if employee exists using the same ID
    const collection = database.collection("employees");
    console.log("9. Checking if employee exists with ID:", id);

    const employee = await collection.findOne({ _id: new ObjectId(id) });
    console.log("10. Employee found:", !!employee);

    if (!employee) {
      throw new Error(`Employee not found with ID: ${id}`);
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("11. File buffer created, size:", buffer.length);

    // Upload to Cloudinary
    console.log("12. Starting Cloudinary upload...");
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "employees", resource_type: "image" },
        (error, result) => {
          if (error) {
            console.log("13. Cloudinary upload error:", error);
            return reject(error);
          }
          console.log("13. Cloudinary upload success:", result?.secure_url);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    if (!uploadResult?.secure_url) {
      throw new Error("Cloudinary did not return a valid URL");
    }

    // Save URL to employee record
    console.log("14. Updating employee record...");
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "employee_details.profile_picture": uploadResult.secure_url,
          updatedAt: new Date(),
        },
      }
    );

    console.log("15. Update result modifiedCount:", updateResult.modifiedCount);

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update employee profile picture");
    }

    return {
      url: uploadResult.secure_url,
      success: true,
      message: "Profile picture uploaded successfully",
    };
  } catch (error: any) {
    console.error("16. FINAL UPLOAD ERROR:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ----------------------
// Get Employee by User ID
// ----------------------
export const getEmployeeByUserId = async (userId: string) => {
  if (!dbConnection) await init();
  try {
    console.log("getEmployeeByUserId - Searching for user_id:", userId);

    if (!userId || userId.trim() === "") {
      return { error: "User ID is required" };
    }

    const collection = await database?.collection("employees");

    // Search for employee with the given user_id
    const employee = await collection.findOne({
      user_id: userId,
      isActive: { $ne: false }, // Exclude soft-deleted employees
    });

    console.log("getEmployeeByUserId - Employee found:", !!employee);

    if (!employee) {
      return null; // No employee found for this user
    }

    // Convert MongoDB ObjectId to string and return the employee
    return {
      ...employee,
      _id: employee._id.toString(),
    };
  } catch (error: any) {
    console.error("Error fetching employee by user ID:", error.message);
    return { error: error.message };
  }
};

// Alternative version if you want to search by different user ID fields
export const getEmployeeByUserIdV2 = async (userId: string) => {
  if (!dbConnection) await init();
  try {
    console.log("getEmployeeByUserIdV2 - Searching for user ID:", userId);

    if (!userId || userId.trim() === "") {
      return { error: "User ID is required" };
    }

    const collection = await database?.collection("employees");

    // Search using multiple possible user ID fields
    const employee = await collection.findOne({
      $or: [
        { user_id: userId },
        { userId: userId }, // if you use "userId" field instead of "user_id"
        { "user.id": userId }, // if user data is nested
      ],
      isActive: { $ne: false },
    });

    console.log("getEmployeeByUserIdV2 - Employee found:", !!employee);

    if (!employee) {
      return null;
    }

    return {
      ...employee,
      _id: employee._id.toString(),
    };
  } catch (error: any) {
    console.error("Error fetching employee by user ID (V2):", error.message);
    return { error: error.message };
  }
};

// Get employee details by user ID (returns only employee_details section)
export const getEmployeeDetailsByUserId = async (userId: string) => {
  if (!dbConnection) await init();
  try {
    if (!userId || userId.trim() === "") {
      return { error: "User ID is required" };
    }

    const collection = await database?.collection("employees");
    const employee = await collection.findOne(
      {
        user_id: userId,
        isActive: { $ne: false },
      },
      { projection: { employee_details: 1, _id: 1 } } // Only return details and ID
    );

    if (!employee) {
      return null;
    }

    return {
      _id: employee._id.toString(),
      ...employee.employee_details,
    };
  } catch (error: any) {
    console.error("Error fetching employee details by user ID:", error.message);
    return { error: error.message };
  }
};
