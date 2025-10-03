"use server";

import { connectToDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import {
    ConcurrencyFormSchema,
    ConcurrencyReviewSchema,
} from "@/schemas";
import {
    CreateConcurrencyResponse,
    UpdateConcurrencyResponse,
    ConcurrencyFormState
} from "@/types";
import { SubmitConcurrencyResponse } from "@/types";

let dbConnection: any;
let database: any;

const init = async () => {
    if (dbConnection) return;
    try {
        const connection = await connectToDB();
        dbConnection = connection;
        database = await dbConnection?.db("hr_management_db");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};

// ----------------------
// Concurrency Form Actions (with Proper Types)
// ----------------------

export const createConcurrencyForm = async (
    prevState: ConcurrencyFormState,
    formData: FormData
): Promise<ConcurrencyFormState> => {
    if (!dbConnection) await init();

    try {
        const collection = await database?.collection("concurrency_forms");

        // Prepare data from form
        const formDataObject = {
            employee_id: formData.get("employee_id") as string,
            form_type: "concurrency_declaration",

            personal_info: {
                full_name: formData.get("full_name") as string,
                position: formData.get("position") as string,
                department: formData.get("department") as string,
                employee_id: formData.get("employee_id") as string,
            },

            outside_employment: {
                has_outside_employment: formData.get("has_outside_employment") === "yes",
                employer_names: formData.get("employer_names") as string,
                nature_of_business: formData.get("nature_of_business") as string,
                hours_per_week: formData.get("hours_per_week") ? parseInt(formData.get("hours_per_week") as string) : undefined,
                relationship_to_duties: formData.get("relationship_to_duties") as string,
            },

            conflict_of_interest: {
                has_conflict: formData.get("has_conflict") === "yes",
                conflict_details: formData.get("conflict_details") as string,
                mitigation_measures: formData.get("mitigation_measures") as string,
            },

            gifts_benefits: {
                received_gifts: formData.get("received_gifts") === "yes",
                gift_details: formData.get("gift_details") as string,
                gift_value: formData.get("gift_value") ? parseFloat(formData.get("gift_value") as string) : undefined,
                donor_relationship: formData.get("donor_relationship") as string,
            },

            declaration: {
                is_truthful: formData.get("is_truthful") === "yes",
                agreed_to_terms: formData.get("agreed_to_terms") === "yes",
                signature: formData.get("signature") as string,
            },
        };

        // Validate with Zod schema
        const validatedData = ConcurrencyFormSchema.parse({
            ...formDataObject,
            submission_date: new Date().toISOString(),
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
        });

        const result = await collection.insertOne(validatedData);

        revalidatePath("/concurrency");
        revalidatePath("/dashboard");

        return {
            insertedId: result.insertedId.toString(),
            success: true,
            message: "Concurrency form submitted successfully"
        };
    } catch (error: any) {
        console.error("Error creating concurrency form:", error.message);

        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            const errorMessage = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return {
                error: `Validation error: ${errorMessage}`,
                success: false,
                message: "Form validation failed"
            };
        }

        return {
            error: error.message,
            success: false,
            message: "Failed to create concurrency form"
        };
    }
};

export const updateConcurrencyForm = async (
    prevState: ConcurrencyFormState,
    formData: FormData
): Promise<ConcurrencyFormState> => {
    if (!dbConnection) await init();

    try {
        const id = formData.get("form_id") as string;

        if (!ObjectId.isValid(id)) {
            return {
                error: "Invalid form ID",
                success: false,
                message: "Invalid form ID"
            };
        }

        const collection = await database?.collection("concurrency_forms");

        // Prepare update data
        const updateData = {
            personal_info: {
                full_name: formData.get("full_name") as string,
                position: formData.get("position") as string,
                department: formData.get("department") as string,
                employee_id: formData.get("employee_id") as string,
            },

            outside_employment: {
                has_outside_employment: formData.get("has_outside_employment") === "yes",
                employer_names: formData.get("employer_names") as string,
                nature_of_business: formData.get("nature_of_business") as string,
                hours_per_week: formData.get("hours_per_week") ? parseInt(formData.get("hours_per_week") as string) : undefined,
                relationship_to_duties: formData.get("relationship_to_duties") as string,
            },

            conflict_of_interest: {
                has_conflict: formData.get("has_conflict") === "yes",
                conflict_details: formData.get("conflict_details") as string,
                mitigation_measures: formData.get("mitigation_measures") as string,
            },

            gifts_benefits: {
                received_gifts: formData.get("received_gifts") === "yes",
                gift_details: formData.get("gift_details") as string,
                gift_value: formData.get("gift_value") ? parseFloat(formData.get("gift_value") as string) : undefined,
                donor_relationship: formData.get("donor_relationship") as string,
            },

            declaration: {
                is_truthful: formData.get("is_truthful") === "yes",
                agreed_to_terms: formData.get("agreed_to_terms") === "yes",
                signature: formData.get("signature") as string,
            },
        };

        // Validate partial data
        const validatedData = ConcurrencyFormSchema.partial().parse({
            ...updateData,
            updated_at: new Date().toISOString(),
        });

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: validatedData }
        );

        revalidatePath("/concurrency");
        revalidatePath(`/concurrency/${id}`);

        return {
            modifiedCount: result.modifiedCount,
            success: true,
            message: "Concurrency form updated successfully"
        };
    } catch (error: any) {
        console.error("Error updating concurrency form:", error.message);

        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            const errorMessage = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return {
                error: `Validation error: ${errorMessage}`,
                success: false,
                message: "Form validation failed"
            };
        }

        return {
            error: error.message,
            success: false,
            message: "Failed to update concurrency form"
        };
    }
};

