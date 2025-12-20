"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

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

type ApiAttendanceResponse = {
  attendance: RawAttendance[];
};

type Employee = {
  id: number;
  email: string;
  fullname: string;
  department: string;
};

export default function HrAttendencePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());


  // Utility function to normalize date format for comparison
  const normalizeDate = (dateStr: string) => {
    // Ensure date is in YYYY-MM-DD format
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

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

  // ---------------- Fetch Attendance ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/list_attendance/`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data: ApiAttendanceResponse = await res.json();

        const mapped: AttendanceRecord[] = (data.attendance || []).map((a: RawAttendance) => {
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
          `https://hrms.globaltechsoftwaresolutions.cloud/api/accounts/employees/`
        );
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        const employeesArray = Array.isArray(data) ? data : (data?.employees || data?.data || []);
        setEmployees(employeesArray);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const selectedDateAttendance = attendance.filter((a) => normalizeDate(a.date) === normalizeDate(selectedDate));
  const checkedIn = selectedDateAttendance.filter((a) => a.check_in).length;
  const currentlyWorking = selectedDateAttendance.filter((a) => a.isCurrentlyWorking).length;
  const totalEmployees = employees.length;
  const absent = totalEmployees - checkedIn;

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  // Get attendance for selected date
  // (already declared above)

  const totalHoursToday = selectedDateAttendance.reduce(
    (acc, a) => acc + (a.hours.hrs * 3600 + a.hours.mins * 60 + a.hours.secs),
    0
  );
  const totalHoursTodayDisplay = (() => {
    const hrs = Math.floor(totalHoursToday / 3600);
    const mins = Math.floor((totalHoursToday % 3600) / 60);
    const secs = Math.round(totalHoursToday % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  })();

  // Calendar Header Component
  const CalendarHeader = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <div className="text-base sm:text-xl font-bold text-gray-800">
              {months[currentMonth]} {currentYear}
            </div>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
      </div>
    );
  };

  // ---------------- PDF Generation ----------------
 const downloadPDF = async () => {
  const jsPDFModule = (await import("jspdf")).default;
  const autoTableModule = (await import("jspdf-autotable")).default;

  const doc = new jsPDFModule({
    orientation: "portrait",
    unit: "pt",
    format: "A4",
  });

  // --- ADD COMPANY LOGO AND NAME ---
  const companyName = "Global Tech Software Solutions";
  const logoUrl = "/logo/Global.jpg"; // replace with your image path or URL

  // Load image as base64
  const imgData = await fetch(logoUrl)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

  // Draw logo (left-top corner)
  doc.addImage(imgData, "PNG", 40, 20, 50, 50);

  // Draw company name (centered at top)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(companyName, doc.internal.pageSize.getWidth() / 2, 50, {
    align: "center",
  });

  // --- ATTENDANCE REPORT TITLE ---
  doc.setFontSize(20);
  // Format selected date for display
  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.text(
    `Attendance Report for ${formattedSelectedDate}`,
    doc.internal.pageSize.getWidth() / 2,
    90,
    { align: "center" }
  );

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const reportDateStr = new Date(selectedDate).toLocaleDateString();
  doc.text(`Date: ${reportDateStr}`, doc.internal.pageSize.getWidth() / 2, 110, {
    align: "center",
  });

  // --- TABLE ---
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

  selectedDateAttendance.forEach((rec, idx) => {
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
    startY: 130,
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

  // Format selected date for filename
    const fileNameDateStr = new Date(selectedDate).toLocaleDateString();
    doc.save(`Attendance-Report-${fileNameDateStr}.pdf`);
};

  // Week Days Header Component
  const WeekDaysHeader = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center py-1 sm:py-2 text-[10px] sm:text-xs font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Calendar Grid Component
  const CalendarGrid = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Empty days for the start of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-16 md:h-20 border border-gray-200 bg-gray-50"></div>);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${(currentMonth + 1)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      
      const isToday = normalizeDate(dateStr) === normalizeDate(new Date().toISOString().split("T")[0]);
      const isSelected = normalizeDate(dateStr) === normalizeDate(selectedDate);
      
      // Check if there's attendance for this date
      const hasAttendance = attendance.some(a => normalizeDate(a.date) === normalizeDate(dateStr));

      days.push(
        <div
          key={day}
          className={`h-12 sm:h-16 md:h-20 border border-gray-200 p-0.5 sm:p-1 cursor-pointer transition-all ${
            isSelected 
              ? "bg-blue-500 text-white" 
              : isToday 
                ? "bg-blue-100 border-blue-300" 
                : "bg-white hover:bg-gray-50"
          }`}
          onClick={() => setSelectedDate(dateStr)}
        >
          <div className={`text-[10px] sm:text-xs font-medium ${
            isSelected ? "text-white" : 
            isToday ? "text-blue-600 font-bold" : "text-gray-700"
          }`}>
            {day}
          </div>
          
          {/* Indicator for attendance */}
          {hasAttendance && (
            <div className="mt-1 flex justify-center">
              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-green-500"}`}></div>
            </div>
          )}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-0.5 sm:gap-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">{days}</div>;
  };

  return (
    <DashboardLayout role="hr">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-gray-800"
        >
          HR Attendance Dashboard 
        </motion.h1>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            { title: "Total Employees", value: totalEmployees, color: "bg-gradient-to-r from-blue-400 to-blue-600" },
            { title: "Checked In", value: checkedIn, color: "bg-gradient-to-r from-green-400 to-green-600" },
            { title: "Currently Working", value: currentlyWorking, color: "bg-gradient-to-r from-emerald-400 to-emerald-600" },
            { title: "Absent", value: absent, color: "bg-gradient-to-r from-red-400 to-red-600" },
            { title: "Total Hours", value: totalHoursTodayDisplay, color: "bg-gradient-to-r from-purple-400 to-purple-600" },
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

        {/* Selected Date Attendance + Download PDF */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            Attendance for {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg sm:mt-5 sm:mb-5 hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>


        {/* Selected Date Attendance Cards */}
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
          ) : selectedDateAttendance.length ? (
            <AnimatePresence>
              {selectedDateAttendance.map((rec, idx) => (
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
              No attendance records for the selected date.
            </div>
          )}
        </motion.div>

{/* Calendar Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <CalendarHeader />
          <WeekDaysHeader />
          <CalendarGrid />
          
          {/* Selected Date Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="text-sm font-semibold text-gray-800">
              Selected Date: {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}