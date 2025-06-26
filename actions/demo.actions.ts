"use server"

import { connectToDB } from "@/lib/db";
import { currentRole } from "@/lib/auth";

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

export const admin = async () => {
    const role = await currentRole()
    if (role === "Admin" || role === "Manager") {
        return { success: "Allowed" }
    }
    else{
        return {error: "Forbidden"}   
    }

}

export const getUserDetails = async () => {

}