"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
    ChevronDownIcon,
    MoreHorizontal,
    HomeIcon,
    UsersIcon,
    BriefcaseIcon,
    BuildingIcon,
    ClockIcon,
    CalendarIcon,
    FileTextIcon,
    DollarSignIcon,
    PieChartIcon,
    SettingsIcon,
    UserCircleIcon,
    ShieldIcon,
    BarChart2Icon,
    FileBarChart2Icon,
    ClipboardListIcon
} from "lucide-react";

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
    {
        icon: <HomeIcon />,
        name: "Dashboard",
        path: "/dashboard",
    },
    {
        icon: <UsersIcon />,
        name: "Employees",
        subItems: [
            { name: "All Employees", path: "/employees" },
            { name: "Employee Documents", path: "/employee-documents" },
        ],
    },
    {
        icon: <BriefcaseIcon />,
        name: "Recruitment",
        subItems: [
            { name: "Job Postings", path: "/recruitment/jobs" },
            { name: "Candidates", path: "/recruitment/candidates" },
            { name: "Interviews", path: "/recruitment/interviews" },
        ],
    },
    {
        icon: <ClockIcon />,
        name: "Time & Attendance",
        subItems: [
            { name: "Time Tracking", path: "/attendance/time" },
            { name: "Leave Management", path: "/attendance/leave" },
            { name: "Attendance Reports", path: "/attendance/reports" },
        ],
    },
    {
        icon: <DollarSignIcon />,
        name: "Payroll",
        subItems: [
            { name: "Salary Processing", path: "/payroll/processing" },
            { name: "Payslips", path: "/payroll/payslips" },
            { name: "Tax Management", path: "/payroll/tax" },
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

const othersItems: NavItem[] = [
    {
        icon: <BuildingIcon />,
        name: "Organization",
        subItems: [
            { name: "Ministries", path: "/ministries" },
            { name: "Departments", path: "/departments" },
            { name: "Positions", path: "/positions" },
        ],
    },
    {
        icon: <ShieldIcon />,
        name: "Administration",
        subItems: [
            { name: "User Management", path: "/admin/users" },
            { name: "Roles & Permissions", path: "/admin/roles" },
            { name: "System Settings", path: "/admin/settings" },
        ],
    },
    {
        icon: <BarChart2Icon />,
        name: "Reports",
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
    },
];

// Rest of your component remains the same...

const AppSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const pathname = usePathname();

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: "main" | "others";
        index: number;
    } | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const isActive = useCallback((path: string) => path === pathname, [pathname]);

    const isExpansionState = isExpanded || isHovered || isMobileOpen;

    const renderMenuItems = (navItems: NavItem[], menuType: "main" | "others") => (
        <ul className="flex flex-col gap-1">
            {navItems.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`menu-item group w-full ${
                                openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "menu-item-active"
                                    : "menu-item-inactive"
                            } cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                !isExpansionState ? "justify-center" : "justify-start"
                            }`}
                        >
                            <span
                                className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${
                                    openSubmenu?.type === menuType && openSubmenu?.index === index
                                        ? "menu-item-icon-active"
                                        : "menu-item-icon-inactive"
                                }`}
                            >
                                {nav.icon}
                            </span>
                            {isExpansionState && (
                                <>
                                    <span className="menu-item-text flex-1 text-left truncate">
                                        {nav.name}
                                    </span>
                                    <ChevronDownIcon
                                        className={`flex-shrink-0 w-4 h-4 transition-transform duration-200 ${
                                            openSubmenu?.type === menuType && openSubmenu?.index === index
                                                ? "rotate-180 text-brand-500"
                                                : ""
                                        }`}
                                    />
                                </>
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                href={nav.path}
                                className={`menu-item group w-full ${
                                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                                } flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                    !isExpansionState ? "justify-center" : "justify-start"
                                }`}
                            >
                                <span
                                    className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${
                                        isActive(nav.path)
                                            ? "menu-item-icon-active"
                                            : "menu-item-icon-inactive"
                                    }`}
                                >
                                    {nav.icon}
                                </span>
                                {isExpansionState && (
                                    <span className="menu-item-text flex-1 text-left truncate">
                                        {nav.name}
                                    </span>
                                )}
                            </Link>
                        )
                    )}
                    {nav.subItems && isExpansionState && (
                        <div
                            ref={(el) => {
                                subMenuRefs.current[`${menuType}-${index}`] = el;
                            }}
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{
                                height:
                                    openSubmenu?.type === menuType && openSubmenu?.index === index
                                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                                        : "0px",
                            }}
                        >
                            <ul className="mt-2 space-y-1 pl-8">
                                {nav.subItems.map((subItem) => (
                                    <li key={subItem.name}>
                                        <Link
                                            href={subItem.path}
                                            className={`menu-dropdown-item w-full flex items-center justify-between p-2 rounded-md transition-all duration-200 ${
                                                isActive(subItem.path)
                                                    ? "menu-dropdown-item-active"
                                                    : "menu-dropdown-item-inactive"
                                            }`}
                                        >
                                            <span className="flex-1 text-left truncate">
                                                {subItem.name}
                                            </span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {subItem.new && (
                                                    <span
                                                        className={`menu-dropdown-badge text-xs px-2 py-0.5 rounded-full ${
                                                            isActive(subItem.path)
                                                                ? "menu-dropdown-badge-active"
                                                                : "menu-dropdown-badge-inactive"
                                                        }`}
                                                    >
                                                        new
                                                    </span>
                                                )}
                                                {subItem.pro && (
                                                    <span
                                                        className={`menu-dropdown-badge text-xs px-2 py-0.5 rounded-full ${
                                                            isActive(subItem.path)
                                                                ? "menu-dropdown-badge-active"
                                                                : "menu-dropdown-badge-inactive"
                                                        }`}
                                                    >
                                                        pro
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    useEffect(() => {
        // Check if the current path matches any submenu item
        let submenuMatched = false;
        ["main", "others"].forEach((menuType) => {
            const items = menuType === "main" ? navItems : othersItems;
            items.forEach((nav, index) => {
                if (nav.subItems) {
                    nav.subItems.forEach((subItem) => {
                        if (isActive(subItem.path)) {
                            setOpenSubmenu({
                                type: menuType as "main" | "others",
                                index,
                            });
                            submenuMatched = true;
                        }
                    });
                }
            });
        });

        // If no submenu item matches, close the open submenu
        if (!submenuMatched) {
            setOpenSubmenu(null);
        }
    }, [pathname, isActive]);

    useEffect(() => {
        // Set the height of the submenu items when the submenu is opened
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (
                prevOpenSubmenu &&
                prevOpenSubmenu.type === menuType &&
                prevOpenSubmenu.index === index
            ) {
                return null;
            }
            return { type: menuType, index };
        });
    };

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-[#0A0A0A] dark:text-gray-50 dark:border-[#121212] text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
                isExpanded || isMobileOpen
                    ? "w-[290px]"
                    : isHovered
                    ? "w-[290px]"
                    : "w-[90px]"
            } ${
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Logo Section */}
            <div
                className={`py-6 px-4 flex items-center ${
                    !isExpansionState ? "justify-center" : "justify-start"
                }`}
            >
                <Link href="/" className="flex items-center">
                    {isExpansionState ? (
                        <>
                            <Image
                                className="dark:hidden"
                                src="/images/logo/logo.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                            <Image
                                className="hidden dark:block"
                                src="/images/logo/logo-dark.svg"
                                alt="Logo"
                                width={150}
                                height={40}
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

            {/* Navigation Section */}
            <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-4">
                <nav className="flex-1">
                    <div className="flex flex-col gap-6">
                        {/* Main Menu Section */}
                        <div>
                            <h2
                                className={`mb-3 text-xs uppercase font-semibold leading-5 text-gray-400 flex items-center ${
                                    !isExpansionState ? "justify-center" : "justify-start"
                                }`}
                            >
                                {isExpansionState ? "Menu" : <MoreHorizontal className="w-4 h-4" />}
                            </h2>
                            {renderMenuItems(navItems, "main")}
                        </div>

                        {/* Others Section */}
                        <div>
                            <h2
                                className={`mb-3 text-xs uppercase font-semibold leading-5 text-gray-400 flex items-center ${
                                    !isExpansionState ? "justify-center" : "justify-start"
                                }`}
                            >
                                {isExpansionState ? "Others" : <MoreHorizontal className="w-4 h-4" />}
                            </h2>
                            {renderMenuItems(othersItems, "others")}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default AppSidebar;