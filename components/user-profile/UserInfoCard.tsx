"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getEmployeeByUserId } from "@/actions/employee.actions";

export default function EmployeeBankingCard() {
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

  if (loading) return <p>Loading banking info...</p>;
  if (!employee) return <p>No banking info found.</p>;

  const fields: [string, any][] = [
    ["Bank Name", employee.bank_name],
    ["Account Number", employee.account_number],
    ["Routing Number", employee.routing_number],
    ["Account Type", employee.account_type],
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-[#121212] lg:p-6 space-y-3">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Banking Information
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
