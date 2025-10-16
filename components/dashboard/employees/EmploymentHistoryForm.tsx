"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { EmployeeFormValues } from "@/schemas";

export default function EmploymentHistoryForm() {
  const { control, register, formState: { errors } } = useFormContext<EmployeeFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employment_history",
  });

  // Type-safe error accessors
  const getEmploymentError = (index: number, field: keyof EmployeeFormValues['employment_history'][0]) => {
    return errors.employment_history?.[index]?.[field]?.message;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2">EMPLOYMENT HISTORY</h2>

      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-700 mb-4">19-29. EMPLOYMENT RECORD (Start with current or most recent employment)</h3>

        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 p-6 rounded space-y-4 mb-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-700">Employment Record #{index + 1}</h4>
              <button
                type="button"
                onClick={() => remove(index)}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Remove Employment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">19. Employer Name *</label>
                <input
                  {...register(`employment_history.${index}.employer_name`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company/organization name"
                />
                {getEmploymentError(index, 'employer_name') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'employer_name')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">20. Employer Address *</label>
                <input
                  {...register(`employment_history.${index}.employer_address`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company address"
                />
                {getEmploymentError(index, 'employer_address') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'employer_address')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">21. Position *</label>
                <input
                  {...register(`employment_history.${index}.position`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Job title/position"
                />
                {getEmploymentError(index, 'position') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'position')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">22. Salary *</label>
                <input
                  type="number"
                  {...register(`employment_history.${index}.salary`, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Monthly salary"
                />
                {getEmploymentError(index, 'salary') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'salary')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">23. Start Date *</label>
                <input
                  type="date"
                  {...register(`employment_history.${index}.employment_start`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getEmploymentError(index, 'employment_start') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'employment_start')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">24. End Date *</label>
                <input
                  type="date"
                  {...register(`employment_history.${index}.employment_end`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getEmploymentError(index, 'employment_end') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'employment_end')}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">25. Duties & Responsibilities *</label>
                <textarea
                  {...register(`employment_history.${index}.duties`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe your main duties and responsibilities"
                />
                {getEmploymentError(index, 'duties') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'duties')}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">26. Reason for Leaving *</label>
                <input
                  {...register(`employment_history.${index}.reason_for_leaving`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for leaving this employment"
                />
                {getEmploymentError(index, 'reason_for_leaving') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'reason_for_leaving')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">27. Notice Period *</label>
                <input
                  {...register(`employment_history.${index}.notice_period`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1 month, 2 weeks"
                />
                {getEmploymentError(index, 'notice_period') && (
                  <p className="text-red-500 text-sm mt-1">{getEmploymentError(index, 'notice_period')}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            append({
              employer_name: "",
              employer_address: "",
              position: "",
              duties: "",
              employment_start: "",
              employment_end: "",
              salary: 0,
              reason_for_leaving: "",
              notice_period: "",
            })
          }
          className="px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
        >
          + Add Employment Record
        </button>
      </div>
    </div>
  );
}