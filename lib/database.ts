// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion } from "mongodb"

if (!process.env.DATABASE_URI) {
    throw new Error('Invalid/Missing environment variable: "DATABASE_URI"')
}

const uri = process.env.DATABASE_URI || ""
const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
}

let client: MongoClient

if (process.env.NODE_ENV === "development") {

    const globalWithMongo = global as typeof globalThis & {
        _mongoClient?: MongoClient
    }

    if (!globalWithMongo._mongoClient) {
        globalWithMongo._mongoClient = new MongoClient(uri, options)
    }
    client = globalWithMongo._mongoClient
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options)
}

// Get the database reference
const db = client.db("td_holdings_db")

// Export both the client and database
export default client
export { db }