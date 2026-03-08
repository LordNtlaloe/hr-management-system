"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface ConcurrencyFormProps {
    employee?: any;
    mode?: "create" | "edit";
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function ConcurrencyForm({
    employee,
    mode = "create",
    onSuccess,
    onCancel,
}: ConcurrencyFormProps) {
    const [formData, setFormData] = useState({
        from: "PS POLICE – IN THE MINISTRY OF LOCAL GOVERNMENT, CHIEFTAINSHIP, HOME AFFAIRS & POLICE",
        to: "PUBLIC SERVICE COMMISSION",
        ref: "",
        name: "",
        date: new Date().toISOString().split("T")[0],
        affectedOfficer: `${employee?.employee_details?.surname || ""} ${employee?.employee_details?.other_names || ""}`,
        confirmation: false,
        changeOfName: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting:", formData);
        onSuccess?.();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 p-4 md:p-6 border rounded-xl bg-white"
        >
            <h2 className="text-center font-bold text-lg underline mb-2">
                CONCURRENCE
            </h2>

            {/* Header fields */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="from">FROM</Label>
                    <Input
                        id="from"
                        name="from"
                        value={formData.from}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <Label htmlFor="to">TO</Label>
                    <Input
                        id="to"
                        name="to"
                        value={formData.to}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="ref">REF</Label>
                    <Input
                        id="ref"
                        name="ref"
                        value={formData.ref}
                        onChange={handleChange}
                        placeholder="LGCHAP/P/..."
                    />
                </div>
                <div>
                    <Label htmlFor="name">NAME (Typed)</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="THAKANE MASOPHA (MRS)"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="date">DATE</Label>
                <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                />
            </div>

            <hr />

            {/* Endorsement section */}
            <p className="text-sm font-semibold">
                ENDORSED BY THE HONOURABLE MINISTER RESPONSIBLE FOR LOCAL GOVERNMENT,
                CHIEFTAINSHIP, HOME AFFAIRS & POLICE IN CONNECTION WITH:
            </p>

            <div>
                <Label>Name of affected officer</Label>
                <Input
                    name="affectedOfficer"
                    value={formData.affectedOfficer}
                    onChange={handleChange}
                />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="confirmation"
                        checked={formData.confirmation}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, confirmation: !!checked }))
                        }
                    />
                    <Label htmlFor="confirmation" className="font-medium">
                        CONFIRMATION
                    </Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="changeOfName"
                        checked={formData.changeOfName}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, changeOfName: !!checked }))
                        }
                    />
                    <Label htmlFor="changeOfName" className="font-medium">
                        CHANGE OF NAME AND SURNAME
                    </Label>
                </div>
            </div>

            <hr />

            {/* Signature Section */}
            <div className="grid md:grid-cols-3 gap-4">
                <div>
                    <Label>Head of Department</Label>
                    <Input placeholder="Signature & Date" />
                </div>
                <div>
                    <Label>Principal Secretary</Label>
                    <Input placeholder="Signature & Date" />
                </div>
                <div>
                    <Label>Honourable Minister</Label>
                    <Input placeholder="Signature & Date" />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Submit</Button>
            </div>
        </form>
    );
}
