"use client";

import { useFormContext, useFieldArray } from "react-hook-form";

export default function EmploymentHistoryForm() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employment_history",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Employment History</h2>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded space-y-2">
          <div>
            <label>Employer Name</label>
            <input
              {...register(`employment_history.${index}.employer_name`)}
              className="input"
            />
          </div>
          <div>
            <label>Employer Address</label>
            <input
              {...register(`employment_history.${index}.employer_address`)}
              className="input"
            />
          </div>
          <div>
            <label>Position</label>
            <input
              {...register(`employment_history.${index}.position`)}
              className="input"
            />
          </div>
          <div>
            <label>Duties</label>
            <textarea
              {...register(`employment_history.${index}.duties`)}
              className="input"
            />
          </div>
          <div>
            <label>Start Date</label>
            <input
              type="date"
              {...register(`employment_history.${index}.employment_start`)}
              className="input"
            />
          </div>
          <div>
            <label>End Date</label>
            <input
              type="date"
              {...register(`employment_history.${index}.employment_end`)}
              className="input"
            />
          </div>
          <div>
            <label>Salary</label>
            <input
              type="number"
              {...register(`employment_history.${index}.salary`, {
                valueAsNumber: true,
              })}
              className="input"
            />
          </div>
          <div>
            <label>Reason for Leaving</label>
            <input
              {...register(`employment_history.${index}.reason_for_leaving`)}
              className="input"
            />
          </div>
          <div>
            <label>Notice Period</label>
            <input
              {...register(`employment_history.${index}.notice_period`)}
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
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Employment Entry
      </button>
    </div>
  );
}
