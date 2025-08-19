"use client";
import React, { useEffect } from "react";
import { useModal } from "@/hooks/use-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { getEmployeeById } from "@/actions/employee.actions";
import { FileIcon, FileText, ImageIcon } from "lucide-react";
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { getAllEmployeeDocuments } from "@/actions/employee.documents.actons";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface EmployeeProfileCardProps {
    employeeId: string;
}

interface Employee {
    _id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    image?: string;
}

interface EmployeeDocument {
    _id: string;
    name: string;
    type: string;
    url: string;
    uploaded_at: string;
}

export default function EmployeeProfileCard({ employeeId }: EmployeeProfileCardProps) {
    const { isOpen, openModal, closeModal } = useModal();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [documents, setDocuments] = React.useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [numPages, setNumPages] = React.useState<number | null>(null);

    // Update the documents fetching part of your component
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch employee data
                const employeeResponse = await getEmployeeById(employeeId);
                if (employeeResponse.error) {
                    console.error(employeeResponse.error);
                    return;
                }
                setEmployee(employeeResponse);

                // Fetch employee documents
                const documentsResponse = await getAllEmployeeDocuments(employeeId);
                if (Array.isArray(documentsResponse)) {
                    // Filter out documents without URLs
                    const validDocs = documentsResponse.filter(doc => doc.url);
                    setDocuments(validDocs);
                } else {
                    console.error(documentsResponse?.error || "Failed to fetch documents");
                    setDocuments([]); // Ensure empty array on error
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setDocuments([]); // Ensure empty array on error
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [employeeId]);
    const handleSave = () => {
        // Handle save logic here
        console.log("Saving changes...");
        closeModal();
    };

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="w-5 h-5" />;
        if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
        return <FileIcon className="w-5 h-5" />;
    };

    const handlePreview = (url: string, type: string) => {
        if (type.includes('image') || type.includes('pdf')) {
            setPreviewUrl(url);
        } else {
            window.open(url, '_blank');
        }
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    if (loading) return <div className="p-5">Loading employee data...</div>;
    if (!employee) return <div className="p-5">Employee not found</div>;

    return (
        <>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-[#121212] lg:p-6 dark:bg-[#0D0D0D]">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-[#121212]">
                            <Image
                                width={80}
                                height={80}
                                src={employee?.image || "/images/user/owner.jpg"}
                                alt="employee"
                                className="object-cover"
                            />
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                {`${employee.first_name} ${employee.last_name}`}
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {employee.position || "Position not set"}
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {employee.department || "Department not set"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Employee ID: {employee.employee_id}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={openModal}
                        variant="outline"
                        className="flex w-full items-center justify-center gap-2 lg:inline-flex lg:w-auto"
                    >
                        Edit
                    </Button>
                </div>
            </div>

            {/* Documents Section */}
            <div className="p-5 mt-6 border border-gray-200 rounded-2xl dark:border-[#121212] lg:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                    Employee Documents
                </h3>

                {documents.length === 0 ? (
                    <p className="text-gray-500">No documents found</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {documents.map((doc) => (
                            <div
                                key={doc._id}
                                className="p-4 border border-gray-200 rounded-lg dark:border-[#121212] hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handlePreview(doc.url, doc.type)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {getFileIcon(doc.type)}
                                    <h4 className="font-medium text-gray-800 dark:text-white/90 truncate">
                                        {doc.name}
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {doc.type}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} className="max-w-4xl">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg max-h-[80vh] overflow-auto">
                        {previewUrl.includes('.pdf') ? (
                            <Document
                                file={previewUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                            >
                                {Array.from(new Array(numPages), (el, index) => (
                                    <Page
                                        key={`page_${index + 1}`}
                                        pageNumber={index + 1}
                                        width={800}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                ))}
                            </Document>
                        ) : (
                            <Image
                                src={previewUrl}
                                alt="Document preview"
                                width={800}
                                height={600}
                                className="object-contain mx-auto"
                            />
                        )}
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setPreviewUrl(null)}>
                                Close Preview
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Employee Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Employee Information
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update employee details.
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="mt-7">
                                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                    Employee Information
                                </h5>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            type="text"
                                            defaultValue={employee.first_name}
                                            id="firstName"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            type="text"
                                            defaultValue={employee.last_name}
                                            id="lastName"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            type="text"
                                            defaultValue={employee.email || ""}
                                            id="email"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            type="text"
                                            defaultValue={employee.phone || ""}
                                            id="phone"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label htmlFor="position">Position</Label>
                                        <Input
                                            type="text"
                                            defaultValue={employee.position || ""}
                                            id="position"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            type="text"
                                            defaultValue={employee.department || ""}
                                            id="department"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}