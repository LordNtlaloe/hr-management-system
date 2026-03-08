"use server"

import { connectToDB } from "@/lib/db"
import { ObjectId } from "mongodb"
import { v2 as cloudinary } from 'cloudinary'
import { EmployeeDocumentSchema } from "@/schemas"
import { z } from "zod"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
    secure: true
})

let dbConnection: any
let database: any

const init = async () => {
    try {
        const connection = await connectToDB()
        dbConnection = connection
        database = await dbConnection?.db("hr_management_db")
    } catch (error) {
        console.error("Database connection failed:", error)
        throw error
    }
}

async function uploadToCloudinary(file: File): Promise<string | null> {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'employee-documents',
                    resource_type: 'auto',
                    allowed_formats: ['jpg', 'png', 'webp', 'pdf', 'doc', 'docx'],
                    transformation: [
                        { width: 1200, height: 1200, crop: "limit" },
                        { quality: "auto" }
                    ]
                },
                (error, result) => {
                    if (error || !result) {
                        console.error('Cloudinary upload error:', error)
                        reject(error || new Error('Upload failed'))
                        return
                    }
                    resolve(result.secure_url)
                }
            )

            uploadStream.end(buffer)
        })
    } catch (error) {
        console.error('Error processing file upload:', error)
        return null
    }
}

export const createEmployeeDocument = async (formData: FormData) => {
    if (!dbConnection) await init()

    try {
        // Extract form data
        const employee_id = formData.get('employee_id') as string
        const national_id_number = formData.get('national_id') as string

        if (!employee_id) {
            return { error: "Employee ID is required" }
        }

        if (!national_id_number) {
            return { error: "National ID number is required" }
        }

        // Handle file uploads
        const nationalIdFile = formData.get('national_id_file') as File | null
        const passportPhotoFile = formData.get('passport_photo_file') as File | null
        const academicCertificates = formData.getAll('academic_certificates_files') as File[]
        const policeClearanceFile = formData.get('police_clearance_file') as File | null
        const medicalCertificateFile = formData.get('medical_certificate_file') as File | null
        const driverLicenseFile = formData.get('driver_license_file') as File | null

        // Validate required files
        if (!passportPhotoFile || passportPhotoFile.size === 0) {
            return { error: "Passport photo is required" }
        }

        if (!academicCertificates.length || academicCertificates.every(f => f.size === 0)) {
            return { error: "At least one academic certificate is required" }
        }

        // Upload files to Cloudinary
        const uploadPromises: Promise<string | null>[] = []
        const fileTypes: string[] = []

        // National ID (optional)
        if (nationalIdFile && nationalIdFile.size > 0) {
            uploadPromises.push(uploadToCloudinary(nationalIdFile))
            fileTypes.push('national_id')
        }

        // Passport Photo (required)
        uploadPromises.push(uploadToCloudinary(passportPhotoFile))
        fileTypes.push('passport_photo')

        // Academic Certificates (required, multiple)
        const validAcademicCerts = academicCertificates.filter(f => f.size > 0)
        for (const cert of validAcademicCerts) {
            uploadPromises.push(uploadToCloudinary(cert))
            fileTypes.push('academic_certificate')
        }

        // Optional documents
        if (policeClearanceFile && policeClearanceFile.size > 0) {
            uploadPromises.push(uploadToCloudinary(policeClearanceFile))
            fileTypes.push('police_clearance')
        }

        if (medicalCertificateFile && medicalCertificateFile.size > 0) {
            uploadPromises.push(uploadToCloudinary(medicalCertificateFile))
            fileTypes.push('medical_certificate')
        }

        if (driverLicenseFile && driverLicenseFile.size > 0) {
            uploadPromises.push(uploadToCloudinary(driverLicenseFile))
            fileTypes.push('driver_license')
        }

        // Wait for all uploads to complete
        const uploadResults = await Promise.all(uploadPromises)

        // Process upload results
        let national_id_url = ""
        let passport_photo_url = ""
        const academic_certificates_urls: string[] = []
        let police_clearance_url = ""
        let medical_certificate_url = ""
        let driver_license_url = ""

        let resultIndex = 0
        for (let i = 0; i < fileTypes.length; i++) {
            const result = uploadResults[resultIndex]
            if (!result) {
                return { error: `Failed to upload ${fileTypes[i]} file` }
            }

            switch (fileTypes[i]) {
                case 'national_id':
                    national_id_url = result
                    break
                case 'passport_photo':
                    passport_photo_url = result
                    break
                case 'academic_certificate':
                    academic_certificates_urls.push(result)
                    break
                case 'police_clearance':
                    police_clearance_url = result
                    break
                case 'medical_certificate':
                    medical_certificate_url = result
                    break
                case 'driver_license':
                    driver_license_url = result
                    break
            }
            resultIndex++
        }

        // Prepare document data
        const documentData = {
            employee_id: new ObjectId(employee_id),
            national_id: national_id_number,
            national_id_document: national_id_url || "",
            passport_photo: passport_photo_url,
            academic_certificates: academic_certificates_urls,
            police_clearance: police_clearance_url || "",
            medical_certificate: medical_certificate_url || "",
            driver_license: driver_license_url || "",
            uploaded_at: new Date(),
            is_active: true
        }

        // Validate the final data structure
        const validated = EmployeeDocumentSchema.parse({
            employee_id: employee_id,
            national_id: national_id_number,
            passport_photo: passport_photo_url,
            academic_certificates: academic_certificates_urls,
            police_clearance: police_clearance_url,
            medical_certificate: medical_certificate_url,
            driver_license: driver_license_url,
        })

        // Save to database
        const collection = await database.collection("employee_documents")

        // Check if documents already exist for this employee
        const existingDocument = await collection.findOne({
            employee_id: new ObjectId(employee_id),
            is_active: true
        })

        let result
        if (existingDocument) {
            // Update existing document
            result = await collection.updateOne(
                { employee_id: new ObjectId(employee_id), is_active: true },
                {
                    $set: {
                        ...documentData,
                        updated_at: new Date()
                    }
                }
            )
            return {
                success: true,
                message: "Employee documents updated successfully",
                documentId: existingDocument._id.toString()
            }
        } else {
            // Create new document record
            result = await collection.insertOne(documentData)
            return {
                insertedId: result.insertedId.toString(),
                success: true,
                message: "Employee documents uploaded successfully"
            }
        }
    } catch (error: any) {
        console.error("Error saving document:", error)

        // Handle validation errors
        if (error.name === 'ZodError') {
            const validationErrors = error.errors.map((err: any) =>
                `${err.path.join('.')}: ${err.message}`
            ).join(', ')
            return {
                error: `Validation error: ${validationErrors}`,
                details: process.env.NODE_ENV === 'development' ? error.errors : undefined
            }
        }

        return {
            error: error.message || "An unexpected error occurred",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
    }
}

export const getEmployeeDocumentById = async (id: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const document = await collection.findOne({ _id: new ObjectId(id) })
        return document ? {
            ...document,
            _id: document._id.toString(),
            employee_id: document.employee_id.toString()
        } : null
    } catch (error: any) {
        console.error("Error fetching employee document:", error.message)
        return { error: error.message }
    }
}

