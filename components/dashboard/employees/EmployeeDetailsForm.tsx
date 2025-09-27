"use client";

import { useFormContext, Controller } from "react-hook-form";
import { EmployeeFormValues, EmployeeDetailsFormValues } from "@/schemas";

export default function EmployeeDetailsForm() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();

  const isCitizen = watch("employee_details.is_citizen");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Employee Details</h2>

      <div>
        <label className="block font-medium">Surname</label>
        <input
          type="text"
          {...register("employee_details.surname")}
          className="border p-2 w-full rounded"
        />
        {errors.employee_details?.surname && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.surname.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium">Other Names</label>
        <input
          type="text"
          {...register("employee_details.other_names")}
          className="border p-2 w-full rounded"
        />
        {errors.employee_details?.other_names && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.other_names.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium">Current Address</label>
        <input
          type="text"
          {...register("employee_details.current_address")}
          className="border p-2 w-full rounded"
        />
        {errors.employee_details?.current_address && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.current_address.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium">Date of Birth</label>
        <input
          type="date"
          {...register("employee_details.date_of_birth")}
          className="border p-2 w-full rounded"
        />
        {errors.employee_details?.date_of_birth && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.date_of_birth.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium">Age</label>
        <input
          type="number"
          {...register("employee_details.age", { valueAsNumber: true })}
          className="border p-2 w-full rounded"
        />
        {errors.employee_details?.age && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.age.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium">Gender</label>
        <select
          {...register("employee_details.gender")}
          className="border p-2 w-full rounded"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.employee_details?.gender && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.gender.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium">Place of Birth</label>
        <input
          type="text"
          {...register("employee_details.place_of_birth")}
          className="border p-2 w-full rounded"
        />
        {errors.employee_details?.place_of_birth && (
          <p className="text-red-500 text-sm">
            {errors.employee_details.place_of_birth.message}
          </p>
        )}
      </div>

      {/* Citizenship Section */}
      <div className="mt-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            {...register("employee_details.is_citizen")}
            className="mr-2"
          />
          Is Citizen
        </label>
      </div>

      {isCitizen ? (
        <div className="space-y-2 mt-2">
          <div>
            <label>Chief's Name</label>
            <input
              type="text"
              {...register("employee_details.citizen_info.chief_name")}
              className="border p-2 w-full rounded"
            />
            {errors.employee_details?.citizen_info?.chief_name && (
              <p className="text-red-500 text-sm">
                {errors.employee_details.citizen_info.chief_name.message}
              </p>
            )}
          </div>
          <div>
            <label>District</label>
            <input
              type="text"
              {...register("employee_details.citizen_info.district")}
              className="border p-2 w-full rounded"
            />
            {errors.employee_details?.citizen_info?.district && (
              <p className="text-red-500 text-sm">
                {errors.employee_details.citizen_info.district.message}
              </p>
            )}
          </div>
          <div>
            <label>Tax ID</label>
            <input
              type="text"
              {...register("employee_details.citizen_info.tax_id")}
              className="border p-2 w-full rounded"
            />
            {errors.employee_details?.citizen_info?.tax_id && (
              <p className="text-red-500 text-sm">
                {errors.employee_details.citizen_info.tax_id.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          <div>
            <label>Certificate Number</label>
            <input
              type="text"
              {...register(
                "employee_details.non_citizen_info.certificate_number"
              )}
              className="border p-2 w-full rounded"
            />
            {errors.employee_details?.non_citizen_info?.certificate_number && (
              <p className="text-red-500 text-sm">
                {
                  errors.employee_details.non_citizen_info.certificate_number
                    .message
                }
              </p>
            )}
          </div>
          <div>
            <label>Date of Issue</label>
            <input
              type="date"
              {...register("employee_details.non_citizen_info.date_of_issue")}
              className="border p-2 w-full rounded"
            />
            {errors.employee_details?.non_citizen_info?.date_of_issue && (
              <p className="text-red-500 text-sm">
                {errors.employee_details.non_citizen_info.date_of_issue.message}
              </p>
            )}
          </div>
          <div>
            <label>Present Nationality</label>
            <input
              type="text"
              {...register(
                "employee_details.non_citizen_info.present_nationality"
              )}
              className="border p-2 w-full rounded"
            />
            {errors.employee_details?.non_citizen_info?.present_nationality && (
              <p className="text-red-500 text-sm">
                {
                  errors.employee_details.non_citizen_info.present_nationality
                    .message
                }
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
