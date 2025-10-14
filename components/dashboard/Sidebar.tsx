"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useCurrentRole } from "@/hooks/use-current-role";

import {
  ChevronDownIcon,
  MoreHorizontal,
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  FileTextIcon,
  DollarSignIcon,
  UserCircleIcon,
  ShieldIcon,
  BarChart2Icon,
} from "lucide-react";

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  roles?: ("Employee" | "Admin" | "HR" | "Manager")[];
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    roles?: ("Employee" | "Admin" | "HR" | "Manager")[];
  }[];
};

// ---- NAV ITEMS ---- //

const adminNavItems: NavItem[] = [
  {
    icon: <HomeIcon />,
    name: "Dashboard",
    path: "/dashboard",
    roles: ["Admin", "Employee"],
  },
  {
    icon: <UsersIcon />,
    name: "Employees",
    roles: ["Admin"],
    subItems: [
      { name: "All Employees", path: "/employees" },
      { name: "Employee Documents", path: "/employee-documents" },
    ],
  },
  {
    icon: <BriefcaseIcon />,
    name: "Recruitment",
    roles: ["Admin"],
    subItems: [
      { name: "Job Postings", path: "/recruitment/jobs" },
      { name: "Candidates", path: "/recruitment/candidates" },
      { name: "Interviews", path: "/recruitment/interviews" },
    ],
  },
  {
    icon: <ClockIcon />,
    name: "Time & Attendance",
    roles: ["Admin", "Employee"],
    subItems: [
      {
        name: "Time Tracking",
        path: "/attendance/time",
        roles: ["Admin", "Employee"],
      },
      {
        name: "Leave Management",
        path: "/attendance/leave",
        roles: ["Admin", "Employee"],
      },
      {
        name: "Attendance Reports",
        path: "/attendance/reports",
        roles: ["Admin"],
      },
    ],
  },
  {
    icon: <DollarSignIcon />,
    name: "Payroll",
    roles: ["Admin"],
    subItems: [
      { name: "Salary Processing", path: "/payroll/processing" },
      { name: "Payslips", path: "/payroll/payslips" },
      { name: "Tax Management", path: "/payroll/tax" },
    ],
  },
  {
    icon: <FileTextIcon />,
    name: "Performance",
    roles: ["Admin", "Employee"],
    subItems: [
      { name: "Reviews", path: "/performance/reviews" },
      { name: "Goals", path: "/performance/goals" },
      { name: "Feedback", path: "/performance/feedback" },
    ],
  },
];

const adminOthersItems: NavItem[] = [
  {
    icon: <BuildingIcon />,
    name: "Organization",
    roles: ["Admin"],
    subItems: [
      { name: "Ministries", path: "/ministries" },
      { name: "Sections", path: "/sections" },
      { name: "Positions", path: "/positions" },
    ],
  },
  {
    icon: <ShieldIcon />,
    name: "Administration",
    roles: ["Admin"],
    subItems: [
      { name: "User Management", path: "/admin/users" },
      { name: "Roles & Permissions", path: "/admin/roles" },
      { name: "System Settings", path: "/admin/settings" },
    ],
  },
  {
    icon: <BarChart2Icon />,
    name: "Reports",
    roles: ["Admin"],
    subItems: [
      { name: "HR Analytics", path: "/reports/analytics" },
      { name: "Employee Reports", path: "/reports/employees" },
      { name: "Custom Reports", path: "/reports/custom" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "My Profile",
    path: "/profile",
    roles: ["Admin", "Employee"],
  },
];

const employeeNavItems: NavItem[] = [
  { icon: <HomeIcon />, name: "Dashboard", path: "/dashboard" },
  {
    icon: <ClockIcon />,
    name: "Time & Attendance",
    subItems: [
      { name: "Time Tracking", path: "/attendance/time" },
      { name: "Leave Management", path: "/attendance/leave" },
    ],
  },
  {
    icon: <FileTextIcon />,
    name: "Performance",
    subItems: [
      { name: "Reviews", path: "/performance/reviews" },
      { name: "Goals", path: "/performance/goals" },
      { name: "Feedback", path: "/performance/feedback" },
    ],
  },
];

const employeeOthersItems: NavItem[] = [
  { icon: <UserCircleIcon />, name: "My Profile", path: "/profile" },
];

// ---- FILTER BY ROLE ---- //
const filterNavItemsByRole = (
  items: NavItem[],
  role?: "Employee" | "Admin" | "HR" | "Manager"
) =>
  items
    .filter((item) => !item.roles || item.roles.includes(role!))
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter(
        (sub) => !sub.roles || sub.roles.includes(role!)
      ),
    }));

