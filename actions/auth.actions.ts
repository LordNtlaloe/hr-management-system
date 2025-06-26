"use server";
import * as z from "zod";
import { LoginSchema, SignUpSchema, PasswordResetSchema, NewPasswordSchema } from "@/schemas";
import { connectToDB } from "@/lib/db"
import bcrypt from "bcryptjs"
import { getUserByEmail } from "@/actions/user.actions";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { generateVerificationToken, generatePasswordResetToken } from "@/lib/tokens";
import { sendTokenEmail } from "@/lib/mail";
import { signOut } from "next-auth/react";

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

export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Invalid Fields" }
    }

    const { email, password } = validatedFields.data;

    const existingUser = await getUserByEmail(email)

    // Fixed: Check if user doesn't exist OR has missing email/password
    if (!existingUser || !existingUser.email || !existingUser.password) {
        return { error: "Email Does Not Exist" }
    }

    // Check if email is verified
    if (!existingUser.emailVerified) {
        const tokenResult = await generateVerificationToken(existingUser.email);

        if (!tokenResult) {
            return { error: "Failed to generate verification token" };
        }

        // Send verification email
        const emailResult = await sendTokenEmail({
            to: existingUser.email,
            name: `${existingUser.first_name} ${existingUser.last_name}`,
            subject: "Verify Your Email Address",
            token: tokenResult.token as string,
            tokenType: 'verification'
        });

        if (!emailResult.success) {
            return { error: "Failed to send verification email" };
        }

        return { success: "Confirmation Email Sent" }
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT
        })
    }
    catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid Credentials" }
                default:
                    return { error: "Something Went Wrong" }
            }
        }
        throw error;
    }

    return { success: "Login Successful" }
}

export const signup = async (values: z.infer<typeof SignUpSchema>) => {
    console.log("Signup values:", values)

    const validateFields = SignUpSchema.safeParse(values);
    if (!validateFields.success) {
        console.log("Validation errors:", validateFields.error.errors);
        return { error: "Invalid Fields" }
    }

    const { first_name, last_name, phone_number, email, password, role } = validateFields.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!dbConnection) await init();

        const collection = database.collection("users");
        if (!collection || !database) {
            return { error: "Failed to connect to collection!!" };
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(email)
        if (existingUser) {
            return { error: "User Already Exists" }
        }

        // Create new user
        const result = await collection.insertOne({
            first_name,
            last_name,
            phone_number,
            email,
            password: hashedPassword,
            role,
            emailVerified: null, // Add this field for verification tracking
            createdAt: new Date()
        });

        console.log("User created successfully:", result.insertedId);

        // Generate verification token
        const tokenResult = await generateVerificationToken(email);

        if (!tokenResult) {
            return { error: "Failed to generate verification token" };
        }

        // Send verification email
        const emailResult = await sendTokenEmail({
            to: email,
            name: `${first_name} ${last_name}`,
            subject: "Verify Your Email Address",
            token: tokenResult.token as string,
            tokenType: 'verification'
        });

        if (!emailResult.success) {
            return { error: "User created but failed to send verification email" };
        }

        return { success: "Verification Email Has Been Sent" }

    } catch (error: any) {
        console.error("An error occurred saving new user:", error.message);
        return { error: error.message }
    }
}

export const getVerificationTokenByEmail = async (email: string) => {
    try {
        if (!dbConnection) await init();

        const collection = database.collection("verification_tokens");
        if (!collection || !database) {
            return null; // Return null instead of error object
        }

        const verificationToken = await collection.findOne({ email });
        return verificationToken;

    } catch (error: any) {
        console.error("An error occurred getting verification token:", error.message);
        return null; // Return null instead of error object
    }
}

export const getVerificationTokenByToken = async (token: string) => {
    try {
        if (!dbConnection) await init();

        const collection = database.collection("verification_tokens");
        if (!collection || !database) {
            return null; // Return null instead of error object
        }

        const verificationToken = await collection.findOne({ token });
        return verificationToken;

    } catch (error: any) {
        console.error("An error occurred getting verification token:", error.message);
        return null; // Return null instead of error object
    }
}

