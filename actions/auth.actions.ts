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
        console.log('🔌 Initializing database connection...');
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
        console.log('✅ Database connection initialized successfully');
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        throw error;
    }
}

export const signup = async (values: z.infer<typeof SignUpSchema>) => {
    console.log("🚀 Starting signup process...");
    console.log("📝 Signup values:", { ...values, password: '[REDACTED]' });

    // Validate the input
    const validateFields = SignUpSchema.safeParse(values);

    if (!validateFields.success) {
        const fieldErrors = validateFields.error.flatten().fieldErrors;
        console.log("❌ Validation errors:", fieldErrors);
        return { error: "Invalid fields", details: fieldErrors };
    }

    const { first_name, last_name, phone_number, email, password, role } = validateFields.data;

    try {
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('🔌 Ensuring database connection...');
        if (!dbConnection) await init();

        const collection = database.collection("users");
        if (!collection) {
            console.error('❌ Failed to get users collection');
            return { error: "Failed to connect to collection" };
        }

        console.log('👤 Checking if user already exists...');
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            console.log('⚠️  User already exists with email:', email);
            return { error: "User already exists" };
        }

        console.log('💾 Creating new user in database...');
        const result = await collection.insertOne({
            first_name,
            last_name,
            phone_number,
            email,
            password: hashedPassword,
            role,
            emailVerified: null,
            createdAt: new Date(),
        });

        console.log("✅ User created successfully with ID:", result.insertedId);

        // Generate verification token
        console.log('🎫 Generating verification token...');
        const tokenResult = await generateVerificationToken(email);
        if (!tokenResult) {
            console.error('❌ Failed to generate verification token');
            return { error: "Failed to generate verification token" };
        }

        console.log('✅ Verification token generated:', {
            token: tokenResult.token?.substring(0, 10) + '...',
            expires: tokenResult.expires
        });

        // Send verification email
        console.log('📧 Sending verification email...');
        const emailResult = await sendTokenEmail({
            to: email,
            name: `${first_name} ${last_name}`,
            subject: "Verify Your Email Address",
            token: tokenResult.token as string,
            tokenType: "verification",
        });

        console.log('📬 Email send result:', emailResult);

        if (!emailResult.success) {
            console.error('❌ Failed to send verification email:', emailResult.error);
            return {
                error: "User created but failed to send verification email",
                details: emailResult.error
            };
        }

        console.log('🎉 Signup process completed successfully!');
        return { success: "Verification email has been sent" };

    } catch (error: any) {
        console.error("❌ Error during signup process:", {
            message: error.message,
            stack: error.stack?.substring(0, 500)
        });
        return { error: error.message };
    }
};

export const login = async (values: z.infer<typeof LoginSchema>) => {
    console.log('🚀 Starting login process...');

    const validatedFields = LoginSchema.safeParse(values);
    if (!validatedFields.success) {
        console.log('❌ Login validation failed:', validatedFields.error);
        return { error: "Invalid Fields" }
    }

    const { email, password } = validatedFields.data;
    console.log('📧 Login attempt for email:', email);

    const existingUser = await getUserByEmail(email)

    if (!existingUser || !existingUser.email || !existingUser.password) {
        console.log('❌ User not found or incomplete user data');
        return { error: "Email Does Not Exist" }
    }

    console.log('👤 User found, checking email verification status...');
    if (!existingUser.emailVerified) {
        console.log('⚠️  Email not verified, sending new verification token...');

        const tokenResult = await generateVerificationToken(existingUser.email);
        if (!tokenResult) {
            console.error('❌ Failed to generate verification token');
            return { error: "Failed to generate verification token" };
        }

        console.log('📧 Sending verification email...');
        const emailResult = await sendTokenEmail({
            to: existingUser.email,
            name: `${existingUser.first_name} ${existingUser.last_name}`,
            subject: "Verify Your Email Address",
            token: tokenResult.token as string,
            tokenType: 'verification'
        });

        console.log('📬 Verification email result:', emailResult);

        if (!emailResult.success) {
            console.error('❌ Failed to send verification email:', emailResult.error);
            return { error: "Failed to send verification email" };
        }

        return { success: "Confirmation Email Sent" }
    }

    console.log('🔐 Checking password...');
    const passwordsMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordsMatch) {
        console.log('❌ Password mismatch');
        return { error: "Invalid Credentials" };
    }

    try {
        console.log('🔑 Attempting to sign in user...');
        await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT
        })
    }
    catch (error) {
        console.error('❌ SignIn error:', error);
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

    console.log('✅ Login successful');
    return { success: "Login Successful" }
}

