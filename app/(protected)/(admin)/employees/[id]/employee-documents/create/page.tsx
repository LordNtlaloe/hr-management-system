"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createEmployeeDocument } from "@/actions/employee.documents.actons"
import { getAllEmployees } from "@/actions/employee.actions"
import { Employee } from "@/types"

const FormSchema = z.object({
    employee_id: z.string().min(1, "Employee selection is required"),
    national_id: z.string().min(1, "National ID is required"),
})

type FormValues = z.infer<typeof FormSchema>

export default function EmployeeDocumentPage() {
    const router = useRouter()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({})
    const [fileValidationErrors, setFileValidationErrors] = useState<Record<string, string>>({})
    const [submitError, setSubmitError] = useState<string>("")
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            employee_id: "",
            national_id: "",
        }
    })

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const empResponse = await getAllEmployees()
                if (Array.isArray(empResponse)) {
                    setEmployees(empResponse)
                } else if (empResponse && !empResponse.error) {
                    setEmployees([])
                }
            } catch (error) {
                console.error("Error fetching employees:", error)
                toast.error("Failed to load employee data")
            }
        }
        fetchEmployees()
    }, [])

    const validateFileSize = (file: File): boolean => {
        const maxSize = 5 * 1024 * 1024 // 5MB
        return file.size <= maxSize
    }

    const validateFileType = (file: File, fieldName: string): boolean => {
        const allowedTypes = {
            passport_photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            academic_certificates: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
            police_clearance: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
            medical_certificate: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
            driver_license: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
            national_id: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
        }

        const allowed = allowedTypes[fieldName as keyof typeof allowedTypes] || []
        return allowed.includes(file.type)
    }

    const handleFileChange = (fieldName: string, files: FileList | null) => {
        if (!files || files.length === 0) return

        // Clear previous errors for this field
        setFileValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[fieldName]
            return newErrors
        })

        if (fieldName === 'academic_certificates') {
            // Handle multiple files
            const validFiles: File[] = []
            const previews: Record<string, string> = {}

            Array.from(files).forEach((file, index) => {
                if (!validateFileSize(file)) {
                    setFileValidationErrors(prev => ({
                        ...prev,
                        [fieldName]: "One or more files exceed 5MB limit"
                    }))
                    return
                }

                if (!validateFileType(file, fieldName)) {
                    setFileValidationErrors(prev => ({
                        ...prev,
                        [fieldName]: "Invalid file type. Only images and PDFs are allowed."
                    }))
                    return
                }

                validFiles.push(file)

                // Create preview
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        previews[`academic_cert_${index}`] = e.target?.result as string
                        setFilePreviews(prev => ({
                            ...prev,
                            ...previews
                        }))
                    }
                    reader.readAsDataURL(file)
                } else {
                    previews[`academic_cert_${index}`] = file.name
                    setFilePreviews(prev => ({
                        ...prev,
                        ...previews
                    }))
                }
            })
        } else {
            // Handle single file
            const file = files[0]

            if (!validateFileSize(file)) {
                setFileValidationErrors(prev => ({
                    ...prev,
                    [fieldName]: "File size must be less than 5MB"
                }))
                return
            }

            if (!validateFileType(file, fieldName)) {
                setFileValidationErrors(prev => ({
                    ...prev,
                    [fieldName]: "Invalid file type for this field"
                }))
                return
            }

            // Create preview
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setFilePreviews(prev => ({
                        ...prev,
                        [fieldName]: e.target?.result as string
                    }))
                }
                reader.readAsDataURL(file)
            } else {
                setFilePreviews(prev => ({
                    ...prev,
                    [fieldName]: file.name
                }))
            }
        }
    }

    const validateRequiredFiles = (): boolean => {
        const passportPhotoInput = document.getElementById('passport_photo_file') as HTMLInputElement
        const academicCertsInput = document.getElementById('academic_certificates_files') as HTMLInputElement

        let isValid = true
        const errors: Record<string, string> = {}

        // Check passport photo (required)
        if (!passportPhotoInput?.files?.[0]) {
            errors.passport_photo = "Passport photo is required"
            isValid = false
        }

        // Check academic certificates (at least one required)
        if (!academicCertsInput?.files?.length) {
            errors.academic_certificates = "At least one academic certificate is required"
            isValid = false
        }

        setFileValidationErrors(errors)
        return isValid
    }

    const onSubmit = async (values: FormValues) => {
        setSubmitError("")

        // Validate required files
        if (!validateRequiredFiles()) {
            const errorMsg = "Please upload all required documents"
            setSubmitError(errorMsg)
            toast.error(errorMsg)
            return
        }

        // Check for any file validation errors
        if (Object.keys(fileValidationErrors).length > 0) {
            const errorMsg = "Please fix file validation errors"
            setSubmitError(errorMsg)
            toast.error(errorMsg)
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()

            // Append form values
            formData.append('employee_id', values.employee_id)
            formData.append('national_id', values.national_id)

            // Append files
            const nationalIdInput = document.getElementById('national_id_file') as HTMLInputElement
            if (nationalIdInput?.files?.[0]) {
                formData.append('national_id_file', nationalIdInput.files[0])
            }

            const passportPhotoInput = document.getElementById('passport_photo_file') as HTMLInputElement
            if (passportPhotoInput?.files?.[0]) {
                formData.append('passport_photo_file', passportPhotoInput.files[0])
            }

            const academicCertsInput = document.getElementById('academic_certificates_files') as HTMLInputElement
            if (academicCertsInput?.files) {
                Array.from(academicCertsInput.files).forEach(file => {
                    formData.append('academic_certificates_files', file)
                })
            }

            const policeClearanceInput = document.getElementById('police_clearance_file') as HTMLInputElement
            if (policeClearanceInput?.files?.[0]) {
                formData.append('police_clearance_file', policeClearanceInput.files[0])
            }

            const medicalCertInput = document.getElementById('medical_certificate_file') as HTMLInputElement
            if (medicalCertInput?.files?.[0]) {
                formData.append('medical_certificate_file', medicalCertInput.files[0])
            }

            const driverLicenseInput = document.getElementById('driver_license_file') as HTMLInputElement
            if (driverLicenseInput?.files?.[0]) {
                formData.append('driver_license_file', driverLicenseInput.files[0])
            }

            const result = await createEmployeeDocument(formData)

            if (result.success) {
                toast.success(result.message || "Documents uploaded successfully")
                router.push(`/employees/${values.employee_id}/documents`)
            } else {
                const errorMsg = result.message || "Failed to upload documents"
                setSubmitError(errorMsg)
                toast.error(errorMsg)
            }
        } catch (error) {
            console.error("Error submitting documents:", error)
            const errorMsg = "An unexpected error occurred"
            setSubmitError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Upload Employee Documents</h1>
                <p className="text-sm text-muted-foreground">
                    Upload required documents for the employee. Passport photo and academic certificates are mandatory.
                </p>
            </div>

            {submitError && (
                <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
                    <p className="text-sm font-medium">{submitError}</p>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employee dropdown */}
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee</FormLabel>
                                        <FormControl>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between"
                                                        disabled={isSubmitting}
                                                        type="button"
                                                    >
                                                        {selectedEmployee
                                                            ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                                                            : "Select employee"}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-full">
                                                    {employees.map((employee) => (
                                                        <DropdownMenuItem
                                                            key={employee._id}
                                                            onClick={() => {
                                                                field.onChange(employee._id)
                                                                setSelectedEmployee(employee)
                                                            }}
                                                        >
                                                            {employee.first_name} {employee.last_name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* National ID */}
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="national_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>National ID Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter national ID number"
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* National ID File */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>National ID Document</FormLabel>
                                <FormControl>
                                    <Input
                                        id="national_id_file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(e) => handleFileChange('national_id', e.target.files)}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                {filePreviews.national_id && (
                                    <div className="mt-2">
                                        {filePreviews.national_id.startsWith('data:image') ? (
                                            <img
                                                src={filePreviews.national_id}
                                                alt="National ID preview"
                                                className="h-20 w-auto object-contain"
                                            />
                                        ) : (
                                            <p className="text-sm">{filePreviews.national_id}</p>
                                        )}
                                    </div>
                                )}
                                {fileValidationErrors.national_id && (
                                    <p className="text-sm text-destructive">{fileValidationErrors.national_id}</p>
                                )}
                            </FormItem>
                        </div>

                        {/* Passport Photo */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Passport Photo (Required)</FormLabel>
                                <FormControl>
                                    <Input
                                        id="passport_photo_file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={(e) => handleFileChange('passport_photo', e.target.files)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </FormControl>
                                {filePreviews.passport_photo && (
                                    <div className="mt-2">
                                        <img
                                            src={filePreviews.passport_photo}
                                            alt="Passport photo preview"
                                            className="h-20 w-auto object-contain"
                                        />
                                    </div>
                                )}
                                {fileValidationErrors.passport_photo && (
                                    <p className="text-sm text-destructive">{fileValidationErrors.passport_photo}</p>
                                )}
                            </FormItem>
                        </div>

                        {/* Academic Certificates */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Academic Certificates (Required)</FormLabel>
                                <FormControl>
                                    <Input
                                        id="academic_certificates_files"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        multiple
                                        onChange={(e) => handleFileChange('academic_certificates', e.target.files)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </FormControl>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {Object.entries(filePreviews)
                                        .filter(([key]) => key.startsWith('academic_cert_'))
                                        .map(([key, preview]) => (
                                            preview.startsWith('data:image') ? (
                                                <img
                                                    key={key}
                                                    src={preview}
                                                    alt="Academic certificate preview"
                                                    className="h-20 w-auto object-contain"
                                                />
                                            ) : (
                                                <p key={key} className="text-sm">{preview}</p>
                                            )
                                        ))}
                                </div>
                                {fileValidationErrors.academic_certificates && (
                                    <p className="text-sm text-destructive">{fileValidationErrors.academic_certificates}</p>
                                )}
                            </FormItem>
                        </div>

                        {/* Police Clearance */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Police Clearance Certificate</FormLabel>
                                <FormControl>
                                    <Input
                                        id="police_clearance_file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(e) => handleFileChange('police_clearance', e.target.files)}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                {filePreviews.police_clearance && (
                                    <div className="mt-2">
                                        {filePreviews.police_clearance.startsWith('data:image') ? (
                                            <img
                                                src={filePreviews.police_clearance}
                                                alt="Police clearance preview"
                                                className="h-20 w-auto object-contain"
                                            />
                                        ) : (
                                            <p className="text-sm">{filePreviews.police_clearance}</p>
                                        )}
                                    </div>
                                )}
                                {fileValidationErrors.police_clearance && (
                                    <p className="text-sm text-destructive">{fileValidationErrors.police_clearance}</p>
                                )}
                            </FormItem>
                        </div>

                        {/* Medical Certificate */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Medical Certificate</FormLabel>
                                <FormControl>
                                    <Input
                                        id="medical_certificate_file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(e) => handleFileChange('medical_certificate', e.target.files)}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                {filePreviews.medical_certificate && (
                                    <div className="mt-2">
                                        {filePreviews.medical_certificate.startsWith('data:image') ? (
                                            <img
                                                src={filePreviews.medical_certificate}
                                                alt="Medical certificate preview"
                                                className="h-20 w-auto object-contain"
                                            />
                                        ) : (
                                            <p className="text-sm">{filePreviews.medical_certificate}</p>
                                        )}
                                    </div>
                                )}
                                {fileValidationErrors.medical_certificate && (
                                    <p className="text-sm text-destructive">{fileValidationErrors.medical_certificate}</p>
                                )}
                            </FormItem>
                        </div>

                        {/* Driver License */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Driver's License</FormLabel>
                                <FormControl>
                                    <Input
                                        id="driver_license_file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(e) => handleFileChange('driver_license', e.target.files)}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                {filePreviews.driver_license && (
                                    <div className="mt-2">
                                        {filePreviews.driver_license.startsWith('data:image') ? (
                                            <img
                                                src={filePreviews.driver_license}
                                                alt="Driver license preview"
                                                className="h-20 w-auto object-contain"
                                            />
                                        ) : (
                                            <p className="text-sm">{filePreviews.driver_license}</p>
                                        )}
                                    </div>
                                )}
                                {fileValidationErrors.driver_license && (
                                    <p className="text-sm text-destructive">{fileValidationErrors.driver_license}</p>
                                )}
                            </FormItem>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Uploading..." : "Upload Documents"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}