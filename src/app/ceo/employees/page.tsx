"use client";
import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/app/lib/supabaseClient";

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

type SortConfig = {
  key: keyof Employee | "";
  direction: "ascending" | "descending";
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "ascending" });

  // --------------------- FETCH EMPLOYEES ---------------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("accounts_employee").select("*");
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error("Unexpected data format");

        const mappedEmployees: Employee[] = data.map((emp: any, index) => ({
          id: emp.id ?? index + 1,
          name: emp.fullname ?? "",
          role: emp.designation ?? "Employee",
          department: emp.department ?? "General",
          email: emp.email_id ?? "",
          status: "active",
          joinDate: emp.date_of_birth ?? new Date().toISOString(),
          phone: emp.phone ?? "",
          salary: 0,
          picture: emp.profile_picture || undefined,
        }));

        setEmployees(mappedEmployees);
        setError("");
      } catch (err: any) {
        console.error("Failed to fetch employees:", err);
        setError("Failed to fetch employees. Check console for details.");
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

  // --------------------- FILTER & SORT ---------------------
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Employee];
        const bValue = b[sortConfig.key as keyof Employee];
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [employees, searchTerm, departmentFilter, statusFilter, sortConfig]);

  const handleSort = (key: keyof Employee) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  // --------------------- RENDER ---------------------
  return (
    <DashboardLayout role="ceo">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {loading && <p className="text-gray-500 animate-pulse">Loading employees...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Management</h1>
                <p className="text-gray-600 mt-1">Manage your organization's employees</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
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
              {filteredAndSortedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105 hover:shadow-2xl duration-300"
                >
                  {/* Profile Image */}
                  {emp.picture ? (
                    <img
                      src={emp.picture}
                      alt={emp.name}
                      className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-md mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-xl mb-4 shadow-md">
                      {emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}

                  {/* Name and Role */}
                  <h2 className="font-semibold text-lg sm:text-xl text-gray-900">{emp.name}</h2>
                  <p className="text-gray-500 text-sm sm:text-base capitalize">{emp.role}</p>
                  <p className="text-gray-500 text-sm">{emp.department}</p>

                  {/* Email & Phone */}
                  <p className="text-gray-400 text-xs mt-1">{emp.email}</p>
                  <p className="text-gray-400 text-xs">{emp.phone}</p>

                  {/* Status */}
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

                  {/* Joined Date */}
                  <p className="mt-2 text-gray-400 text-xs">Joined: {new Date(emp.joinDate).toLocaleDateString()}</p>

                  {/* Salary */}
                  <p className="mt-2 font-semibold text-gray-900 text-sm">${emp.salary.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