// Rest of your functions remain the same but with added logging...
export const verifyEmail = async (token: string) => {
    try {
        console.log('🔍 Starting email verification process...');
        console.log('🎫 Verifying token:', token?.substring(0, 10) + '...');

        if (!dbConnection) await init();

        const verificationToken = await getVerificationTokenByToken(token);

        if (!verificationToken) {
            console.log('❌ Token not found in database');
            return { error: "Invalid or expired token" };
        }

        console.log('✅ Token found, checking expiration...');
        if (new Date() > new Date(verificationToken.expires)) {
            const tokensCollection = database.collection("verification_tokens");
            await tokensCollection.deleteOne({ token });
            console.log('❌ Token expired and deleted');
            return { error: "Token has expired" };
        }

        const user = await getUserByEmail(verificationToken.email);
        if (!user) {
            console.log('❌ User not found for token email');
            return { error: "User not found" };
        }

        if (user.emailVerified) {
            const tokensCollection = database.collection("verification_tokens");
            await tokensCollection.deleteOne({ token });
            console.log('⚠️  Email already verified, token cleaned up');
            return { error: "Email is already verified" };
        }

        console.log('💾 Updating user verification status...');
        const session = dbConnection.startSession();

        try {
            await session.withTransaction(async () => {
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

                const tokensCollection = database.collection("verification_tokens");
                await tokensCollection.deleteOne({ token }, { session });

                if (updateResult.modifiedCount === 0) {
                    throw new Error("Failed to update user");
                }
            });

            console.log('✅ Email verified successfully');
            return { success: "Email verified successfully" };

        } catch (transactionError) {
            console.error('❌ Transaction failed:', transactionError);
            return { error: "Failed to verify email" };
        } finally {
            await session.endSession();
        }

    } catch (error: any) {
        console.error('❌ Error during email verification:', error);
        return { error: "Something went wrong during verification" };
    }
}

// Include all your other existing functions here...
export const getVerificationTokenByEmail = async (email: string) => {
    try {
        if (!dbConnection) await init();
        const collection = database.collection("verification_tokens");
        if (!collection || !database) return null;
        return await collection.findOne({ email });
    } catch (error: any) {
        console.error("Error getting verification token by email:", error.message);
        return null;
    }
}

export const getVerificationTokenByToken = async (token: string) => {
    try {
        if (!dbConnection) await init();
        const collection = database.collection("verification_tokens");
        if (!collection || !database) return null;
        return await collection.findOne({ token });
    } catch (error: any) {
        console.error("Error getting verification token by token:", error.message);
        return null;
    }
}

export const resetPassword = async (values: z.infer<typeof PasswordResetSchema>) => {
    console.log('🔑 Starting password reset process...');
    const validatedFields = PasswordResetSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid email address" };
    }

    const { email } = validatedFields.data;

    try {
        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            return { success: "If an account with that email exists, we've sent you a password reset link." };
        }

        console.log('🎫 Generating password reset token...');
        const tokenResult = await generatePasswordResetToken(email);

        if (!tokenResult) {
            return { error: "Failed to generate reset token" };
        }

        console.log('📧 Sending password reset email...');
        const emailResult = await sendTokenEmail({
            to: email,
            name: `${existingUser.first_name} ${existingUser.last_name}`,
            subject: "Reset Your Password",
            token: tokenResult.token as string,
            tokenType: 'reset'
        });

        console.log('📬 Password reset email result:', emailResult);

        if (!emailResult.success) {
            return { error: "Failed to send reset email" };
        }

        return { success: "If an account with that email exists, we've sent you a password reset link." };

    } catch (error: any) {
        console.error("Error during password reset:", error.message);
        return { error: "Something went wrong. Please try again." };
    }
};

// Include all your other functions (getPasswordResetTokenByEmail, getPasswordResetTokenByToken, newPassword, logout)
export const getPasswordResetTokenByEmail = async (email: string) => {
    try {
        if (!dbConnection) await init();
        const collection = database.collection("password_reset_tokens");
        if (!collection || !database) return null;
        return await collection.findOne({ email });
    } catch (error: any) {
        console.error("Error getting password reset token by email:", error.message);
        return null;
    }
};

export const getPasswordResetTokenByToken = async (token: string) => {
    try {
        if (!dbConnection) await init();
        const collection = database.collection("password_reset_tokens");
        if (!collection || !database) return null;
        return await collection.findOne({ token });
    } catch (error: any) {
        console.error("Error getting password reset token by token:", error.message);
        return null;
    }
};

export const newPassword = async (
    values: z.infer<typeof NewPasswordSchema>,
    token?: string | null
) => {
    if (!token) return { error: "Missing token" };

    const validatedFields = NewPasswordSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid fields" };

    const { password } = validatedFields.data;

    try {
        const resetToken = await getPasswordResetTokenByToken(token);
        if (!resetToken) return { error: "Invalid or expired token" };

        if (new Date() > new Date(resetToken.expires)) {
            const tokensCollection = database.collection("password_reset_tokens");
            await tokensCollection.deleteOne({ token });
            return { error: "Token has expired" };
        }

        const user = await getUserByEmail(resetToken.email);
        if (!user) return { error: "User not found" };

        const hashedPassword = await bcrypt.hash(password, 10);
        const session = dbConnection.startSession();

        try {
            await session.withTransaction(async () => {
                const usersCollection = database.collection("users");
                const updateResult = await usersCollection.updateOne(
                    { email: resetToken.email },
                    { $set: { password: hashedPassword, updatedAt: new Date() } },
                    { session }
                );

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
        console.error("Error updating password:", error.message);
        return { error: "Something went wrong during password reset" };
    }
};

export const logout = async () => {
    await signOut();
}