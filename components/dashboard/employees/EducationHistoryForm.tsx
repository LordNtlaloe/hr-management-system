"use client";

import { useFormContext, useFieldArray } from "react-hook-form";

export default function EducationHistoryForm() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education_history",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Education History</h2>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded space-y-2">
          <div>
            <label>School Name</label>
            <input
              {...register(`education_history.${index}.school_name`)}
              className="input"
            />
          </div>
          <div>
            <label>Date of Entry</label>
            <input
              type="date"
              {...register(`education_history.${index}.date_of_entry`)}
              className="input"
            />
          </div>
          <div>
            <label>Date of Leaving</label>
            <input
              type="date"
              {...register(`education_history.${index}.date_of_leaving`)}
              className="input"
            />
          </div>
          <div>
            <label>Qualification</label>
            <input
              {...register(`education_history.${index}.qualification`)}
              className="input"
            />
          </div>
          <div>
            <label>Qualification Start Date</label>
            <input
              type="date"
              {...register(
                `education_history.${index}.qualification_start_date`
              )}
              className="input"
            />
          </div>
          <div>
            <label>Qualification Completion Date</label>
            <input
              type="date"
              {...register(
                `education_history.${index}.qualification_completion_date`
              )}
              className="input"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-red-600"
          >
            Remove Entry
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
            qualification_start_date: "",
            qualification_completion_date: "",
            additional_skills: [],
          })
        }
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Education Entry
      </button>
    </div>
  );
}
