"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Eye, X } from "lucide-react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type Employee = {
  email: string;
  fullname: string;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  profile_picture?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_no?: string | null;
  employment_type?: string | null;
};

type Hr = Employee;
type Manager = Employee;

type ViewType = "employee" | "hr" | "manager";

export default function TeamReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrs, setHrs] = useState<Hr[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [view, setView] = useState<ViewType>("employee");
  const [loading, setLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const tabs: { label: string; value: ViewType; icon: React.ReactNode }[] = [
    { label: "Employees", value: "employee", icon: <Users className="w-5 h-5" /> },
    { label: "HR", value: "hr", icon: <Briefcase className="w-5 h-5" /> },
    { label: "Managers", value: "manager", icon: <Briefcase className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, hrRes, managerRes] = await Promise.all([
          fetch(`${API_BASE}/api/accounts/employees/`),
          fetch(`${API_BASE}/api/accounts/hrs/`),
          fetch(`${API_BASE}/api/accounts/managers/`),
        ]);

        const empData: Employee[] = await empRes.json();
        const hrData: Hr[] = await hrRes.json();
        const managerData: Manager[] = await managerRes.json();

        setEmployees(empData || []);
        setHrs(hrData || []);
        setManagers(managerData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const list = view === "employee" ? employees : view === "hr" ? hrs : managers;

  const getAvatar = (emp: Employee) =>
    emp.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.fullname || emp.email
    )}&background=random`;

  return (
    <DashboardLayout role="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-gray-800">
            Team Report 📋
          </h1>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow ${
                  view === tab.value
                    ? "bg-blue-600 text-white scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Data list */}
          {loading ? (
            <p className="text-gray-500 animate-pulse text-center py-10">
              Loading {view} data...
            </p>
          ) : list.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No {view} found.</p>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((emp, idx) => (
                  <motion.div
                    key={emp.email || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <Image
                        src={getAvatar(emp)}
                        alt={emp.fullname || "Profile"}
                        width={48}
                        height={48}
                        className="rounded-full object-cover border border-gray-200"
                      />
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {emp.fullname || "Unknown"}
                      </h2>
                    </div>

                    <div className="text-black text-sm space-y-1">
                      <p className="flex items-center gap-2 text-gray-800 font-medium">
                        📧 <span className="truncate">{emp.email}</span>
                      </p>
                      {emp.phone && <p>📞 {emp.phone}</p>}
                      {emp.department && <p>🏢 {emp.department}</p>}
                      {emp.designation && <p>💼 {emp.designation}</p>}
                      {emp.employment_type && <p>🕒 {emp.employment_type}</p>}
                    </div>

                    <button
                      onClick={() => setSelectedEmp(emp)}
                      className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all duration-300"
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

      {/* Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
                <Image
                  src={getAvatar(selectedEmp)}
                  alt={selectedEmp?.fullname || "Profile"}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border border-gray-200"
                />
                <h2 className="text-2xl font-bold text-gray-800">{selectedEmp.fullname}</h2>
              </div>

              <div className="space-y-2 text-gray-700 text-sm sm:text-base">
                <p className="font-semibold text-gray-800">Email: {selectedEmp.email}</p>
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
                {selectedEmp.designation && (
                  <p>
                    <strong>Designation:</strong> {selectedEmp.designation}
                  </p>
                )}
                {selectedEmp.employment_type && (
                  <p>
                    <strong>Employment Type:</strong> {selectedEmp.employment_type}
                  </p>
                )}
                {selectedEmp.emergency_contact_name && (
                  <p>
                    <strong>Emergency Contact:</strong> {selectedEmp.emergency_contact_name} ({selectedEmp.emergency_contact_relationship}) - {selectedEmp.emergency_contact_no}
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
