"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "@/hooks/use-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { getEmployeeById } from "@/actions/employee.actions";
import { getSectionById } from "@/actions/section.actions";
import { getPositionById } from "@/actions/position.actions";
import { Employee, Section, Position } from "@/types";

interface EmployeeProfileCardProps {
    employeeId: string;
}

export default function EmployeeProfileCard({ employeeId }: EmployeeProfileCardProps) {
    const { isOpen, openModal, closeModal } = useModal();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [section, setsection] = useState<Section | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);

            // Fetch employee data
            const employeeResponse = await getEmployeeById(employeeId);
            if (employeeResponse.error) {
                console.error(employeeResponse.error);
                return;
            }
            setEmployee(employeeResponse);

            // Fetch section data if employee has section_id
            if (employeeResponse.section_id) {
                const sectionId = typeof employeeResponse.section_id === 'string'
                    ? employeeResponse.section_id
                    : employeeResponse.section_id._id;

                const sectionResponse = await getSectionById(sectionId);
                setsection(sectionResponse);
            }

            // Fetch position data if employee has position_id
            if (employeeResponse.position_id) {
                const positionId = typeof employeeResponse.position_id === 'string'
                    ? employeeResponse.position_id
                    : employeeResponse.position_id._id;

                const positionResponse = await getPositionById(positionId);
                setPosition(positionResponse);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
    }, [employeeId]);

    const handleSave = () => {
        // Handle save logic here
        console.log("Saving changes...");
        closeModal();
    };

    const getsectionName = () => {
        if (section) return section.section_name;
        if (employee && typeof employee.section_id === 'object') return employee.section_id;
        return "Section not set";
    };

    const getPositionName = () => {
        if (position) return position.position_title;
        if (employee && typeof employee.position_id === 'object') return employee.position_id;
        return "Position not set";
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
                                src={employee?.image || "https://avatar.iran.liara.run/public"}
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
                                    {getPositionName()}
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {getsectionName()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Employee ID: {employee._id}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={openModal}
                        variant="outline"
                        className="w-full lg:w-auto"
                    >
                        Edit
                    </Button>
                </div>
            </div>

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
                                    <div className="col-span-2 lg:col-span-1 space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            type="text"
                                            defaultValue={employee.first_name}
                                            name="firstName"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            defaultValue={employee.last_name}
                                            name="lastName"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            defaultValue={employee.email || ""}
                                            name="email"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            defaultValue={employee.phone || ""}
                                            name="phone"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 space-y-2">
                                        <Label htmlFor="position">Position</Label>
                                        <Input
                                            id="position"
                                            type="text"
                                            defaultValue={getPositionName()}
                                            name="position"
                                        />
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 space-y-2">
                                        <Label htmlFor="section">Section</Label>
                                        <Input
                                            id="section"
                                            type="text"
                                            defaultValue={getsectionName()}
                                            name="section"
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