"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/app/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

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
  const [loading, setLoading] = useState(true);

  const today = new Date();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: empData, error: empError } = await supabase
          .from("accounts_employee")
          .select("email_id, fullname");
        if (empError) throw new Error(empError.message);

        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data: attData, error: attError } = await supabase
          .from("accounts_attendance")
          .select("email_id, date, check_in, check_out")
          .gte("date", startOfDay)
          .lte("date", endOfDay);
        if (attError) throw new Error(attError.message);

        const mappedAttendance: AttendanceRecord[] = (attData || []).map((a) => {
          const emp = empData?.find((e) => e.email_id === a.email_id);
          const dateStr = a.date;
          const checkInStr = a.check_in ? `${dateStr}T${a.check_in}` : null;
          const checkOutStr = a.check_out ? `${dateStr}T${a.check_out}` : null;

          let hours = 0;
          if (checkInStr && checkOutStr) {
            const inTime = new Date(checkInStr).getTime();
            const outTime = new Date(checkOutStr).getTime();
            hours = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
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
        console.error("Error fetching data:", err.message || err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Summary calculations
  const totalEmployees = attendance.length;
  const checkedIn = attendance.filter((a) => a.checkIn).length;
  const absent = totalEmployees - checkedIn;
  const avgHours =
    totalEmployees > 0
      ? (
          attendance.reduce((acc, a) => acc + a.hours, 0) / totalEmployees
        ).toFixed(2)
      : 0;

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gray-50 p-6 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold mb-6 text-gray-800"
        >
          Manager Dashboard 📋
        </motion.h1>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            { title: "Total Employees", value: totalEmployees, color: "bg-gradient-to-r from-blue-400 to-blue-600" },
            { title: "Checked In", value: checkedIn, color: "bg-gradient-to-r from-green-400 to-green-600" },
            { title: "Absent", value: absent, color: "bg-gradient-to-r from-red-400 to-red-600" },
            { title: "Avg Hours", value: avgHours, color: "bg-gradient-to-r from-purple-400 to-purple-600" },
          ].map((kpi) => (
            <motion.div
              key={kpi.title}
              className={`rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between hover:scale-105 transition-transform duration-300 ${kpi.color}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-sm font-medium opacity-90">{kpi.title}</p>
              <p className="text-2xl md:text-3xl font-bold">{kpi.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Employee Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4"
              >
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))
          ) : attendance.length ? (
            <AnimatePresence>
              {attendance.map((rec, idx) => {
                const checkInBadge = rec.checkIn
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800";
                const checkOutBadge = rec.checkOut
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800";
                const hoursPercent = Math.min((rec.hours / 8) * 100, 100);

                return (
                 <motion.div
  key={rec.email}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3, delay: idx * 0.05 }}
  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
>
  {/* Header: Name & Email */}
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-gray-800">{rec.name}</h3>
    <p className="text-sm text-gray-500">{rec.email}</p>
  </div>

  {/* Date */}
  <div className="mb-3">
    <p className="text-xs text-gray-400">Date</p>
    <p className="text-sm text-gray-700 font-medium">{new Date(rec.date).toLocaleDateString()}</p>
  </div>

  {/* Check-in / Check-out */}
  <div className="mb-3">
    <p className="text-xs text-gray-400">Check-in / Check-out</p>
    <div className="flex gap-2 mt-1">
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${rec.checkIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : "Pending"}
      </span>
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${rec.checkOut ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : "Pending"}
      </span>
    </div>
  </div>

  {/* Hours Progress */}
  <div>
    <p className="text-xs text-gray-400 mb-1">Worked Hours</p>
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((rec.hours / 8) * 100, 100)}%` }}
        transition={{ duration: 1 }}
        className="h-2 bg-blue-500 rounded-full"
      />
    </div>
    <p className="text-xs text-center text-gray-600 mt-1">{rec.hours} hrs</p>
  </div>
</motion.div>


                );
              })}
            </AnimatePresence>
          ) : (
            <div className="col-span-full text-center text-gray-500 p-8 bg-white rounded-xl shadow-lg">
              No attendance records found for today.
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
