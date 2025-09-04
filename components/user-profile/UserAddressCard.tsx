"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getEmployeeByUserId } from "@/actions/employee.actions";

export default function EmployeeAddressCard() {
  const user = useCurrentUser();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const id = user?.id
    const fetchEmployee = async () => {
      setLoading(true);
      const data = await getEmployeeByUserId(id);
      setEmployee(data);
      setLoading(false);
    };

    fetchEmployee();
  }, [user?.id]);

  if (loading) return <p>Loading address info...</p>;
  if (!employee) return <p>No address info found.</p>;

  const fields: [string, any][] = [
    ["Street Address", employee.street_address],
    ["City/State", employee.city_state],
    ["Postal Code", employee.postal_code],
    ["Country", employee.country],
    ["Tax ID", employee.tax_id],
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-[#121212] lg:p-6 space-y-3">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Address Information
      </h4>
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {value || "Not set"}
          </p>
        </div>
      ))}
    </div>
  );
}