// Improved verifyEmail function
export const verifyEmail = async (token: string) => {
    try {
        if (!dbConnection) await init();

        console.log("Verifying token:", token); // Debug log

        // Get verification token
        const verificationToken = await getVerificationTokenByToken(token);

        if (!verificationToken) {
            console.log("Token not found in database"); // Debug log
            return { error: "Invalid or expired token" };
        }

        console.log("Found token:", verificationToken); // Debug log

        // Check if token is expired
        if (new Date() > new Date(verificationToken.expires)) {
            // Clean up expired token
            const tokensCollection = database.collection("verification_tokens");
            await tokensCollection.deleteOne({ token });
            console.log("Token expired"); // Debug log
            return { error: "Token has expired" };
        }

        // Get user by email
        const user = await getUserByEmail(verificationToken.email);
        if (!user) {
            console.log("User not found"); // Debug log
            return { error: "User not found" };
        }

        console.log("User found:", { email: user.email, emailVerified: user.emailVerified }); // Debug log

        // Check if email is already verified
        if (user.emailVerified) {
            // Clean up token since email is already verified
            const tokensCollection = database.collection("verification_tokens");
            await tokensCollection.deleteOne({ token });
            console.log("Email already verified"); // Debug log
            return { error: "Email is already verified" };
        }

        // Update user's emailVerified field and delete token atomically
        const session = dbConnection.startSession();

        try {
            let result;
            await session.withTransaction(async () => {
                // Update user's emailVerified field
                const usersCollection = database.collection("users");
                const updateResult = await usersCollection.updateOne(
                    { email: verificationToken.email },
                    {
                        $set: {
                            emailVerified: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );

                console.log("User update result:", updateResult); // Debug log

                // Delete the verification token
                const tokensCollection = database.collection("verification_tokens");
                const deleteResult = await tokensCollection.deleteOne({ token }, { session });

                console.log("Token delete result:", deleteResult); // Debug log

                if (updateResult.modifiedCount === 0) {
                    throw new Error("Failed to update user");
                }
            });

            console.log("Email verified successfully"); // Debug log
            return { success: "Email verified successfully" };

        } catch (transactionError) {
            console.error("Transaction failed:", transactionError);
            return { error: "Failed to verify email" };
        } finally {
            await session.endSession();
        }

    } catch (error: any) {
        console.error("An error occurred verifying email:", error.message);
        return { error: "Something went wrong during verification" };
    }
}


export const resetPassword = async (values: z.infer<typeof PasswordResetSchema>) => {
    const validatedFields = PasswordResetSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid email address" };
    }

    const { email } = validatedFields.data;

    try {
        // Check if user exists
        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            // Don't reveal if user exists or not for security
            return { success: "If an account with that email exists, we've sent you a password reset link." };
        }

        // Generate password reset token
        const tokenResult = await generatePasswordResetToken(email);

        if (!tokenResult) {
            return { error: "Failed to generate reset token" };
        }

        // Send password reset email
        const emailResult = await sendTokenEmail({
            to: email,
            name: `${existingUser.first_name} ${existingUser.last_name}`,
            subject: "Reset Your Password",
            token: tokenResult.token as string,
            tokenType: 'reset'
        });

        if (!emailResult.success) {
            return { error: "Failed to send reset email" };
        }

        return { success: "If an account with that email exists, we've sent you a password reset link." };

    } catch (error: any) {
        console.error("An error occurred during password reset:", error.message);
        return { error: "Something went wrong. Please try again." };
    }
};

// Helper functions for password reset tokens
export const getPasswordResetTokenByEmail = async (email: string) => {
    try {
        if (!dbConnection) await init();

        const collection = database.collection("password_reset_tokens");
        if (!collection || !database) {
            return null;
        }

        const resetToken = await collection.findOne({ email });
        return resetToken;

    } catch (error: any) {
        console.error("An error occurred getting password reset token:", error.message);
        return null;
    }
};

export const getPasswordResetTokenByToken = async (token: string) => {
    try {
        if (!dbConnection) await init();

        const collection = database.collection("password_reset_tokens");
        if (!collection || !database) {
            return null;
        }

        const resetToken = await collection.findOne({ token });
        return resetToken;

    } catch (error: any) {
        console.error("An error occurred getting password reset token:", error.message);
        return null;
    }
};



export const newPassword = async (
    values: z.infer<typeof NewPasswordSchema>,
    token?: string | null
) => {
    if (!token) {
        return { error: "Missing token" };
    }

    const validatedFields = NewPasswordSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { password } = validatedFields.data;

    try {
        // Get reset token
        const resetToken = await getPasswordResetTokenByToken(token);

        if (!resetToken) {
            return { error: "Invalid or expired token" };
        }

        // Check if token is expired
        if (new Date() > new Date(resetToken.expires)) {
            // Clean up expired token
            const tokensCollection = database.collection("password_reset_tokens");
            await tokensCollection.deleteOne({ token });
            return { error: "Token has expired" };
        }

        // Get user by email
        const user = await getUserByEmail(resetToken.email);
        if (!user) {
            return { error: "User not found" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password and delete token atomically
        const session = dbConnection.startSession();

        try {
            await session.withTransaction(async () => {
                // Update user's password
                const usersCollection = database.collection("users");
                const updateResult = await usersCollection.updateOne(
                    { email: resetToken.email },
                    {
                        $set: {
                            password: hashedPassword,
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );

                // Delete the reset token
                const tokensCollection = database.collection("password_reset_tokens");
                await tokensCollection.deleteOne({ token }, { session });

                if (updateResult.modifiedCount === 0) {
                    throw new Error("Failed to update password");
                }
            });

            return { success: "Password updated successfully" };

        } catch (transactionError) {
            console.error("Transaction failed:", transactionError);
            return { error: "Failed to update password" };
        } finally {
            await session.endSession();
        }

    } catch (error: any) {
        console.error("An error occurred updating password:", error.message);
        return { error: "Something went wrong during password reset" };
    }
};

export const logout = async() => {
    await signOut();
}