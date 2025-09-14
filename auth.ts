import NextAuth, { DefaultSession, User } from "next-auth"
import "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client, { db } from "./lib/database"
import { LoginSchema } from "@/schemas"
import { getUserByEmail, getUserById } from "@/actions/user.actions"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
import { ObjectId } from "mongodb"

declare module "next-auth" {
  interface User {
    first_name: string,
    last_name: string,
    role?: "Employee" | "Admin"
  }

  interface Session {
    user: {
      first_name: string,
      last_name: string,
      role: "Employee" | "Admin"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    role?: "Employee" | "Admin"
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(client, {
    databaseName: "hr_management_db"
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      async authorize(credentials): Promise<User | null> {
        try {
          const validatedFields = LoginSchema.safeParse(credentials)

          if (validatedFields.success) {
            const { email, password } = validatedFields.data

            const user = await getUserByEmail(email)

            if (!user || !user.password) {
              return null
            }

            const passwordsMatch = await bcrypt.compare(password, user.password)

            if (passwordsMatch) {
              // Return user object that matches the User interface
              return {
                id: user._id?.toString() || user.id?.toString(),
                email: user.email,
                name: user.name,
                role: user.role || "Employee"
              } as User
            }
          }
          return null
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
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
      try {
        if (user.id) {
          const collection = db.collection("users")

          // Use proper MongoDB query format
          let query: any
          if (ObjectId.isValid(user.id)) {
            query = { _id: new ObjectId(user.id) }
          } else {
            query = { id: user.id }
          }

          await collection.updateOne(
            query,
            {
              $set: {
                emailVerified: new Date(),
                role: "Employee"
              }
            },
            { upsert: false }
          )
        }
      } catch (error) {
        console.error("Link account error:", error)
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Allow OAuth without email verification
        if (account?.provider !== "credentials") {
          if (user.email) {
            const existingUser = await getUserByEmail(user.email)

            if (existingUser && !existingUser.role) {
              const collection = db.collection("users")
              await collection.updateOne(
                { email: user.email },
                { $set: { role: "Employee" } }
              )
            }
          }
          return true
        }

        // For credentials, check if user exists and is verified
        if (!user.id) {
          return false
        }

        const existingUser = await getUserById(user.id)

        // Allow sign in if user exists (remove email verification requirement for now)
        return !!existingUser
      } catch (error) {
        console.error("SignIn callback error:", error)
        return false
      }
    },

    // auth.ts - Update the JWT callback to properly handle roles
    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (user) {
          token.sub = user.id?.toString()
          token.role = user.role || "Employee" // Default to Employee if no role is set

          // For OAuth users, ensure they have a role in the database
          if (account?.provider !== "credentials" && user.email) {
            const existingUser = await getUserByEmail(user.email)
            if (existingUser) {
              token.role = existingUser.role || "Employee"
              token.sub = existingUser._id?.toString() || existingUser.id?.toString()

              // Update role in DB if not set
              if (!existingUser.role) {
                const collection = db.collection("users")
                await collection.updateOne(
                  { email: user.email },
                  { $set: { role: "Employee" } }
                )
              }
            }
          }
          return token
        }

        // Subsequent requests - refresh user data
        if (token.sub) {
          const existingUser = await getUserById(token.sub)
          if (existingUser) {
            token.role = existingUser.role || "Employee"
          }
        }

        return token
      } catch (error) {
        console.error("JWT callback error:", error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (token.sub && session.user) {
          session.user.id = token.sub
        }

        if (token.role && session.user) {
          session.user.role = token.role
        }

        return session
      } catch (error) {
        console.error("Session callback error:", error)
        return session
      }
    }
  }
})