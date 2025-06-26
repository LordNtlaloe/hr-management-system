import NextAuth, { DefaultSession } from "next-auth"
import "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client, { db } from "./lib/database"; // Import both client and db
import { LoginSchema } from "@/schemas"
import { getUserByEmail, getUserById } from "@/actions/user.actions"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
import { connectToDB } from "@/lib/db"

declare module "@auth/core" {
  interface Session {
    user: {
      role: "Cashier" | "Manager" | "Admin"
    } & DefaultSession["user"]
  }
}

// Extend the JWT interface to include role
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    role?: "Cashier" | "Manager" | "Admin"
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string
    role?: string
  }
}

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use the database reference instead of just the client
  adapter: MongoDBAdapter(client, {
    databaseName: "td_holdings_db"
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const user = await getUserByEmail(email)

          // Check if user exists and doesn't have an error
          if (!user || !user.password) {
            return null
          }

          // Verify password
          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) {
            // Return user object (without password)
            return user;
          }
        }

        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error"
  },
  events: {
    async linkAccount({ user }) {
      if (user.id) {
        const collection = db.collection("users");

        // Update both emailVerified and set default role for new OAuth users
        await collection.updateOne(
          { id: user.id },
          {
            $set: {
              emailVerified: new Date(),
              role: "Cashier" // Set default role for OAuth users
            },
            $setOnInsert: { role: "Cashier" } // Only set role if it doesn't exist
          },
          { upsert: false } // Don't create new document, just update existing
        );
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") {
        // For OAuth users, ensure they have a default role
        if (user.email) {
          const existingUser = await getUserByEmail(user.email);

          // If user exists but doesn't have a role, update it
          if (existingUser && !existingUser.role) {
            const collection = db.collection("users");
            await collection.updateOne(
              { email: user.email },
              { $set: { role: "Cashier" } }
            );
          }
        }
        return true;
      }

      // Existing credentials logic
      if (!user.id) {
        return false;
      }

      const existingUser = await getUserById(user.id);
      if (!existingUser?.emailVerified) {
        return false;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Handle first-time OAuth sign in
      if (user && account?.provider !== "credentials") {
        if (user.email) {
          const existingUser = await getUserByEmail(user.email);
          if (existingUser) {
            // If user doesn't have a role, set default and update DB
            if (!existingUser.role) {
              const collection = db.collection("users");
              await collection.updateOne(
                { email: user.email },
                { $set: { role: "Cashier" } }
              );
              token.role = "Cashier";
            } else {
              token.role = existingUser.role;
            }
          }
        }
        return token;
      }

      // For subsequent requests, get user data and set role
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (existingUser) {
        // Always set the role from the database
        token.role = existingUser.role || "Cashier";

        // If user doesn't have a role in DB, update it
        if (!existingUser.role) {
          const collection = db.collection("users");
          await collection.updateOne(
            { _id: existingUser._id }, // Use _id for MongoDB
            { $set: { role: "Cashier" } }
          );
          token.role = "Cashier";
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log({ sessionToken: token });

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      return session;
    }
  }
})