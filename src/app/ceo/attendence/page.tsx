"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import "react-calendar/dist/Calendar.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";


type Holiday = {
  date: string;
  summary: string;
  type: "Government" | "Bank" | "Festival" | "Jayanthi";
  description?: string;
}

type RawAttendanceRecord = {
  email?: string;
  fullname?: string;
  department?: string;
  date?: string;
  check_in?: string | null;
  check_out?: string | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  check_in_img?: string | null;
  check_out_img?: string | null;
  photo_in?: string | null;
  photo_out?: string | null;
  [key: string]: unknown; // Allow additional fields
};

type AttendanceRecord = {
  email: string;
  fullname: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  checkInDateTime?: string | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  hours: { hrs: number; mins: number; secs: number };
  isCurrentlyWorking?: boolean;
};



type RawEmployee = {
  id?: number;
  email?: string;
  fullname?: string;
  department?: string;
  date_joined?: string;
  reports_to?: string;
  profile_picture?: string | null;
  [key: string]: unknown; // Allow additional fields
};

type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string;
  date_joined?: string;
  reports_to?: string;
  profile_picture?: string | null;
  [key: string]: unknown;
};

import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  // Helper to format date as DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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

  // Helper to calculate real-time hours for currently working employees
  const calculateRealTimeHours = (checkInTime: string, currentDate: Date) => {
    const inTime = new Date(checkInTime).getTime();
    const currentTime = currentDate.getTime();
    const diffInSeconds = Math.max(0, (currentTime - inTime) / 1000);
    return {
      hrs: Math.floor(diffInSeconds / 3600),
      mins: Math.floor((diffInSeconds % 3600) / 60),
      secs: Math.round(diffInSeconds % 60),
    };
  };
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  // --- For mini calendar selection (full attendance list) ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [holidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<
    {
      employee_name?: string;
      status: string;
      date: string;
      [key: string]: unknown;
    }[]
  >([]);
  // Attendance filter for attendance cards
  // null = all, "checked-in" = only checked-in, "absent" = only absent
  const [attendanceFilter, setAttendanceFilter] = useState<null | "checked-in" | "absent">(null);
  // Leaves KPI (updates with selected date)
  const [leavesToday, setLeavesToday] = useState(0);

  // Shift, OT, and Break data
  const [shifts, setShifts] = useState<any[]>([]);
  const [otRecords, setOtRecords] = useState<any[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [loadingOT, setLoadingOT] = useState(true);
  const [loadingBreaks, setLoadingBreaks] = useState(true);

  // Fetch leaves for selected date (or today if none selected) - improved for local timezone
  useEffect(() => {
    const fetchLeavesForDate = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`
        );
        if (!res.ok) throw new Error("Failed to fetch leaves");
        const data = await res.json();
        const leaves = data.leaves || [];
        const targetDate = selectedDate
          ? new Date(selectedDate)
          : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

        const matchingLeaves = leaves.filter((l: { start_date: string; end_date: string; status: string }) => {
          if (l.status !== "Approved") return false;

          const start = new Date(l.start_date);
          const end = new Date(l.end_date);

          // Normalize start and end to cover full local day
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          return targetDate >= start && targetDate <= end;
        });
        setLeavesToday(matchingLeaves.length);
      } catch (err) {
        console.error("Error fetching leaves for date:", err);
      }
    };
    fetchLeavesForDate();
  }, [selectedDate]);
  const router = useRouter();

  // ---------------- Fetch Attendance ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const responseData = await res.json();
        console.log('Raw attendance data:', responseData);
        const data = Array.isArray(responseData) ? { attendance: responseData } : responseData;

        const mapped: AttendanceRecord[] = (data.attendance || []).map((a: RawAttendanceRecord) => {
          let hours = { hrs: 0, mins: 0, secs: 0 };
          if (a.check_in && a.check_out) {
            const inTime = new Date(`${a.date || ''}T${a.check_in}`).getTime();
            const outTime = new Date(`${a.date || ''}T${a.check_out}`).getTime();
            const diffInSeconds = Math.max(0, (outTime - inTime) / 1000);
            hours = {
              hrs: Math.floor(diffInSeconds / 3600),
              mins: Math.floor((diffInSeconds % 3600) / 60),
              secs: Math.round(diffInSeconds % 60),
            };
          }
          // Check if employee is currently working (checked in but not checked out)
          const isCurrentlyWorking = a.check_in && !a.check_out;

          // Store check-in datetime for real-time calculations
          const checkInDateTime = a.check_in ? `${a.date || ''}T${a.check_in}` : null;

          console.log('Processing attendance record:', a);
          console.log('Check-in photo field:', a.check_in_photo);
          console.log('Check-out photo field:', a.check_out_photo);
          // Check for different possible field names for photos
          const checkInPhoto = a.check_in_photo || a.checkInPhoto || a.check_in_img || a.photo_in || null;
          const checkOutPhoto = a.check_out_photo || a.checkOutPhoto || a.check_out_img || a.photo_out || null;
          console.log('Mapped check-in photo:', checkInPhoto);
          console.log('Mapped check-out photo:', checkOutPhoto);

          return {
            email: a.email || '',
            fullname: a.fullname || '',
            department: a.department || '',
            date: a.date || '',
            check_in: a.check_in || null,
            check_out: a.check_out || null,
            check_in_photo: checkInPhoto,
            check_out_photo: checkOutPhoto,
            checkInDateTime,
            hours,
            isCurrentlyWorking,
          };
        });

        setAttendance(mapped);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Error fetching data:", message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update current time every second for real-time calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ---------------- Fetch Employees ----------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`
        );
        if (!res.ok) throw new Error("Failed to fetch employees");
        const responseData = await res.json();
        const data = Array.isArray(responseData) ? responseData : (responseData?.employees || responseData?.data || []);
        const today = new Date();
        const filtered = data.filter((emp: RawEmployee) => {
          if (!emp.date_joined) return true;
          const joinDate = new Date(emp.date_joined || '');
          return joinDate <= today; // include only if joined on or before today
        });
        const mappedEmployees: Employee[] = filtered.map((emp: RawEmployee) => ({
          id: emp.id || 0,
          email: emp.email || '',
          fullname: emp.fullname || '',
          department: emp.department || '',
          date_joined: emp.date_joined,
          reports_to: emp.reports_to,
          profile_picture: emp.profile_picture || null
        }));
        setEmployees(mappedEmployees);
        setTotalEmployees(mappedEmployees.length);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // ---------------- Fetch Shifts ----------------
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoadingShifts(true);
        const res = await fetch(
          `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/list_shifts/`
        );
        if (!res.ok) throw new Error("Failed to fetch shifts");
        const data = await res.json();
        setShifts(Array.isArray(data) ? data : (data.shifts || []));
      } catch (err) {
        console.error("Error fetching shifts:", err);
      } finally {
        setLoadingShifts(false);
      }
    };
    fetchShifts();
  }, []);

  // ---------------- Fetch OT Records ----------------
  useEffect(() => {
    const fetchOT = async () => {
      try {
        setLoadingOT(true);
        const res = await fetch(
          `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/list_ot/`
        );
        if (!res.ok) throw new Error("Failed to fetch OT records");
        const data = await res.json();
        setOtRecords(Array.isArray(data) ? data : (data.ot_records || []));
      } catch (err) {
        console.error("Error fetching OT records:", err);
      } finally {
        setLoadingOT(false);
      }
    };
    fetchOT();
  }, []);

  // ---------------- Fetch Breaks ----------------
  useEffect(() => {
    const fetchBreaks = async () => {
      try {
        setLoadingBreaks(true);
        const res = await fetch(
          `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/list_breaks/`
        );
        if (!res.ok) throw new Error("Failed to fetch breaks");
        const data = await res.json();
        setBreaks(Array.isArray(data) ? data : (data.breaks || data.break_records || []));
      } catch (err) {
        console.error("Error fetching breaks:", err);
      } finally {
        setLoadingBreaks(false);
      }
    };
    fetchBreaks();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  // Build attendance for selected date (or today if none selected): include absent employees as well
  const effectiveDate = selectedDate || today;
  const effectiveDateObj = new Date(effectiveDate);
  const isFutureDate = effectiveDateObj > new Date(today);
  const attendanceRecordsForDate = attendance.filter((a) => a.date === effectiveDate);
  // Map email to attendance record for the date for quick lookup
  const attendanceMap: Record<string, AttendanceRecord> = {};
  attendanceRecordsForDate.forEach((rec) => {
    attendanceMap[rec.email] = rec;
  });
  // Compose full list: for each employee, get their attendance record for the date, or fill as absent
  const dateAttendance = employees
    .filter((emp) => {
      // Skip if employee joined after the selected date
      if (!emp.date_joined) return true;
      const joinedDate = new Date(emp.date_joined);
      const checkDate = new Date(effectiveDate);
      return joinedDate <= checkDate; // Include only if joined before or on that date
    })
    .map((emp) => {
      const rec = attendanceMap[emp.email];
      if (rec) {
        return rec;
      } else {
        // Mark as absent only if joined before or on this date
        return {
          email: emp.email,
          fullname: emp.fullname,
          department: emp.department,
          date: effectiveDate,
          check_in: null,
          check_out: null,
          hours: { hrs: 0, mins: 0, secs: 0 },
        };
      }
    });
  console.log("Computed dateAttendance for", effectiveDate, ":", dateAttendance);
  // Filtered attendance for KPI cards click
  const filteredDateAttendance = attendanceFilter === "checked-in"
    ? dateAttendance.filter((a) => a.check_in)
    : attendanceFilter === "absent"
    ? dateAttendance.filter((a) => !a.check_in)
    : dateAttendance;
  // Calculate checked-in and absent safely to prevent negative values
  const employeesForDate = employees.filter(emp =>
    dateAttendance.some(a => a.email === emp.email && a.date <= today)
  );

  const checkedIn = employeesForDate.filter(emp =>
    dateAttendance.find(a => a.email === emp.email && a.date <= today)?.check_in
  ).length;

  const absent = Math.max(employeesForDate.length - checkedIn, 0); // ensure not negative

  const totalHoursForDate = dateAttendance.reduce(
    (acc, a) => acc + (a.hours.hrs * 3600 + a.hours.mins * 60 + a.hours.secs),
    0
  );
  const totalHoursForDateDisplay = (() => {
    const hrs = Math.floor(totalHoursForDate / 3600);
    const mins = Math.floor((totalHoursForDate % 3600) / 60);
    const secs = Math.round(totalHoursForDate % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  })();

  // Recharts Data Preparation
  // Pie Chart: Attendance Distribution
  const attendancePieData = [
    { name: "Checked In", value: checkedIn },
    { name: "Absent", value: absent },
  ];
  const pieColors = ["#34d399", "#f87171"]; // green, red

  // ---------------- Bar Chart: Daily Hours Worked per Employee (for selected date) ----------------
  // If selectedDate is set, show hours for that date, else show for today
  const barChartData = dateAttendance.map((rec) => ({
    name: (rec.fullname || 'Unknown').length > 14 ? (rec.fullname || 'Unknown').slice(0, 12) + "…" : (rec.fullname || 'Unknown'),
    hours: Number((rec.hours.hrs + rec.hours.mins / 60 + rec.hours.secs / 3600).toFixed(2)),
  }));

  // ---------------- PDF Generation ----------------
  // Download PDF for selected date or today
  const downloadPDF = async () => {
    const jsPDFModule = (await import("jspdf")).default;
    const autoTableModule = (await import("jspdf-autotable")).default;

    const doc = new jsPDFModule({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });

    // Add company logo and name at the top
    // Fetch the logo as base64
    // Use the actual hosted logo URL
    const logoUrl = "https://www.globaltechsoftwaresolutions.com/_next/image?url=%2Flogo%2FGlobal.jpg&w=64&q=75";
    let logoBase64: string | undefined;
    try {
      // Fetch the image and convert to base64
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const toBase64 = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result.split(",")[1]);
            else reject("Failed to convert logo to base64");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      logoBase64 = await toBase64(blob);
    } catch (e) {
      console.warn("Could not load company logo for PDF:", e);
      logoBase64 = undefined;
    }

    let y = 30;
    if (logoBase64) {
      // Add the logo (width: 70, height: 70)
      doc.addImage(
        logoBase64,
        "PNG",
        doc.internal.pageSize.getWidth() / 2 - 35,
        y,
        70,
        70
      );
      y += 80; // Larger gap after bigger logo
    }
    // Add company name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(
      "Global Tech Solutions",
      doc.internal.pageSize.getWidth() / 2,
      y,
      { align: "center" }
    );
    y += 35; // More spacing after company name

    // Title
    doc.setFontSize(20);
    doc.text(
      `${selectedDate ? formatDate(selectedDate) : "Today's"} Attendance Report`,
      doc.internal.pageSize.getWidth() / 2,
      y,
      { align: "center" }
    );
    y += 30; // More spacing after title

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const dateStr = selectedDate
      ? (() => {
          const d = new Date(selectedDate);
          return d.toLocaleDateString();
        })()
      : new Date().toLocaleDateString();
    doc.text(`Date: ${dateStr}`, doc.internal.pageSize.getWidth() / 2, y + 15, {
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

    dateAttendance.forEach((rec, idx) => {
      let checkInDisplay = "Absent";
      let checkOutDisplay = "Absent";
      let hoursDisplay = "Absent";

      if (rec?.check_in) {
        checkInDisplay = new Date(`${rec?.date}T${rec?.check_in}`).toLocaleTimeString();
        if (rec?.check_out) {
          checkOutDisplay = new Date(`${rec?.date}T${rec?.check_out}`).toLocaleTimeString();
          hoursDisplay = `${rec?.hours.hrs}h ${rec?.hours.mins}m ${rec?.hours.secs}s`;
        } else {
          checkOutDisplay = "Pending";
          hoursDisplay = `${rec?.hours.hrs}h ${rec?.hours.mins}m ${rec?.hours.secs}s`;
        }
      }

      tableRows.push([
        idx + 1,
        rec.fullname || "Unknown",
        rec.email || "-",
        rec.department || "-",
        checkInDisplay,
        checkOutDisplay,
        hoursDisplay,
      ]);
    });

    autoTableModule(doc, {
      startY: y + 35,
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

    doc.save(
      `Attendance-Report-${selectedDate ? selectedDate : today}.pdf`
    );
  };


useEffect(() => {
  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const data = await res.json();
      // Ensure leaves is always an array
      setLeaves(Array.isArray(data.leaves) ? data.leaves : []);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setLeaves([]);
    }
  };
  fetchLeaves();
}, []);

const calendarEvents = [
  ...holidays.map((h) => ({
    title: `${h.summary} (${h.type})`,
    start: h.date,
    backgroundColor:
      h.type === "Government"
        ? "#3b82f6"
        : h.type === "Bank"
        ? "#a855f7"
        : h.type === "Jayanthi"
        ? "#22c55e"
        : "#f97316",
    textColor: "#fff",
  })),
  ...leaves.map((l) => {
    // Fix: add 1 day to end date since FullCalendar excludes the end date itself
    // Remove unused variable 'start'
    const end = new Date(String(l.end_date));
    end.setDate(end.getDate() + 1);

    // Find employee details from employees array
    const employee = employees.find(emp => emp.email === l.email);
    const employeeName = employee?.fullname || l.employee_name || "Employee";
    const reportingManager = employee?.reports_to || "N/A";

    return {
      title: `${employeeName} - ${l.status}`,
      start: String(l.start_date),
      end: end.toISOString().split("T")[0],
      backgroundColor:
        l.status === "Approved"
          ? "#22c55e"
          : l.status === "Pending"
          ? "#f59e0b"
          : "#ef4444",
      textColor: "#fff",
      extendedProps: {
        employee_name: employeeName,
        reporting_manager: reportingManager,
        leave_type: l.leave_type,
        reason: l.reason,
        status: l.status,
        start_date: l.start_date,
        end_date: l.end_date,
      },
    };
  }),
];



  return (
    <>
      <style jsx global>{`
        .highlight-day {
          background-color: rgba(59, 130, 246, 0.15) !important;
          border-radius: 8px;
          transition: background-color 0.3s ease;
        }

        /* Mobile-responsive calendar styles */
        @media (max-width: 640px) {
          .fc {
            font-size: 10px !important;
          }
          .fc-toolbar-title {
            font-size: 14px !important;
          }
          .fc-button {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          .fc-daygrid-day-number {
            font-size: 11px !important;
            padding: 2px !important;
          }
          .fc-daygrid-event {
            font-size: 9px !important;
            padding: 1px 2px !important;
          }
          .fc-col-header-cell-cushion {
            padding: 4px 2px !important;
            font-size: 10px !important;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .fc {
            font-size: 12px !important;
          }
          .fc-toolbar-title {
            font-size: 16px !important;
          }
        }

        /* Pie chart label styles */
        .recharts-pie-label-text {
          font-size: 9px !important;
        }

        @media (min-width: 640px) {
          .recharts-pie-label-text {
            font-size: 11px !important;
          }
        }

        @media (min-width: 768px) {
          .recharts-pie-label-text {
            font-size: 12px !important;
          }
        }

        /* Legend styles */
        .recharts-legend-wrapper {
          font-size: 9px !important;
        }

        @media (min-width: 640px) {
          .recharts-legend-wrapper {
            font-size: 11px !important;
          }
        }
      `}</style>
      <DashboardLayout role="ceo">
      <div className="space-y-4 sm:space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 md:mb-3 lg:mb-4 text-gray-800 w-full"
        >
          CEO ATTENDANCE 📋
        </motion.h1>

        {/* KPI Cards */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-2 md:gap-3 lg:gap-4 w-full mb-4 sm:mb-5 md:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            {
              title: "Total Employees",
              value: totalEmployees,
              color: "bg-gradient-to-r from-blue-400 to-blue-600",
              onClick: () => router.push("/ceo/employees/"),
            },
            {
              title: "Checked In",
              value: checkedIn,
              color: "bg-gradient-to-r from-green-400 to-green-600",
              onClick: () => {
                setAttendanceFilter("checked-in");
                setTimeout(() => {
                  const section = document.getElementById("attendance-section");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }, 0);
              },
            },
            {
              title: "Absent",
              value: absent,
              color: "bg-gradient-to-r from-red-400 to-red-600",
              onClick: () => {
                setAttendanceFilter("absent");
                setTimeout(() => {
                  const section = document.getElementById("attendance-section");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }, 0);
              },
            },
            // Insert Leaves KPI before Total Hours
            {
              title: "Leaves",
              value: leavesToday,
              color: "bg-gradient-to-r from-yellow-400 to-yellow-600",
              onClick: () => {
                setAttendanceFilter(null);
                setTimeout(() => {
                  const section = document.getElementById("attendance-section");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }, 0);
              },
            },
            {
              title: "Total Hours",
              value: totalHoursForDateDisplay,
              color: "bg-gradient-to-r from-purple-400 to-purple-600",
              onClick: () => {
                setAttendanceFilter(null);
                setTimeout(() => {
                  const section = document.getElementById("attendance-section");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }, 0);
              },
            },
          ].map((kpi) => (
            <motion.div
              key={kpi.title}
              className={`flex flex-col items-center justify-center bg-white shadow-lg rounded-xl p-4 sm:p-2 md:p-3 lg:p-4 xl:p-5 w-full sm:flex-1 hover:scale-105 transition-transform duration-300 ${kpi.color} cursor-pointer min-h-[80px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[100px]`}
              onClick={kpi.onClick}
              tabIndex={0}
              role="button"
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  kpi.onClick();
                }
              }}
            >
              <p className="text-sm sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-semibold text-center leading-tight text-white break-words">{kpi.title}</p>
              <p className="text-xl sm:text-xs md:text-sm lg:text-lg xl:text-2xl font-bold text-center whitespace-nowrap overflow-hidden truncate leading-tight mt-2 sm:mt-1 text-white">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section */}
        {/* Charts Section */}
        {/* Always show charts */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 md:gap-3 lg:gap-4 mb-1 sm:mb-2 md:mb-4 lg:mb-6">
          {/* Pie Chart - Attendance Distribution */}
          <div className="w-full bg-white rounded shadow-sm p-1 sm:p-2 md:p-3 lg:p-5 flex flex-col items-center overflow-hidden">
            <h3 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2 lg:mb-3">Attendance Distribution</h3>
            <div className="w-full h-40 sm:h-56 md:h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    label={(props) => {
                      const { name, percent } = props as unknown as { name: string; percent: number };
                      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                      if (isMobile) {
                        // Show only percentage on mobile
                        return `${(percent * 100).toFixed(0)}%`;
                      }
                      return `${name} (${(percent * 100).toFixed(0)}%)`;
                    }}
                  >
                    {attendancePieData.map((entry, idx) => {
                      return <Cell key={`cell-${entry.name}`} fill={pieColors[idx % pieColors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip />
                  <RechartsLegend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: '10px' }}
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Bar Chart - Hours Worked per Employee */}
          <div className="w-full bg-white rounded shadow-sm p-1 sm:p-2 md:p-3 lg:p-5 flex flex-col items-center overflow-hidden">
            <h3 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2 lg:mb-3">
              Hours Worked Per Employee ({selectedDate ? formatDate(selectedDate) : "Today"})
            </h3>
            <div className="w-full h-40 sm:h-56 md:h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft", fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Today's/Selected Date Attendance + Download PDF */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 sm:mb-2 md:mb-3 gap-1 sm:gap-2">
          <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700">
            {selectedDate ? `${formatDate(selectedDate)} Attendance` : "Today's Attendance"}
          </h2>
          <button
            onClick={downloadPDF}
            className="w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white text-[10px] sm:text-xs md:text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Download PDF
          </button>
        </div>

        {/* Date Attendance Cards */}
        <motion.div
          id="attendance-section"
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-3 lg:gap-4 mb-4 sm:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {loading || loadingEmployees ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full animate-pulse bg-white shadow-lg rounded-lg p-3 sm:p-4 lg:p-6 flex flex-col gap-2 sm:gap-3 min-w-0"
              >
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))
          ) : (
            (() => {
              // If selected/focused date is in the future, show "Future Date"
              if (isFutureDate) {
                return (
                  <div className="col-span-full flex items-center justify-center py-16">
                    <span className="italic text-gray-400 text-lg">Future Date</span>
                  </div>
                );
              }
              // If all employees are absent for the selected date, show single "Leave / No Attendance" card
              if (
                selectedDate &&
                dateAttendance.length > 0 &&
                dateAttendance.every(a => !a.check_in)
              ) {
                return (
                  <div className="col-span-full flex items-center justify-center py-16">
                    <span className="italic text-gray-400 text-lg">Leave / No Attendance</span>
                  </div>
                );
              }
              // If not in the future, show cards or message
              if (filteredDateAttendance.length) {
                return (
                  <AnimatePresence>
                    {filteredDateAttendance.map((rec, idx) => (
                      <motion.div
                        key={`${rec.email}-${rec.date}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 md:p-4 lg:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between min-w-0 overflow-hidden"
                      >
                        <div className="mb-2 sm:mb-3 md:mb-4">
                          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{rec.fullname}</h3>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 break-all truncate">{rec.email}</p>
                        </div>
                        {/* Check-in/Check-out Images */}
                        <div className="flex gap-4 mb-3 justify-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">Check-in</span>
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 shadow-sm">
                              {rec?.check_in_photo ? (
                                <>
                                  {console.log('Rendering check-in image:', rec?.check_in_photo)}
                                  <Image
                                    src={rec?.check_in_photo.startsWith('http') ? rec?.check_in_photo : `${process.env.NEXT_PUBLIC_API_URL}${rec?.check_in_photo}`}
                                    alt="Check-in Photo"
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                    onError={(e) => {
                                      console.error('Error loading check-in image:', e);
                                      // Handle image loading error
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">Check-out</span>
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-200 shadow-sm">
                              {rec?.check_out_photo ? (
                                <>
                                  {console.log('Rendering check-out image:', rec?.check_out_photo)}
                                  <Image
                                    src={rec?.check_out_photo.startsWith('http') ? rec?.check_out_photo : `${process.env.NEXT_PUBLIC_API_URL}${rec?.check_out_photo}`}
                                    alt="Check-out Photo"
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                    onError={(e) => {
                                      console.error('Error loading check-out image:', e);
                                      // Handle image loading error
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mb-2 sm:mb-3">                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400">Check-in / Check-out</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                rec?.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rec?.check_in
                                ? new Date(`${rec?.date}T${rec?.check_in}`).toLocaleTimeString()
                                : "Absent"}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                rec?.check_out
                                  ? "bg-green-100 text-green-700"
                                  : rec?.check_in
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rec?.check_out
                                ? new Date(`${rec?.date}T${rec?.check_out}`).toLocaleTimeString()
                                : rec?.check_in
                                ? "Pending"
                                : "Absent"}
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

                        <div>                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400 mb-1">Worked Hours</p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  rec.check_in
                                    ? rec.isCurrentlyWorking && rec.checkInDateTime
                                      ? (() => {
                                          const realTimeHours = calculateRealTimeHours(rec.checkInDateTime, currentTime);
                                          return Math.min(
                                            ((realTimeHours.hrs + realTimeHours.mins / 60 + realTimeHours.secs / 3600) / 8) * 100,
                                            100
                                          );
                                        })()
                                      : Math.min(
                                          ((rec?.hours.hrs + rec?.hours.mins / 60 + rec?.hours.secs / 3600) / 8) * 100,
                                          100
                                        )
                                    : 0
                                }%`
                              }}
                              transition={{ duration: 1 }}
                              className={`h-2 ${rec?.isCurrentlyWorking ? "bg-green-500" : rec?.check_in ? "bg-blue-500" : "bg-gray-300"} rounded-full`}
                            />
                          </div>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-center text-gray-600 mt-1 flex items-center justify-center">
                            {rec?.check_in
                              ? rec?.isCurrentlyWorking && rec?.checkInDateTime
                                ? (() => {
                                  const realTimeHours = calculateRealTimeHours(rec?.checkInDateTime, currentTime);
                                  return `${realTimeHours.hrs}h ${realTimeHours.mins}m ${realTimeHours.secs}s`;
                                })()
                                : `${rec?.hours.hrs}h ${rec?.hours.mins}m ${rec?.hours.secs}s`
                              : "Absent"}
                            {rec?.isCurrentlyWorking && (
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
                );
              }
              // If no attendance cards for date, and not in the future
              return (
                <div className="col-span-full text-center text-gray-500 p-6 sm:p-8 bg-white rounded-xl shadow-lg">
                  No attendance records for this date.
                </div>
              );
            })()
          )}
        </motion.div>

        {/* Full Attendance List */}
        <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-700 mb-2">Full Attendance Records</h2>
        {/* Calendar for filtering */}
        <div className="mb-4 flex flex-col items-center">
          <div className="bg-white p-2 sm:p-4 rounded-xl shadow-md w-full max-w-5xl">
            {/* Show selected date above calendar */}
            {selectedDate && (
              <div className="mb-2 text-center text-gray-700 font-semibold text-xs sm:text-sm md:text-base">
                Showing attendance for: {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            )}
            <div className="mx-auto w-full">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                contentHeight="auto"
                aspectRatio={1.35}
                showNonCurrentDates={false}
                events={calendarEvents}
                eventClick={(info) => {
                  const { leave_type, reason, status, start_date, end_date, employee_name, reporting_manager } = info.event.extendedProps || {};
                  const details = `
                    <div style="
                      color: black;
                      position: relative;
                      border-radius: 10px;
                      padding: 0;
                      max-width: min(320px, 90vw);
                      font-family: sans-serif;
                      overflow: hidden;
                    ">
                      <div style="
                        position: absolute;
                        inset: 0;
                        background: rgba(20,20,20,0.48);
                        z-index: 0;
                        pointer-events: none;
                      "></div>
                      <div style="
                        position: relative;
                        background: #fff;
                        color: #000;
                        border-radius: 10px;
                        padding: 18px 18px 14px 18px;
                        box-shadow: 0 4px 14px rgba(0,0,0,0.28);
                        font-weight: 600;
                        z-index: 1;
                      ">
                        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 10px; color: #111;">${info.event.title}</h3>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>Employee:</strong> <span style="font-weight:400">${employee_name || "N/A"}</span></p>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>Reporting Manager:</strong> <span style="font-weight:400">${reporting_manager || "N/A"}</span></p>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>Type:</strong> <span style="font-weight:400">${leave_type || "N/A"}</span></p>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>Reason:</strong> <span style="font-weight:400">${reason || "N/A"}</span></p>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>Status:</strong> <span style="font-weight:400">${status || "N/A"}</span></p>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>From:</strong> <span style="font-weight:400">${start_date || info.event.startStr}</span></p>
                        <p style="font-size: 13px; margin: 4px 0; font-weight: 500;"><strong>To:</strong> <span style="font-weight:400">${end_date || "-"}</span></p>
                        <button id="closeCardBtn" style="margin-top: 10px; background:#2563eb; color:#fff; border:none; padding:7px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;">Close</button>
                      </div>
                    </div>
                  `;
                  const existingCard = document.getElementById("leaveCard");
                  if (existingCard) existingCard.remove();
                  const card = document.createElement("div");
                  card.id = "leaveCard";
                  card.style.position = "fixed";
                  card.style.zIndex = "9999";

                  // Mobile-responsive positioning
                  const isMobile = window.innerWidth < 640;
                  if (isMobile) {
                    card.style.top = "50%";
                    card.style.left = "50%";
                    card.style.transform = "translate(-50%, -50%)";
                  } else {
                    card.style.top = `${info.jsEvent.pageY + 10}px`;
                    card.style.left = `${info.jsEvent.pageX + 10}px`;
                  }

                  card.innerHTML = details;
                  document.body.appendChild(card);

                  // Add backdrop for mobile
                  if (isMobile) {
                    const backdrop = document.createElement("div");
                    backdrop.id = "leaveCardBackdrop";
                    backdrop.style.position = "fixed";
                    backdrop.style.inset = "0";
                    backdrop.style.background = "rgba(0,0,0,0.5)";
                    backdrop.style.zIndex = "9998";
                    backdrop.onclick = () => {
                      card.remove();
                      backdrop.remove();
                    };
                    document.body.appendChild(backdrop);
                    document.getElementById("closeCardBtn")?.addEventListener("click", () => {
                      card.remove();
                      backdrop.remove();
                    });
                  } else {
                    document.getElementById("closeCardBtn")?.addEventListener("click", () => card.remove());
                  }
                }}
                dateClick={(arg) => {
                  const local = new Date(arg.date.getTime() - arg.date.getTimezoneOffset() * 60000);
                  const dateStr = local.toISOString().split("T")[0];
                  if (dateStr !== selectedDate) setSelectedDate(dateStr);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  const cell = arg.dayEl as HTMLElement;
                  if (cell) {
                    document.querySelectorAll(".fc-daygrid-day.highlight-day").forEach(el => el.classList.remove("highlight-day"));
                    cell.classList.add("highlight-day");
                  }
                }}
                headerToolbar={{
                  left: "prev,next",
                  center: "title",
                  right: "today",
                }}
                buttonText={{
                  today: "Today",
                  month: "Month",
                  week: "Week"
                }}
              />
            </div>
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition text-xs sm:text-sm"
            >
              Clear
            </button>
          )}
        </div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-3 lg:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {loading || loadingEmployees ? (
            <p>Loading...</p>
          ) : (
            <AnimatePresence>
              {/* Full Attendance Records updated all-absent logic */}
              {selectedDate ? (
                (() => {
                  const selected = selectedDate;
                  const isFuture = new Date(selected) > new Date(today);
                  const allAbsent = dateAttendance.length > 0 && dateAttendance.every(a => !a.check_in);
                  if (isFuture) {
                    return (
                      <div className="col-span-full flex items-center justify-center py-16">
                        <span className="italic text-gray-400 text-lg">Future Date</span>
                      </div>
                    );
                  }
                  // If all employees are absent (regardless of weekend/weekday), show single "Leave / No Attendance" card
                  if (allAbsent) {
                    return (
                      <div className="col-span-full flex items-center justify-center py-16">
                        <span className="italic text-gray-400 text-lg">Leave / No Attendance</span>
                      </div>
                    );
                  }
                  // Otherwise, show attendance cards as normal
                  return dateAttendance
                      .sort((a, b) => (a.fullname || '').localeCompare(b.fullname || ''))
                    .map((rec, idx) => {
                      const workedPercent = rec.check_in
                        ? rec.isCurrentlyWorking && rec.checkInDateTime
                          ? (() => {
                              const realTimeHours = calculateRealTimeHours(rec.checkInDateTime, currentTime);
                              return Math.min(
                                ((realTimeHours.hrs + realTimeHours.mins / 60 + realTimeHours.secs / 3600) / 8) * 100,
                                100
                              );
                            })()
                          : Math.min(
                              ((rec.hours.hrs + rec.hours.mins / 60 + rec.hours.secs / 3600) / 8) * 100,
                              100
                            )
                        : 0;
                      return (
                        <motion.div
                          key={`${rec.email}-${selected}-full`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, delay: idx * 0.02 }}
                          className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between min-w-0 overflow-hidden"
                        >
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{rec.fullname}</h3>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 break-all truncate">{rec.email}</p>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 mt-1">
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                              {rec.department}
                            </span>
                          </p>
                        </div>

                        {/* Check-in/Check-out Images */}
                        <div className="flex gap-4 mb-3 justify-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">Check-in</span>
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 shadow-sm">
                              {rec?.check_in_photo ? (
                                <>
                                  {console.log('Rendering check-in image:', rec?.check_in_photo)}
                                  <Image
                                    src={rec?.check_in_photo.startsWith('http') ? rec?.check_in_photo : `${process.env.NEXT_PUBLIC_API_URL}${rec?.check_in_photo}`}
                                    alt="Check-in Photo"
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">Check-out</span>
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-200 shadow-sm">
                              {rec?.check_out_photo ? (
                                <>
                                  {console.log('Rendering check-out image:', rec?.check_out_photo)}
                                  <Image
                                    src={rec?.check_out_photo.startsWith('http') ? rec?.check_out_photo : `${process.env.NEXT_PUBLIC_API_URL}${rec?.check_out_photo}`}
                                    alt="Check-out Photo"
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-2 sm:mb-3">
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400">Date</p>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-700 font-medium">{formatDate(rec.date)}</p>
                        </div>
                        <div className="mb-2 sm:mb-3">
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400">Check-in / Check-out</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                rec.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rec.check_in
                                ? new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString()
                                : "Absent"}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                rec.check_out
                                  ? "bg-green-100 text-green-700"
                                  : rec.check_in
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rec.check_out
                                ? new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString()
                                : rec.check_in
                                ? "Pending"
                                : "Absent"}
                            </span>
                          </div>
                        </div>

                        {/* Shifts, OT, and Breaks for this employee on this date */}
                        <div className="mt-3 space-y-2 mb-3">
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

                        <div>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400 mb-1">
                          {rec?.isCurrentlyWorking ? '⏳ Currently Working' : '💼 Worked Hours'}
                          </p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${workedPercent}%`
                              }}
                              transition={{ duration: 1 }}
                              className={`h-2 ${rec.isCurrentlyWorking ? "bg-green-500" : rec.check_in ? "bg-blue-500" : "bg-gray-300"} rounded-full`}
                            />
                          </div>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-center text-gray-600 mt-1 flex items-center justify-center">
                            {rec.check_in
                              ? rec.isCurrentlyWorking && rec.checkInDateTime
                                ? (() => {
                                    const realTimeHours = calculateRealTimeHours(rec.checkInDateTime, currentTime);
                                    return `${realTimeHours.hrs}h ${realTimeHours.mins}m ${realTimeHours.secs}s`;
                                  })()
                                : `${rec.hours.hrs}h ${rec.hours.mins}m ${rec.hours.secs}s`
                              : "Absent"}
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
                      );
                    });
                })()
              ) : (
                (() => {
                  // All past/current dates for all employees
                  // Gather all unique dates
                  const allDatesSet = new Set<string>();
                  attendance.forEach(rec => allDatesSet.add(rec.date));
                  const allDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));
                  // For each date, for each employee, show card or absent
                  const cards: { emp: Employee; date: string; rec: AttendanceRecord | null }[] = [];
                  allDates.forEach(date => {
                    employees.forEach(emp => {
                      const rec = attendance.find(r => r.email === emp.email && r.date === date) || null;
                      cards.push({ emp, date, rec });
                    });
                  });
                  // Sort by date desc, then name
                  cards.sort((a, b) => {
                    if (a.date !== b.date) return b.date.localeCompare(a.date);
                    return (a.emp.fullname || '').localeCompare(b.emp.fullname || '');
                  });
                  // If all cards are for future dates, show message
                  if (
                    cards.length > 0 &&
                    cards.every(({ date }) => new Date(date) > new Date(today))
                  ) {
                    return (
                      <div className="col-span-full flex items-center justify-center py-16">
                        <span className="italic text-gray-400 text-lg">Future Date</span>
                      </div>
                    );
                  }
                  // Only show cards for today or past
                  const filteredCards = cards.filter(({ date }) => new Date(date) <= new Date(today));
                  if (filteredCards.length === 0) {
                    return (
                      <div className="col-span-full text-center text-gray-500 p-6 sm:p-8 bg-white rounded-xl shadow-lg">
                        No attendance records found.
                      </div>
                    );
                  }
                  return filteredCards.map(({ emp, date, rec }, idx) => {
                    const displayRec = rec || {
                      email: emp.email,
                      fullname: emp.fullname,
                      department: emp.department,
                      date: date,
                      check_in: null,
                      check_out: null,
                      checkInDateTime: null,
                      isCurrentlyWorking: false,
                      hours: { hrs: 0, mins: 0, secs: 0 }
                    };
                    const workedPercent = displayRec?.check_in
                      ? displayRec?.isCurrentlyWorking && displayRec?.checkInDateTime
                        ? (() => {
                            const realTimeHours = calculateRealTimeHours(displayRec?.checkInDateTime, currentTime);
                            return Math.min(
                              ((realTimeHours.hrs + realTimeHours.mins / 60 + realTimeHours.secs / 3600) / 8) * 100,
                              100
                            );
                          })()
                        : Math.min(
                            ((displayRec?.hours.hrs + displayRec?.hours.mins / 60 + displayRec?.hours.secs / 3600) / 8) * 100,
                            100
                          )
                      : 0;
                    return (
                      <motion.div
                        key={`${emp.email}-${date}-full`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: idx * 0.01 }}
                        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between min-w-0 overflow-hidden"
                      >
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{displayRec.fullname}</h3>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 break-all truncate">{displayRec.email}</p>
                        </div>
                        <div className="mb-2 sm:mb-3">
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400">Date</p>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-700 font-medium">{formatDate(displayRec.date)}</p>
                        </div>
                        <div className="mb-2 sm:mb-3">
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400">Check-in / Check-out</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                displayRec?.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {displayRec?.check_in
                                ? new Date(`${displayRec?.date}T${displayRec?.check_in}`).toLocaleTimeString()
                                : "Absent"}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                displayRec?.check_out
                                  ? "bg-green-100 text-green-700"
                                  : displayRec?.check_in
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {displayRec?.check_out
                                ? new Date(`${displayRec?.date}T${displayRec?.check_out}`).toLocaleTimeString()
                                : displayRec?.check_in
                                ? "Pending"
                                : "Absent"}
                            </span>
                          </div>
                        </div>

                        {/* Shifts, OT, and Breaks for this employee on this date */}
                        <div className="mt-3 space-y-2 mb-3">
                          {/* Shifts */}
                          {shifts.filter(shift => shift.date === displayRec.date && (shift.emp_email === displayRec.email || shift.employee_email === displayRec.email)).length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-2">
                              <div className="flex items-center gap-1 mb-1">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-medium text-blue-700">Shifts</span>
                              </div>
                              {shifts.filter(shift => shift.date === displayRec.date && (shift.emp_email === displayRec.email || shift.employee_email === displayRec.email)).map((shift, idx) => (
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
                            return otDate === displayRec.date && ot.email === displayRec.email;
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
                                return otDate === displayRec.date && ot.email === displayRec.email;
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
                            return breakDate === displayRec.date && br.email === displayRec.email;
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
                                return breakDate === displayRec.date && br.email === displayRec.email;
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

                        <div>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400 mb-1">
                            {displayRec?.isCurrentlyWorking ? '⏳ Currently Working' : '💼 Worked Hours'}
                          </p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${workedPercent}%`
                              }}
                              transition={{ duration: 1 }}
                              className={`h-2 ${displayRec?.isCurrentlyWorking ? "bg-green-500" : displayRec?.check_in ? "bg-blue-500" : "bg-gray-300"} rounded-full`}
                            />
                          </div>
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-center text-gray-600 mt-1">
                            {displayRec?.check_in
                              ? displayRec?.isCurrentlyWorking && displayRec?.checkInDateTime
                                ? (() => {
                                    const realTimeHours = calculateRealTimeHours(displayRec?.checkInDateTime, currentTime);
                                    return `${realTimeHours.hrs}h ${realTimeHours.mins}m ${realTimeHours.secs}s`;
                                  })()
                                : `${displayRec?.hours.hrs}h ${displayRec?.hours.mins}m ${displayRec?.hours.secs}s`
                              : "Absent"}
                          </p>
                        </div>
                      </motion.div>
                    );
                  });
                })()
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
    </>
  );
};
