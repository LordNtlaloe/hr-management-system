// lib/tokens.ts - Fixed generateVerificationToken function
/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from "crypto";
import { connectToDB } from "@/lib/db";
import { getUserByEmail } from "@/actions/user.actions";

let dbConnection: any;
let database: any;

const init = async () => {
    try {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("td_holdings_db");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

export const generateVerificationToken = async (email: string) => {
    try {
        if (!dbConnection) await init();

        // Generate secure random token
        const token = crypto.randomUUID();

        // Set expiration time (24 hours from now)
        const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

        const collection = database.collection("verification_tokens");
        if (!collection || !database) {
            throw new Error("Failed to connect to collection");
        }

        // First, delete any existing token for this email
        await collection.deleteOne({ email });

        // Insert new token
        const insertResult = await collection.insertOne({
            email,
            token,
            expires,
            createdAt: new Date()
        });

        if (!insertResult.insertedId) {
            throw new Error("Failed to create verification token");
        }

        return { token, expires };

    } catch (error: any) {
        console.error("Error generating verification token:", error.message);
        throw error;
    }
}

// Alternative approach using upsert (replace the above function with this if preferred)
export const generateVerificationTokenUpsert = async (email: string) => {
    try {
        if (!dbConnection) await init();

        // Generate secure random token
        const token = crypto.randomUUID();

        // Set expiration time (24 hours from now)
        const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

        const collection = database.collection("verification_tokens");
        if (!collection || !database) {
            throw new Error("Failed to connect to collection");
        }

        // Use upsert to replace existing token or create new one
        await collection.replaceOne(
            { email },
            {
                email,
                token,
                expires,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true }
        );

        return { token, expires };

    } catch (error: any) {
        console.error("Error generating verification token:", error.message);
        throw error;
    }
}

// Fixed regenerateVerificationToken function
export const regenerateVerificationToken = async (email: string) => {
    try {
        if (!dbConnection) await init();

        // Check if user exists
        const existingUser = await getUserByEmail(email);
        if (!existingUser) {
            return { error: "Email Does Not Exist" };
        }

        // Generate new token
        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

        const collection = database.collection("verification_tokens");
        if (!collection || !database) {
            throw new Error("Failed to connect to collection");
        }

        // Delete existing token and create new one
        await collection.deleteOne({ email });
        
        const insertResult = await collection.insertOne({
            email,
            token,
            expires,
            createdAt: new Date()
        });

        if (!insertResult.insertedId) {
            throw new Error("Failed to create verification token");
        }

        return { token, expires };

    } catch (error: any) {
        console.error("Error regenerating verification token:", error.message);
        return { error: error.message };
    }
}
export const generatePasswordResetToken = async (email: string) => {
    try {
        // Initialize database connection if not already done
        if (!dbConnection) await init();

        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

        const collection = database.collection("password_reset_tokens");
        if (!collection || !database) {
            throw new Error("Failed to connect to password reset tokens collection");
        }

        // Check if there's an existing token for this email and delete it
        const existingToken = await collection.findOne({ email });
        if (existingToken) {
            await collection.deleteOne({ email });
        }

        // Create new token
        const result = await collection.insertOne({
            email,
            token,
            expires,
            createdAt: new Date()
        });

        if (!result.insertedId) {
            throw new Error("Failed to insert password reset token");
        }

        console.log("Password reset token generated successfully:", { email, token });
        return { token, expires };

    } catch (error: any) {
        console.error("Error generating password reset token:", error.message);
        return null;
    }
};

// Alternative version with better error handling
export const generatePasswordResetTokenImproved = async (email: string) => {
    try {
        // Initialize database connection if not already done
        if (!dbConnection) await init();

        // Verify database connection
        if (!database) {
            throw new Error("Database connection not established");
        }

        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

        const collection = database.collection("password_reset_tokens");
        
        // Use upsert to replace existing token or create new one
        const result = await collection.replaceOne(
            { email },
            {
                email,
                token,
                expires,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true }
        );

        if (!result.acknowledged) {
            throw new Error("Failed to create password reset token");
        }

        console.log("Password reset token generated successfully:", { 
            email, 
            token: token.substring(0, 8) + "...", // Log partial token for security
            upserted: result.upsertedId ? true : false,
            modified: result.modifiedCount > 0
        });

        return { token, expires };

    } catch (error: any) {
        console.error("Error generating password reset token:", error.message, error.stack);
        return null;
    }
};

