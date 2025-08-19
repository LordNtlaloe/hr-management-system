import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: "Employee"  | "Admin"
  }
  
  interface Session {
    user: {
      id: string
      role: "Employee"  | "Admin"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "Employee"  | "Admin"
  }
}