"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Attendance = {
  id: number;
  employeeId: string;
  name: string;
  date: string;
  status: "Present" | "Absent" | "Leave" | "Late";
  checkIn?: string;
  checkOut?: string;
};

export default function HRAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance data (replace with your backend API)
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch("/api/attendance"); // 👈 your API endpoint
        const data = await res.json();
        setAttendance(data);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return <p className="text-center">Loading attendance records...</p>;

  return (

    <DashboardLayout role="hr">
       <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Employee Attendance Records</h2>

      {attendance.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No attendance data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="p-2 border">Employee ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Check-In</th>
                <th className="p-2 border">Check-Out</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.id} className="text-sm text-center hover:bg-gray-50">
                  <td className="border p-2">{record.employeeId}</td>
                  <td className="border p-2">{record.name}</td>
                  <td className="border p-2">{record.date}</td>
                  <td className="border p-2">{record.checkIn || "-"}</td>
                  <td className="border p-2">{record.checkOut || "-"}</td>
                  <td
                    className={`border p-2 font-medium ${
                      record.status === "Present"
                        ? "text-green-600"
                        : record.status === "Absent"
                        ? "text-red-600"
                        : record.status === "Late"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {record.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
