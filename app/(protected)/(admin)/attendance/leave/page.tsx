"use client"
import React, { useEffect, useState } from 'react'
import { getPendingLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '@/actions/leaves.actions'
import { useCurrentRole } from '@/hooks/use-current-role'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Check, X, Loader2, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Employee {
    _id: string
    name: string
    email: string
    avatar?: string
    position?: string
    department?: string
}

interface LeaveRequest {
    _id: string
    employeeId: Employee
    leaveType: string
    startDate: string
    endDate: string
    reason?: string
    status: 'pending' | 'approved' | 'rejected'
    approvedBy?: Employee
    approvedDate?: string
    appliedDate: string
    days: number
    createdAt: string
    updatedAt: string
}

export default function RequestedLeaves() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const role = useCurrentRole()
    const user = useCurrentUser()
    const isAdmin = role === 'Admin'

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getPendingLeaveRequests()
                if (Array.isArray(data)) {
                    setLeaves(data)
                }
            } catch (error) {
                console.error('Failed to fetch leave requests:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleApprove = async (leaveId: string) => {
        try {
            setProcessing(`approve-${leaveId}`)
            const result = await approveLeaveRequest(leaveId, user?.id || '')
            if (result.success) {
                setLeaves(leaves.map(leave =>
                    leave._id === leaveId ? {
                        ...leave,
                        status: 'approved',
                        approvedBy: {
                            _id: user?.id || '',
                            name: user?.name || 'Admin',
                            email: user?.email || '',
                            avatar: user?.image || ''
                        },
                        approvedDate: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } : leave
                ))
            }
        } catch (error) {
            console.error('Failed to approve leave:', error)
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (leaveId: string) => {
        try {
            setProcessing(`reject-${leaveId}`)
            const result = await rejectLeaveRequest(leaveId, user?.id || '')
            if (result.success) {
                setLeaves(leaves.map(leave =>
                    leave._id === leaveId ? {
                        ...leave,
                        status: 'rejected',
                        approvedBy: {
                            _id: user?.id || '',
                            name: user?.name || 'Admin',
                            email: user?.email || '',
                            avatar: user?.image || ''
                        },
                        approvedDate: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } : leave
                ))
            }
        } catch (error) {
            console.error('Failed to reject leave:', error)
        } finally {
            setProcessing(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="gap-1 bg-green-500 text-green-900"><Check size={14} /> Approved</Badge>
            case 'rejected':
                return <Badge variant="destructive" className="gap-1"><X size={14} /> Rejected</Badge>
            default:
                return <Badge className="gap-1 bg-red-500 text-red-900"><Loader2 size={14} className="animate-spin" /> Pending</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Leave Requests</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline">{leaves.length} pending</Badge>
                </div>
            </div>

            {leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
                    <Calendar className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-500">No pending leave requests</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {leaves.map((leave) => (
                        <div key={leave._id} className="p-6 border rounded-lg shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={leave.employeeId.avatar} />
                                            <AvatarFallback>
                                                {leave.employeeId.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-medium">{leave.employeeId.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="w-4 h-4" />
                                                <span>{leave.employeeId.email}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {leave.employeeId.department && (
                                                    <Badge variant="outline">{leave.employeeId.department}</Badge>
                                                )}
                                                {leave.employeeId.position && (
                                                    <span className="text-sm text-gray-500">{leave.employeeId.position}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>
                                                {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-gray-500">({leave.days} day{leave.days > 1 ? 's' : ''})</span>
                                        </div>
                                        <Badge variant="secondary">{leave.leaveType} Leave</Badge>
                                        {getStatusBadge(leave.status)}
                                    </div>

                                    {leave.reason && (
                                        <div className="p-3 mt-2 text-sm bg-gray-50 rounded-md dark:bg-gray-800">
                                            <p className="font-medium text-gray-700 dark:text-gray-300">Reason:</p>
                                            <p className="text-gray-600 dark:text-gray-400">{leave.reason}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Applied on {format(new Date(leave.appliedDate), 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    {leave.approvedBy && (
                                        <div className="p-3 text-sm bg-gray-50 rounded-md dark:bg-gray-800">
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                {leave.status === 'approved' ? 'Approved' : 'Rejected'} by:
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Avatar className="w-6 h-6">
                                                    <AvatarImage src={leave.approvedBy.avatar} />
                                                    <AvatarFallback>
                                                        {leave.approvedBy.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{leave.approvedBy.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(new Date(leave.approvedDate || ''), 'MMM d, yyyy h:mm a')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {isAdmin && leave.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(leave._id)}
                                                disabled={!!processing}
                                                className="flex-1 bg-green-500 text-green-900"
                                            >
                                                {processing === `approve-${leave._id}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Approve'
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(leave._id)}
                                                disabled={!!processing}
                                                className="flex-1"
                                            >
                                                {processing === `reject-${leave._id}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Reject'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}