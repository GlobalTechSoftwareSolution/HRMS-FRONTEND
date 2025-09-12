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

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const leaveRes = await fetch("/api/leaves?status=Approved");
        const approvedLeaves = await leaveRes.json();

        const res = await fetch("/api/attendance");
        const scannedData = await res.json();

        const today = new Date().toISOString().split("T")[0];

        const allEmployees = [...scannedData];
        const updated = allEmployees.map((record: Attendance) => {
          const onLeave = approvedLeaves.find(
            (l: any) =>
              l.employeeId === record.employeeId &&
              today >= l.startDate &&
              today <= l.endDate
          );

          if (onLeave) {
            return { ...record, status: "Leave", checkIn: "-", checkOut: "-" };
          }

          if (record.status === "Present" || record.status === "Late") {
            return record;
          }

          return { ...record, status: "Absent", checkIn: "-", checkOut: "-" };
        });

        setAttendance(updated);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) return <p className="text-center py-10">Loading attendance records...</p>;

  return (
    <DashboardLayout role="hr">
      <div className="max-w-full md:max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center md:text-left">
          Employee Attendance Records
        </h2>

        {attendance.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No attendance data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr className="hidden sm:table-row">
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
                  <tr
                    key={record.id}
                    className="block sm:table-row mb-4 sm:mb-0 border sm:border-none rounded-lg sm:rounded-none bg-gray-50 sm:bg-white p-2 sm:p-0"
                  >
                    {/* Mobile view */}
                    <td className="block sm:table-cell border-b sm:border-none p-2 sm:p-0">
                      <span className="font-semibold sm:hidden">Employee ID: </span>
                      {record.employeeId}
                    </td>
                    <td className="block sm:table-cell border-b sm:border-none p-2 sm:p-0">
                      <span className="font-semibold sm:hidden">Name: </span>
                      {record.name}
                    </td>
                    <td className="block sm:table-cell border-b sm:border-none p-2 sm:p-0">
                      <span className="font-semibold sm:hidden">Date: </span>
                      {record.date}
                    </td>
                    <td className="block sm:table-cell border-b sm:border-none p-2 sm:p-0">
                      <span className="font-semibold sm:hidden">Check-In: </span>
                      {record.checkIn || "-"}
                    </td>
                    <td className="block sm:table-cell border-b sm:border-none p-2 sm:p-0">
                      <span className="font-semibold sm:hidden">Check-Out: </span>
                      {record.checkOut || "-"}
                    </td>
                    <td
                      className={`block sm:table-cell p-2 font-medium ${
                        record.status === "Present"
                          ? "text-green-600"
                          : record.status === "Absent"
                          ? "text-red-600"
                          : record.status === "Late"
                          ? "text-yellow-600"
                          : "text-blue-600"
                      }`}
                    >
                      <span className="font-semibold sm:hidden">Status: </span>
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
