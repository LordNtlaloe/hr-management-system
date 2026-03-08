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
// ✅ Import the Adapter type from next-auth's own bundled @auth/core so the
//    cast below resolves against the correct (single) type instance.
import type { Adapter } from "next-auth/adapters"

declare module "next-auth" {
  interface User {
    first_name: string
    last_name: string
    role?: "Employee" | "Admin" | "HR" | "Manager"
  }

  interface Session {
    user: {
      first_name: string
      last_name: string
      role: "Employee" | "Admin" | "HR" | "Manager"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    role?: "Employee" | "Admin" | "HR" | "Manager"
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ✅ Cast to next-auth's own Adapter type.
  //    @auth/mongodb-adapter and next-auth both depend on @auth/core but yarn
  //    resolves them to different instances, making their AdapterUser types
  //    structurally incompatible. The cast tells TypeScript to treat the adapter
  //    as the version next-auth expects, which is safe because the runtime
  //    implementation is identical.
  adapter: MongoDBAdapter(client, {
    databaseName: "hr_management_db",
  }) as Adapter,

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
              return {
                id: user._id?.toString() || user.id?.toString(),
                email: user.email,
                name: user.name,
                role: user.role || "Employee",
              } as User
            }
          }
          return null
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },

  events: {
    async linkAccount({ user }) {
      try {
        if (user.id) {
          const collection = db.collection("users")

          let query: any
          if (ObjectId.isValid(user.id)) {
            query = { _id: new ObjectId(user.id) }
          } else {
            query = { id: user.id }
          }

          await collection.updateOne(
            query,
            { $set: { emailVerified: new Date(), role: "Employee" } },
            { upsert: false }
          )
        }
      } catch (error) {
        console.error("Link account error:", error)
      }
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      try {
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

        if (!user.id) return false

        const existingUser = await getUserById(user.id)
        return !!existingUser
      } catch (error) {
        console.error("SignIn callback error:", error)
        return false
      }
    },

    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.sub = user.id?.toString()
          token.role = user.role || "Employee"

          if (account?.provider !== "credentials" && user.email) {
            const existingUser = await getUserByEmail(user.email)
            if (existingUser) {
              token.role = existingUser.role || "Employee"
              token.sub =
                existingUser._id?.toString() || existingUser.id?.toString()

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
    },
  },
})