export const getEmployeeDocuments = async (employeeId: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const documents = await collection.find({
            employee_id: new ObjectId(employeeId),
            is_active: true
        }).toArray()

        return documents.map((doc: any) => ({
            ...doc,
            _id: doc._id.toString(),
            employee_id: doc.employee_id.toString()
        }))
    } catch (error: any) {
        console.error("Error fetching employee documents:", error.message)
        return { error: error.message }
    }
}

export const updateEmployeeDocument = async (id: string, updateData: Partial<z.infer<typeof EmployeeDocumentSchema>>) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updateData,
                    updated_at: new Date()
                }
            }
        )
        return { modifiedCount: result.modifiedCount, success: true }
    } catch (error: any) {
        console.error("Error updating employee document:", error.message)
        return { error: error.message }
    }
}

export const deleteEmployeeDocument = async (id: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    is_active: false,
                    deleted_at: new Date()
                }
            }
        )
        return { modifiedCount: result.modifiedCount, success: true }
    } catch (error: any) {
        console.error("Error deleting employee document:", error.message)
        return { error: error.message }
    }
}


export const getAllEmployeeDocuments = async (employeeId: string, includeInactive = false) => {
    if (!dbConnection) await init();

    try {
        const documentsCollection = await database?.collection("employee_documents");
        const employeesCollection = await database?.collection("employees");
        
        if (!database || !documentsCollection || !employeesCollection) {
            throw new Error("Failed to connect to database collections");
        }

        // Validate employeeId format
        if (!ObjectId.isValid(employeeId)) {
            throw new Error("Invalid employee ID format");
        }

        const documents = await documentsCollection.aggregate([
            {
                $match: {
                    employee_id: new ObjectId(employeeId),
                    ...(!includeInactive && { is_active: { $ne: false } })
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "employee_id",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    employee_name: {
                        $cond: {
                            if: "$employee",
                            then: { $concat: ["$employee.first_name", " ", "$employee.last_name"] },
                            else: "Unknown Employee"
                        }
                    },
                    // Ensure dates are properly formatted
                    created_at: {
                        $cond: {
                            if: { $ne: ["$created_at", null] },
                            then: "$created_at",
                            else: new Date()
                        }
                    },
                    updated_at: {
                        $cond: {
                            if: { $ne: ["$updated_at", null] },
                            then: "$updated_at",
                            else: null
                        }
                    }
                }
            }
        ]).toArray();

        // Convert to plain objects with proper serialization
        return documents.map((doc: any) => {
            const convertedDoc = {
                ...doc,
                _id: doc._id?.toString() || '',
                employee_id: doc.employee_id?.toString() || employeeId,
                // Convert dates to ISO strings
                created_at: doc.created_at?.toISOString?.() || new Date().toISOString(),
                updated_at: doc.updated_at?.toISOString?.() || null,
                // Handle all document fields
                national_id: doc.national_id || '',
                passport_photo: doc.passport_photo || null,
                academic_certificates: doc.academic_certificates || [],
                police_clearance: doc.police_clearance || null,
                medical_certificate: doc.medical_certificate || null,
                driver_license: doc.driver_license || null,
                is_active: doc.is_active ?? true,
                // Ensure employee_name is included
                employee_name: doc.employee_name || 'Unknown Employee'
            };

            // Remove temporary fields
            delete convertedDoc.employee;
            
            return convertedDoc;
        });

    } catch (error: any) {
        console.error("Error fetching employee documents:", error.message);
        return { 
            error: error.message,
            statusCode: error instanceof Error && error.message.includes("Invalid") ? 400 : 500
        };
    }
};


