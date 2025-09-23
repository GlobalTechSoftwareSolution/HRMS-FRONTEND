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
  const [, setDailyHours] = useState<Record<string, number>>({});
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
      setDailyHours(dailyHoursCalc);
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
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <span className="text-green-600 text-xl sm:text-2xl font-bold">
                {leaveData.filter((l) => l.email === userEmail).length}
              </span>
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCalendar className="text-green-600 text-lg sm:text-xl" />
              </div>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Leave Balance</p>
            <p className="text-xs text-gray-400 mt-1">Days remaining</p>
          </div>

          {/* Hours Worked */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-purple-600 text-xl sm:text-2xl font-bold">
                {hoursThisWeek.toFixed(2)} hrs
              </span>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiClock className="text-purple-600 text-lg sm:text-xl" />
              </div>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Hours Worked</p>
            <p className="text-xs text-gray-400 mt-1">
              {((hoursThisWeek / totalPossibleHours) * 100).toFixed(2)}% of {totalPossibleHours} hrs
            </p>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <span className="text-blue-600 text-xl sm:text-2xl font-bold">{attendanceRate}%</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiTrendingUp className="text-blue-600 text-lg sm:text-xl" />
              </div>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Attendance Rate</p>
            <p className="text-xs text-gray-400 mt-1">Based on days attended</p>
          </div>

          {/* Pending Requests */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <span className="text-yellow-600 text-xl sm:text-2xl font-bold">{pendingRequests}</span>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiAlertCircle className="text-yellow-600 text-lg sm:text-xl" />
              </div>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Pending Requests</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
          </div>
        </div>

        {/* Daily Hours Table */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mt-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
            Daily Hours Worked
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-600">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-4">Date</th>
                  <th className="py-2 px-4">Check-In</th>
                  <th className="py-2 px-4">Check-Out</th>
                  <th className="py-2 px-4">Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((rec) => {
                  const hours =
                    rec.checkIn && rec.checkOut
                      ? ((new Date(`${rec.date}T${rec.checkOut}`).getTime() -
                          new Date(`${rec.date}T${rec.checkIn}`).getTime()) /
                          1000 /
                          3600
                        ).toFixed(2)
                      : "0.00";
                  return (
                    <tr key={rec.date} className="border-b">
                      <td className="py-2 px-4">{rec.date}</td>
                      <td className="py-2 px-4">{rec.checkIn ?? "-"}</td>
                      <td className="py-2 px-4">{rec.checkOut ?? "-"}</td>
                      <td className="py-2 px-4">{hours} hrs</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaves Table */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mt-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Your Leaves</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-600">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-4">Start Date</th>
                  <th className="py-2 px-4">End Date</th>
                  <th className="py-2 px-4">Type</th>
                  <th className="py-2 px-4">Reason</th>
                  <th className="py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveData
                  .filter((l) => l.email === userEmail)
                  .map((l, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{l.start_date}</td>
                      <td className="py-2 px-4">{l.end_date}</td>
                      <td className="py-2 px-4">{l.leave_type ?? "-"}</td>
                      <td className="py-2 px-4">{l.reason}</td>
                      <td className="py-2 px-4">{l.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link href="/employee/leaves" className="w-full">
                <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 w-full">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full mb-2">
                    <FiCalendar className="text-blue-600 text-lg sm:text-xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Request Leave</span>
                </button>
              </Link>

              <Link href="/employee/attendance" className="w-full">
                <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 w-full">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full mb-2">
                    <FiClock className="text-green-600 text-lg sm:text-xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">View Attendance</span>
                </button>
              </Link>

              <Link href="/employee/payroll" className="w-full">
                <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 w-full">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full mb-2">
                    <FiDollarSign className="text-purple-600 text-lg sm:text-xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">View Payslips</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
