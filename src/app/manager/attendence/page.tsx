"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/app/lib/supabaseClient";

type AttendanceRecord = {
  email: string;
  name: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number;
};

export default function ManagerDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const today = new Date();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Fetch employees (email + fullname)
        const { data: empData, error: empError } = await supabase
          .from("accounts_employee")
          .select("email_id, fullname");
        if (empError) throw new Error(empError.message);

        // ✅ Fetch today's attendance
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data: attData, error: attError } = await supabase
          .from("accounts_attendance")
          .select("email_id, date, check_in, check_out")
          .gte("date", startOfDay)
          .lte("date", endOfDay);

        if (attError) throw new Error(attError.message);

        // ✅ Merge attendance with employee names
        const mappedAttendance: AttendanceRecord[] = (attData || []).map(a => {
  const emp = empData?.find(e => e.email_id === a.email_id);

  // Combine date + check_in/out to get proper DateTime
  const dateStr = a.date; // "2025-09-18"
  const checkInStr = a.check_in ? `${dateStr}T${a.check_in}` : null;
  const checkOutStr = a.check_out ? `${dateStr}T${a.check_out}` : null;

  let hours = 0;
  if (checkInStr && checkOutStr) {
    const inTime = new Date(checkInStr).getTime();
    const outTime = new Date(checkOutStr).getTime();
    hours = Math.max(0, (outTime - inTime) / (1000 * 60 * 60)); // ms → hrs
  }

  return {
    email: a.email_id,
    name: emp?.fullname || "Unknown",
    date: a.date,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    hours: parseFloat(hours.toFixed(2)),
  };
});


        setAttendance(mappedAttendance);
      } catch (err: any) {
        console.error("Error fetching data from Supabase:", err.message || err);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Manager Dashboard 📋
        </h1>

        <h2 className="text-xl font-semibold mb-3">Today's Attendance</h2>

        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Check-in</th>
                <th className="px-4 py-2 border">Check-out</th>
                <th className="px-4 py-2 border">Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length ? (
                attendance.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{rec.email}</td>
                    <td className="px-4 py-2 border">{rec.name}</td>
                    <td className="px-4 py-2 border">
                      {new Date(rec.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border">
                      {rec.checkIn
                        ? new Date(rec.checkIn).toLocaleTimeString()
                        : "--"}
                    </td>
                    <td className="px-4 py-2 border">
                      {rec.checkOut
                        ? new Date(rec.checkOut).toLocaleTimeString()
                        : "--"}
                    </td>
                    <td className="px-4 py-2 border">{rec.hours}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-gray-500">
                    No attendance records found for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
