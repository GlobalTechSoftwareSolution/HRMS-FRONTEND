"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Eye, X } from "lucide-react";

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  email_id: string;
  fullname: string;
  age: number | null;
  phone: string | null;
  department: string | null;
  date_of_birth: string | null;
  profile_picture?: string | null;
};

export default function TeamReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrs, setHrs] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [view, setView] = useState<"employee" | "hr" | "manager">("employee");
  const [loading, setLoading] = useState(false);

  // Popup
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: empData, error: empErr } = await supabase
        .from("accounts_employee")
        .select("*");

      const { data: hrData, error: hrErr } = await supabase
        .from("accounts_hr")
        .select("*");

      const { data: managerData, error: managerErr } = await supabase
        .from("accounts_manager")
        .select("*");

      if (empErr) console.error("Employee fetch error:", empErr);
      if (hrErr) console.error("HR fetch error:", hrErr);
      if (managerErr) console.error("Manager fetch error:", managerErr);

      if (empData) setEmployees(empData);
      if (hrData) setHrs(hrData);
      if (managerData) setManagers(managerData);

      setLoading(false);
    };

    fetchData();
  }, []);

  const list =
    view === "employee" ? employees : view === "hr" ? hrs : managers;

  // Avatar helper
  const getAvatar = (emp: Employee) =>
    emp.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.fullname || emp.email_id
    )}&background=random`;

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
            Team Report 📋
          </h1>

          {/* Toggle buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setView("employee")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow 
              ${
                view === "employee"
                  ? "bg-blue-600 text-white scale-105"
                  : "bg-gray-200 text-gray-700 hover:bg-blue-100"
              }`}
            >
              <Users className="w-5 h-5" /> Employees
            </button>

            <button
              onClick={() => setView("hr")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow 
              ${
                view === "hr"
                  ? "bg-purple-600 text-white scale-105"
                  : "bg-gray-200 text-gray-700 hover:bg-purple-100"
              }`}
            >
              <Briefcase className="w-5 h-5" /> HR
            </button>

            <button
              onClick={() => setView("manager")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow 
              ${
                view === "manager"
                  ? "bg-green-600 text-white scale-105"
                  : "bg-gray-200 text-gray-700 hover:bg-green-100"
              }`}
            >
              <Briefcase className="w-5 h-5" /> Manager
            </button>
          </div>

          {/* Data list */}
          {loading ? (
            <p className="text-gray-500 animate-pulse">Loading {view} data...</p>
          ) : list.length === 0 ? (
            <p className="text-gray-500">No {view} found.</p>
          ) : (
            <AnimatePresence>
              <div className="grid gap-6 md:grid-cols-2">
                {list.map((emp, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <img
                        src={getAvatar(emp)}
                        alt="profile"
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                      <h2 className="text-xl font-semibold text-gray-800">
                        {emp.fullname || "Unknown"}
                      </h2>
                    </div>

                    <p className="text-gray-600 text-sm mb-1">📧 {emp.email_id}</p>
                    {emp.phone && (
                      <p className="text-gray-600 text-sm mb-1">📞 {emp.phone}</p>
                    )}
                    {emp.department && (
                      <p className="text-gray-600 text-sm mb-1">🏢 {emp.department}</p>
                    )}

                    {/* View button */}
                    <button
                      onClick={() => setSelectedEmp(emp)}
                      className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all duration-300"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Popup modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative"
            >
              <button
                onClick={() => setSelectedEmp(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <img
                  src={getAvatar(selectedEmp)}
                  alt="profile"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedEmp.fullname}
                </h2>
              </div>

              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Email:</strong> {selectedEmp.email_id}
                </p>
                {selectedEmp.phone && (
                  <p>
                    <strong>Phone:</strong> {selectedEmp.phone}
                  </p>
                )}
                {selectedEmp.department && (
                  <p>
                    <strong>Department:</strong> {selectedEmp.department}
                  </p>
                )}
                {selectedEmp.age && (
                  <p>
                    <strong>Age:</strong> {selectedEmp.age}
                  </p>
                )}
                {selectedEmp.date_of_birth && (
                  <p>
                    <strong>DOB:</strong> {selectedEmp.date_of_birth}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
