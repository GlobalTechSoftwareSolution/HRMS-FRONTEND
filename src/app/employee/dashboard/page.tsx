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
import { supabase } from "@/app/lib/supabaseClient";

export default function DashboardOverview() {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0);
  const [dailyHours, setDailyHours] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<
    {
      email: string;
      role: string;
      date: string;
      checkIn: string | null;
      checkOut: string | null;
    }[]
  >([]);
  const [leaveData, setLeaveData] = useState<{ email: string; status: string; start_date: string; end_date: string; leave_type: string | null; reason: string }[]>([]);

  const totalPossibleHours = 200; // Total working hours for calculation

  const fetchDashboardData = async () => {
    try {
      const userEmail = localStorage.getItem("user_email");

      // Fetch leave data dynamically from API
      const leaveRes = await fetch("http://127.0.0.1:8000/api/accounts/list_leaves/");
      if (!leaveRes.ok) throw new Error("Failed to fetch leave data");

      const leaveJson = await leaveRes.json();
      console.log("Leave API response:", leaveJson); // Check structure

      // Extract leaves array correctly
      const leaveData: { email: string; status: string; start_date: string; end_date: string; leave_type: string | null; reason: string }[] = leaveJson.leaves || [];
      setLeaveData(leaveData);

      // Calculate pendingRequestsCount correctly
      const userLeaves = leaveData.filter((l) => l.email === userEmail);
      const pendingRequestsCount = userLeaves.reduce((acc, leave) => {
        return leave.status?.toLowerCase() === "pending" ? acc + 1 : acc;
      }, 0);
      setPendingRequests(pendingRequestsCount);

      // Fetch attendance dynamically from API
      const attendanceRes = await fetch("http://127.0.0.1:8000/api/accounts/list_attendance/");
      let allAttendanceRecords: {
        email: string;
        role: string;
        date: string;
        checkIn: string | null;
        checkOut: string | null;
      }[] = [];

      if (attendanceRes.ok) {
        const attendanceJson = await attendanceRes.json();
        // Extract attendance array correctly
        const attendanceData = attendanceJson.attendance || [];
        allAttendanceRecords = attendanceData.map((rec: any) => ({
          email: rec.email,
          role: rec.role,
          date: rec.date,
          checkIn: rec.check_in,
          checkOut: rec.check_out,
        }));
      }

      // Filter attendance for current user
      const filteredAttendanceRecords = allAttendanceRecords.filter(
        (record) => record.email === userEmail
      );

      // Attendance rate calculation
      const totalDays = filteredAttendanceRecords.length;
      const presentDays = filteredAttendanceRecords.filter(
        (a) => a.checkIn && a.checkOut
      ).length;
      const attendanceRate = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;

      // Hours worked this week + daily breakdown
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

      let hoursThisWeekCalc = 0;
      const dailyHoursCalc: Record<string, number> = {};

      filteredAttendanceRecords.forEach((record) => {
        if (record.checkIn && record.checkOut) {
          const checkIn = new Date(`${record.date}T${record.checkIn}`);
          const checkOut = new Date(`${record.date}T${record.checkOut}`);
          if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            const hours = (checkOut.getTime() - checkIn.getTime()) / 1000 / 3600;
            dailyHoursCalc[record.date] = (dailyHoursCalc[record.date] || 0) + hours;
            if (checkIn >= startOfWeek) {
              hoursThisWeekCalc += hours;
            }
          }
        }
      });

      // Set state after calculations
      setAttendanceRate(attendanceRate);
      setHoursThisWeek(hoursThisWeekCalc);
      setDailyHours(dailyHoursCalc);
      setAttendanceRecords(filteredAttendanceRecords);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Poll every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);

    // Supabase realtime subscription
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => fetchDashboardData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaves" },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="p-6 text-center text-gray-500">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

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
              Welcome back! Here's your personal overview
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
                {leaveData.filter((l) => l.email === localStorage.getItem("user_email")).length}
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
              <span className="text-blue-600 text-xl sm:text-2xl font-bold">
                {attendanceRate}%
              </span>
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
              <span className="text-yellow-600 text-xl sm:text-2xl font-bold">
                {pendingRequests}
              </span>
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
                {attendanceRecords.map((record) => {
                  const hours =
                    record.checkIn && record.checkOut
                      ? ((new Date(`${record.date}T${record.checkOut}`).getTime() -
                          new Date(`${record.date}T${record.checkIn}`).getTime()) /
                          1000 /
                          3600
                        ).toFixed(2)
                      : "0.00";
                  return (
                    <tr key={record.date} className="border-b">
                      <td className="py-2 px-4">{record.date}</td>
                      <td className="py-2 px-4">{record.checkIn ?? "-"}</td>
                      <td className="py-2 px-4">{record.checkOut ?? "-"}</td>
                      <td className="py-2 px-4">{hours} hrs</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Leaves Table */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mt-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
            Your Leaves
          </h2>
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
                  .filter((l) => l.email === localStorage.getItem("user_email"))
                  .map((leave, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{leave.start_date}</td>
                      <td className="py-2 px-4">{leave.end_date}</td>
                      <td className="py-2 px-4">{leave.leave_type ?? "-"}</td>
                      <td className="py-2 px-4">{leave.reason}</td>
                      <td className="py-2 px-4">{leave.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link href="/employee/leaves" className="w-full">
                <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 w-full">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full mb-2">
                    <FiCalendar className="text-blue-600 text-lg sm:text-xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Request Leave
                  </span>
                </button>
              </Link>

              <Link href="/employee/attendance" className="w-full">
                <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 w-full">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full mb-2">
                    <FiClock className="text-green-600 text-lg sm:text-xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    View Attendance
                  </span>
                </button>
              </Link>

              <Link href="/employee/payroll" className="w-full">
                <button className="flex flex-col items-center justify-center p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 w-full">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full mb-2">
                    <FiDollarSign className="text-purple-600 text-lg sm:text-xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    View Payslips
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}