export const getDocumentsByType = async (employeeId: string, documentType: string, includeInactive = false) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const filter: any = {
            employee_id: new ObjectId(employeeId),
            document_type: documentType
        }
        if (!includeInactive) {
            filter.is_active = { $ne: false }
        }
        const documents = await collection.find(filter).toArray()
        return documents.map((doc: any) => ({
            ...doc,
            _id: doc._id.toString(),
            employee_id: doc.employee_id.toString()
        }))
    } catch (error: any) {
        console.error("Error fetching documents by type:", error.message)
        return { error: error.message }
    }
}

export const getDocumentsByEmployeeId = async (employeeId: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const filter: any = {
            employee_id: new ObjectId(employeeId),
        }

        const documents = await collection.find(filter).toArray()
        return documents.map((doc: any) => ({
            ...doc,
            _id: doc._id.toString(),
            employee_id: doc.employee_id.toString()
        }))
    } catch (error: any) {
        console.error("Error fetching documents by type:", error.message)
        return { error: error.message }
    }
}

export const getActiveDocumentTypesForEmployee = async (employeeId: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const result = await collection.aggregate([
            {
                $match: {
                    employee_id: new ObjectId(employeeId),
                    is_active: true
                }
            },
            {
                $group: {
                    _id: "$document_type"
                }
            }
        ]).toArray()

        return result.map((item: any) => item._id)
    } catch (error: any) {
        console.error("Error fetching active document types:", error.message)
        return { error: error.message }
    }
}

export const validateEmployeeDocuments = async (employeeId: string) => {
    if (!dbConnection) await init()
    try {
        const collection = await database?.collection("employee_documents")
        const documents = await collection.findOne({
            employee_id: new ObjectId(employeeId),
            is_active: true
        })

        if (!documents) {
            return {
                isValid: false,
                missing: ['passport_photo', 'academic_certificates'],
                message: "No documents found for this employee"
            }
        }

        const missing = []
        if (!documents.passport_photo) missing.push('passport_photo')
        if (!documents.academic_certificates || documents.academic_certificates.length === 0) {
            missing.push('academic_certificates')
        }

        return {
            isValid: missing.length === 0,
            missing,
            message: missing.length === 0 ? "All required documents are present" : `Missing: ${missing.join(', ')}`
        }
    } catch (error: any) {
        console.error("Error validating employee documents:", error.message)
        return { error: error.message }
    }
}

export const getAllDocuments = async () => {
    if (!dbConnection) await init();

    try {
        const documentsCollection = await database?.collection("employee_documents");
        const employeesCollection = await database?.collection("employees");

        if (!database || !documentsCollection || !employeesCollection) {
            return { error: "Failed to connect to database" };
        }

        const documents = await documentsCollection.aggregate([
            {
                $lookup: {
                    from: "employees",
                    localField: "employee_id",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true // Handle cases where employee might not exist
                }
            },
            {
                $addFields: {
                    employee_name: {
                        $cond: {
                            if: "$employee",
                            then: { $concat: ["$employee.first_name", " ", "$employee.last_name"] },
                            else: "Unknown Employee"
                        }
                    }
                }
            }
        ]).toArray();

        // Convert MongoDB documents to plain objects with proper null checks
        return documents.map((doc: any) => {
            const convertedDoc: any = {
                ...doc,
                _id: doc._id?.toString() || '', // Handle potential undefined _id
                employee_id: doc.employee_id?.toString() || '', // Handle potential undefined employee_id
                employee_name: doc.employee_name || 'Unknown Employee',
                created_at: doc.created_at?.toISOString() || new Date().toISOString(), // Default to now if missing
                updated_at: doc.updated_at?.toISOString() || null, // Set to null if missing
                // Handle all other fields with proper defaults
                national_id: doc.national_id || '',
                passport_photo: doc.passport_photo || null,
                academic_certificates: doc.academic_certificates || [],
                police_clearance: doc.police_clearance || null,
                medical_certificate: doc.medical_certificate || null,
                driver_license: doc.driver_license || null
            };

            // Remove the nested employee object if it exists
            if (convertedDoc.employee) {
                delete convertedDoc.employee;
            }

            return convertedDoc;
        });
    } catch (error: any) {
        console.error("Error fetching documents:", error.message);
        return { error: error.message };
    }
};