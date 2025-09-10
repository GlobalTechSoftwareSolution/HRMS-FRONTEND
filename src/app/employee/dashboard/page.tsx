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
  FiCheckCircle,
  FiUser,
} from "react-icons/fi";

type Activity = {
  id: number;
  type: string;
  status: string;
  date: string;
  details: string;
};

export default function DashboardOverview() {
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/employee/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard data");

        const data = await res.json();

        setLeaveBalance(data.leaveBalance);
        setAttendanceRate(data.attendanceRate);
        setPendingRequests(data.pendingRequests);
        setHoursThisWeek(data.hoursThisWeek);
        setRecentActivities(data.recentActivities);
      } catch (err) {
        console.error(err);
        setLeaveBalance(18);
        setAttendanceRate(96);
        setPendingRequests(3);
        setHoursThisWeek(38);
        setRecentActivities([
          {
            id: 1,
            type: "leave",
            status: "approved",
            date: "2025-09-01",
            details: "Annual leave approved",
          },
          {
            id: 2,
            type: "attendance",
            status: "recorded",
            date: "2025-09-05",
            details: "Late arrival (9:20 AM)",
          },
          {
            id: 3,
            type: "payslip",
            status: "available",
            date: "2025-08-31",
            details: "August payslip available",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <FiCheckCircle className="text-green-500" />;
      case "recorded":
        return <FiClock className="text-blue-500" />;
      case "available":
        return <FiDollarSign className="text-purple-500" />;
      case "updated":
        return <FiUser className="text-indigo-500" />;
      default:
        return <FiAlertCircle className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="p-6 text-center text-gray-500">Loading dashboard...</div>
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
          {/* Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <span className="text-green-600 text-xl sm:text-2xl font-bold">
                {leaveBalance}
              </span>
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCalendar className="text-green-600 text-lg sm:text-xl" />
              </div>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Leave Balance</p>
            <p className="text-xs text-gray-400 mt-1">Days remaining</p>
          </div>

          {/* Repeat similar responsive tweaks for other cards */}
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
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </div>

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

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-purple-600 text-xl sm:text-2xl font-bold">
                {hoursThisWeek}
              </span>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiClock className="text-purple-600 text-lg sm:text-xl" />
              </div>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Hours Worked</p>
            <p className="text-xs text-gray-400 mt-1">Out of 40 hours this week</p>
          </div>
        </div>

        {/* Quick Actions + Recent Activities */}
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

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Recent Activities
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-1">{getStatusIcon(activity.status)}</div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
            Weekly Progress
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  strokeDasharray={`${(hoursThisWeek / 40) * 100}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-gray-800">
                  {hoursThisWeek}/40
                </span>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-gray-700 font-medium text-sm sm:text-base">
                Weekly Hours Target
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                {hoursThisWeek >= 40
                  ? "You've reached your weekly target! 🎉"
                  : `${40 - hoursThisWeek} hours remaining to reach your target`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