// Standalone actions (don't use useFormState)
export const submitConcurrencyForm = async (id: string): Promise<SubmitConcurrencyResponse> => {
    if (!dbConnection) await init();

    try {
        if (!ObjectId.isValid(id)) {
            return { error: "Invalid form ID", success: false, message: "Invalid form ID" };
        }

        const collection = await database?.collection("concurrency_forms");

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "submitted",
                    submission_date: new Date(),
                    updated_at: new Date()
                }
            }
        );

        revalidatePath("/concurrency");
        revalidatePath("/dashboard");

        return {
            modifiedCount: result.modifiedCount,
            success: true,
            message: "Concurrency form submitted for review"
        };
    } catch (error: any) {
        console.error("Error submitting concurrency form:", error.message);
        return {
            error: error.message,
            success: false,
            message: "Failed to submit concurrency form"
        };
    }
};



export const reviewConcurrencyForm = async (id: string, decision: string, reviewer_notes?: string) => {
    if (!dbConnection) await init();

    try {
        if (!ObjectId.isValid(id)) {
            return { error: "Invalid form ID", success: false };
        }

        const collection = await database?.collection("concurrency_forms");

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: decision,
                    review_date: new Date(),
                    reviewer_notes: reviewer_notes || "",
                    updated_at: new Date()
                }
            }
        );

        revalidatePath("/concurrency");
        revalidatePath("/admin/concurrency");

        return {
            modifiedCount: result.modifiedCount,
            success: true,
            message: `Concurrency form ${decision}`
        };
    } catch (error: any) {
        console.error("Error reviewing concurrency form:", error.message);
        return { error: error.message, success: false };
    }
};

export const deleteConcurrencyForm = async (id: string) => {
    if (!dbConnection) await init();

    try {
        if (!ObjectId.isValid(id)) {
            return { error: "Invalid form ID", success: false };
        }

        const collection = await database?.collection("concurrency_forms");

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    is_active: false,
                    deleted_at: new Date(),
                    updated_at: new Date()
                }
            }
        );

        revalidatePath("/concurrency");

        return {
            modifiedCount: result.modifiedCount,
            success: true,
            message: "Concurrency form deleted successfully"
        };
    } catch (error: any) {
        console.error("Error deleting concurrency form:", error.message);
        return { error: error.message, success: false };
    }
};

// ----------------------
// Data Fetching Actions
// ----------------------

export const getConcurrencyFormById = async (id: string) => {
    if (!dbConnection) await init();

    try {
        if (!ObjectId.isValid(id)) {
            return { error: "Invalid form ID", success: false };
        }

        const collection = await database?.collection("concurrency_forms");
        const form = await collection.findOne({
            _id: new ObjectId(id),
            is_active: { $ne: false }
        });

        if (!form) {
            return { error: "Concurrency form not found", success: false };
        }

        return {
            ...form,
            _id: form._id.toString(),
            success: true
        };
    } catch (error: any) {
        console.error("Error fetching concurrency form:", error.message);
        return { error: error.message, success: false };
    }
};

export const getConcurrencyFormsByEmployee = async (employeeId: string) => {
    if (!dbConnection) await init();

    try {
        const collection = await database?.collection("concurrency_forms");
        const forms = await collection.find({
            employee_id: employeeId,
            is_active: { $ne: false }
        }).sort({ created_at: -1 }).toArray();

        return {
            forms: forms.map((form: any) => ({
                ...form,
                _id: form._id.toString()
            })),
            success: true
        };
    } catch (error: any) {
        console.error("Error fetching employee concurrency forms:", error.message);
        return { error: error.message, success: false };
    }
};

export const getAllConcurrencyForms = async (filters = {}) => {
    if (!dbConnection) await init();

    try {
        const collection = await database?.collection("concurrency_forms");
        const query = { is_active: { $ne: false }, ...filters };
        const forms = await collection.find(query).sort({ created_at: -1 }).toArray();

        return {
            forms: forms.map((form: any) => ({
                ...form,
                _id: form._id.toString()
            })),
            success: true
        };
    } catch (error: any) {
        console.error("Error fetching concurrency forms:", error.message);
        return { error: error.message, success: false };
    }
};

export const getConcurrencyFormStats = async (employeeId?: string) => {
    if (!dbConnection) await init();

    try {
        const collection = await database?.collection("concurrency_forms");

        // Create a properly typed query object
        const query: any = { is_active: { $ne: false } };
        if (employeeId) {
            query.employee_id = employeeId;
        }

        const forms = await collection.find(query).toArray();

        const stats = {
            total: forms.length,
            pending: forms.filter((f: any) => f.status === 'pending').length,
            submitted: forms.filter((f: any) => f.status === 'submitted').length,
            approved: forms.filter((f: any) => f.status === 'approved').length,
            rejected: forms.filter((f: any) => f.status === 'rejected').length,
            requires_revision: forms.filter((f: any) => f.status === 'requires_revision').length,
        };

        return {
            stats,
            success: true
        };
    } catch (error: any) {
        console.error("Error fetching concurrency stats:", error.message);
        return { error: error.message, success: false };
    }
};