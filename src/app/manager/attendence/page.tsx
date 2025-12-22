"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type RawAttendance = {
  email: string;
  fullname: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
};

type AttendanceRecord = {
  email: string;
  fullname: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  hours: { hrs: number; mins: number; secs: number };
  isCurrentlyWorking?: boolean;
  currentHours?: { hrs: number; mins: number; secs: number };
};


type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string;
};

type Shift = {
  date: string;
  emp_email?: string;
  employee_email?: string;
  shift?: string;
  shift_type?: string;
  start_time: string;
  end_time: string;
};

type OT = {
  ot_start: string;
  ot_end: string;
  email: string;
};

type Break = {
  break_start: string;
  break_end?: string;
  email: string;
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

export default function ManagerAttendenceDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Update real-time working hours for currently working employees
  useEffect(() => {
    const interval = setInterval(() => {
      setAttendance(prevAttendance => {
        return prevAttendance.map(record => {
          if (record.isCurrentlyWorking && record.check_in && !record.check_out) {
            const inTime = new Date(`${record.date}T${record.check_in}`).getTime();
            const currentTime = new Date().getTime();
            const diffInSeconds = Math.max(0, (currentTime - inTime) / 1000);
            const currentHours = {
              hrs: Math.floor(diffInSeconds / 3600),
              mins: Math.floor((diffInSeconds % 3600) / 60),
              secs: Math.round(diffInSeconds % 60),
            };
            return {
              ...record,
              currentHours
            };
          }
          return record;
        });
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [managerRemarks, setManagerRemarks] = useState<Record<number, string>>({});

  // Shift, OT, and Break data
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [otRecords, setOtRecords] = useState<OT[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);

  // ---------------- Fetch Attendance ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const rawData = await res.json();
        // Handle different response formats
        let attendanceData: AttendanceRecord[] = [];
        if (rawData.attendance && Array.isArray(rawData.attendance)) {
          attendanceData = rawData.attendance;
        } else if (Array.isArray(rawData)) {
          attendanceData = rawData;
        } else if (rawData.data && Array.isArray(rawData.data)) {
          attendanceData = rawData.data;
        } else {
          attendanceData = [];
        }

        const mapped: AttendanceRecord[] = attendanceData.map((a: RawAttendance) => {
          let hours = { hrs: 0, mins: 0, secs: 0 };
          let currentHours = { hrs: 0, mins: 0, secs: 0 };
          let isCurrentlyWorking = false;
          
          if (a.check_in && a.check_out) {
            // Completed shift
            const inTime = new Date(`${a.date}T${a.check_in}`).getTime();
            const outTime = new Date(`${a.date}T${a.check_out}`).getTime();
            const diffInSeconds = Math.max(0, (outTime - inTime) / 1000);
            hours = {
              hrs: Math.floor(diffInSeconds / 3600),
              mins: Math.floor((diffInSeconds % 3600) / 60),
              secs: Math.round(diffInSeconds % 60),
            };
          } else if (a.check_in && !a.check_out) {
            // Currently working
            isCurrentlyWorking = true;
            const inTime = new Date(`${a.date}T${a.check_in}`).getTime();
            const currentTime = new Date().getTime();
            const diffInSeconds = Math.max(0, (currentTime - inTime) / 1000);
            currentHours = {
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
            check_in_photo: a.check_in_photo || null,
            check_out_photo: a.check_out_photo || null,
            hours,
            isCurrentlyWorking,
            currentHours: isCurrentlyWorking ? currentHours : undefined,
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
        const rawData = await res.json();
        // Handle different response formats based on patterns seen in other components
        let employeesArray = [];
        if (Array.isArray(rawData)) {
          employeesArray = rawData;
        } else if (rawData.employees && Array.isArray(rawData.employees)) {
          employeesArray = rawData.employees;
        } else if (rawData.data && Array.isArray(rawData.data)) {
          employeesArray = rawData.data;
        } else if (rawData.results && Array.isArray(rawData.results)) {
          employeesArray = rawData.results;
        } else {
          // Try to extract employees from various possible keys
          const possibleKeys = ['employees', 'data', 'results', 'users', 'active'];
          for (const key of possibleKeys) {
            if (rawData[key] && Array.isArray(rawData[key])) {
              employeesArray = rawData[key];
              break;
            }
          }
          // If still no array found, try to use rawData directly if it looks like employee data
          if (employeesArray.length === 0 && rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            // Check if rawData itself looks like a single employee record
            if (rawData.email || rawData.email_id || rawData.fullname) {
              employeesArray = [rawData];
            }
          }
        }
        
        setEmployees(employeesArray);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployees([]);
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
        const data = await res.json();
        setHolidays(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching holidays:", err);
        setHolidays([]);
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
        const data = await res.json();
        // Ensure we're setting an array, handling different response formats
        const absencesArray = Array.isArray(data) ? data : (data.absent || data.data || data.absences || []);
        setAbsences(absencesArray);
      } catch (err) {
        console.error("Error fetching absences:", err);
        setAbsences([]); // Ensure it's always an array
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
        const data = await res.json();
        // Ensure we're setting an array, handling different response formats
        const leavesArray = Array.isArray(data) ? data : (data.leaves || data.data || []);
        setLeaves(leavesArray);
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setLeaves([]); // Ensure it's always an array
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
        const data = await res.json();
        setShifts(Array.isArray(data) ? data : (data.shifts || []));
      } catch (err) {
        console.error("Error fetching shifts:", err);
      }
    };
    fetchShifts();
  }, []);

  // ---------------- Fetch OT Records ----------------
  useEffect(() => {
    const fetchOT = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_ot/`
        );
        if (!res.ok) throw new Error("Failed to fetch OT records");
        const data = await res.json();
        setOtRecords(Array.isArray(data) ? data : (data.ot_records || []));
      } catch (err) {
        console.error("Error fetching OT records:", err);
      }
    };
    fetchOT();
  }, []);

  // ---------------- Fetch Breaks ----------------
  useEffect(() => {
    const fetchBreaks = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_breaks/`
        );
        if (!res.ok) throw new Error("Failed to fetch breaks");
        const data = await res.json();
        setBreaks(Array.isArray(data) ? data : (data.breaks || data.break_records || []));
      } catch (err) {
        console.error("Error fetching breaks:", err);
      }
    };
    fetchBreaks();
  }, []);

  // Get today's date in local timezone (YYYY-MM-DD)
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr;
  })();
  
  // Recalculate metrics when data changes
  const totalEmployees = employees.length;
  const todaysAttendance = attendance.filter((a) => a.date === today);
  
  // Get attendance for selected date
  const selectedDateAttendance = selectedDate
    ? attendance.filter((a) => a.date === selectedDate)
    : todaysAttendance;
    
  const checkedIn = selectedDateAttendance.filter((a) => a.check_in).length;
  const currentlyWorking = selectedDateAttendance.filter((a) => a.isCurrentlyWorking).length;
  
  // Calculate absent employees properly
  // Absent = Total employees - Checked in employees
  const absent = Math.max(0, totalEmployees - checkedIn);
  
  // Calculate employees on leave for today
  const leavesToday = leaves.filter(leave => {
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    const currentDate = new Date(today);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    return currentDate >= startDate && currentDate <= endDate && leave.status?.toLowerCase() === 'approved';
  });
  
  const onLeave = leavesToday.length;
  
  // Format date for display
  const formatDateForComparison = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };


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
        // Check if the leave is for the selected date
        const startDate = new Date(l.start_date);
        const endDate = new Date(l.end_date);
        const currentDate = new Date(selectedDate);
        
        // Normalize dates for comparison (set time to 00:00:00)
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        // Check if current date is within the leave period
        return currentDate >= startDate && currentDate <= endDate;
      })
    : [];

  // Helper function to get leave status color
  const getLeaveStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 border-green-400';
      case 'rejected':
        return 'bg-red-50 border-red-400';
      case 'pending':
        return 'bg-orange-50 border-orange-400';
      default:
        return 'bg-gray-50 border-gray-400';
    }
  };

  // Helper function to get leave status text color
  const getLeaveStatusTextColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'text-green-800';
      case 'rejected':
        return 'text-red-800';
      case 'pending':
        return 'text-orange-800';
      default:
        return 'text-gray-800';
    }
  };

  // Get attendance requests for selected date
  const selectedDateRequests = selectedDate
    ? attendanceRequests.filter((r) => r.date === selectedDate)
    : [];

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
        const data = await refreshRes.json();
        setAttendanceRequests(Array.isArray(data) ? data : (data?.attendance_requests || data?.data || []));
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

  // Helper function to format time
  const formatTime = (timeStr: string | null | undefined): string => {
    if (!timeStr || timeStr === "-" || timeStr === "null") return "-";
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(timeStr);
    if (!match) return timeStr;
    const [, hour, min, sec] = match;
    let h = parseInt(hour, 10);
    let m = parseInt(min, 10);
    const s = sec !== undefined ? parseInt(sec, 10) : 0;
    if (s >= 30) {
      m += 1;
      if (m >= 60) {
        m = 0;
        h = (h + 1) % 24;
      }
    }
    const period = h >= 12 ? "PM" : "AM";
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
    const mm = m.toString().padStart(2, "0");
    return `${displayHour}:${mm} ${period}`;
  };

  // Get tile class for calendar
  const getTileClassName = ({ date }: { date: Date }): string => {
    const dateStr = formatDateForComparison(date);
    
    // Check for holidays
    const isHoliday = holidays.some((h) => h.date === dateStr);
    if (isHoliday) return "calendar-holiday";
    
    // Check for leave days
    const isLeaveDay = leaves.some(leave => {
      if (leave.status.toLowerCase() !== 'approved') return false;
      
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const currentDate = new Date(dateStr);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      return currentDate >= startDate && currentDate <= endDate;
    });
    
    if (isLeaveDay) return "calendar-leave";
    
    // Check for absent days (employees who didn't check in and aren't on approved leave)
    const isAbsentDay = absences.some((a) => a.date === dateStr);
    if (isAbsentDay) return "calendar-absent";
    
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
            { title: "Currently Working", value: currentlyWorking, color: "bg-gradient-to-r from-emerald-400 to-emerald-600" },
            { title: "Absent", value: absent, color: "bg-gradient-to-r from-red-400 to-red-600" },
            { title: "On Leave", value: onLeave, color: "bg-gradient-to-r from-yellow-400 to-yellow-600" },
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
                  locale="en-US"
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
                      <h4 className="text-md font-semibold text-green-700 mb-2">📋 Leaves</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedDateLeaves.map((leave) => (
                          <div
                            key={leave.id}
                            className={`rounded-lg p-3 border-2 ${getLeaveStatusColor(leave.status)}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-semibold text-sm mb-1 truncate" title={leave.email}>{leave.email}</h5>
                            </div>
                            <p className="text-xs mb-1">
                              <strong>Type:</strong> {leave.leave_type?.replace(/_/g, ' ')?.toUpperCase() || 'N/A'}
                            </p>
                            <p className="text-xs mb-1">
                              <strong>Period:</strong> {leave.start_date} to {leave.end_date}
                            </p>
                            <p className="text-xs">
                              <strong>Reason:</strong> {leave.reason || 'N/A'}
                            </p>

                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getLeaveStatusTextColor(leave.status)}`}>
                                {leave.status}
                              </span>
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
                                  <h5 className="font-semibold text-gray-800 text-sm sm:text-base break-words truncate" title={absence.fullname}>{absence.fullname}</h5>
                                  <p className="text-xs text-gray-600 truncate" title={absence.email}>{absence.email}</p>
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
                                  <h5 className="font-semibold text-gray-800 text-base truncate" title={request.email}>{request.email}</h5>
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
                  <div className="mb-3">
                    <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="mr-2">✅</span> Attendance Records
                    </h4>
                    <div className="text-xs text-gray-500 mb-3">
                      Showing {selectedDateAttendance.length} record(s) for {selectedDate || 'today'}
                    </div>
                  </div>
                  
                  {selectedDateAttendance.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {selectedDateAttendance.map((rec) => (
                        <div
                          key={`${rec.email}-${rec.date}`}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                        >
                          {/* Employee Info */}
                          <div className="mb-3 pb-2 border-b border-gray-100">
                            <h4 className="font-semibold text-gray-800 text-base truncate" title={rec.fullname}>{rec.fullname}</h4>
                            <p className="text-xs text-gray-500 mt-1" title={rec.email}>
                              <span className="inline-block px-1 py-1 bg-blue-50 text-blue-700 rounded-full text-xs truncate overflow-hidden max-w-[60px]" title={rec.email}>
                                {rec.email}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs truncate max-w-[120px]">
                                {rec.department}
                              </span>
                            </p>
                          </div>
                          
                          {/* Check-in/Check-out Times */}
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">⏱️ Time Records</h5>
                            <div className="flex gap-2 flex-wrap">
                              <div className={`flex-1 min-w-[100px] px-2 py-1.5 text-xs rounded-lg ${rec.check_in ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <div className="font-medium">Check-in</div>
                                <div className="mt-0.5">
                                  {rec.check_in ? new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                </div>
                              </div>
                              <div className={`flex-1 min-w-[100px] px-2 py-1.5 text-xs rounded-lg ${rec.check_out ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                <div className="font-medium">Check-out</div>
                                <div className="mt-0.5">
                                  {rec.check_out ? new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Check-in/Check-out Images */}
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-2">📸 Attendance Photos</h5>
                            <div className="flex gap-4 justify-center">
                              {rec.check_in_photo ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Check-in</span>
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 shadow-sm">
                                    <Image
                                      src={rec.check_in_photo}
                                      alt="Check-in Photo"
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          let placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                                          if (!placeholder) {
                                            placeholder = document.createElement('div') as HTMLElement;
                                            placeholder.className = 'image-placeholder w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs';
                                            placeholder.innerHTML = 'No Img';
                                            parent.appendChild(placeholder);
                                          }
                                          placeholder.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Check-in</span>
                                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              
                              {rec.check_out_photo ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Check-out</span>
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-200 shadow-sm">
                                    <Image
                                      src={rec.check_out_photo}
                                      alt="Check-out Photo"
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          let placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                                          if (!placeholder) {
                                            placeholder = document.createElement('div') as HTMLElement;
                                            placeholder.className = 'image-placeholder w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs';
                                            placeholder.innerHTML = 'No Img';
                                            parent.appendChild(placeholder);
                                          }
                                          placeholder.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Check-out</span>
                                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Shifts, OT, and Breaks for this employee on this date */}
                          <div className="pt-2 border-t border-gray-100">
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">📊 Work Duration</h5>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-600 flex items-center">
                                <span className="mr-1">{rec.isCurrentlyWorking ? '⏳ Currently Working' : '💼 Worked Hours'}</span>
                                {rec.isCurrentlyWorking && (
                                  <motion.span
                                    className="ml-1 w-2 h-2 rounded-full bg-green-500"
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  />
                                )}
                              </p>
                              <p className="text-sm font-semibold text-gray-800">
                                {(rec.isCurrentlyWorking ? rec.currentHours : rec.hours)?.hrs || 0}h
                                {(rec.isCurrentlyWorking ? rec.currentHours : rec.hours)?.mins || 0}m
                              </p>
                            </div>

                            {/* Progress bar for worked hours */}
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(((rec.isCurrentlyWorking ? (rec.currentHours?.hrs || 0) + (rec.currentHours?.mins || 0) / 60 : (rec.hours.hrs || 0) + (rec.hours.mins || 0) / 60) || 0) / 8 * 100, 100)}%`
                                }}
                                transition={{ duration: 1 }}
                                className={`h-full rounded-full ${rec.isCurrentlyWorking ? 'bg-green-500' : 'bg-blue-500'}`}
                              />
                            </div>

                            {/* Shifts */}
                            {shifts.filter(shift => shift.date === selectedDate && (shift.emp_email === rec.email || shift.employee_email === rec.email)).length > 0 && (
                              <div className="bg-blue-50 rounded p-1 mb-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-[10px] font-medium text-blue-700">Shifts</span>
                                </div>
                                {shifts.filter(shift => shift.date === selectedDate && (shift.emp_email === rec.email || shift.employee_email === rec.email)).map((shift, idx) => (
                                  <div key={idx} className="text-[10px] text-blue-600 truncate">
                                    {shift.shift || shift.shift_type || 'General'}: {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* OT */}
                            {otRecords.filter(ot => {
                              const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                              return otDate === selectedDate && ot.email === rec.email;
                            }).length > 0 && (
                              <div className="bg-orange-50 rounded p-1 mb-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg className="w-2.5 h-2.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  <span className="text-[10px] font-medium text-orange-700">Overtime</span>
                                </div>
                                {otRecords.filter(ot => {
                                  const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                                  return otDate === selectedDate && ot.email === rec.email;
                                }).map((ot, idx) => {
                                  const startTime = new Date(ot.ot_start);
                                  const endTime = new Date(ot.ot_end);
                                  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                                  return (
                                    <div key={idx} className="text-[10px] text-orange-600 truncate">
                                      {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({Math.abs(hours).toFixed(1)}h)
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Breaks */}
                            {breaks.filter(br => {
                              const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                              return breakDate === selectedDate && br.email === rec.email;
                            }).length > 0 && (
                              <div className="bg-green-50 rounded p-1 mb-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M9 3v1m6-1v1m-7 5h8m-4 4v.01" />
                                  </svg>
                                  <span className="text-[10px] font-medium text-green-700">Breaks</span>
                                </div>
                                {breaks.filter(br => {
                                  const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                                  return breakDate === selectedDate && br.email === rec.email;
                                }).map((br, idx) => {
                                  const breakStart = new Date(br.break_start);
                                  const breakEnd = br.break_end ? new Date(br.break_end) : null;
                                  const duration = breakEnd ? (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60) : 0;
                                  return (
                                    <div key={idx} className="text-[10px] text-green-600 truncate">
                                      {formatTime(breakStart.toISOString().split('T')[1].substring(0, 8))}
                                      {breakEnd && ` - ${formatTime(breakEnd.toISOString().split('T')[1].substring(0, 8))}`}
                                      {breakEnd && ` (${Math.abs(duration).toFixed(1)}h)`}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="text-gray-500 text-sm">No attendance records found for this date.</p>
                      <p className="text-gray-400 text-xs mt-1">Select a different date or check back later.</p>
                    </div>
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
                    <p className="text-xs sm:text-sm text-gray-500 truncate" title={rec.email}>{rec.email}</p>
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
                  </div>

                  {/* Shifts, OT, and Breaks for this employee on this date */}
                  <div className="mt-3 space-y-2">
                    {/* Shifts */}
                    {shifts.filter(shift => shift.date === rec.date && (shift.emp_email === rec.email || shift.employee_email === rec.email)).length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">Shifts</span>
                        </div>
                        {shifts.filter(shift => shift.date === rec.date && (shift.emp_email === rec.email || shift.employee_email === rec.email)).map((shift, idx) => (
                          <div key={idx} className="text-xs text-blue-600">
                            <div className="font-medium truncate">
                              {shift.shift || shift.shift_type || 'General'}
                            </div>
                            <div className="text-xs text-blue-500 truncate">
                              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                              {/* OT */}
                              {otRecords.filter(ot => {
                                const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                                return otDate === rec.date && ot.email === rec.email;
                              }).length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-xs font-medium text-orange-700">Overtime</span>
                        </div>
                        {otRecords.filter(ot => {
                          const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                          return otDate === rec.date && ot.email === rec.email;
                        }).map((ot, idx) => {
                          const startTime = new Date(ot.ot_start);
                          const endTime = new Date(ot.ot_end);
                          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                          return (
                            <div key={idx} className="text-xs text-orange-600 truncate">
                              {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({Math.abs(hours).toFixed(1)}h)
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Breaks */}
                    {breaks.filter(br => {
                      const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                      return breakDate === rec.date && br.email === rec.email;
                    }).length > 0 && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M9 3v1m6-1v1m-7 5h8m-4 4v.01" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">Breaks</span>
                        </div>
                                {breaks.filter(br => {
                                  const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                                  return breakDate === rec.date && br.email === rec.email;
                                }).map((br, idx) => {
                          const breakStart = new Date(br.break_start);
                          const breakEnd = br.break_end ? new Date(br.break_end) : null;
                          const duration = breakEnd ? (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60) : 0;
                          return (
                            <div key={idx} className="text-xs text-green-600 truncate">
                              {formatTime(breakStart.toISOString().split('T')[1].substring(0, 8))}
                              {breakEnd && ` - ${formatTime(breakEnd.toISOString().split('T')[1].substring(0, 8))}`}
                              {breakEnd && ` (${Math.abs(duration).toFixed(1)}h)`}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Check-in/Check-out Images */}
                  <div className="flex gap-3 mb-3 justify-center">
                    {rec.check_in_photo ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">Check-in</span>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 shadow-sm">
                          <Image
                            src={rec.check_in_photo}
                            alt="Check-in"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                let placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                                if (!placeholder) {
                                  placeholder = document.createElement('div') as HTMLElement;
                                  placeholder.className = 'image-placeholder w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs';
                                  placeholder.innerHTML = 'No Img';
                                  parent.appendChild(placeholder);
                                }
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">Check-in</span>
                        <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {rec.check_out_photo ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">Check-out</span>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-200 shadow-sm">
                          <Image
                            src={rec.check_out_photo}
                            alt="Check-out"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                let placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                                if (!placeholder) {
                                  placeholder = document.createElement('div') as HTMLElement;
                                  placeholder.className = 'image-placeholder w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs';
                                  placeholder.innerHTML = 'No Img';
                                  parent.appendChild(placeholder);
                                }
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">Check-out</span>
                        <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      {rec.isCurrentlyWorking ? 'Working Hours' : 'Worked Hours'}
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            Math.min(
                              (((rec.isCurrentlyWorking ? (rec.currentHours?.hrs || 0) + (rec.currentHours?.mins || 0) / 60 + (rec.currentHours?.secs || 0) / 3600 : rec.hours.hrs + rec.hours.mins / 60 + rec.hours.secs / 3600) || 0) / 8) * 100,
                              100
                            )
                          }%`
                        }}
                        transition={{ duration: 1 }}
                        className={`h-2 rounded-full ${rec.isCurrentlyWorking ? 'bg-green-500' : 'bg-blue-500'}`}
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-center text-gray-600 mt-1 flex items-center justify-center">
                      {(rec.isCurrentlyWorking ? rec.currentHours : rec.hours)?.hrs || 0}h 
                      {(rec.isCurrentlyWorking ? rec.currentHours : rec.hours)?.mins || 0}m 
                      {(rec.isCurrentlyWorking ? rec.currentHours : rec.hours)?.secs || 0}s
                      {rec.isCurrentlyWorking && (
                        <motion.span 
                          className="ml-2 w-2 h-2 rounded-full bg-green-500"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )}
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
                    className="bg-white rounded-xl shadow-md p-5 border border-gray-200 w-full overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 pb-3 border-b border-gray-100">
                      <div className="min-w-0 w-full md:w-auto">
                        <h3 className="text-lg font-bold text-gray-800 break-words flex items-center">
                          <span className="mr-2">📅</span>
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                      </div>
                      <div className="text-right min-w-0 bg-gray-50 px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-bold text-gray-900">{records.length}</span> employee{records.length !== 1 ? 's' : ''} • 
                          <span className="font-semibold">Avg: {avgHoursDisplay}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {records.map((record) => (
                        <div 
                          key={`${record.email}-${date}`}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 flex flex-col"
                        >
                          {/* Employee Info */}
                          <div className="mb-3 pb-2 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 text-base truncate" title={record.fullname}>{record.fullname}</h4>
                            <p className="text-xs text-gray-500 mt-1 truncate" title={record.email}>
                              <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs truncate max-w-[120px]" title={record.email}>
                                {record.email}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs truncate max-w-[120px]">
                                {record.department}
                              </span>
                            </p>
                          </div>

                          {/* Shifts, OT, and Breaks for this employee on this date */}
                          <div className="mb-3 space-y-1">
                            {/* Shifts */}
                            {shifts.filter(shift => shift.date === date && (shift.emp_email === record.email || shift.employee_email === record.email)).length > 0 && (
                              <div className="bg-blue-50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-[10px] font-medium text-blue-700">Shifts</span>
                                </div>
                                {shifts.filter(shift => shift.date === date && (shift.emp_email === record.email || shift.employee_email === record.email)).map((shift, idx) => (
                                  <div key={idx} className="text-[10px] text-blue-600 truncate">
                                    {shift.shift || shift.shift_type || 'General'}: {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* OT */}
                            {otRecords.filter(ot => {
                              const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                              return otDate === date && ot.email === record.email;
                            }).length > 0 && (
                              <div className="bg-orange-50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg className="w-2.5 h-2.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  <span className="text-[10px] font-medium text-orange-700">Overtime</span>
                                </div>
                                {otRecords.filter(ot => {
                                  const otDate = new Date(ot.ot_start).toISOString().split('T')[0];
                                  return otDate === date && ot.email === record.email;
                                }).map((ot, idx) => {
                                  const startTime = new Date(ot.ot_start);
                                  const endTime = new Date(ot.ot_end);
                                  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                                  return (
                                    <div key={idx} className="text-[10px] text-orange-600 truncate">
                                      {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({Math.abs(hours).toFixed(1)}h)
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Breaks */}
                            {breaks.filter(br => {
                              const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                              return breakDate === date && br.email === record.email;
                            }).length > 0 && (
                              <div className="bg-green-50 rounded p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z M9 3v1m6-1v1m-7 5h8m-4 4v.01" />
                                  </svg>
                                  <span className="text-[10px] font-medium text-green-700">Breaks</span>
                                </div>
                                {breaks.filter(br => {
                                  const breakDate = new Date(br.break_start).toISOString().split('T')[0];
                                  return breakDate === date && br.email === record.email;
                                }).map((br, idx) => {
                                  const breakStart = new Date(br.break_start);
                                  const breakEnd = br.break_end ? new Date(br.break_end) : null;
                                  const duration = breakEnd ? (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60) : 0;
                                  return (
                                    <div key={idx} className="text-[10px] text-green-600 truncate">
                                      {formatTime(breakStart.toISOString().split('T')[1].substring(0, 8))}
                                      {breakEnd && ` - ${formatTime(breakEnd.toISOString().split('T')[1].substring(0, 8))}`}
                                      {breakEnd && ` (${Math.abs(duration).toFixed(1)}h)`}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Time Records */}
                          <div className="mb-3 flex-grow">
                            <div className="flex gap-2 mb-2">
                              <div className={`flex-1 px-2 py-1.5 text-xs rounded-lg ${record.check_in ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <div className="font-medium text-[10px]">📥 Check-in</div>
                                <div className="mt-0.5 font-semibold">
                                  {record.check_in ? new Date(`${date}T${record.check_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                </div>
                              </div>
                              <div className={`flex-1 px-2 py-1.5 text-xs rounded-lg ${record.check_out ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                <div className="font-medium text-[10px]">📤 Check-out</div>
                                <div className="mt-0.5 font-semibold">
                                  {record.check_out ? new Date(`${date}T${record.check_out}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                </div>
                              </div>
                            </div>


                          </div>
                          
                          {/* Worked Hours */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">⏱️ Worked</span>
                              <span className="text-sm font-bold text-gray-800">{record.hours.hrs}h {record.hours.mins}m</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.min(((record.hours.hrs + record.hours.mins / 60) / 8) * 100, 100)}%`
                                }}
                              />
                            </div>
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
    </>
  );
}
