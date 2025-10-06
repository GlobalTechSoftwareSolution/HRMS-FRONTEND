"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
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
};

export default function DashboardOverview() {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([]);

  const totalPossibleHours = 200;

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
      }));

      const userAttendance = allAttendance.filter((a) => a.email === userEmail);
      setAttendanceRecords(userAttendance);

      // Attendance rate
      const totalDays = userAttendance.length;
      const presentDays = userAttendance.filter((a) => a.checkIn && a.checkOut).length;
      setAttendanceRate(totalDays ? Math.round((presentDays / totalDays) * 100) : 0);

      // Hours this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      let weekHours = 0;
      const dailyHoursCalc: Record<string, number> = {};

      userAttendance.forEach((rec) => {
        if (rec.checkIn && rec.checkOut) {
          const inTime = new Date(`${rec.date}T${rec.checkIn}`);
          const outTime = new Date(`${rec.date}T${rec.checkOut}`);
          if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
            const hours = (outTime.getTime() - inTime.getTime()) / 1000 / 3600;
            dailyHoursCalc[rec.date] = (dailyHoursCalc[rec.date] || 0) + hours;
            if (inTime >= startOfWeek) weekHours += hours;
          }
        }
      });

      setHoursThisWeek(weekHours);
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
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Leave Balance */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <span className="text-green-600 text-xl sm:text-2xl font-bold">
                {15 - leaveData.filter((l) => l.email === userEmail && l.status?.toLowerCase() === "approved").length}
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
                {(Math.round(hoursThisWeek * 2) / 2).toFixed(1)} hrs
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                {(Math.round(((hoursThisWeek / totalPossibleHours) * 100) * 2) / 2).toFixed(1)}% of {totalPossibleHours} hrs
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
              const hours =
                rec.checkIn && rec.checkOut
                  ? (Math.round(
                      ((new Date(`${rec.date}T${rec.checkOut}`).getTime() -
                        new Date(`${rec.date}T${rec.checkIn}`).getTime()) /
                        1000 /
                        3600) * 2
                    ) / 2).toFixed(1)
                  : "0.0";
              return (
                <div key={rec.date} className="bg-gray-50 p-3 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-gray-700 font-medium">{rec.date}</p>
                    <p className="text-gray-500 text-sm">
                      {rec.checkIn ?? "-"} - {rec.checkOut ?? "-"}
                    </p>
                  </div>
                  <span className="text-gray-700 font-bold">{hours} hrs</span>
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
                    <div className="text-gray-700 font-medium">{l.start_date} - {l.end_date}</div>
                    <div className="text-gray-500 text-sm">{l.leave_type ?? "-"}</div>
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
      </div>
    </DashboardLayout>
  );
}
