// components/dashboard/concurrency/concurrency-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import {
  createConcurrencyForm,
  updateConcurrencyForm,
  submitConcurrencyForm,
} from "@/actions/concurrency.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Save,
  Send,
  Building,
  AlertTriangle,
  Gift,
  FileText,
  X,
} from "lucide-react";
import type { ConcurrencyFormState } from "@/types";

interface ConcurrencyFormProps {
  employee?: any;
  form?: any;
  mode?: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
  isDialog?: boolean;
}

const initialState: ConcurrencyFormState = {
  success: false,
  message: "",
  error: "",
  insertedId: undefined,
  modifiedCount: undefined,
};

export default function ConcurrencyForm({
  employee,
  form,
  mode = "create",
  onSuccess,
  onCancel,
  isDialog = false,
}: ConcurrencyFormProps) {
  const [state, formAction] = useFormState(
    mode === "create" ? createConcurrencyForm : updateConcurrencyForm,
    initialState
  );

  const [hasOutsideEmployment, setHasOutsideEmployment] = useState(
    form?.outside_employment?.has_outside_employment || false
  );
  const [hasConflict, setHasConflict] = useState(
    form?.conflict_of_interest?.has_conflict || false
  );
  const [receivedGifts, setReceivedGifts] = useState(
    form?.gifts_benefits?.received_gifts || false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission with proper typing
  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    // Add form_id for update mode
    if (mode === "edit" && form?._id) {
      formData.append("form_id", form._id);
    }
    formAction(formData);
  };

  const handleFinalSubmit = async () => {
    if (!form?._id) return;

    setIsSubmitting(true);
    try {
      const result = await submitConcurrencyForm(form._id);
      if (result.success) {
        alert(result.message);
        onSuccess?.();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (state.success && state.message) {
      alert(state.message);
      if (mode === "create" && state.insertedId) {
        // If in dialog, close it on success
        if (isDialog) {
          onSuccess?.();
        } else {
          window.location.href = `/concurrency/${state.insertedId}/edit`;
        }
      }
      setIsSubmitting(false);
    } else if (state.error) {
      alert(state.error);
      setIsSubmitting(false);
    }
  }, [state, mode, isDialog, onSuccess]);

  return (
    <div className="space-y-6">
      {/* Header for dialog mode */}
      {isDialog && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Declaration of Concurrency / Conflict of Interest
            </h2>
            <p className="text-muted-foreground mt-1">
              Please complete this form to declare any potential conflicts of interest or concurrent employment.
            </p>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Header for non-dialog mode */}
      {!isDialog && (
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Declaration of Concurrency / Conflict of Interest
          </h1>
          <p className="text-muted-foreground">
            Please complete this form to declare any potential conflicts of interest or concurrent employment.
          </p>
          {form?.status && (
            <Badge
              variant={
                form.status === "approved"
                  ? "default"
                  : form.status === "rejected"
                  ? "destructive"
                  : form.status === "pending"
                  ? "secondary"
                  : "outline"
              }
            >
              {form.status.toUpperCase()}
            </Badge>
          )}
        </div>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && state.message && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic employment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={
                    form?.personal_info?.full_name ||
                    `${employee?.employee_details?.surname} ${employee?.employee_details?.other_names}`
                  }
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={form?.personal_info?.position}
                  required
                  placeholder="Your current position"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  name="department"
                  defaultValue={form?.personal_info?.department}
                  required
                  placeholder="Your department"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  defaultValue={
                    form?.personal_info?.employee_id || employee?._id
                  }
                  required
                  placeholder="Your employee ID"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rest of your form components remain the same */}
        {/* ... */}

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onCancel || (() => window.history.back())}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {mode === "create" ? "Save Draft" : "Update Form"}
              </Button>

              {mode === "edit" && form?.status === "pending" && (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit for Review
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}