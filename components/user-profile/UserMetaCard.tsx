"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getEmployeeByUserId } from "@/actions/employee.actions";

export default function EmployeeMetaCard() {
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

  if (loading) return <p>Loading employee info...</p>;
  if (!employee) return <p>No employee info found.</p>;

  const fields: [string, any][] = [
    ["First Name", employee.first_name],
    ["Last Name", employee.last_name],
    ["Employment Number", employee.employment_number],
    ["Gender", employee.gender],
    ["Email", employee.email],
    ["Phone", employee.phone],
    ["Department", employee.department_name],
    ["Position", employee.position_title],
    ["Manager", employee.manager_name],
    ["Hire Date", employee.hire_date],
    ["Date of Birth", employee.date_of_birth],
    ["Salary", employee.salary],
    ["Status", employee.status],
    ["Nationality", employee.nationality],
    ["Qualifications", employee.qualifications],
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-[#121212] lg:p-6 space-y-3">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">General Information</h4>
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="font-medium text-gray-800 dark:text-white/90">{value || "Not set"}</p>
        </div>
      ))}
    </div>
  );
}
