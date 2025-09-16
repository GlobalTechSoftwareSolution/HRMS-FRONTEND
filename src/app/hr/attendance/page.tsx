"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@supabase/supabase-js";

type Attendance = {
  id: number;
  email_id: string;
  role: string; // employee role
  date: string;
  check_in?: string;
  check_out?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HRAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data, error } = await supabase
          .from<Attendance>("accounts_attendance")
          .select("*");
        if (error) {
          setError(error.message);
          setAttendance([]);
        } else if (data) {
          setAttendance(data);
          setError(null);
        }
      } catch (err) {
        setError("Unexpected error fetching attendance.");
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const getStatus = (record: Attendance) => {
    if (record.check_in && record.check_out) return "Present";
    if (record.check_in && !record.check_out) return "Active";
    return "Absent";
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
              {[
                { label: "Present", color: "green", icon: "✔️" },
                { label: "Active", color: "yellow", icon: "⏳" },
                { label: "Absent", color: "red", icon: "❌" },
              ].map((item) => {
                const count = attendance.filter(
                  (rec) => getStatus(rec) === item.label
                ).length;
                return (
                  <div
                    key={item.label}
                    className={`bg-white rounded-xl shadow-lg p-5 flex items-center space-x-4 transform transition-transform hover:scale-105 duration-300`}
                  >
                    <div
                      className={`text-${item.color}-500 text-3xl bg-${item.color}-100 p-3 rounded-full animate-bounce`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-700">{count}</h3>
                      <p className="text-gray-500">{item.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="overflow-hidden bg-white shadow-lg rounded-xl animate-fadeIn mt-6">
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
                    const statusColors: Record<string, string> = {
                      Present: "bg-green-100 text-green-800",
                      Active: "bg-yellow-100 text-yellow-800",
                      Absent: "bg-red-100 text-red-800",
                    };
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 transition-colors duration-300 border-b"
                      >
                        <td className="p-3 break-words">{record.email_id}</td>
                        <td className="p-3 font-medium">{record.role}</td>
                        <td className="p-3">{record.date}</td>
                        <td className="p-3">{record.check_in || "-"}</td>
                        <td className="p-3">{record.check_out || "-"}</td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}
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
          </>
        )}
      </div>

      {/* Animations & Responsive Styles */}
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

        /* Media Queries for Responsive Design */
        @media (max-width: 1024px) {
          table th, table td {
            padding: 10px;
          }
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr 1fr !important;
          }
          table thead {
            display: none;
          }
          table, table tbody, table tr, table td {
            display: block;
            width: 100%;
          }
          table tr {
            margin-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
          }
          table td {
            padding: 8px 10px;
            text-align: right;
            position: relative;
          }
          table td::before {
            content: attr(data-label);
            position: absolute;
            left: 10px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            color: #555;
          }
        }

        @media (max-width: 480px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
          table td {
            font-size: 13px;
            padding: 6px 8px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
