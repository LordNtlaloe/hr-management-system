// components/forms/employee-details-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeDetailsSchema, EmployeeDetailsFormValues } from "@/schemas";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AddressFields } from "./sections/address-fields";
import { EmergencyContactFields } from "./sections/emergency-contact";
import { BankingInfoFields } from "./sections/banking-details";
import { AdditionalInfoFields } from "./sections/additional-info";

interface EmployeeDetailsFormProps {
  onSubmit: (data: Partial<EmployeeDetailsFormValues>) => void;
  onBack: () => void;
  loading: boolean;
}

export function EmployeeDetailsForm({
  onSubmit,
  onBack,
  loading,
}: EmployeeDetailsFormProps) {
  const form = useForm<Partial<EmployeeDetailsFormValues>>({
    resolver: zodResolver(EmployeeDetailsSchema.partial()),
    defaultValues: {
      address: {
        country: "",
        city_state: "",
        postal_code: "",
        street_address: "",
        tax_id: "",
      },
      emergency_contact: {
        name: "",
        relationship: "",
        phone: "",
        email: "",
        address: "",
      },
      banking_info: {
        bank_name: "",
        account_number: "",
        routing_number: "",
        account_type: "checking",
      },
      additional_info: {
        marital_status: "single",
        spouse_name: "",
        children_count: 0,
        next_of_kin: "",
        medical_conditions: "",
        allergies: "",
        notes: "",
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Employee Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AddressFields control={form.control} />
            <EmergencyContactFields control={form.control} />
            <BankingInfoFields control={form.control} />
            <AdditionalInfoFields control={form.control} />

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={onBack}>
                Back to Basic Info
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
