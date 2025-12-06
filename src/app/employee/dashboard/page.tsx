"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import Image from "next/image";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";

type AttendanceRecord = {
  email: string;
  role: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
};

type LeaveRecord = {
  email: string;
  status: string;
  start_date: string;
  end_date: string;
  leave_type: string | null;
  reason: string;
};

type RawAttendance = {
  email: string;
  role?: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
};

export default function DashboardOverview() {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [hoursThisMonth, setHoursThisMonth] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const totalPossibleHours = 196; // 196 hours per month (8*6*4 approx)

  const fetchDashboardData = async () => {
    try {
      const userEmail = localStorage.getItem("user_email");
      if (!userEmail) return;

      // Fetch leaves
      const leaveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
      if (!leaveRes.ok) throw new Error("Failed to fetch leave data");
      const leaveJson = await leaveRes.json();
      const leaves: LeaveRecord[] = leaveJson.leaves || [];
      setLeaveData(leaves);

      // Pending requests
      const userLeaves = leaves.filter((l) => l.email === userEmail);
      const pendingCount = userLeaves.reduce(
        (acc, l) => (l.status?.toLowerCase() === "pending" ? acc + 1 : acc),
        0
      );
      setPendingRequests(pendingCount);

      // Fetch attendance
      const attendanceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_attendance/`);
      const attendanceJson = attendanceRes.ok ? await attendanceRes.json() : { attendance: [] };
      const rawAttendance: RawAttendance[] = attendanceJson.attendance || [];

      const allAttendance: AttendanceRecord[] = rawAttendance.map((rec) => ({
        email: rec.email,
        role: rec.role ?? "",
        date: rec.date,
        checkIn: rec.checkIn ?? rec.check_in ?? null,
        checkOut: rec.checkOut ?? rec.check_out ?? null,
        checkInPhoto: rec.check_in_photo ?? null,
        checkOutPhoto: rec.check_out_photo ?? null,
      }));

      const userAttendance = allAttendance.filter((a) => a.email === userEmail);
      setAttendanceRecords(userAttendance);

      // Attendance rate
      const totalDays = userAttendance.length;
      const presentDays = userAttendance.filter((a) => a.checkIn && a.checkOut).length;
      setAttendanceRate(totalDays ? Math.round((presentDays / totalDays) * 100) : 0);

      // Hours this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      let monthHours = 0;
      const dailyHoursCalc: Record<string, number> = {};

      userAttendance.forEach((rec) => {
        if (rec.checkIn && rec.checkOut) {
          const inTime = new Date(`${rec.date}T${rec.checkIn}`);
          const outTime = new Date(`${rec.date}T${rec.checkOut}`);
          if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
            const hours = (outTime.getTime() - inTime.getTime()) / 1000 / 3600;
            dailyHoursCalc[rec.date] = (dailyHoursCalc[rec.date] || 0) + hours;
            if (inTime >= startOfMonth) monthHours += hours;
          }
        }
      });

      setHoursThisMonth(monthHours);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="p-6 text-center text-gray-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  const userEmail = localStorage.getItem("user_email") || "";

  return (
    <DashboardLayout role="employee">
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Welcome back! Here&apos;s your personal overview
            </p>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm w-fit">
            {new Date().toLocaleDateString("en-GB")}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Leave Balance */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <span className="text-green-600 text-xl sm:text-2xl font-bold">
                {15 -
                  leaveData
                    .filter((l) => l.email === userEmail && l.status?.toLowerCase() === "approved")
                    .reduce((total, l) => {
                      const days = Math.max(
                        1,
                        Math.ceil(
                          (new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1
                      );
                      return total + days;
                    }, 0)
                }
              </span>
              <p className="text-gray-500 mt-1 text-sm">Leave Balance</p>
              <p className="text-xs text-gray-400 mt-0.5">Days remaining</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg self-end sm:self-auto">
              <FiCalendar className="text-green-600 text-lg sm:text-xl" />
            </div>
          </div>

          {/* Hours Worked */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-purple-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <span className="text-purple-600 text-xl sm:text-2xl font-bold">
                {(Math.round(hoursThisMonth * 2) / 2).toFixed(1)} hrs
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                {(Math.round(((hoursThisMonth / totalPossibleHours) * 100) * 2) / 2).toFixed(1)}% of {totalPossibleHours} hrs
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg self-end sm:self-auto">
              <FiClock className="text-purple-600 text-lg sm:text-xl" />
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <span className="text-blue-600 text-xl sm:text-2xl font-bold">
                {attendanceRate}%
              </span>
              <p className="text-gray-500 mt-1 text-sm">Attendance Rate</p>
              <p className="text-xs text-gray-400 mt-0.5">Based on days attended</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg self-end sm:self-auto">
              <FiTrendingUp className="text-blue-600 text-lg sm:text-xl" />
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <span className="text-yellow-600 text-xl sm:text-2xl font-bold">{pendingRequests}</span>
              <p className="text-gray-500 mt-1 text-sm">Pending Requests</p>
              <p className="text-xs text-gray-400 mt-0.5">Awaiting approval</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg self-end sm:self-auto">
              <FiAlertCircle className="text-yellow-600 text-lg sm:text-xl" />
            </div>
          </div>
        </div>

        {/* Daily Hours Table */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mt-6 overflow-x-auto">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Daily Hours Worked</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
            {attendanceRecords.map((rec) => {
              const checkInTime = rec.checkIn ? new Date(`${rec.date}T${rec.checkIn}`) : null;
              const checkOutTime = rec.checkOut ? new Date(`${rec.date}T${rec.checkOut}`) : null;
              const now = new Date();
              const endTime = checkOutTime || (checkInTime ? now : null);
              const workedHours = checkInTime && endTime ? (endTime.getTime() - checkInTime.getTime()) / (1000 * 3600) : 0;

              // Round up at .6 (60 minutes)
              const displayHours = workedHours > 0 ? Math.ceil(workedHours * 10 / 6) * 0.6 : 0;
              const hours = displayHours > 0 ? displayHours.toFixed(1) : "0.0";

              const isWorking = rec.checkIn && !rec.checkOut;
              const progressPercent = workedHours > 0 ? Math.min((workedHours / 8) * 100, 100) : 0;

              return (
                <div key={rec.date} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="text-center mb-4">
                    <p className="text-gray-700 font-medium">
                      {new Date(rec.date).toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-gray-500 text-sm">{hours} hrs</p>
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Check-in */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-2">Check-in</p>
                      <p className="text-sm text-gray-700 mb-2">
                        {rec.checkIn
                          ? new Date(`${rec.date}T${rec.checkIn}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                          : "-"}
                      </p>
                      {rec.checkInPhoto && (
                        <Image
                          src={rec.checkInPhoto || ''}
                          alt="Check-in photo"
                          width={64}
                          height={64}
                          className="object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedPhoto(rec.checkInPhoto)}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>

                    {/* Timeline Line */}
                    <div className="flex-1 mx-4 relative">
                      {/* Hour Scale */}
                      <div className="flex justify-between mb-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                          <div key={hour} className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 font-medium">{hour}</span>
                            <div className="w-px h-2 bg-gray-300"></div>
                          </div>
                        ))}
                      </div>
                      {/* Progress Bar */}
                      <div className="relative bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-3 ${isWorking ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-green-400 to-green-500'} rounded-full transition-all duration-1000`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                        {isWorking && progressPercent < 100 && (
                          <div className="absolute right-0 top-0 w-4 h-4 bg-blue-500 rounded-full animate-pulse transform translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                        )}
                      </div>
                    </div>

                    {/* Check-out */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-2">Check-out</p>
                      <p className="text-sm text-gray-700 mb-2">
                        {rec.checkOut
                          ? new Date(`${rec.date}T${rec.checkOut}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                          : isWorking ? "Working..." : "-"}
                      </p>
                      {rec.checkOutPhoto && (
                        <Image
                          src={rec.checkOutPhoto || ''}
                          alt="Check-out photo"
                          width={64}
                          height={64}
                          className="object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedPhoto(rec.checkOutPhoto)}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaves Table */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mt-6 overflow-x-auto">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Your Leaves</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3">
            {leaveData
              .filter((l) => l.email === userEmail)
              .map((l, idx) => {
                let statusColor = "text-orange-500";
                if (l.status.toLowerCase() === "approved") statusColor = "text-green-600";
                else if (l.status.toLowerCase() === "rejected") statusColor = "text-red-600";

                return (
                  <div
                    key={idx}
                    className="bg-gray-50 p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:justify-between gap-1"
                  >
                    <div className="text-gray-700 font-medium">
                      {new Date(l.start_date).toLocaleDateString("en-GB")} - {new Date(l.end_date).toLocaleDateString("en-GB")}
                      <span className="text-gray-500 text-sm ml-2">
                        ({Math.max(
                          1,
                          Math.ceil(
                            (new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) + 1
                        )}{" "}
                        days)
                      </span>
                    </div>
                    <div className="text-gray-500 text-sm">{l.reason}</div>
                    <div className={`${statusColor} font-semibold`}>{l.status}</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          <Link href="/employee/leaves">
            <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 w-full">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full mb-2">
                <FiCalendar className="text-blue-600 text-lg sm:text-xl" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Request Leave</span>
            </button>
          </Link>

          <Link href="/employee/attendance">
            <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 w-full">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full mb-2">
                <FiClock className="text-green-600 text-lg sm:text-xl" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">View Attendance</span>
            </button>
          </Link>

          <Link href="/employee/payroll">
            <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 w-full">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full mb-2">
                <FiDollarSign className="text-purple-600 text-lg sm:text-xl" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">View Payslips</span>
            </button>
          </Link>
        </div>

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
      </div>
    </DashboardLayout>
  );
}
