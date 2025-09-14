"use server"
import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
let dbConnection: any;
let database: any;
import bcrypt from "bcryptjs";


// Initialize database connection
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

// CREATE - Add a new user
export const createUser = async (userData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        // Check if user already exists
        const existingUser = await collection.findOne({ email: userData.email });
        if (existingUser) {
            return { error: "User with this email already exists" };
        }

        const result = await collection.insertOne(userData);
        if (result.acknowledged) {
            return { success: true, userId: result.insertedId };
        }

        return { error: "Failed to create user" };
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

// READ - Get user by email
export const getUserByEmail = async (email: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        const user = await collection.findOne({ email });

        if (user) {
            return user;
        }

        return null;
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

// READ - Get user by ID
export const getUserById = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        const user = await collection.findOne({ _id: new ObjectId(id) });

        if (user) {
            return user;
        }

        return null;
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

// READ - Get all users (with optional pagination)
// actions/user.actions.ts
// READ - Get all users
export const getAllUsers = async () => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            throw new Error("Failed to connect to users collection");
        }

        const users = await collection.find({}).toArray();

        // Convert ObjectId and Dates to strings
        const plainUsers = users.map((user: { _id: { toString: () => any; }; createdAt: { toString: () => any; }; updatedAt: { toString: () => any; }; }) => ({
            ...user,
            _id: user._id.toString(),
            createdAt: user.createdAt ? user.createdAt.toString() : null,
            updatedAt: user.updatedAt ? user.updatedAt.toString() : null,
        }));

        return plainUsers;
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        throw error;
    }
};


// UPDATE - Update user by ID
export const updateUser = async (id: string, updateData: any) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        // Remove _id from update data if present to avoid modification
        if (updateData._id) {
            delete updateData._id;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.modifiedCount === 1) {
            return { success: true };
        } else if (result.matchedCount === 0) {
            return { error: "User not found" };
        }

        return { error: "Failed to update user" };
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

// DELETE - Delete user by ID
export const deleteUser = async (id: string) => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            return { success: true };
        }

        return { error: "User not found or already deleted" };
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

// SEARCH - Search users by various fields
export const searchUsers = async (query: string, field: string = "name") => {
    if (!dbConnection) await init();
    try {
        const collection = await database?.collection("users");

        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        // Create a case-insensitive regex search
        const searchQuery = {
            [field]: { $regex: new RegExp(query, 'i') }
        };

        const users = await collection.find(searchQuery).toArray();
        return users;
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

export const getUserRoleById = async (id: string) => {
    if (!dbConnection) await init();

    try {
        const collection = await database?.colleciton("users");
        if (!database || !collection) {
            console.log("Failed to connect to collection...");
            return { error: "Failed to connect to users collection" };
        }

        const user = await collection.find(id);
        const role = user.role;
        return role;
    }
    catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }

}


// Add this function to your user.actions.ts file


// CREATE - Create user account for new employee
// Add this updated function to your user.actions.ts file

export const createUserForEmployee = async (userData: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string; // Changed from phone_number to match employee schema
  employee_id: string;
}) => {
  if (!dbConnection) await init();
  
  try {
    const collection = await database?.collection("users");

    if (!database || !collection) {
      console.log("Failed to connect to collection...");
      return { error: "Failed to connect to users collection", success: false };
    }

    // Check if user already exists
    const existingUser = await collection.findOne({ email: userData.email });
    if (existingUser) {
      return { error: "User with this email already exists", success: false };
    }

    // Hash the default password "user123"
    const hashedPassword = await bcrypt.hash("user123", 10);

    // Create user object
    const newUser = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      name: `${userData.first_name} ${userData.last_name}`, // Add name field for NextAuth compatibility
      email: userData.email,
      phone_number: userData.phone, // Store as phone_number in users collection
      password: hashedPassword,
      role: "Employee", // Default role
      emailVerified: new Date(), // Mark as verified immediately
      employee_id: userData.employee_id, // Link to employee record
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newUser);
    
    if (result.acknowledged) {
      console.log(`User created successfully for employee: ${userData.email}`);
      return { 
        success: true, 
        userId: result.insertedId.toString(),
        message: "User account created successfully"
      };
    }

    return { error: "Failed to create user", success: false };
  } catch (error: any) {
    console.error("Error creating user for employee:", error.message);
    return { error: error.message, success: false };
  }
};