"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Image from "next/image";

type AttendanceRecord = {
  email: string;
  fullname: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours: { hrs: number; mins: number; secs: number };
  check_in_photo?: string | null;
  check_out_photo?: string | null;
};

type ApiAttendanceResponse = {
  attendance: {
    email: string;
    fullname: string;
    department: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    check_in_photo?: string | null;
    check_out_photo?: string | null;
  }[];
};

type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string;
};

type Holiday = {
  id: number;
  name: string;
  date: string;
  description?: string;
};

type AbsenceRecord = {
  email: string;
  fullname: string;
  department: string;
  date: string;
};

type Leave = {
  id: number;
  email: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: string;
  applied_on: string;
};

type AttendanceRequest = {
  id: number;
  email: string;
  date: string;
  reason: string;
  manager_remark: string | null;
  status: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

type ShiftData = {
  shift_id: number;
  date: string;
  start_time: string;
  end_time: string;
  emp_email: string;
  emp_name: string;
  manager_email: string;
  manager_name: string;
  shift: string;
};

type OTData = {
  id: number;
  email: string;
  manager_email: string;
  ot_start: string;
  ot_end: string;
  emp_name: string;
};

export default function ManagerAttendenceDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [managerRemarks, setManagerRemarks] = useState<Record<number, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Add shifts and OT states
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [otRecords, setOtRecords] = useState<OTData[]>([]);

  // ---------------- Fetch Attendance ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data: ApiAttendanceResponse = await res.json();

        const mapped: AttendanceRecord[] = (data.attendance || []).map((a) => {
          let hours = { hrs: 0, mins: 0, secs: 0 };
          if (a.check_in && a.check_out) {
            const inTime = new Date(`${a.date}T${a.check_in}`).getTime();
            const outTime = new Date(`${a.date}T${a.check_out}`).getTime();
            const diffInSeconds = Math.max(0, (outTime - inTime) / 1000);
            hours = {
              hrs: Math.floor(diffInSeconds / 3600),
              mins: Math.floor((diffInSeconds % 3600) / 60),
              secs: Math.round(diffInSeconds % 60),
            };
          }
          return {
            email: a.email,
            fullname: a.fullname,
            department: a.department,
            date: a.date,
            check_in: a.check_in,
            check_out: a.check_out,
            hours,
            check_in_photo: a.check_in_photo || null,
            check_out_photo: a.check_out_photo || null,
          };
        });

        setAttendance(mapped);
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------------- Fetch Employees ----------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`
        );
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data: Employee[] = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  // ---------------- Fetch Holidays ----------------
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/holidays/`
        );
        if (!res.ok) throw new Error("Failed to fetch holidays");
        const data: Holiday[] = await res.json();
        setHolidays(data);
      } catch (err) {
        console.error("Error fetching holidays:", err);
      }
    };
    fetchHolidays();
  }, []);

  // ---------------- Fetch Absences ----------------
  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_absent/`
        );
        if (!res.ok) throw new Error("Failed to fetch absences");
        const data: AbsenceRecord[] = await res.json();
        setAbsences(data);
      } catch (err) {
        console.error("Error fetching absences:", err);
      }
    };
    fetchAbsences();
  }, []);

  // ---------------- Fetch Leaves ----------------
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`
        );
        if (!res.ok) throw new Error("Failed to fetch leaves");
        const data: { leaves: Leave[] } = await res.json();
        setLeaves(data.leaves || []);
      } catch (err) {
        console.error("Error fetching leaves:", err);
      }
    };
    fetchLeaves();
  }, []);

  // ---------------- Fetch Attendance Requests ----------------
  useEffect(() => {
    const fetchAttendanceRequests = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/attendance_requests/`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance requests");
        const data: AttendanceRequest[] = await res.json();
        setAttendanceRequests(data);
      } catch (err) {
        console.error("Error fetching attendance requests:", err);
      }
    };
    fetchAttendanceRequests();
  }, []);

  // ---------------- Fetch Shifts ----------------
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_shifts/`
        );
        if (!res.ok) throw new Error("Failed to fetch shifts");
        const data: ShiftData[] = await res.json();
        setShifts(data);
      } catch (err) {
        console.error("Error fetching shifts:", err);
      }
    };
    fetchShifts();
  }, []);

  // ---------------- Fetch OT Records ----------------
  useEffect(() => {
    const fetchOtRecords = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_ot/`);
        if (!response.ok) throw new Error("Failed to fetch OT records");
        const data = await response.json();
        setOtRecords(data.ot_records || []);
      } catch (err) {
        console.error("Error fetching OT records:", err);
      }
    };

    fetchOtRecords();
  }, []);

  // Get today's date in local timezone (YYYY-MM-DD)
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log('Current Date:', now);
    console.log('Formatted Today:', dateStr);
    return dateStr;
  })();
  
  const todaysAttendance = attendance.filter((a) => a.date === today);
  const checkedIn = todaysAttendance.filter((a) => a.check_in).length;
  const totalEmployees = employees.length;
  const absent = totalEmployees - checkedIn;

  const totalHoursToday = todaysAttendance.reduce(
    (acc, a) => acc + (a.hours.hrs * 3600 + a.hours.mins * 60 + a.hours.secs),
    0
  );
  const totalHoursTodayDisplay = (() => {
    const hrs = Math.floor(totalHoursToday / 3600);
    const mins = Math.floor((totalHoursToday % 3600) / 60);
    const secs = Math.round(totalHoursToday % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  })();

  // Format date for display
  const formatDateForComparison = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Helper to expand leave date range
  const expandLeaveDates = (leave: Leave): string[] => {
    const dates: string[] = [];
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = formatDateForComparison(current);
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Get attendance for selected date
  const selectedDateAttendance = selectedDate
    ? attendance.filter((a) => a.date === selectedDate)
    : [];

  // Get holiday for selected date
  const selectedDateHoliday = selectedDate
    ? holidays.find((h) => h.date === selectedDate)
    : null;

  // Get absences for selected date
  const selectedDateAbsences = selectedDate
    ? absences.filter((a) => a.date === selectedDate)
    : [];

  // Get leaves for selected date
  const selectedDateLeaves = selectedDate
    ? leaves.filter((l) => {
        const leaveDates = expandLeaveDates(l);
        return leaveDates.includes(selectedDate);
      })
    : [];

  // Get attendance requests for selected date
  const selectedDateRequests = selectedDate
    ? attendanceRequests.filter((r) => r.date === selectedDate)
    : [];

  // Get employee shifts for selected date
  const getEmployeeShifts = (empEmail: string) => {
    return shifts.filter(shift => shift.emp_email === empEmail && shift.date === today);
  };

  // Get employee OT records for selected date
  const getEmployeeOT = (empEmail: string) => {
    return otRecords.filter(ot => {
      const otDate = new Date(ot.ot_start);
      const selectedDateObj = new Date(today);
      return ot.email === empEmail &&
             otDate.toDateString() === selectedDateObj.toDateString();
    });
  };

  // Handle calendar date click
  const handleDateClick = (value: Date) => {
    const dateStr = formatDateForComparison(value);
    setSelectedDate(dateStr);
  };

  // Handle approve/reject attendance request
  const handleApproveReject = async (requestId: number, approved: boolean) => {
    const managerEmail = localStorage.getItem("user_email") || "";
    const remark = managerRemarks[requestId]?.trim() || "";

    if (!remark) {
      alert("Please enter a remark before submitting.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/attendance_requests/${requestId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved,
            manager_remark: remark,
            reviewer_email: managerEmail,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update request");

      // Refresh attendance requests
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/attendance_requests/`
      );
      if (refreshRes.ok) {
        const data: AttendanceRequest[] = await refreshRes.json();
        setAttendanceRequests(data);
      }

      // Clear the remark for this request
      setManagerRemarks(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      alert(approved ? "Request approved successfully!" : "Request rejected.");
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Failed to update request. Please try again.");
    }
  };

  // Get tile class for calendar
  const getTileClassName = ({ date }: { date: Date }): string => {
    const dateStr = formatDateForComparison(date);
    
    // Only highlight holidays
    const isHoliday = holidays.some((h) => h.date === dateStr);
    if (isHoliday) return "calendar-holiday";
    
    return "";
  };

  // Group attendance by date
  const attendanceByDate = attendance.reduce((acc, rec) => {
    if (!acc[rec.date]) acc[rec.date] = [];
    acc[rec.date].push(rec);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  const sortedDates = Object.keys(attendanceByDate).sort((a, b) => b.localeCompare(a));

  // ---------------- PDF Generation ----------------
  const downloadPDF = async () => {
    const jsPDFModule = (await import("jspdf")).default;
    const autoTableModule = (await import("jspdf-autotable")).default;

    const doc = new jsPDFModule({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(
      "Today's Attendance Report",
      doc.internal.pageSize.getWidth() / 2,
      40,
      { align: "center" }
    );

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const todayStr = new Date().toLocaleDateString();
    doc.text(`Date: ${todayStr}`, doc.internal.pageSize.getWidth() / 2, 60, {
      align: "center",
    });

    const tableColumn = [
      "ID",
      "Employee Name",
      "Email",
      "Department",
      "Check-in",
      "Check-out",
      "Hours",
    ];
    const tableRows: (string | number)[][] = [];

    todaysAttendance.forEach((rec, idx) => {
      tableRows.push([
        idx + 1,
        rec.fullname || "Unknown",
        rec.email || "-",
        rec.department || "-",
        rec.check_in
          ? new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString()
          : "Pending",
        rec.check_out
          ? new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString()
          : "Pending",
        `${rec.hours.hrs}h ${rec.hours.mins}m ${rec.hours.secs}s`,
      ]);
    });

    autoTableModule(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        lineColor: [44, 62, 80],
        lineWidth: 0.2,
      },
    });

    doc.save(`Attendance-Report-${todayStr}.pdf`);
  };

  return (
    <>
      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        * {
          max-width: 100%;
        }
        .calendar-holiday {
          background-color: #f59e0b !important;
          color: white !important;
          font-weight: bold;
        }
        .calendar-holiday:hover {
          background-color: #d97706 !important;
        }
        .calendar-leave {
          background-color: #10b981 !important;
          color: white !important;
          font-weight: bold;
        }
        .calendar-leave:hover {
          background-color: #059669 !important;
        }
        .calendar-absent {
          background-color: #ef4444 !important;
          color: white !important;
          font-weight: bold;
        }
        .calendar-absent:hover {
          background-color: #dc2626 !important;
        }
        .react-calendar__tile:disabled {
          background-color: transparent !important;
          color: transparent !important;
          cursor: default !important;
          pointer-events: none;
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          visibility: hidden !important;
        }
      `}</style>
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden w-full">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800 w-full"
        >
          Manager Dashboard 📋
        </motion.h1>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            { title: "Total Employees", value: totalEmployees, color: "bg-gradient-to-r from-blue-400 to-blue-600" },
            { title: "Checked In", value: checkedIn, color: "bg-gradient-to-r from-green-400 to-green-600" },
            { title: "Absent", value: absent, color: "bg-gradient-to-r from-red-400 to-red-600" },
            { title: "Total Hours", value: totalHoursTodayDisplay, color: "bg-gradient-to-r from-purple-400 to-purple-600" },
          ].map((kpi) => (
            <motion.div
              key={kpi.title}
              className={`rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-6 text-white shadow-lg flex flex-col justify-between hover:scale-105 transition-transform duration-300 ${kpi.color} min-w-0`}
            >
              <p className="text-xs sm:text-sm md:text-base font-medium opacity-90 truncate">{kpi.title}</p>
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold break-words">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar Section */}
        <motion.div
          className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700">📅 Attendance Calendar</h2>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full overflow-x-hidden">
              <div className="flex-shrink-0">
                <Calendar
                  onChange={(value) => handleDateClick(value as Date)}
                  onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActiveStartDate(activeStartDate)}
                  value={selectedDate ? new Date(selectedDate) : new Date()}
                  activeStartDate={activeStartDate}
                  tileClassName={getTileClassName}
                  tileDisabled={({ date, view }) => view === 'month' && date.getMonth() !== activeStartDate.getMonth()}
                  className="rounded-lg border-2 border-gray-200"
                />
              </div>
              
              {selectedDate && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  {/* Holiday Info */}
                  {selectedDateHoliday && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎉</span>
                        <h4 className="text-lg font-bold text-amber-800">{selectedDateHoliday.name}</h4>
                      </div>
                      {selectedDateHoliday.description && (
                        <p className="text-sm text-amber-700">{selectedDateHoliday.description}</p>
                      )}
                      <p className="text-xs text-amber-600 mt-2 font-semibold">Public Holiday</p>
                    </div>
                  )}
                  
                  {/* Leaves */}
                  {selectedDateLeaves.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-green-700 mb-2">📋 Approved Leaves</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDateLeaves.map((leave) => (
                          <div
                            key={leave.id}
                            className="bg-green-50 border-2 border-green-400 rounded-lg p-3"
                          >
                            <h5 className="font-semibold text-green-800 text-sm mb-1">{leave.email}</h5>
                            <p className="text-xs text-green-700 mb-1">
                              <strong>Type:</strong> {leave.leave_type.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-green-700 mb-1">
                              <strong>Duration:</strong> {leave.start_date} to {leave.end_date}
                            </p>
                            <p className="text-xs text-green-700">
                              <strong>Reason:</strong> {leave.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Absences & Attendance Requests Combined */}
                  {(selectedDateAbsences.length > 0 || selectedDateRequests.length > 0) && (
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-orange-700 mb-3">⚠️ Absences & Requests</h4>
                      <div className="space-y-3">
                        {/* Map through absences and find matching requests */}
                        {selectedDateAbsences.map((absence, idx) => {
                          const matchingRequest = selectedDateRequests.find(r => r.email === absence.email);
                          
                          return (
                            <div
                              key={`${absence.email}-${idx}`}
                              className={`border-2 rounded-lg p-4 ${
                                matchingRequest
                                  ? matchingRequest.status === 'Pending'
                                    ? 'bg-yellow-50 border-yellow-400'
                                    : matchingRequest.status === 'Approved'
                                    ? 'bg-green-50 border-green-400'
                                    : 'bg-red-50 border-red-400'
                                  : 'bg-red-50 border-red-400'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800 text-sm sm:text-base break-words">{absence.fullname}</h5>
                                  <p className="text-xs text-gray-600 break-all">{absence.email}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    <strong>Department:</strong> {absence.department}
                                  </p>
                                </div>
                                {matchingRequest && (
                                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                                    matchingRequest.status === 'Pending'
                                      ? 'bg-yellow-200 text-yellow-800'
                                      : matchingRequest.status === 'Approved'
                                      ? 'bg-green-200 text-green-800'
                                      : 'bg-red-200 text-red-800'
                                  }`}>
                                    {matchingRequest.status}
                                  </span>
                                )}
                              </div>

                              {matchingRequest ? (
                                <>
                                  <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
                                    <p className="text-sm text-gray-800 mb-1">
                                      <strong>📝 Request Reason:</strong>
                                    </p>
                                    <p className="text-sm text-gray-700 italic">&quot;{matchingRequest.reason}&quot;</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Submitted: {new Date(matchingRequest.created_at).toLocaleString()}
                                    </p>
                                  </div>

                                  {matchingRequest.manager_remark && (
                                    <div className="bg-blue-50 rounded p-2 mb-3">
                                      <p className="text-xs text-blue-800">
                                        <strong>Manager Remark:</strong> {matchingRequest.manager_remark}
                                      </p>
                                    </div>
                                  )}

                                  {matchingRequest.status === 'Pending' && (
                                    <>
                                      <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                          Manager Remark:
                                        </label>
                                        <textarea
                                          value={managerRemarks[matchingRequest.id] || ''}
                                          onChange={(e) => setManagerRemarks(prev => ({
                                            ...prev,
                                            [matchingRequest.id]: e.target.value
                                          }))}
                                          placeholder="Enter your remark (e.g., Validated with team; allow office presence.)"
                                          className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          rows={2}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleApproveReject(matchingRequest.id, true)}
                                          className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                          disabled={!managerRemarks[matchingRequest.id]?.trim()}
                                        >
                                          ✓ Approve
                                        </button>
                                        <button
                                          onClick={() => handleApproveReject(matchingRequest.id, false)}
                                          className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                          disabled={!managerRemarks[matchingRequest.id]?.trim()}
                                        >
                                          ✗ Reject
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : (
                                <div className="bg-white bg-opacity-50 rounded p-3">
                                  <p className="text-sm text-red-700">
                                    ⚠️ No attendance request submitted
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Show requests that don't have matching absences */}
                        {selectedDateRequests
                          .filter(req => !selectedDateAbsences.some(abs => abs.email === req.email))
                          .map((request) => (
                            <div
                              key={request.id}
                              className={`border-2 rounded-lg p-4 ${
                                request.status === 'Pending'
                                  ? 'bg-yellow-50 border-yellow-400'
                                  : request.status === 'Approved'
                                  ? 'bg-green-50 border-green-400'
                                  : 'bg-red-50 border-red-400'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800 text-base">{request.email}</h5>
                                </div>
                                <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                                  request.status === 'Pending'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : request.status === 'Approved'
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {request.status}
                                </span>
                              </div>

                              <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
                                <p className="text-sm text-gray-800 mb-1">
                                  <strong>📝 Request Reason:</strong>
                                </p>
                                <p className="text-sm text-gray-700 italic">&quot;{request.reason}&quot;</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Submitted: {new Date(request.created_at).toLocaleString()}
                                </p>
                              </div>

                              {request.manager_remark && (
                                <div className="bg-blue-50 rounded p-2 mb-3">
                                  <p className="text-xs text-blue-800">
                                    <strong>Manager Remark:</strong> {request.manager_remark}
                                  </p>
                                </div>
                              )}

                              {request.status === 'Pending' && (
                                <>
                                  <div className="mb-3">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                      Manager Remark:
                                    </label>
                                    <textarea
                                      value={managerRemarks[request.id] || ''}
                                      onChange={(e) => setManagerRemarks(prev => ({
                                        ...prev,
                                        [request.id]: e.target.value
                                      }))}
                                      placeholder="Enter your remark (e.g., Validated with team; allow office presence.)"
                                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleApproveReject(request.id, true)}
                                      className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                      disabled={!managerRemarks[request.id]?.trim()}
                                    >
                                      ✓ Approve
                                    </button>
                                    <button
                                      onClick={() => handleApproveReject(request.id, false)}
                                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                      disabled={!managerRemarks[request.id]?.trim()}
                                    >
                                      ✗ Reject
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Attendance Records */}
                  <h4 className="text-md font-semibold text-gray-700 mb-2">✅ Attendance Records</h4>
                  {selectedDateAttendance.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {selectedDateAttendance.map((rec) => (
                        <div
                          key={`${rec.email}-${rec.date}`}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold text-gray-800 text-sm">{rec.fullname}</h4>
                          <p className="text-xs text-gray-500 mb-2">{rec.email}</p>

                          {/* Shifts Info */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-400">Shifts</p>
                            {(() => {
                              const empShifts = shifts.filter(shift => shift.emp_email === rec.email && shift.date === selectedDate);
                              return empShifts.length > 0 ? (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {empShifts.map((shift) => {
                                    const startTime = (() => {
                                      if (!shift.start_time) return "Pending";
                                      const timeParts = shift.start_time.split(":");
                                      let hours = parseInt(timeParts[0]);
                                      const minutes = timeParts[1];
                                      const ampm = hours >= 12 ? "PM" : "AM";
                                      hours = hours % 12;
                                      hours = hours ? hours : 12;
                                      return `${hours}:${minutes} ${ampm}`;
                                    })();
                                    const endTime = (() => {
                                      if (!shift.end_time) return "Pending";
                                      const timeParts = shift.end_time.split(":");
                                      let hours = parseInt(timeParts[0]);
                                      const minutes = timeParts[1];
                                      const ampm = hours >= 12 ? "PM" : "AM";
                                      hours = hours % 12;
                                      hours = hours ? hours : 12;
                                      return `${hours}:${minutes} ${ampm}`;
                                    })();
                                    return (
                                      <span
                                        key={shift.shift_id}
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          shift.shift === "Morning"
                                            ? "bg-blue-100 text-blue-700"
                                            : shift.shift === "Evening"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-purple-100 text-purple-700"
                                        }`}
                                      >
                                        {shift.shift} ({startTime} - {endTime})
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">No shifts</p>
                              );
                            })()}
                          </div>

                          {/* OT Info */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-400">Overtime</p>
                            {(() => {
                              const empOT = otRecords.filter(ot => {
                                const otDate = new Date(ot.ot_start);
                                const selectedDateObj = new Date(selectedDate!);
                                return ot.email === rec.email &&
                                       otDate.toDateString() === selectedDateObj.toDateString();
                              });
                              return empOT.length > 0 ? (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {empOT.map((ot) => {
                                    const startTime = new Date(ot.ot_start).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    });
                                    const endTime = new Date(ot.ot_end).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    });

                                    // Calculate duration in hours and minutes
                                    const start = new Date(ot.ot_start);
                                    const end = new Date(ot.ot_end);
                                    const diffMs = end.getTime() - start.getTime();
                                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                                    const duration = diffHours > 0
                                      ? `${diffHours}h ${diffMinutes}m`
                                      : `${diffMinutes}m`;

                                    return (
                                      <span
                                        key={ot.id}
                                        className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                                      >
                                        OT ({startTime} - {endTime}) - {duration}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">No overtime</p>
                              );
                            })()}
                          </div>

                          <div className="flex gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${rec.check_in ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              In: {rec.check_in ? new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString() : 'N/A'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${rec.check_out ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              Out: {rec.check_out ? new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2 mb-2">
                            {rec.check_in_photo && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Check-in</p>
                                <Image
                                  src={rec.check_in_photo || ''}
                                  alt="Check-in photo"
                                  width={48}
                                  height={48}
                                  className="object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedPhoto(rec.check_in_photo || null)}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            {rec.check_out_photo && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Check-out</p>
                                <Image
                                  src={rec.check_out_photo || ''}
                                  alt="Check-out photo"
                                  width={48}
                                  height={48}
                                  className="object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedPhoto(rec.check_out_photo || null)}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            Hours: {rec.hours.hrs}h {rec.hours.mins}m
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No attendance records for this date.</p>
                  )}
                </div>
              )}
            </div>
        </motion.div>

        {/* Today Attendance + Download PDF */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Today Attendance</h2>
            <p className="text-sm text-gray-500">
              {new Date(today).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg sm:mt-5 sm:mb-5 hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>

        {/* Today Attendance Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse bg-white shadow-lg rounded-xl p-4 sm:p-6 flex flex-col gap-3"
              >
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))
          ) : todaysAttendance.length ? (
            <AnimatePresence>
              {todaysAttendance.map((rec, idx) => (
                <motion.div
                  key={`${rec.email}-${rec.date}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
                >
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{rec.fullname}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 break-words">{rec.email}</p>
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <p className="text-xs text-gray-400">Check-in / Check-out</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                          rec.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {rec.check_in ? new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString() : "Pending"}
                      </span>
                      <span
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                          rec.check_out ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {rec.check_out ? new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString() : "Pending"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {rec.check_in_photo && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Check-in</p>
                          <Image
                            src={rec.check_in_photo || ''}
                            alt="Check-in photo"
                            width={48}
                            height={48}
                            className="object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedPhoto(rec.check_in_photo || null)}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      {rec.check_out_photo && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Check-out</p>
                          <Image
                            src={rec.check_out_photo || ''}
                            alt="Check-out photo"
                            width={48}
                            height={48}
                            className="object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedPhoto(rec.check_out_photo || null)}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Shifts Info */}
                  <div className="mb-2 sm:mb-3">
                    <p className="text-xs text-gray-400">Today&apos;s Shifts</p>
                    {(() => {
                      const empShifts = getEmployeeShifts(rec.email);
                      return empShifts.length > 0 ? (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {empShifts.map((shift) => {
                            const startTime = (() => {
                              if (!shift.start_time) return "Pending";
                              const timeParts = shift.start_time.split(":");
                              let hours = parseInt(timeParts[0]);
                              const minutes = timeParts[1];
                              const ampm = hours >= 12 ? "PM" : "AM";
                              hours = hours % 12;
                              hours = hours ? hours : 12;
                              return `${hours}:${minutes} ${ampm}`;
                            })();
                            const endTime = (() => {
                              if (!shift.end_time) return "Pending";
                              const timeParts = shift.end_time.split(":");
                              let hours = parseInt(timeParts[0]);
                              const minutes = timeParts[1];
                              const ampm = hours >= 12 ? "PM" : "AM";
                              hours = hours % 12;
                              hours = hours ? hours : 12;
                              return `${hours}:${minutes} ${ampm}`;
                            })();
                            return (
                              <span
                                key={shift.shift_id}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                  shift.shift === "Morning"
                                    ? "bg-blue-100 text-blue-700"
                                    : shift.shift === "Evening"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {shift.shift} ({startTime} - {endTime})
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1">No shifts assigned</p>
                      );
                    })()}
                  </div>

                  {/* OT Info */}
                  <div className="mb-2 sm:mb-3">
                    <p className="text-xs text-gray-400">Today&apos;s Overtime</p>
                    {(() => {
                      const empOT = getEmployeeOT(rec.email);
                      return empOT.length > 0 ? (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {empOT.map((ot) => {
                            const startTime = new Date(ot.ot_start).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });
                            const endTime = new Date(ot.ot_end).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });

                            // Calculate duration in hours and minutes
                            const start = new Date(ot.ot_start);
                            const end = new Date(ot.ot_end);
                            const diffMs = end.getTime() - start.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                            const duration = diffHours > 0
                              ? `${diffHours}h ${diffMinutes}m`
                              : `${diffMinutes}m`;

                            return (
                              <span
                                key={ot.id}
                                className="px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-green-100 text-green-800"
                              >
                                OT ({startTime} - {endTime}) - {duration}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1">No overtime</p>
                      );
                    })()}
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Worked Hours</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            Math.min(
                              ((rec.hours.hrs + rec.hours.mins / 60 + rec.hours.secs / 3600) / 8) * 100,
                              100
                            )
                          }%`
                        }}
                        transition={{ duration: 1 }}
                        className="h-2 bg-blue-500 rounded-full"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-center text-gray-600 mt-1">
                      {rec.hours.hrs}h {rec.hours.mins}m {rec.hours.secs}s
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full text-center text-gray-500 p-6 sm:p-8 bg-white rounded-xl shadow-lg">
              No attendance records for today&apos;s employees.
            </div>
          )}
        </motion.div>

        {/* All Dates Attendance Section */}
        <motion.div
          className="mt-6 sm:mt-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">📊 All Attendance Records</h2>
          
          {sortedDates.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 w-full">
              {sortedDates.map((date) => {
                const records = attendanceByDate[date];
                const totalHours = records.reduce(
                  (acc, r) => acc + (r.hours.hrs * 3600 + r.hours.mins * 60 + r.hours.secs),
                  0
                );
                const avgHours = totalHours / records.length;
                const avgHoursDisplay = `${Math.floor(avgHours / 3600)}h ${Math.floor((avgHours % 3600) / 60)}m`;
                
                return (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 border border-gray-200 w-full overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                      <div className="min-w-0 w-full sm:w-auto">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 break-words">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {records.length} employee{records.length !== 1 ? 's' : ''} • Avg: {avgHoursDisplay}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        View on Calendar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {records.map((rec) => (
                        <div
                          key={`${rec.email}-${rec.date}`}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold text-gray-800 text-sm truncate">{rec.fullname}</h4>
                          <p className="text-xs text-gray-500 mb-2 truncate">{rec.department}</p>

                          {/* Shifts Info */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-400">Shifts</p>
                            {(() => {
                              const empShifts = shifts.filter(shift => shift.emp_email === rec.email && shift.date === date);
                              return empShifts.length > 0 ? (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {empShifts.map((shift) => {
                                    return (
                                      <span
                                        key={shift.shift_id}
                                        className={`px-1 py-0.5 text-[10px] font-medium rounded ${
                                          shift.shift === "Morning"
                                            ? "bg-blue-100 text-blue-700"
                                            : shift.shift === "Evening"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-purple-100 text-purple-700"
                                        }`}
                                      >
                                        {shift.shift}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-600 mt-1">No shifts</p>
                              );
                            })()}
                          </div>

                          {/* OT Info */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-400">Overtime</p>
                            {(() => {
                              const empOT = otRecords.filter(ot => {
                                const otDate = new Date(ot.ot_start);
                                const selectedDateObj = new Date(date);
                                return ot.email === rec.email &&
                                       otDate.toDateString() === selectedDateObj.toDateString();
                              });
                              return empOT.length > 0 ? (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {empOT.map((ot) => {
                                    // Calculate duration in hours and minutes
                                    const start = new Date(ot.ot_start);
                                    const end = new Date(ot.ot_end);
                                    const diffMs = end.getTime() - start.getTime();
                                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                                    const duration = diffHours > 0
                                      ? `${diffHours}h ${diffMinutes}m`
                                      : `${diffMinutes}m`;

                                    return (
                                      <span
                                        key={ot.id}
                                        className="px-1 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-800"
                                      >
                                        {duration}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-600 mt-1">No OT</p>
                              );
                            })()}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${rec.check_in ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {rec.check_in ? new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No In'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${rec.check_out ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {rec.check_out ? new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No Out'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((rec.hours.hrs + rec.hours.mins / 60) / 8) * 100,
                                    100
                                  )}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {rec.hours.hrs}h {rec.hours.mins}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-8 bg-white rounded-xl shadow-lg">
              No attendance records available.
            </div>
          )}
        </motion.div>

      </div>
    </DashboardLayout>

    {/* Photo Modal */}
    {selectedPhoto && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto relative">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
          <Image
            src={selectedPhoto || ''}
            alt="Attendance photo"
            width={600}
            height={400}
            className="max-w-full max-h-screen object-contain"
          />
        </div>
      </div>
    )}
    </>
  );
}
