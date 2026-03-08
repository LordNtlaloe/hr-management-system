import { getEmployeeById } from "@/actions/employee.actions";
import { LeaveRequest, Employee } from "@/types";

export const isEmployeeObject = (employee: any): employee is Employee => {
  return employee && typeof employee === "object" && "first_name" in employee;
};

export const getEmployeeId = (employee: string | Employee): string => {
  if (typeof employee === "string") return employee;
  return employee._id;
};

export const getEmployeeName = (employee: string | Employee): string => {
  if (isEmployeeObject(employee)) {
    return `${employee.first_name} ${employee.last_name}`.trim();
  }
  return "Loading...";
};

export const getEmployeeEmail = (employee: string | Employee): string => {
  if (isEmployeeObject(employee)) {
    return employee.email;
  }
  return "loading...@example.com";
};

export const getEmployeeInitial = (employee: string | Employee): string => {
  const name = getEmployeeName(employee);
  return name.charAt(0).toUpperCase() || "U";
};

export const getEmployeeImage = (employee: string | Employee): string | undefined => {
  if (isEmployeeObject(employee)) {
    return (employee as any).image;
  }
  return undefined;
};

export const getEmployeeDetails = (employee: string | Employee) => {
  if (isEmployeeObject(employee)) {
    return {
      section_name: employee.section_name,
      position_title: employee.position_title,
      employment_number: employee.employment_number,
      phone: employee.phone,
    };
  }
  return {
    section_name: "",
    position_title: "",
    employment_number: "",
    phone: "",
  };
};

export const getApproverName = (approver: string | Employee | undefined | null): string => {
  if (!approver) return "Unknown";
  if (isEmployeeObject(approver)) {
    return `${approver.first_name} ${approver.last_name}`.trim();
  }
  return "Unknown";
};

export const fetchEmployeeData = async (employeeId: string): Promise<Employee> => {
  try {
    const employee = await getEmployeeById(employeeId);
    if (employee && typeof employee === "object") {
      return employee;
    }
  } catch (error) {
    console.error("Failed to fetch employee:", error);
  }

  return {
    _id: employeeId,
    first_name: "Unknown",
    last_name: "Employee",
    email: "unknown@example.com",
    phone: "",
    section_name: "",
    position_title: "",
    employment_number: "",
    user_id: "",
    section_id: "",
    position_id: "",
    hire_date: new Date(),
    salary: 0,
    status: "active",
  } as Employee;
};

export const processLeaveRequests = async (leaves: LeaveRequest[]): Promise<LeaveRequest[]> => {
  const processedLeaves: LeaveRequest[] = [];

  for (const leave of leaves) {
    if (isEmployeeObject(leave.employeeId)) {
      processedLeaves.push(leave);
    } else {
      const employeeData = await fetchEmployeeData(leave.employeeId as string);
      processedLeaves.push({
        ...leave,
        employeeId: employeeData,
      });
    }
  }

  return processedLeaves;
};

export const getLeaveTypeColor = (leaveType: string): string => {
  switch (leaveType.toLowerCase()) {
    case "annual":
      return "bg-blue-100 text-blue-800";
    case "sick":
      return "bg-purple-100 text-purple-800";
    case "personal":
      return "bg-orange-100 text-orange-800";
    case "emergency":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
