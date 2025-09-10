"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type AttendanceRecord = {
  id: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Half Day";
  checkIn: string;
  checkOut: string | null;
  hoursWorked: string | null;
};

type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalHours: number;
};

export default function AttendancePortal() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<"today" | "history" | "stats">("today");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const today = new Date();
  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if user already checked in today
  const todayRecord = attendance.find(record => 
    new Date(record.date).toDateString() === today.toDateString()
  );

  // Calculate attendance statistics
  const stats: AttendanceStats = attendance.reduce(
    (acc, record) => {
      if (record.status === "Present") acc.present++;
      if (record.status === "Absent") acc.absent++;
      if (record.status === "Late") acc.late++;
      if (record.status === "Half Day") acc.halfDay++;
      if (record.hoursWorked) {
        acc.totalHours += parseFloat(record.hoursWorked);
      }
      return acc;
    },
    { present: 0, absent: 0, late: 0, halfDay: 0, totalHours: 0 }
  );

  const handleCheckIn = () => {
    setScanning(true);

    // Simulate face scanning delay
    setTimeout(() => {
      const now = new Date();
      const checkInTime = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      // Determine if late (after 9:30 AM)
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
      
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        date: today.toISOString().split("T")[0],
        status: isLate ? "Late" : "Present",
        checkIn: checkInTime,
        checkOut: null,
        hoursWorked: null,
      };

      setAttendance(prev => [newRecord, ...prev]);
      setScanning(false);
      alert(`Check-in successful at ${checkInTime}! ${isLate ? "You are late today." : ""}`);
    }, 2000);
  };

  const handleCheckOut = () => {
    setScanning(true);

    // Simulate face scanning delay
    setTimeout(() => {
      const now = new Date();
      const checkOutTime = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Calculate hours worked
      const checkInTime = todayRecord?.checkIn;
      if (checkInTime) {
        const [inHour, inMinute] = checkInTime.split(":").map(Number);
        const [outHour, outMinute] = checkOutTime.split(":").map(Number);
        
        let hoursWorked = outHour - inHour + (outMinute - inMinute) / 60;
        if (hoursWorked < 0) hoursWorked += 24; // Handle overnight
        
        const hoursWorkedFormatted = hoursWorked.toFixed(1);

        setAttendance(prev =>
          prev.map(record =>
            record.id === todayRecord.id
              ? {
                  ...record,
                  checkOut: checkOutTime,
                  hoursWorked: hoursWorkedFormatted,
                }
              : record
          )
        );
      }

      setScanning(false);
      alert(`Check-out successful at ${checkOutTime}!`);
    }, 2000);
  };

  // Filter attendance by selected month and year
  const filteredAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    return (
      recordDate.getMonth() === selectedMonth && 
      recordDate.getFullYear() === selectedYear
    );
  });

  // Generate calendar days for the selected month and year
  const getCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = attendance.find(r => r.date === dateStr);
      
      days.push({
        date: dateStr,
        day: i,
        record,
      });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();

  useEffect(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem("attendance");
    if (stored) setAttendance(JSON.parse(stored));
  }, []);

  useEffect(() => {
    // Save attendance to localStorage
    localStorage.setItem("attendance", JSON.stringify(attendance));
  }, [attendance]);

  return (
    <DashboardLayout role="employee">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Attendance Portal</h1>
              <p className="text-gray-500 text-sm md:text-base mt-1">Track your daily attendance and working hours</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 md:px-4 md:py-2 rounded-full flex items-center text-xs md:text-sm">
              <span className="mr-1 md:mr-2">📅</span>
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-2 md:p-3 mr-2 md:mr-4">
                  <span className="text-green-600 text-lg md:text-xl">✅</span>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500">Present</h3>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{stats.present}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="rounded-full bg-red-100 p-2 md:p-3 mr-2 md:mr-4">
                  <span className="text-red-600 text-lg md:text-xl">❌</span>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500">Absent</h3>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{stats.absent}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-2 md:p-3 mr-2 md:mr-4">
                  <span className="text-yellow-600 text-lg md:text-xl">⏰</span>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500">Late</h3>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{stats.late}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-2 md:p-3 mr-2 md:mr-4">
                  <span className="text-blue-600 text-lg md:text-xl">🕑</span>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500">Half Day</h3>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{stats.halfDay}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-2 md:mr-4">
                  <span className="text-purple-600 text-lg md:text-xl">⏱️</span>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm text-gray-500">Total Hours</h3>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{stats.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Check-in/out Panel */}
          <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Today's Attendance</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-gray-500 text-sm md:text-base">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              
              <div className="flex-1">
                {todayRecord ? (
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-sm md:text-base">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{todayRecord.checkIn}</span>
                    </div>
                    {todayRecord.checkOut ? (
                      <>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Check-out:</span>
                          <span className="font-medium">{todayRecord.checkOut}</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base">
                          <span className="text-gray-600">Hours worked:</span>
                          <span className="font-medium">{todayRecord.hoursWorked} hrs</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm md:text-base">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          todayRecord.status === "Present" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {todayRecord.status}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm md:text-base">No attendance recorded today</p>
                )}
              </div>
              
              <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto">
                {!todayRecord ? (
                  <button
                    disabled={scanning}
                    onClick={handleCheckIn}
                    className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center text-sm md:text-base ${
                      scanning
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {scanning ? (
                      <>
                        <span className="mr-1 md:mr-2">🔍</span> Scanning...
                      </>
                    ) : (
                      <>
                        <span className="mr-1 md:mr-2">📸</span> Check In
                      </>
                    )}
                  </button>
                ) : !todayRecord.checkOut ? (
                  <button
                    disabled={scanning}
                    onClick={handleCheckOut}
                    className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center text-sm md:text-base ${
                      scanning
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {scanning ? (
                      <>
                        <span className="mr-1 md:mr-2">🔍</span> Scanning...
                      </>
                    ) : (
                      <>
                        <span className="mr-1 md:mr-2">🚪</span> Check Out
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center text-green-600 font-semibold py-2 md:py-3 text-sm md:text-base">
                    ✅ Attendance completed for today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100 mb-4 md:mb-6">
            <div className="flex flex-wrap gap-1 md:gap-2">
              <button
                className={`px-3 md:px-4 py-1 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                  view === "today"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setView("today")}
              >
                Today
              </button>
              <button
                className={`px-3 md:px-4 py-1 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                  view === "history"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setView("history")}
              >
                History
              </button>
              <button
                className={`px-3 md:px-4 py-1 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                  view === "stats"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setView("stats")}
              >
                Statistics
              </button>
            </div>
          </div>

          {/* Content based on view */}
          {view === "today" && (
            <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Recent Attendance</h2>
              {attendance.length === 0 ? (
                <div className="text-center py-6 md:py-10">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">📊</div>
                  <p className="text-gray-500 text-sm md:text-base">No attendance records yet</p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">Check in to start recording your attendance</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs md:text-sm text-gray-600">
                        <th className="pb-2 md:pb-3">Date</th>
                        <th className="pb-2 md:pb-3">Status</th>
                        <th className="pb-2 md:pb-3">Check-in</th>
                        <th className="pb-2 md:pb-3">Check-out</th>
                        <th className="pb-2 md:pb-3">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.slice(0, 5).map((record) => (
                        <tr key={record.id} className="border-b border-gray-100">
                          <td className="py-3 md:py-4 text-xs md:text-sm">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-3 md:py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === "Present"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "Absent"
                                  ? "bg-red-100 text-red-800"
                                  : record.status === "Late"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 md:py-4 text-xs md:text-sm">{record.checkIn}</td>
                          <td className="py-3 md:py-4 text-xs md:text-sm">{record.checkOut || "-"}</td>
                          <td className="py-3 md:py-4 text-xs md:text-sm">{record.hoursWorked || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "history" && (
            <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3 md:gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Attendance History</h2>
                <div className="flex gap-1 md:gap-2">
                  <select
                    className="border border-gray-300 rounded-lg px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(0, i).toLocaleDateString("en-US", { month: "short" })}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-gray-300 rounded-lg px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={today.getFullYear() - 2 + i}>
                        {today.getFullYear() - 2 + i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredAttendance.length === 0 ? (
                <div className="text-center py-6 md:py-10">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">📅</div>
                  <p className="text-gray-500 text-sm md:text-base">No attendance records for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs md:text-sm text-gray-600">
                        <th className="pb-2 md:pb-3">Date</th>
                        <th className="pb-2 md:pb-3">Status</th>
                        <th className="pb-2 md:pb-3">Check-in</th>
                        <th className="pb-2 md:pb-3">Check-out</th>
                        <th className="pb-2 md:pb-3">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100">
                          <td className="py-3 md:py-4 text-xs md:text-sm">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-3 md:py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === "Present"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "Absent"
                                  ? "bg-red-100 text-red-800"
                                  : record.status === "Late"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 md:py-4 text-xs md:text-sm">{record.checkIn}</td>
                          <td className="py-3 md:py-4 text-xs md:text-sm">{record.checkOut || "-"}</td>
                          <td className="py-3 md:py-4 text-xs md:text-sm">{record.hoursWorked || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "stats" && (
            <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Monthly Calendar View</h2>
              
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-3 md:mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center font-medium text-gray-500 py-1 md:py-2 text-xs md:text-sm">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map(day => (
                  <div 
                    key={day.date}
                    className={`p-1 md:p-2 rounded border text-center text-xs md:text-sm ${
                      day.record
                        ? day.record.status === "Present"
                          ? "bg-green-50 border-green-200"
                          : day.record.status === "Absent"
                          ? "bg-red-50 border-red-200"
                          : day.record.status === "Late"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="font-medium">{day.day}</div>
                    {day.record && (
                      <div className="mt-0 md:mt-1">
                        {day.record.status === "Present" && "✅"}
                        {day.record.status === "Absent" && "❌"}
                        {day.record.status === "Late" && "⏰"}
                        {day.record.status === "Half Day" && "🕑"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 md:gap-4 mt-4 md:mt-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-green-200 rounded mr-1 md:mr-2"></div>
                  <span className="text-xs md:text-sm text-gray-600">Present</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-red-200 rounded mr-1 md:mr-2"></div>
                  <span className="text-xs md:text-sm text-gray-600">Absent</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-200 rounded mr-1 md:mr-2"></div>
                  <span className="text-xs md:text-sm text-gray-600">Late</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-200 rounded mr-1 md:mr-2"></div>
                  <span className="text-xs md:text-sm text-gray-600">Half Day</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .stats-grid > div:last-child {
            grid-column: span 2;
          }
        }
        
        @media (max-width: 768px) {
          .calendar-grid {
            font-size: 0.75rem;
          }
        }
        
        @media (max-width: 1024px) {
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .table-responsive table {
            min-width: 600px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}