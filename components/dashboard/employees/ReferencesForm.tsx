"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { EmployeeFormValues } from "@/schemas";

export default function ReferencesForm() {
  const { control, register, formState: { errors } } = useFormContext<EmployeeFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "references",
  });

  // Type-safe error accessors
  const getReferenceError = (index: number, field: keyof EmployeeFormValues['references'][0]) => {
    return errors.references?.[index]?.[field]?.message;
  };

  // Ensure exactly 2 references
  if (fields.length === 0) {
    append({ name: "", address: "", occupation: "", known_duration: "" });
    append({ name: "", address: "", occupation: "", known_duration: "" });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2">REFERENCES</h2>

      {/* Section 30: PERSONAL REFERENCES */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-700 mb-2">30. PERSONAL REFERENCES</h3>
        <p className="text-sm text-gray-600 mb-6">
          Give names and addresses of two responsible persons who know you well, either in private life or in business. Do not send testimonials from these persons.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => (
            <div key={field.id} className="border-2 border-blue-200 p-6 rounded space-y-4 bg-blue-50">
              <h4 className="text-lg font-bold text-blue-800 text-center">REFERENCE {index + 1}</h4>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name *</label>
                <input
                  {...register(`references.${index}.name`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name of reference"
                />
                {getReferenceError(index, 'name') && (
                  <p className="text-red-500 text-sm mt-1">{getReferenceError(index, 'name')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Occupation *</label>
                <input
                  {...register(`references.${index}.occupation`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reference's occupation"
                />
                {getReferenceError(index, 'occupation') && (
                  <p className="text-red-500 text-sm mt-1">{getReferenceError(index, 'occupation')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Address *</label>
                <textarea
                  {...register(`references.${index}.address`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Complete address of reference"
                />
                {getReferenceError(index, 'address') && (
                  <p className="text-red-500 text-sm mt-1">{getReferenceError(index, 'address')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Period of knowing you *</label>
                <input
                  {...register(`references.${index}.known_duration`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5 years, 3 months"
                />
                {getReferenceError(index, 'known_duration') && (
                  <p className="text-red-500 text-sm mt-1">{getReferenceError(index, 'known_duration')}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form footer notes */}
        <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-bold text-yellow-800 mb-3 text-lg">NOTES—</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
            <li className="font-semibold">It is an offence to give false information.</li>
            <li>The application should be completed in applicant's own handwriting.</li>
            <li>Do not enclose originals of certificates or testimonials, but send certified photocopy copies only.</li>
            <li>If you are invited for interview by the Commission, bring the originals of your certificates and testimonials with you but make sure that they are returned to you before you leave.</li>
            <li>If you do not receive an acknowledgement of this form within reasonable time, please enquire from the address.</li>
          </ol>
        </div>

        {/* Signature and Date */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Applicant's Signature</label>
            <div className="w-full h-12 border-b-2 border-gray-400"></div>
            <p className="text-xs text-gray-500 mt-1">Sign above</p>
          </div>
        </div>
      </div>
    </div>
  );
}