import { DefaultSession } from "next-auth";

export type ExtenedUser = DefaultSession["user"] & {
    role: "Cashier" | "Manager" | "Admin"
}

declare module "next-auth" {
    interface Session {
        user: ExtenedUser
    }
}


declare module "next-auth" {
    interface User {
        user: ExtenedUser
    }
}