"use client";
import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image"; 
import DashboardLayout from "@/components/DashboardLayout";

type Employee = {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  status: "active" | "on-leave" | "offboarded";
  joinDate: string;
  phone: string;
  salary: number;
  picture?: string;
};

type EmployeeAPIResponse = {
  id?: number;
  fullname?: string;
  designation?: string;
  department?: string;
  email_id?: string;
  status?: "active" | "on-leave" | "offboarded";
  join_date?: string;
  phone?: string;
  salary?: number;
  profile_picture?: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // --------------------- FETCH EMPLOYEES ---------------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/employees/`
        );
        if (!res.ok) throw new Error("Failed to fetch employees");

        const data: EmployeeAPIResponse[] = await res.json();

        const mappedEmployees: Employee[] = (data || []).map((emp, index) => ({
          id: emp.id ?? index + 1,
          name: emp.fullname ?? "",
          role: emp.designation ?? "Employee",
          department: emp.department ?? "General",
          email: emp.email_id ?? "",
          status: emp.status ?? "active",
          joinDate: emp.join_date ?? new Date().toISOString(),
          phone: emp.phone ?? "",
          salary: emp.salary ?? 0,
          picture: emp.profile_picture || undefined,
        }));

        setEmployees(mappedEmployees);
        setError("");
      } catch (err: unknown) {
        console.error("Failed to fetch employees:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch employees. Check console for details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // --------------------- DEPARTMENTS ---------------------
  const departments = useMemo(() => {
    const depts = new Set(employees.map((emp) => emp.department));
    return ["all", ...Array.from(depts)];
  }, [employees]);

  // --------------------- FILTERED EMPLOYEES ---------------------
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        departmentFilter === "all" || emp.department === departmentFilter;
      const matchesStatus =
        statusFilter === "all" || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  return (
    <DashboardLayout role="ceo">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {loading && (
          <p className="text-gray-500 animate-pulse">Loading employees...</p>
        )}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Employee Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your organization&apos;s employees
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                </div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === "all" ? "All Departments" : d}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="offboarded">Offboarded</option>
                </select>
              </div>
            </div>

            {/* Employee Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredEmployees.length === 0 ? (
                <p className="text-center text-gray-500 col-span-full mt-6">No employees found.</p>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105 hover:shadow-2xl duration-300"
                  >
                    {/* Profile Image */}
                    {emp.picture ? (
                      <div className="relative w-24 h-24 mb-4">
                        <Image
                          src={emp.picture}
                          alt={emp.name}
                          className="rounded-full object-cover"
                          fill
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-xl mb-4 shadow-md">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}

                    {/* Name & Role */}
                    <h2 className="font-semibold text-lg sm:text-xl text-gray-900">{emp.name}</h2>
                    <p className="text-gray-500 text-sm sm:text-base capitalize">{emp.role}</p>
                    <p className="text-gray-500 text-sm">{emp.department}</p>

                    {/* Email & Phone */}
                    <p className="text-gray-400 text-xs mt-1">{emp.email}</p>
                    <p className="text-gray-400 text-xs">{emp.phone}</p>

                    {/* Status Badge */}
                    <span
                      className={`mt-3 px-4 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                        emp.status === "active"
                          ? "bg-green-100 text-green-800"
                          : emp.status === "on-leave"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                    </span>

                    {/* Join Date */}
                    <p className="mt-2 text-gray-400 text-xs">
                      Joined: {new Date(emp.joinDate).toLocaleDateString()}
                    </p>

                    {/* Salary */}
                    <p className="mt-2 font-semibold text-gray-900 text-sm">
                      ${emp.salary.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
