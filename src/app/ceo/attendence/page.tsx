
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



type AttendanceRecord = {
  email: string;
  fullname: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours: { hrs: number; mins: number; secs: number };
};

type ApiAttendanceResponse = {
  attendance: {
    email: string;
    fullname: string;
    department: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
  }[];
};

type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string;
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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
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

  // ---------------- Fetch Employees ----------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/employees/`
        );
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data: Employee[] = await res.json();
        setEmployees(data);
        setTotalEmployees(data.length);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
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
  const dateAttendance = employees.map((emp) => {
    const rec = attendanceMap[emp.email];
    if (rec) {
      return rec;
    } else {
      // Absent employee
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
    name: rec.fullname.length > 14 ? rec.fullname.slice(0, 12) + "…" : rec.fullname,
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

      if (rec.check_in) {
        checkInDisplay = new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString();
        if (rec.check_out) {
          checkOutDisplay = new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString();
          hoursDisplay = `${rec.hours.hrs}h ${rec.hours.mins}m ${rec.hours.secs}s`;
        } else {
          checkOutDisplay = "Pending";
          hoursDisplay = `${rec.hours.hrs}h ${rec.hours.mins}m ${rec.hours.secs}s`;
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/leaves`);
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
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
  ...leaves.map((l) => ({
    title: `${l.employee_name || "Employee"} - ${l.status}`,
    start: l.date,
    backgroundColor: l.status === "Approved" ? "#eab308" : "#f97316",
    textColor: "#000",
  })),
];



  return (
    <>
      <style jsx global>{`
        .highlight-day {
          background-color: rgba(59, 130, 246, 0.15) !important;
          border-radius: 8px;
          transition: background-color 0.3s ease;
        }
      `}</style>
      <DashboardLayout role="ceo">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-gray-800"
        >
          CEO ATTENDANCE 📋
        </motion.h1>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6"
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
              className={`rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col justify-between hover:scale-105 transition-transform duration-300 ${kpi.color} cursor-pointer`}
              onClick={kpi.onClick}
              tabIndex={0}
              role="button"
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  kpi.onClick();
                }
              }}
            >
              <p className="text-sm sm:text-base font-medium opacity-90">{kpi.title}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section */}
        {/* Charts Section */}
        {/* Always show charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Pie Chart - Attendance Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance Distribution</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props) => {
                      const { name, percent } = props as unknown as { name: string; percent: number };
                      return `${name} (${(percent * 100).toFixed(0)}%)`;
                    }}
                  >
                    {attendancePieData.map((entry, idx) => {
                      return <Cell key={`cell-${entry.name}`} fill={pieColors[idx % pieColors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip />
                  <RechartsLegend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Bar Chart - Hours Worked per Employee */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Hours Worked Per Employee ({selectedDate ? formatDate(selectedDate) : "Today"})
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft", fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Today's/Selected Date Attendance + Download PDF */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            {selectedDate ? `${formatDate(selectedDate)} Attendance` : "Today's Attendance"}
          </h2>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg sm:mt-5 sm:mb-5 hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>

        {/* Date Attendance Cards */}
        <motion.div
          id="attendance-section"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {loading || loadingEmployees ? (
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
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Worked Hours</p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  rec.check_in
                                    ? Math.min(
                                        ((rec.hours.hrs + rec.hours.mins / 60 + rec.hours.secs / 3600) / 8) * 100,
                                        100
                                      )
                                    : 0
                                }%`
                              }}
                              transition={{ duration: 1 }}
                              className={`h-2 ${rec.check_in ? "bg-blue-500" : "bg-gray-300"} rounded-full`}
                            />
                          </div>
                          <p className="text-xs sm:text-sm text-center text-gray-600 mt-1">
                            {rec.check_in
                              ? `${rec.hours.hrs}h ${rec.hours.mins}m ${rec.hours.secs}s`
                              : "Absent"}
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
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Full Attendance Records</h2>
        {/* Calendar for filtering */}
        <div className="mb-4 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-5xl">
            {/* Show selected date above calendar */}
            {selectedDate && (
              <div className="mb-2 text-center text-gray-700 font-semibold">
                Showing attendance for: {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            )}
            <div className="mx-auto max-w-[600px]">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height={400}
                contentHeight={350}
                showNonCurrentDates={false}
                events={calendarEvents}
                eventClick={(info) => {
                  const clickedDate = info.event.startStr.split("T")[0];
                  setSelectedDate(clickedDate);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  const cell = info.el.closest(".fc-daygrid-day") as HTMLElement | null;
                  if (cell) {
                    document.querySelectorAll(".fc-daygrid-day.highlight-day").forEach(el => el.classList.remove("highlight-day"));
                    cell.classList.add("highlight-day");
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
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,dayGridWeek",
                }}
              />
            </div>
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-3 px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition"
            >
              Clear
            </button>
          )}
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
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
                    .sort((a, b) => a.fullname.localeCompare(b.fullname))
                    .map((rec, idx) => {
                      const workedPercent = rec.check_in
                        ? Math.min(
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
                          className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
                        >
                          <div className="mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">{rec.fullname}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 break-words">{rec.email}</p>
                          </div>
                          <div className="mb-2 sm:mb-3">
                            <p className="text-xs text-gray-400">Date</p>
                            <p className="text-sm sm:text-base text-gray-700 font-medium">{formatDate(rec.date)}</p>
                          </div>
                          <div className="mb-2 sm:mb-3">
                            <p className="text-xs text-gray-400">Check-in / Check-out</p>
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
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-1">Worked Hours</p>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${workedPercent}%`
                                }}
                                transition={{ duration: 1 }}
                                className={`h-2 ${rec.check_in ? "bg-blue-500" : "bg-gray-300"} rounded-full`}
                              />
                            </div>
                            <p className="text-xs sm:text-sm text-center text-gray-600 mt-1">
                              {rec.check_in
                                ? `${rec.hours.hrs}h ${rec.hours.mins}m ${rec.hours.secs}s`
                                : "Absent"}
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
                    return a.emp.fullname.localeCompare(b.emp.fullname);
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
                      hours: { hrs: 0, mins: 0, secs: 0 }
                    };
                    const workedPercent = displayRec.check_in
                      ? Math.min(
                          ((displayRec.hours.hrs + displayRec.hours.mins / 60 + displayRec.hours.secs / 3600) / 8) * 100,
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
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
                      >
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800">{displayRec.fullname}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 break-words">{displayRec.email}</p>
                        </div>
                        <div className="mb-2 sm:mb-3">
                          <p className="text-xs text-gray-400">Date</p>
                          <p className="text-sm sm:text-base text-gray-700 font-medium">{formatDate(displayRec.date)}</p>
                        </div>
                        <div className="mb-2 sm:mb-3">
                          <p className="text-xs text-gray-400">Check-in / Check-out</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                displayRec.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {displayRec.check_in
                                ? new Date(`${displayRec.date}T${displayRec.check_in}`).toLocaleTimeString()
                                : "Absent"}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                                displayRec.check_out
                                  ? "bg-green-100 text-green-700"
                                  : displayRec.check_in
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {displayRec.check_out
                                ? new Date(`${displayRec.date}T${displayRec.check_out}`).toLocaleTimeString()
                                : displayRec.check_in
                                ? "Pending"
                                : "Absent"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Worked Hours</p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${workedPercent}%`
                              }}
                              transition={{ duration: 1 }}
                              className={`h-2 ${displayRec.check_in ? "bg-blue-500" : "bg-gray-300"} rounded-full`}
                            />
                          </div>
                          <p className="text-xs sm:text-sm text-center text-gray-600 mt-1">
                            {displayRec.check_in
                              ? `${displayRec.hours.hrs}h ${displayRec.hours.mins}m ${displayRec.hours.secs}s`
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
