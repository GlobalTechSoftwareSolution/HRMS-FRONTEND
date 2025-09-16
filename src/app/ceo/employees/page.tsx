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
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    role: "",
    department: "Engineering",
    email: "",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0],
    phone: "",
    salary: 0,
  });

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
          name: emp.fullname,
          role: emp.designation ?? "Employee",
          department: emp.department ?? "General",
          email: emp.email_id,
          status: "active", // default, table has no status
          joinDate: emp.date_of_birth ?? new Date().toISOString(),
          phone: emp.phone ?? "",
          salary: 0, // default, table has no salary
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

  // --------------------- ADD / EDIT / DELETE ---------------------
  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) return alert("Name and Email are required!");
    if (editEmployeeId) {
      setEmployees(
        employees.map((emp) => (emp.id === editEmployeeId ? { id: editEmployeeId, ...newEmployee } : emp))
      );
      setEditEmployeeId(null);
    } else {
      const newId = employees.length ? Math.max(...employees.map((e) => e.id)) + 1 : 1;
      setEmployees([...employees, { id: newId, ...newEmployee }]);
    }
    setIsAddEmployeeModalOpen(false);
    setNewEmployee({
      name: "",
      role: "",
      department: "Engineering",
      email: "",
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
      phone: "",
      salary: 0,
    });
  };

  const handleEditEmployee = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      setNewEmployee({ ...emp });
      setEditEmployeeId(id);
      setIsAddEmployeeModalOpen(true);
    }
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      setEmployees(employees.filter((emp) => emp.id !== id));
    }
  };

  // --------------------- RENDER ---------------------
  return (
    <DashboardLayout role="ceo">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {loading && <p className="text-gray-500">Loading employees...</p>}
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
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="offboarded">Offboarded</option>
                </select>
              </div>
            </div>

            {/* Employee Table */}
            <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["name", "role", "department", "status", "email", "joinDate", "salary"].map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort(key as keyof Employee)}
                      >
                        <div className="flex items-center gap-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                          {sortConfig.key === key && <span>{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 text-sm font-bold">
                            {emp.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 text-sm sm:text-base">{emp.name}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{emp.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-900 text-sm sm:text-base">{emp.role}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
                            emp.status === "active"
                              ? "bg-green-100 text-green-800"
                              : emp.status === "on-leave"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-sm">{emp.email}</td>
                      <td className="px-4 py-2 text-gray-500 text-sm">
                        {new Date(emp.joinDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-gray-900 text-sm">${emp.salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