// ---- SIDEBAR COMPONENT ---- //
const AppSidebar: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  // const { data: session, status } = useCurrentUser();
  const pathname = usePathname();
  const { role, status } = useCurrentRole();
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const isActive = (path: string) => path === pathname;
  const isExpansionState = isExpanded || isHovered || isMobileOpen;

  const mainNavItems = filterNavItemsByRole(
    role === "Admin" ? adminNavItems : employeeNavItems,
    role
  );
  const othersNavItems = filterNavItemsByRole(
    role === "Admin" ? adminOthersItems : employeeOthersItems,
    role
  );

  const handleToggle = (index: number, type: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.index === index && prev.type === type ? null : { type, index }
    );
  };

  const renderMenuItems = (items: NavItem[], type: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <>
              <button
                onClick={() => handleToggle(index, type)}
                className={`menu-item group w-full cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  openSubmenu?.type === type && openSubmenu.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } ${!isExpansionState ? "justify-center" : "justify-start"}`}
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {nav.icon}
                </span>
                {isExpansionState && (
                  <>
                    <span className="flex-1 truncate">{nav.name}</span>
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform duration-200 ${
                        openSubmenu?.type === type &&
                        openSubmenu.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {/* Dropdown */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openSubmenu?.type === type && openSubmenu.index === index
                    ? "max-h-96"
                    : "max-h-0"
                }`}
              >
                <ul className="mt-2 space-y-1 pl-8">
                  {nav.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.path}
                        className={`menu-dropdown-item w-full flex items-center justify-between p-2 rounded-md transition-all duration-200 ${
                          isActive(sub.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        <div className="flex gap-1">
                          {sub.new && (
                            <span className="menu-dropdown-badge">new</span>
                          )}
                          {sub.pro && (
                            <span className="menu-dropdown-badge">pro</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${!isExpansionState ? "justify-center" : "justify-start"}`}
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {nav.icon}
                </span>
                {isExpansionState && (
                  <span className="flex-1 truncate">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  if (status === "loading") {
    return (
      <aside className="fixed mt-16 top-0 left-0 h-screen w-[90px] flex flex-col items-center justify-center bg-white dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-[#121212]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed mt-16 top-0 left-0 h-screen bg-white dark:bg-[#0A0A0A] dark:text-gray-50 border-r border-gray-200 dark:border-[#121212] transition-all duration-300 z-50 ${
        isExpansionState ? "w-[290px]" : "w-[90px]"
      }`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-6 px-4 flex items-center ${!isExpansionState ? "justify-center" : "justify-start"}`}
      >
        <Link href="/">
          {isExpansionState ? (
            <>
              <Image
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
                className="hidden dark:block"
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-4">
        <nav className="flex-1 flex flex-col gap-6">
          {/* Main Menu */}
          <div>
            <h2
              className={`mb-3 text-xs uppercase font-semibold text-gray-400 flex items-center ${!isExpansionState ? "justify-center" : "justify-start"}`}
            >
              {isExpansionState ? (
                "Menu"
              ) : (
                <MoreHorizontal className="w-4 h-4" />
              )}
            </h2>
            {renderMenuItems(mainNavItems, "main")}
          </div>

          {/* Others */}
          {othersNavItems.length > 0 && (
            <div>
              <h2
                className={`mb-3 text-xs uppercase font-semibold text-gray-400 flex items-center ${!isExpansionState ? "justify-center" : "justify-start"}`}
              >
                {isExpansionState ? (
                  "Others"
                ) : (
                  <MoreHorizontal className="w-4 h-4" />
                )}
              </h2>
              {renderMenuItems(othersNavItems, "others")}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
