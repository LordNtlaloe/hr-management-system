import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
let dbConnection: any;
let database: any;
export const runtime = 'nodejs'


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
            return user; // Return the user object directly
        }

        return null; // Return null instead of error object for "not found"
    } catch (error: any) {
        console.log("An error occurred...", error.message);
        return { error: error.message };
    }
}

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