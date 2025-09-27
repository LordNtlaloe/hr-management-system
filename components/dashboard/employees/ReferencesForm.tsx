"use client";

import { useFormContext, useFieldArray } from "react-hook-form";

export default function ReferencesForm() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "references",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">References</h2>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded space-y-2">
          <div>
            <label>Name</label>
            <input
              {...register(`references.${index}.name`)}
              className="input"
            />
          </div>
          <div>
            <label>Address</label>
            <input
              {...register(`references.${index}.address`)}
              className="input"
            />
          </div>
          <div>
            <label>Occupation</label>
            <input
              {...register(`references.${index}.occupation`)}
              className="input"
            />
          </div>
          <div>
            <label>Known Duration</label>
            <input
              {...register(`references.${index}.known_duration`)}
              className="input"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-red-600"
          >
            Remove Reference
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({ name: "", address: "", occupation: "", known_duration: "" })
        }
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Reference
      </button>
    </div>
  );
}
