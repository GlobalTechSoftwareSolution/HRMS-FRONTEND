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

export default function AdminAttendanceDashboard() {
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch Attendance
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const responseData = await res.json();
        const data = Array.isArray(responseData) ? { attendance: responseData } : responseData;

        const mapped: AttendanceRecord[] = (data.attendance || []).map((a: any) => {
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

  // Fetch Employees
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
        setEmployees(data);
        setTotalEmployees(data.length || 0);
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
  const attendancePieData = [
    { name: "Checked In", value: checkedIn },
    { name: "Absent", value: absent },
  ];
  const pieColors = ["#34d399", "#f87171"];

  // Bar Chart Data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyAttendance = attendance.filter((rec) => {
    const recDate = new Date(rec.date);
    return recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear;
  });

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

  const barChartData = Object.entries(hoursPerEmployeeMap).map(
    ([name, hours]) => ({
      name: name.length > 14 ? name.slice(0, 12) + "…" : name,
      hours: Number(hours.toFixed(2)),
    })
  );

  // PDF Generation
  const downloadPDF = async () => {
    const jsPDFModule = (await import("jspdf")).default;
    const autoTableModule = (await import("jspdf-autotable")).default;

    const doc = new jsPDFModule({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });

    const logoUrl = "https://www.globaltechsoftwaresolutions.com/_next/image?url=%2Flogo%2FGlobal.jpg&w=64&q=75";
    let logoBase64: string | undefined;
    try {
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
      doc.addImage(
        logoBase64,
        "PNG",
        doc.internal.pageSize.getWidth() / 2 - 35,
        y,
        70,
        70
      );
      y += 80;
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(
      "Global Tech Solutions",
      doc.internal.pageSize.getWidth() / 2,
      y,
      { align: "center" }
    );
    y += 35;

    doc.setFontSize(20);
    doc.text(
      "Today's Attendance Report",
      doc.internal.pageSize.getWidth() / 2,
      y,
      { align: "center" }
    );
    y += 30;

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
    <>
      <style jsx global>{`
        /* Mobile-first responsive styles */
        @media (max-width: 640px) {
          .react-calendar {
            width: 100% !important;
            max-width: 100% !important;
            font-size: 0.8rem;
          }
          
          .react-calendar__navigation button {
            min-width: 30px;
            font-size: 0.8rem;
          }
          
          .react-calendar__tile {
            padding: 0.3em 0.2em;
            font-size: 0.75rem;
          }
          
          .chart-container-mobile {
            height: 250px !important;
          }
          
          .attendance-card-mobile {
            min-height: 160px;
            padding: 1rem !important;
          }
          
          .kpi-card-mobile {
            padding: 0.75rem !important;
            min-height: 70px;
          }
        }

        @media (max-width: 768px) {
          .grid-cols-responsive {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          
          .charts-stack-mobile {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }

        @media (max-width: 1024px) {
          .calendar-container {
            max-width: 100% !important;
          }
        }

        /* Custom calendar tile styles */
        .bg-green-100 {
          background-color: #dcfce7;
        }
        .text-green-700 {
          color: #15803d;
        }
        .bg-yellow-100 {
          background-color: #fef9c3;
        }
        .text-yellow-700 {
          color: #a16207;
        }
      `}</style>
      
      <DashboardLayout role="admin">
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800 text-center sm:text-left"
          >
            Admin Dashboard 📋
          </motion.h1>

          {/* KPI Cards - Responsive Grid */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6"
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
              { 
                title: "Checked In", 
                value: checkedIn, 
                color: "bg-gradient-to-r from-green-400 to-green-600" 
              },
              { 
                title: "Absent", 
                value: absent, 
                color: "bg-gradient-to-r from-red-400 to-red-600" 
              },
              {
                title: "Total Hours",
                value: totalHoursTodayDisplay,
                color: "bg-gradient-to-r from-purple-400 to-purple-600",
              },
            ].map((kpi) => (
              <motion.div
                key={kpi.title}
                className={`kpi-card-mobile rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg flex flex-col justify-between hover:scale-105 transition-transform duration-300 ${kpi.color}`}
              >
                <p className="text-xs sm:text-sm font-medium opacity-90 mb-1 sm:mb-2">{kpi.title}</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
                  {kpi.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Section - Stack on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10 charts-stack-mobile">
            {/* Pie Chart */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                Attendance Distribution
              </h3>
              <div className="w-full h-64 sm:h-72 md:h-80 chart-container-mobile">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
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
                    <RechartsLegend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                Hours Worked Per Employee (month)
              </h3>
              <div className="w-full h-64 sm:h-72 md:h-80 chart-container-mobile">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={barChartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      fontSize={10}
                    />
                    <YAxis 
                      label={{ 
                        value: "Hours", 
                        angle: -90, 
                        position: "insideLeft", 
                        fontSize: 12 
                      }} 
                    />
                    <RechartsTooltip />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Today's Attendance + Download PDF */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 text-center sm:text-left w-full sm:w-auto">
              Today&apos;s Attendance
            </h2>
            <button
              onClick={downloadPDF}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base transition-colors duration-200"
            >
              Download PDF
            </button>
          </div>

          {/* Today Attendance Cards - Responsive Grid */}
          <motion.div
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 grid-cols-responsive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-white shadow-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 attendance-card-mobile"
                >
                  <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
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
                    className="attendance-card-mobile bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
                  >
                    <div className="mb-2 sm:mb-3 md:mb-4">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 line-clamp-1">
                        {rec.fullname}
                      </h3>
                      <p className="text-xs text-gray-500 break-words mt-1 line-clamp-1">
                        {rec.email}
                      </p>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <p className="text-xs text-gray-400">Check-in / Check-out</p>
                      <div className="flex flex-col xs:flex-row gap-1 xs:gap-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rec.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          } text-center`}
                        >
                          {rec.check_in ? 
                            new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : "Pending"}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rec.check_out ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          } text-center`}
                        >
                          {rec.check_out ? 
                            new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : "Pending"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Worked Hours</p>
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
                      <p className="text-xs text-center text-gray-600 mt-1">
                        {rec.hours.hrs}h {rec.hours.mins}m {rec.hours.secs}s
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="col-span-full text-center text-gray-500 p-4 sm:p-6 md:p-8 bg-white rounded-lg sm:rounded-xl shadow-lg">
                No attendance records for today.
              </div>
            )}
          </motion.div>

          {/* Full Attendance List */}
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">
            Full Attendance Records
          </h2>
          
          {/* Calendar for filtering */}
          <div className="mb-4 sm:mb-6 flex flex-col items-center">
            <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-md w-full calendar-container max-w-md mx-auto">
              <Calendar
                onChange={(value) => {
                  if (!value || Array.isArray(value)) return;
                  if (!(value instanceof Date)) return;
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
                className="mt-3 px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition text-sm sm:text-base"
              >
                Clear Date Filter
              </button>
            )}
          </div>

          {/* Full Attendance Records Grid */}
          <motion.div
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 grid-cols-responsive"
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
                      className="attendance-card-mobile bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
                    >
                      <div className="mb-2 sm:mb-3 md:mb-4">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 line-clamp-1">
                          {rec.fullname}
                        </h3>
                        <p className="text-xs text-gray-500 break-words mt-1 line-clamp-1">
                          {rec.email}
                        </p>
                      </div>
                      <div className="mb-2 sm:mb-3">
                        <p className="text-xs text-gray-400">Date</p>
                        <p className="text-sm sm:text-base text-gray-700 font-medium">
                          {formatDate(rec.date)}
                        </p>
                      </div>
                      <div className="mb-2 sm:mb-3">
                        <p className="text-xs text-gray-400">Check-in / Check-out</p>
                        <div className="flex flex-col xs:flex-row gap-1 xs:gap-2 mt-1">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rec.check_in ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            } text-center`}
                          >
                            {rec.check_in ? 
                              new Date(`${rec.date}T${rec.check_in}`).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : "Pending"}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rec.check_out ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            } text-center`}
                          >
                            {rec.check_out ? 
                              new Date(`${rec.date}T${rec.check_out}`).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : "Pending"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Worked Hours</p>
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
                        <p className="text-xs text-center text-gray-600 mt-1">
                          {rec.hours.hrs}h {rec.hours.mins}m {rec.hours.secs}s
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500 p-4 sm:p-6 md:p-8 bg-white rounded-lg sm:rounded-xl shadow-lg">
                    No attendance records found for selected date.
                  </div>
                )}
              </AnimatePresence>
            ) : loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading attendance data...</p>
              </div>
            ) : (
              <div className="col-span-full text-center text-gray-500 p-4 sm:p-6 md:p-8 bg-white rounded-lg sm:rounded-xl shadow-lg">
                No attendance records found.
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    </>
  );
}
