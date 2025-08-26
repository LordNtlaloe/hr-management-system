"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { Label } from "@/components/ui/label"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar, } from "@/components/ui/calendar"
import { getLeaveReport, getEmployeeStatusCounts, getEmployeeLeaveUtilization } from "@/actions/leaves.actions"
import { getTimeTrackingSummary } from "@/actions/attendance.actions"
import { getAllEmployees } from "@/actions/employee.actions"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"]

// Custom calendar picker component
interface CalendarPickerProps {
    selected: Date | null
    onChange: (date: Date) => void
}

function CalendarPicker({ selected, onChange }: CalendarPickerProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | null>(selected || null)

    React.useEffect(() => {
        setDate(selected)
    }, [selected])

    return (
        <div className="flex flex-col gap-2">
            <Label className="px-1">Select Date</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48 justify-between font-normal">
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        // mode="single"
                        selected={date || undefined}
                        captionLayout="dropdown"
                        onSelect={(d: Date | null) => {
                            if (d) {
                                setDate(d)
                                onChange(d)
                            }
                            setOpen(false)
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default function AttendanceReports() {
    const [dateRange, setDateRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null })
    const [summary, setSummary] = useState<any>({})
    const [attendanceTrend, setAttendanceTrend] = useState<any[]>([])
    const [leaveBreakdown, setLeaveBreakdown] = useState<any[]>([])
    const [deptAttendance, setDeptAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        if (!dateRange.from || !dateRange.to) return

        const fetchData = async () => {
            setLoading(true)
            try {
                // 1️⃣ Summary cards
                const employeeStatus = await getEmployeeStatusCounts()
                const leaveUtil = await getEmployeeLeaveUtilization('month')
                setSummary({ ...employeeStatus, ...leaveUtil })

                // 2️⃣ Leave breakdown
                const leaveReport = await getLeaveReport(dateRange.from!, dateRange.to!)
                const leaveChart = Array.isArray(leaveReport)
                    ? leaveReport.map((r: any) => ({ name: r._id.leaveType, value: r.totalDays }))
                    : []
                setLeaveBreakdown(leaveChart)

                // 3️⃣ Attendance trend
                const timeSummary = await getTimeTrackingSummary(dateRange.from!, dateRange.to!)
                const trendData = Array.isArray(timeSummary) ? timeSummary : []
                setAttendanceTrend(trendData)

                // 4️⃣ Department-wise attendance
                const employees = await getAllEmployees()
                if (!Array.isArray(employees)) {
                    console.error("Failed to fetch employees:", employees.error)
                    setDeptAttendance([])
                } else {
                    const deptMap: any = {}
                    employees.forEach((emp: any) => {
                        const deptName = emp.department?.name || "Unknown"
                        if (!deptMap[deptName]) deptMap[deptName] = { dept: deptName, present: 0, total: 0 }
                        deptMap[deptName].total += 1
                        if (trendData.some((t: any) => Array.isArray(t.employeeIds) && t.employeeIds.includes(emp._id))) {
                            deptMap[deptName].present += 1
                        }
                    })
                    setDeptAttendance(Object.values(deptMap))
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [dateRange])

    if (loading) return <div className="text-center py-8">Loading attendance report...</div>

    return (
        <div className="p-6 grid gap-6">
            {/* Date Filter */}
            <div className="flex gap-4">
                <CalendarPicker
                    selected={dateRange.from}
                    onChange={(date: Date) => setDateRange(prev => ({ ...prev, from: date }))}
                />
                <CalendarPicker
                    selected={dateRange.to}
                    onChange={(date: Date) => setDateRange(prev => ({ ...prev, to: date }))}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Employees</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{summary.total || 0}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Attendance Rate</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{summary.attendanceRate || 0}%</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Leave Days</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{summary.usedDays || 0}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>On Leave</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{summary.onLeave || 0}</p></CardContent>
                </Card>
            </div>

            {/* Attendance Trend */}
            <Card>
                <CardHeader><CardTitle>Attendance Over Time</CardTitle></CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={attendanceTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="present" stroke="#82ca9d" />
                            <Line type="monotone" dataKey="absent" stroke="#ff4d4d" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Leave Breakdown */}
            <Card>
                <CardHeader><CardTitle>Leave Breakdown</CardTitle></CardHeader>
                <CardContent className="h-72 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={leaveBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {leaveBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Department-wise Attendance */}
            <Card>
                <CardHeader><CardTitle>Department Attendance</CardTitle></CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptAttendance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dept" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="present" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
