import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: "Employee"  | "Admin" | "HR" | "Manager"
  }
  
  interface Session {
    user: {
      id: string
      role: "Employee"  | "Admin" | "HR" | "Manager"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "Employee"  | "Admin" | "HR" | "Manager"
  }
}