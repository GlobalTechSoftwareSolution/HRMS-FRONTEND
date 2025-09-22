"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type AttendanceRecord = {
  id: number;
  email: string;
  role: string;
  date: string;
  check_in?: string;
  check_out?: string;
};

type AttendanceAPIResponse = {
  attendance: AttendanceRecord[];
};

export default function HRAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/list_attendance/`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        // 👇 Properly typed API response
        const data: AttendanceAPIResponse = await res.json();
        setAttendance(data.attendance);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(message);
        setError(message);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const getStatus = (record: AttendanceRecord) => {
    if (record.check_in && record.check_out) return "Present";
    if (record.check_in && !record.check_out) return "Active";
    return "Absent";
  };

  const statusColors: Record<string, string> = {
    Present: "bg-green-100 text-green-800",
    Active: "bg-yellow-100 text-yellow-800",
    Absent: "bg-red-100 text-red-800",
  };

  const iconMap: Record<string, string> = {
    Present: "✔️",
    Active: "⏳",
    Absent: "❌",
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 animate-pulse text-gray-400">
        Loading attendance records...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-64 text-red-600 font-semibold">
        Error: {error}
      </div>
    );

  return (
    <DashboardLayout role="hr">
      <div className="max-w-full md:max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 animate-fadeIn">
          Employee Attendance Records
        </h2>

        {attendance.length === 0 ? (
          <div className="text-center py-20 text-gray-500 animate-pulse">
            No attendance data available.
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {["Present", "Active", "Absent"].map((label) => {
                const count = attendance.filter(
                  (rec) => getStatus(rec) === label
                ).length;
                const icon = iconMap[label];

                return (
                  <div
                    key={label}
                    className="bg-white rounded-xl shadow-lg p-5 flex items-center space-x-4 transform transition-transform hover:scale-105 duration-300"
                  >
                    <div
                      className={`text-3xl bg-white p-3 rounded-full animate-bounce ${
                        label === "Present"
                          ? "text-green-500"
                          : label === "Active"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-700">{count}</h3>
                      <p className="text-gray-500">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table for larger screens */}
            <div className="hidden sm:block overflow-hidden bg-white shadow-lg rounded-xl animate-fadeIn mt-6">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr className="text-gray-700 uppercase text-sm tracking-wide">
                    <th className="p-3 border-b">Email</th>
                    <th className="p-3 border-b">Role</th>
                    <th className="p-3 border-b">Date</th>
                    <th className="p-3 border-b">Check-In</th>
                    <th className="p-3 border-b">Check-Out</th>
                    <th className="p-3 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => {
                    const status = getStatus(record);
                    return (
                      <tr
                        key={`${record.id}-${record.email}-${record.date}`}
                        className="hover:bg-gray-50 transition-colors duration-300 border-b"
                      >
                        <td className="p-3 break-words">{record.email}</td>
                        <td className="p-3 font-medium">{record.role}</td>
                        <td className="p-3">{record.date}</td>
                        <td className="p-3">{record.check_in || "-"}</td>
                        <td className="p-3">{record.check_out || "-"}</td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              statusColors[status]
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards for small screens */}
            <div className="sm:hidden space-y-4 mt-6">
              {attendance.map((record) => {
                const status = getStatus(record);
                return (
                  <div
                    key={`${record.id}-${record.email}-${record.date}`}
                    className="bg-white shadow-lg rounded-xl p-4 animate-fadeIn"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {record.email}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 text-sm">
                      <div>
                        <span className="font-medium">Role:</span> {record.role}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {record.date}
                      </div>
                      <div>
                        <span className="font-medium">Check-In:</span> {record.check_in || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Check-Out:</span> {record.check_out || "-"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-bounce {
          animation: bounce 1.2s infinite alternate;
        }
        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
