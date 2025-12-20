"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiActivity,
  FiBriefcase,
  FiArrowRight,
  FiCamera,
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
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([]);

  const fetchDashboardData = async () => {
    try {
      const userEmail = localStorage.getItem("user_email");
      if (!userEmail) {
        console.error("User email not found. Please log in again.");
        return;
      }

      // Helper to ensure absolute URLs (Same logic as attendance page)
      const getAbsoluteImageUrl = (url: string | null | undefined): string | null => {
        if (!url || url === "-" || url === "null") return null;
        if (url.startsWith("http") || url.startsWith("data:")) return url;
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const path = url.startsWith("/") ? url : `/${url}`;
        return `${baseUrl}${path}`;
      };

      // Fetch leaves
      const leaveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_leaves/`);
      if (!leaveRes.ok) {
        throw new Error(`Failed to fetch leave data`);
      }
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
      if (!attendanceRes.ok) {
        throw new Error(`Failed to fetch attendance data`);
      }
      const attendanceJson = await attendanceRes.json();
      const rawAttendance: RawAttendance[] = attendanceJson.attendance || [];

      // Sort by absolute date descending
      const sortedRaw = rawAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const allAttendance: AttendanceRecord[] = sortedRaw.map((rec) => ({
        email: rec.email,
        role: rec.role ?? "",
        date: rec.date,
        checkIn: rec.checkIn ?? rec.check_in ?? null,
        checkOut: rec.checkOut ?? rec.check_out ?? null,
        checkInPhoto: getAbsoluteImageUrl(rec.check_in_photo ?? rec.check_in_photo),
        checkOutPhoto: getAbsoluteImageUrl(rec.check_out_photo ?? rec.check_out_photo),
      }));

      const userAttendance = allAttendance.filter((a) => a.email === userEmail);
      setAttendanceRecords(userAttendance);

      // Attendance rate
      const totalDays = userAttendance.length;
      const presentDays = userAttendance.filter((a) => a.checkIn && a.checkOut).length;
      setAttendanceRate(totalDays ? Math.round((presentDays / totalDays) * 100) : 0);

      // Hours this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      let weekHours = 0;
      userAttendance.forEach((rec) => {
        const recDate = new Date(rec.date);
        if (recDate >= startOfWeek && rec.checkIn && rec.checkOut) {
          const inTime = new Date(`${rec.date}T${rec.checkIn}`);
          const outTime = new Date(`${rec.date}T${rec.checkOut}`);
          if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
            const diff = outTime.getTime() - inTime.getTime();
            if (diff > 0) {
              weekHours += diff / (1000 * 60 * 60);
            }
          }
        }
      });

      setHoursThisWeek(weekHours);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Don't show full error to user to avoid "ugly" feel, just log it and show generic
      // setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format Helper
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "-";
    try {
      // timeStr is usually HH:MM:SS
      const [h, m] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(h), parseInt(m));
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return timeStr;
    }
  };

  // Calculate current work hours for ongoing sessions
  const getCurrentWorkHours = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's record
    const todayRecord = attendanceRecords.find(record => record.date === today);
    
    // If there's a completed session, calculate actual worked hours
    if (todayRecord && todayRecord.checkIn && todayRecord.checkOut) {
      try {
        const checkInTime = new Date(`${today}T${todayRecord.checkIn}`);
        const checkOutTime = new Date(`${today}T${todayRecord.checkOut}`);
        
        // Calculate difference in milliseconds
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        
        // Convert to hours
        const diffHours = diffMs / (1000 * 60 * 60);
        
        // Return positive hours worked, capped at 8 hours
        return Math.min(8, Math.max(0, diffHours));
      } catch (error) {
        console.error('Error calculating completed work hours:', error);
        return 0;
      }
    }
    
    // If there's a check-in but no check-out, calculate elapsed time
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      try {
        const checkInTime = new Date(`${today}T${todayRecord.checkIn}`);
        const currentTime = new Date();
        
        // Calculate difference in milliseconds
        const diffMs = currentTime.getTime() - checkInTime.getTime();
        
        // Convert to hours
        const diffHours = diffMs / (1000 * 60 * 60);
        
        // Return positive hours worked, capped at 8 hours
        return Math.min(8, Math.max(0, diffHours));
      } catch (error) {
        console.error('Error calculating ongoing work hours:', error);
        return 0;
      }
    }
    
    return 0;
  };

  const calculateDuration = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return "-";
    try {
      const start = new Date(`2000-01-01T${checkIn}`);
      const end = new Date(`2000-01-01T${checkOut}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      // Cap at 8 hours for display purposes
      return Math.min(8, Math.max(0, hours)).toFixed(1);
    } catch {
      return "0.0";
    }
  };

  // Calculate duration in hours for progress calculation
  const calculateDurationHours = (checkIn: string | null, checkOut: string | null): number => {
    if (!checkIn || !checkOut) return 0;
    try {
      const start = new Date(`2000-01-01T${checkIn}`);
      const end = new Date(`2000-01-01T${checkOut}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      // Cap at 8 hours for progress calculation
      return Math.min(8, Math.max(0, hours));
    } catch {
      return 0;
    }
  };

  // Leave calculation helper
  const getLeaveBalance = () => {
    const totalLeaves = 15;
    const userEmail = localStorage.getItem("user_email") || "";
    const taken = leaveData
      .filter((l) => l.email === userEmail && l.status?.toLowerCase() === "approved")
      .reduce((total, l) => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + Math.max(1, days);
      }, 0);
    return Math.max(0, totalLeaves - taken);
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const userEmail = localStorage.getItem("user_email") || "Employee";

  return (
    <DashboardLayout role="employee">
      <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen space-y-8 font-sans">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
              <span>Overview for {new Date().toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <FiCalendar className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Attendance Rate */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${attendanceRate >= 90 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {attendanceRate >= 90 ? 'Excellent' : 'Average'}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{attendanceRate}%</div>
            <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Attendance Rate</div>
          </div>

          {/* Card 2: Hours Worked */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <FiClock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-50 text-gray-600">
                This Week
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{hoursThisWeek.toFixed(1)} <span className="text-lg text-gray-400 font-medium">hrs</span></div>
            <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Total Hours Worked</div>
          </div>

          {/* Card 3: Leave Balance */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                <FiBriefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{getLeaveBalance()}</div>
            <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Leave Balance</div>
          </div>

          {/* Card 4: Pending Requests */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                <FiAlertCircle className="w-5 h-5" />
              </div>
              {pendingRequests > 0 && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{pendingRequests}</div>
            <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Pending Requests</div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Recent Attendance Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiActivity className="text-blue-500" />
                Recent Daily Activity
              </h2>
              <Link href="/employee/attendance">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  View Full History
                </span>
              </Link>
            </div>

            <div className="space-y-4">
              {attendanceRecords.slice(0, 5).map((rec, index) => {
                const duration = calculateDuration(rec.checkIn, rec.checkOut);
                const isComplete = rec.checkIn && rec.checkOut;

                return (
                  <div key={index} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    {/* Decorative gradient bar on left */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isComplete ? 'bg-gradient-to-b from-green-400 to-blue-500' : 'bg-gray-200'}`}></div>

                    <div className="flex flex-col md:flex-row md:items-center gap-6 pl-2">

                      {/* Date Block */}
                      <div className="min-w-[100px] flex md:flex-col items-center md:items-start gap-2">
                        <span className="text-2xl font-bold text-gray-800">{new Date(rec.date).getDate()}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-gray-500">{new Date(rec.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-xs text-gray-400 font-medium">{new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                      </div>

                      {/* Animated Professional Timeline */}
                      <div className="flex-1 w-full mt-2">
                        {/* Clean Timeline Container */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          {/* Simple Header with Images */}
                          <div className="flex justify-between items-center mb-4">
                            {/* Check-in with Image */}
                            <div className="flex items-center gap-2">
                              {rec.checkInPhoto ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-green-300">
                                  <Image 
                                    src={rec.checkInPhoto} 
                                    alt="Check-in" 
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGMEY0RjgiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIxMCIgZmlsbD0iIzNCODJGNiIvPjxwYXRoIGQ9Ik0zMCA2MCBMMzAgNjAgTDQwIDYwIEw3MCA5MCBMNzAgOTAgTDQwIDkwIFoiIGZpbGw9IiMzQjgyRjYiLz48L3N2Zz4=';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                  <FiCamera className="text-green-600 text-sm" />
                                </div>
                              )}
                              <div>
                                <div className="text-xs text-gray-500">Check-in</div>
                                <div className="text-sm font-medium text-gray-800">{formatTime(rec.checkIn)}</div>
                              </div>
                            </div>
                                                    
                            {/* Duration */}
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-800">{duration}</div>
                              <div className="text-xs text-gray-500">worked</div>
                            </div>
                                                    
                            {/* Check-out with Image */}
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Check-out</div>
                                <div className="text-sm font-medium text-gray-800">{isComplete ? formatTime(rec.checkOut) : '--:--'}</div>
                              </div>
                              {isComplete && rec.checkOutPhoto ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-red-300">
                                  <Image 
                                    src={rec.checkOutPhoto} 
                                    alt="Check-out" 
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGRkVGRTkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIxMCIgZmlsbD0iI0U1MzUzNSIvPjxwYXRoIGQ9Ik0zMCA2MCBMMzAgNjAgTDQwIDYwIEw3MCA5MCBMNzAgOTAgTDQwIDkwIFoiIGZpbGw9IiNFNTM1MzUiLz48L3N2Zz4=';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isComplete ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'}`}>
                                  <FiCamera className={`text-sm ${isComplete ? 'text-red-600' : 'text-gray-400'}`} />
                                </div>
                              )}
                            </div>
                          </div>
                                                  
                          {/* Centered Timeline Bar with Integrated Labels (0-8) */}
                          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mb-1">
                            {/* Progress Fill with Animation */}
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${!isComplete && rec.checkIn ? 'animate-pulse' : ''}`}
                              style={{
                                width: isComplete ? `${Math.min(100, (calculateDurationHours(rec.checkIn, rec.checkOut) / 8) * 100)}%` : (rec.checkIn ? `${Math.min(100, (getCurrentWorkHours() / 8) * 100)}%` : '0%'),
                                background: 'linear-gradient(to right, #10B981, #3B82F6)'
                              }}
                            ></div>
                                                      
                            {/* Hour Markers with Centered Numbers (0-8) */}
                            <div className="absolute inset-0 flex justify-between items-center px-1">
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                                <div key={hour} className="flex flex-col items-center relative z-10">
                                  <div className="w-px h-3 bg-gray-400"></div>
                                  <span className="text-[9px] font-medium text-gray-600 absolute top-1/2 transform -translate-y-1/2 mt-2.5">{hour}</span>
                                </div>
                              ))}
                            </div>
                                                        
                            {/* Animated Working Indicator */}
                            {!isComplete && rec.checkIn && (
                              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white animate-ping"></div>
                            )}
                                                        
                            {/* Check-in Marker */}
                            <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                        
                            {/* Check-out Marker */}
                            {isComplete && (
                              <div className="absolute top-1/2 left-full transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                                                  
                          {/* Progress Info with Real-time Update */}
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0h</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-700">{isComplete ? Math.round((calculateDurationHours(rec.checkIn, rec.checkOut) / 8) * 100) : Math.round((getCurrentWorkHours() / 8) * 100)}%</span>
                              <span className="text-gray-500">of 8h day</span>
                            </div>
                            <span>8h</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {attendanceRecords.length === 0 && (
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <p className="text-gray-500">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Widgets & Quick Actions */}
          <div className="space-y-8">

            {/* Quick Actions Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Quick Actions</h3>
              </div>
              <div className="p-2 grid grid-cols-1 gap-1">
                <Link href="/employee/leaves" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group transition-colors">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FiBriefcase />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-700">Request Leave</h4>
                    <p className="text-xs text-gray-500">Apply for days off</p>
                  </div>
                  <FiArrowRight className="text-gray-300 group-hover:text-blue-500" />
                </Link>

                <Link href="/employee/attendance" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group transition-colors">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FiCheckCircle />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-700">Mark Attendance</h4>
                    <p className="text-xs text-gray-500">Check in or out</p>
                  </div>
                  <FiArrowRight className="text-gray-300 group-hover:text-green-500" />
                </Link>
              </div>
            </div>

            {/* Upcoming Leaves Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">My Leaves</h3>
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{leaveData.filter(l => l.email === userEmail).length}</span>
              </div>
              <div className="p-4 space-y-3">
                {leaveData.filter(l => l.email === userEmail).slice(0, 3).map((leave, i) => (
                  <div key={i} className="flex flex-col gap-1 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${leave.status.toLowerCase() == 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                          leave.status.toLowerCase() == 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                        {leave.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(leave.start_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{leave.reason}</p>
                  </div>
                ))}
                {leaveData.filter(l => l.email === userEmail).length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-xs">No leave history</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}