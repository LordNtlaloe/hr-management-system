import * as z from "zod";


export const LoginSchema = z.object({
    email: z.string().email({message: "Email Is Required"}),
    password: z.string({message: "Password Is Required"})
})

export const SignUpSchema = z.object({
    first_name: z.string({message: "First Name Is Required"}),
    last_name: z.string({message: "Last Name Is Required"}),
    phone_number: z.string({message: "Phone Number Is Required"}),
    email: z.string().email({message: "Email Is Required"}),
    password: z.string({message: "Password Is Required"}),
    role: z.string()
})

export const PasswordResetSchema = z.object({
    email: z.string().email({message: "Email Is Required"}),
})

export const NewPasswordSchema = z.object({
    password: z.string().min(6, {message: "Email Is Required"}),
})