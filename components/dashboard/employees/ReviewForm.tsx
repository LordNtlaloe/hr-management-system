"use client";

import { useFormContext } from "react-hook-form";

export default function ReviewForm() {
  const { getValues } = useFormContext();
  const values = getValues();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review Information</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
        {JSON.stringify(values, null, 2)}
      </pre>
      <p>Make sure all data is correct before submitting.</p>
    </div>
  );
}
