"use client";

import { useFormContext } from "react-hook-form";
import { EmployeeFormValues } from "@/schemas";

export default function LegalInfoForm() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();

  const hasCriminalRecord = watch("legal_info.has_criminal_record");
  const dismissedFromWork = watch("legal_info.dismissed_from_work");
  const fatherDeceased = watch("legal_info.father_deceased");
  const maritalStatus = watch("legal_info.marital_status");

  // Clear conditional fields when parent field changes
  const handleCriminalRecordChange = (checked: boolean) => {
    setValue("legal_info.has_criminal_record", checked);
    if (!checked) {
      setValue("legal_info.criminal_record", undefined);
    } else {
      setValue("legal_info.criminal_record", {
        offense: "",
        place_committed: "",
      });
    }
  };

  const handleDismissalChange = (checked: boolean) => {
    setValue("legal_info.dismissed_from_work", checked);
    if (!checked) {
      setValue("legal_info.dismissal_reason", "");
    }
  };

  const handleFatherDeceasedChange = (checked: boolean) => {
    setValue("legal_info.father_deceased", checked);
    if (checked) {
      setValue("legal_info.father_place_of_birth", "");
      setValue("legal_info.father_occupation", "");
      setValue("legal_info.father_address", "");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Legal Information
      </h2>

      {/* Father Information */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-800">
          Father Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Father's Name *
          </label>
          <input
            {...register("legal_info.father_name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter father's name"
          />
          {errors.legal_info?.father_name && (
            <p className="text-red-500 text-sm mt-1">
              {errors.legal_info.father_name.message}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={fatherDeceased}
              onChange={(e) => handleFatherDeceasedChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Father Deceased
            </span>
          </label>
        </div>

        {!fatherDeceased && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Place of Birth
              </label>
              <input
                {...register("legal_info.father_place_of_birth")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter father's place of birth"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Occupation
              </label>
              <input
                {...register("legal_info.father_occupation")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter father's occupation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Address
              </label>
              <textarea
                {...register("legal_info.father_address")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter father's address"
              />
            </div>
          </>
        )}
      </div>

      {/* Marital Information */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Marital Status</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marital Status *
          </label>
          <select
            {...register("legal_info.marital_status")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          {errors.legal_info?.marital_status && (
            <p className="text-red-500 text-sm mt-1">
              {errors.legal_info.marital_status.message}
            </p>
          )}
        </div>

        {maritalStatus === "married" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spouse Nationality
            </label>
            <input
              {...register("legal_info.spouse_nationality")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter spouse nationality"
            />
          </div>
        )}
      </div>

      {/* Criminal Record */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Legal History</h3>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hasCriminalRecord}
              onChange={(e) => handleCriminalRecordChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Has Criminal Record
            </span>
          </label>
        </div>

        {hasCriminalRecord && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offense *
              </label>
              <input
                {...register("legal_info.criminal_record.offense")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the offense"
              />
              {errors.legal_info?.criminal_record?.offense && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.legal_info.criminal_record.offense.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Place Committed *
              </label>
              <input
                {...register("legal_info.criminal_record.place_committed")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Where was the offense committed"
              />
              {errors.legal_info?.criminal_record?.place_committed && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.legal_info.criminal_record.place_committed.message}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={dismissedFromWork}
              onChange={(e) => handleDismissalChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Previously Dismissed from Work
            </span>
          </label>
        </div>

        {dismissedFromWork && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dismissal Reason *
            </label>
            <textarea
              {...register("legal_info.dismissal_reason")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Explain the reason for dismissal"
            />
            {errors.legal_info?.dismissal_reason && (
              <p className="text-red-500 text-sm mt-1">
                {errors.legal_info.dismissal_reason.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
