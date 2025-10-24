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
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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

// This component uses the admin layout
export default function AdminAttendanceDashboard() {
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
  const [, setEmployees] = useState<Employee[]>([]);
  const [, setLoadingEmployees] = useState(true);
  // --- For mini calendar selection (full attendance list) ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();
  const todaysAttendance = attendance.filter((a) => a.date === today);
  const checkedIn = todaysAttendance.filter((a) => a.check_in).length;
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

  // Recharts Data Preparation
  // Pie Chart: Attendance Distribution
  const attendancePieData = [
    { name: "Checked In", value: checkedIn },
    { name: "Absent", value: absent },
  ];
  const pieColors = ["#34d399", "#f87171"]; // green, red

  // ---------------- Bar Chart: Monthly Hours Worked per Employee ----------------
  const currentMonth = new Date().getMonth(); // 0-11
  const currentYear = new Date().getFullYear();

  // Filter records for current month
  const monthlyAttendance = attendance.filter((rec) => {
    const recDate = new Date(rec.date);
    return recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear;
  });

  // Sum hours per employee
  const hoursPerEmployeeMap: Record<string, number> = {};
  monthlyAttendance.forEach((rec) => {
    const hours =
      rec.hours.hrs + rec.hours.mins / 60 + rec.hours.secs / 3600;
    if (hoursPerEmployeeMap[rec.fullname]) {
      hoursPerEmployeeMap[rec.fullname] += hours;
    } else {
      hoursPerEmployeeMap[rec.fullname] = hours;
    }
  });

  // Prepare chart data
  const barChartData = Object.entries(hoursPerEmployeeMap).map(
    ([name, hours]) => ({
      name: name.length > 14 ? name.slice(0, 12) + "…" : name,
      hours: Number(hours.toFixed(2)),
    })
  );

  // ---------------- PDF Generation ----------------
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
      "Today's Attendance Report",
      doc.internal.pageSize.getWidth() / 2,
      y,
      { align: "center" }
    );
    y += 30; // More spacing after title

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const todayStr = new Date().toLocaleDateString();
    doc.text(`Date: ${todayStr}`, doc.internal.pageSize.getWidth() / 2, y + 15, {
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

    doc.save(`Attendance-Report-${todayStr}.pdf`);
  };

  return (
    <DashboardLayout role="admin">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-gray-800"
        >
          Admin Dashboard 📋
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
            },
            { title: "Checked In", value: checkedIn, color: "bg-gradient-to-r from-green-400 to-green-600" },
            { title: "Absent", value: absent, color: "bg-gradient-to-r from-red-400 to-red-600" },
            {
              title: "Total Hours",
              value: totalHoursTodayDisplay,
              color: "bg-gradient-to-r from-purple-400 to-purple-600",
            },
          ].map((kpi) => (
            <motion.div
              key={kpi.title}
              className={`rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col justify-between hover:scale-105 transition-transform duration-300 ${kpi.color}`}
            >
              <p className="text-sm sm:text-base font-medium opacity-90">{kpi.title}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section */}
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
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Hours Worked Per Employee (month)</h3>
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

        {/* Today's Attendance + Download PDF */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            Today&apos;s Attendance
          </h2>
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
              No attendance records for today.
            </div>
          )}
        </motion.div>

        {/* Full Attendance List */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Full Attendance Records</h2>
        {/* Calendar for filtering */}
        <div className="mb-4 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md">
            <Calendar
              onChange={(value) => {
                if (!value || Array.isArray(value)) return; // ignore null or range
                if (!(value instanceof Date)) return; // extra safety for non-Date
                const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
                const dateStr = local.toISOString().split("T")[0];
                setSelectedDate(dateStr === selectedDate ? null : dateStr);
              }}
              value={
                selectedDate
                  ? (() => {
                      const [year, month, day] = selectedDate.split("-");
                      return new Date(Number(year), Number(month) - 1, Number(day));
                    })()
                  : null
              }
              tileClassName={({ date }) => {
                const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                const dateStr = local.toISOString().split("T")[0];
                if (dateStr === today) return "bg-green-100 text-green-700 font-bold rounded";
                if (dateStr === yesterday) return "bg-yellow-100 text-yellow-700 font-bold rounded";
                return "";
              }}
            />
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
          {attendance.length && !loading ? (
            <AnimatePresence>
              {(selectedDate
                ? attendance.filter((rec) => rec.date === selectedDate)
                : attendance.filter((rec) => rec.date === today || rec.date === yesterday)
              ).length > 0 ? (
                (selectedDate
                  ? attendance.filter((rec) => rec.date === selectedDate)
                  : attendance.filter((rec) => rec.date === today || rec.date === yesterday)
                ).map((rec, idx) => (
                  <motion.div
                    key={`${rec.email}-${rec.date}-full`}
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
                          className="h-2 bg-purple-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-center text-gray-600 mt-1">
                        {rec.hours.hrs}h {rec.hours.mins}m {rec.hours.secs}s
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 p-6 sm:p-8 bg-white rounded-xl shadow-lg">
                  No attendance records found for selected date.
                </div>
              )}
            </AnimatePresence>
          ) : loading ? (
            <p>Loading...</p>
          ) : (
            <p>No attendance records found.</p>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
