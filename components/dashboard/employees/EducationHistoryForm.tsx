"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { EmployeeFormValues } from "@/schemas";

export default function EducationHistoryForm() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education_history",
  });

  // Type-safe error accessors
  const getEducationError = (index: number, field: keyof EmployeeFormValues['education_history'][0]) => {
    return errors.education_history?.[index]?.[field]?.message;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2">EDUCATION HISTORY</h2>

      {/* Section 15: SCHOOLS ATTENDED */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-700 mb-4">15. SCHOOLS ATTENDED, WITH DATES OF ENTRY AND LEAVING</h3>

        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 p-4 rounded space-y-4 mb-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">NAME OF SCHOOL *</label>
                <input
                  {...register(`education_history.${index}.school_name`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="School name"
                />
                {getEducationError(index, 'school_name') && (
                  <p className="text-red-500 text-sm mt-1">{getEducationError(index, 'school_name')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">DATE OF ENTRY *</label>
                <input
                  type="date"
                  {...register(`education_history.${index}.date_of_entry`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getEducationError(index, 'date_of_entry') && (
                  <p className="text-red-500 text-sm mt-1">{getEducationError(index, 'date_of_entry')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">DATE OF LEAVING *</label>
                <input
                  type="date"
                  {...register(`education_history.${index}.date_of_leaving`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getEducationError(index, 'date_of_leaving') && (
                  <p className="text-red-500 text-sm mt-1">{getEducationError(index, 'date_of_leaving')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">QUALIFICATION OBTAINED *</label>
                <input
                  {...register(`education_history.${index}.qualification`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., High School Diploma, Bachelor's Degree"
                />
                {getEducationError(index, 'qualification') && (
                  <p className="text-red-500 text-sm mt-1">{getEducationError(index, 'qualification')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Qualification Completion Date</label>
                <input
                  type="date"
                  {...register(`education_history.${index}.qualification_completion_date`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getEducationError(index, 'qualification_completion_date') && (
                  <p className="text-red-500 text-sm mt-1">{getEducationError(index, 'qualification_completion_date')}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Remove School
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            append({
              school_name: "",
              date_of_entry: "",
              date_of_leaving: "",
              qualification: "",
              qualification_completion_date: "",
              additional_skills: [],
            })
          }
          className="px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
        >
          + Add School
        </button>
      </div>

      {/* Section 16: EXAMINATIONS PASSED */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-700 mb-4">16. EXAMINATIONS PASSED</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Junior Certificate Class</label>
              <input
                type="text"
                {...register("examinations.junior_certificate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Grade/Class"
              />
              {errors.examinations?.junior_certificate && (
                <p className="text-red-500 text-sm mt-1">{errors.examinations.junior_certificate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                {...register("examinations.junior_certificate_date")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.examinations?.junior_certificate_date && (
                <p className="text-red-500 text-sm mt-1">{errors.examinations.junior_certificate_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">SUBJECTS PASSED AND GRADE</label>
            <textarea
              {...register("examinations.subjects_passed")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="List all subjects and corresponding grades (e.g., Mathematics - A, English - B+)"
            />
            {errors.examinations?.subjects_passed && (
              <p className="text-red-500 text-sm mt-1">{errors.examinations.subjects_passed.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 17: UNIVERSITY/POST SECONDARY */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-700 mb-4">17. UNIVERSITY (OR OTHER POST SECONDARY INSTITUTION) WITH DATES OF ENTRY AND LEAVING, AND ACADEMIC OR PROFESSIONAL QUALIFICATIONS OBTAINED</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">NAME OF INSTITUTION</label>
            <input
              {...register("post_secondary.institution_name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Institution name"
            />
            {errors.post_secondary?.institution_name && (
              <p className="text-red-500 text-sm mt-1">{errors.post_secondary.institution_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">DATE OF ENTRY</label>
            <input
              type="date"
              {...register("post_secondary.date_of_entry")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.post_secondary?.date_of_entry && (
              <p className="text-red-500 text-sm mt-1">{errors.post_secondary.date_of_entry.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">DATE OF LEAVING</label>
            <input
              type="date"
              {...register("post_secondary.date_of_leaving")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.post_secondary?.date_of_leaving && (
              <p className="text-red-500 text-sm mt-1">{errors.post_secondary.date_of_leaving.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">QUALIFICATIONS OBTAINED (with dates)</label>
          <textarea
            {...register("post_secondary.qualifications_obtained")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="List all qualifications with completion dates (e.g., Bachelor of Science in Computer Science - June 2020)"
          />
          {errors.post_secondary?.qualifications_obtained && (
            <p className="text-red-500 text-sm mt-1">{errors.post_secondary.qualifications_obtained.message}</p>
          )}
        </div>
      </div>

      {/* Section 18: ADDITIONAL QUALIFICATIONS - FIXED */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-700 mb-2">18. ANY ADDITIONAL RECOGNISED QUALIFICATIONS POSSESSED AND DATES OBTAINED</h3>
        <p className="text-sm text-gray-600 mb-4 italic">(Notes - Applicants for Secretarial appointments should please insert short-hand and typing speeds.)</p>

        <textarea
          {...register("additional_qualifications.qualifications")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="List any additional qualifications, certifications, or skills with dates obtained"
        />
        {errors.additional_qualifications?.qualifications && (
          <p className="text-red-500 text-sm mt-1">
            {errors.additional_qualifications.qualifications.message}
          </p>
        )}
      </div>
    </div>
  );
}