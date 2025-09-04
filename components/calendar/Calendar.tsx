"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/use-modal";
import { Modal } from "@/components/ui/modal";
import { getEmployeeLeaveRequests, createLeaveRequest } from '@/actions/leaves.actions';
import { useCurrentRole } from "@/hooks/use-current-role";

export enum LeaveType {
  ANNUAL = "Annual",
  SICK = "Sick",
}

interface LeaveEvent extends EventInput {
  extendedProps: {
    status: string;
    leaveType: LeaveType;
    leaveId: string;
  };
}

const Calendar: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { role } = useCurrentRole();
  const isEmployee = role === "Employee";

  useEffect(() => {
    const fetchLeaveEvents = async () => {
      try {
        const response = await getEmployeeLeaveRequests(employeeId);

        if (Array.isArray(response)) {
          const formattedEvents: LeaveEvent[] = response.map((leave: any) => ({
            id: leave._id,
            title: `${leave.leaveType.toUpperCase()} Leave`,
            start: new Date(leave.startDate),
            end: new Date(leave.endDate),
            allDay: true,
            extendedProps: {
              status: leave.status,
              leaveType: leave.leaveType,
              leaveId: leave._id
            },
          }));

          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("Failed to fetch leave events", error);
      }
    };

    fetchLeaveEvents();
  }, [employeeId]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!isEmployee) return;

    resetModalFields();
    setStartDate(selectInfo.startStr);
    setEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedLeave(event as unknown as LeaveEvent);
    setLeaveType(event.extendedProps.leaveType as LeaveType);
    setStartDate(event.start?.toISOString().split("T")[0] || "");
    setEndDate(event.end?.toISOString().split("T")[0] || "");
    openModal();
  };

  const handleSubmitLeaveRequest = async () => {
    try {
      const leaveData = {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        days: calculateDaysDifference(new Date(startDate), new Date(endDate)),
      };

      const result = await createLeaveRequest(leaveData);

      if (result.success) {
        const newEvent: LeaveEvent = {
          id: result.insertedId,
          title: `${leaveType} Leave`,
          start: leaveData.startDate,
          end: leaveData.endDate,
          allDay: true,
          extendedProps: {
            status: "pending",
            leaveType,
            leaveId: result.insertedId
          },
        };

        setEvents((prevEvents) => [...prevEvents, newEvent]);
        closeModal();
        resetModalFields();
      }
    } catch (error) {
      console.error("Failed to submit leave request", error);
    }
  };

  const calculateDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const resetModalFields = () => {
    setLeaveType(LeaveType.ANNUAL);
    setStartDate("");
    setEndDate("");
    setReason("");
    setSelectedLeave(null);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next" + (isEmployee ? " requestLeaveButton" : ""),
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={isEmployee}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          customButtons={isEmployee ? {
            requestLeaveButton: {
              text: "Request Leave +",
              click: openModal,
            },
          } : undefined}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedLeave ? "Leave Details" : "Request Leave"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedLeave ? "View your leave request details" : "Submit a new leave request"}
            </p>
          </div>
          <div className="mt-8">
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as unknown as LeaveType)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                disabled={!!selectedLeave || !isEmployee}
              >
                {Object.values(LeaveType).map((type) => (
                  <option key={type as string} value={type as string}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                disabled={!!selectedLeave || !isEmployee}
              />
            </div>
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                disabled={!!selectedLeave || !isEmployee}
              />
            </div>
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                rows={3}
                disabled={!!selectedLeave || !isEmployee}
                placeholder="Enter reason for leave (optional)"
              />
            </div>
            {selectedLeave && (
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Status
                </label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedLeave.extendedProps.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : selectedLeave.extendedProps.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {selectedLeave.extendedProps.status.charAt(0).toUpperCase() +
                    selectedLeave.extendedProps.status.slice(1)}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={closeModal}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              Close
            </button>
            {!selectedLeave && isEmployee && (
              <button
                onClick={handleSubmitLeaveRequest}
                className="rounded-lg bg-slate-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                disabled={!startDate || !endDate}
              >
                Submit Request
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const status = eventInfo.event.extendedProps.status;
  const colorClass = status === 'approved' ? 'success' :
    status === 'rejected' ? 'danger' : 'warning';

  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
      {eventInfo.event.extendedProps.status === 'pending' && (
        <div className="fc-event-status">(Pending)</div>
      )}
    </div>
  );
};

export default Calendar;